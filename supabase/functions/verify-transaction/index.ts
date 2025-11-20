import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GoogleGenAI } from "https://esm.sh/@google/genai";
import { corsHeaders } from './cors.ts';
import { system_content } from './prompt_content.ts';
import { getMembership, insertTransaction, getCategory, getRules, getBudget, getRecentTransactions } from './supabaseQueries.ts';

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Missing auth header", { status: 401, headers: corsHeaders });

    const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_ANON_KEY"), {
      global: { headers: { Authorization: authHeader } }
    });

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

    // 3. Fetch context for AI
    const [category, rules, budget, recentTransactions] = await Promise.all([
      getCategory(supabase, category_id),
      getRules(supabase, grant_id),
      getBudget(supabase, grant_id),
      getRecentTransactions(supabase, grant_id, category_id, 3)
    ]);

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
      contents: [{ role: "user", parts: [{ text: `${system_content}\n${content}` }] }]
    });

    const llmJson = await llmRes.json();
    const llmOutput = JSON.parse(llmJson.choices[0].message.content);

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

    return new Response(JSON.stringify({ transaction_id: transaction.transaction_id, llm_verdict: llmOutput }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error(err);
    return new Response(`Error: ${err.message}`, { status: 500, headers: corsHeaders });
  }
});
