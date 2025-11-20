// index.ts
// Load .env variables manually
import "https://deno.land/std@0.168.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GoogleGenAI } from "npm:@google/genai/node";
import { corsHeaders } from './cors.ts';
import { system_content, transactionSchema, transactionJsonSchema } from './llm_context.ts';
import {
  getMembership,
  insertTransaction,
  getCategory,
  getRules,
  getBudget,
  getRecentTransactions
} from './supabaseQueries.ts';

serve(async (req) => {
  console.log("ENV check:", {
    url: Deno.env.get("SUPABASE_URL"),
    key: Deno.env.get("SUPABASE_ANON_KEY")
  });

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Missing auth header", { status: 401, headers: corsHeaders });

    const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_ANON_KEY"), {
      global: { headers: { Authorization: authHeader } }
    });

    console.log("authHeader:", authHeader);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const body = await req.json();
    const { grant_id, amount, category_id, additional_details, redo_of_transaction_id } = body;

    // 1. Validate membership
    const membership = await getMembership(supabase, grant_id, user.id);
    if (!membership) return new Response("Forbidden: not a grant member", { status: 403, headers: corsHeaders });

    // 2. Insert transaction
    const transaction = await insertTransaction(supabase, {
      grant_id,
      amount,
      category_id,
      additional_details,
      redo_of_transaction_id,
      entered_by: user.id
    });

    // 3. Fetch context for AI and recent transactions
    const [category, rules, budget, recentTransactions] = await Promise.all([
      getCategory(supabase, category_id),
      getRules(supabase, grant_id),
      getBudget(supabase, grant_id),
      getRecentTransactions(supabase, grant_id, category_id, 3)
    ]);

    // 3a. Validate fetched data
    if (!category) {
      return new Response(
        JSON.stringify({ error: "Category not found", code: "CATEGORY_NOT_FOUND" }),
        { status: 404, headers: corsHeaders }
      );
    }

    if (!rules) {
      return new Response(
        JSON.stringify({ error: "No rules found for this grant", code: "RULES_NOT_FOUND" }),
        { status: 404, headers: corsHeaders }
      );
    }

    if (!budget || budget.length === 0) {
      return new Response(
        JSON.stringify({ error: "No budget defined for this grant", code: "NO_BUDGET_DEFINED" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 3b. Enforce hard budget constraint BEFORE AI
    const categoryBudget = budget.find(b => b.category_id === category_id);
    if (!categoryBudget) {
      return new Response(
        JSON.stringify({ error: "No budget defined for this category", code: "NO_BUDGET_CONFIGURED" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const spentSoFar = Number(categoryBudget.spent || 0);
    const budgeted = Number(categoryBudget.budgeted || 0);

    if (spentSoFar + Number(amount) > budgeted) {
      await supabase
        .from("transactions")
        .update({ status: "REJECTED", confidence_score: 100 })
        .eq("transaction_id", transaction.transaction_id);

      return new Response(
        JSON.stringify({
          transaction_id: transaction.transaction_id,
          decision: "REJECTED",
          reason: "This transaction exceeds the allocated budget for this category.",
          over_budget_details: {
            spent_so_far: spentSoFar,
            attempted_addition: Number(amount),
            budgeted,
            amount_over: spentSoFar + Number(amount) - budgeted
          }
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // 4. Prepare AI content
    const content = JSON.stringify({
      transaction,
      category,
      grant_rules: rules,
      grant_budget: budget,
      recent_transactions: recentTransactions
    }, null, 2);

    const ai = new GoogleGenAI(Deno.env.get("GEMINI_API_KEY"));
    const llmRes = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: `${system_content}\n${content}` }] }
      ],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: transactionJsonSchema,
      }
    });

    console.log("LLM raw response:", llmRes);

    console.log("content:", llmRes.candidates?.[0]?.content?.parts?.[0]);

    const llmText = llmRes.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!llmText) {
      throw new Error("LLM returned empty content");
    }

    let llmOutputRaw;
    try {
      llmOutputRaw = JSON.parse(llmText);
    } catch (err) {
      console.error("Failed to parse LLM JSON:", llmText);
      throw new Error("Invalid JSON returned from LLM");
    }

    // Validate and coerce types using Zod
    const llmOutput = transactionSchema.parse({
    ...llmOutputRaw,
    decision: llmOutputRaw.decision ?? "REQUIRES_REVIEW",
    reasoning: llmOutputRaw.reasoning ?? "",
    rule_citations: llmOutputRaw.rule_citations ?? [],
    confidence_score: Number(llmOutputRaw.confidence_score ?? 0),
    confidence_score_suggestions: llmOutputRaw.confidence_score_suggestions ?? []
    });
    
    console.log("Validated LLM output: ", llmOutput);

    // 5. Log LLM output
    await supabase.from("llm_logs").insert({
      transaction_id: transaction.transaction_id,
      log: llmOutput
    });

    // 6. Update transaction status + confidence
    await supabase.from("transactions").update({
      status: llmOutput.decision,
      confidence_score: llmOutput.confidence_score
    }).eq("transaction_id", transaction.transaction_id);

    return new Response(
      JSON.stringify({ transaction_id: transaction.transaction_id, llm_verdict: llmOutput }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error(err);
    return new Response(`Error: ${err.message}`, { status: 500, headers: corsHeaders });
  }
});
