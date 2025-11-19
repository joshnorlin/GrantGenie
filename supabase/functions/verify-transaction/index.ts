import { createClient } from 'jsr:@supabase/supabase-js';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GoogleGenAI } from "https://esm.sh/@google/genai";
import { corsHeaders } from './cors.ts';
import { system_content } from './prompt_content.ts';
import { getMembership, insertTransaction, getCategory, getRules, getBudget } from './supabaseQueries.ts';
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Missing auth header", {
      status: 401,
      headers: corsHeaders
    });
    // Anon client + user JWT for RLS
    const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_ANON_KEY"), {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", {
      status: 401,
      headers: corsHeaders
    });
    const body = await req.json();
    const { grant_id, amount, category_id, description } = body;
    // 1. Validate membership
    const membership = await getMembership(supabase, grant_id, user.id);
    if (!membership) return new Response("Forbidden: not a grant member", {
      status: 403,
      headers: corsHeaders
    });
    // 2. Insert transaction
    const transaction = await insertTransaction(supabase, {
      grant_id,
      amount,
      category_id,
      entered_by: user.id,
      status: "pending",
      provided_details: description
    });
    // 3. Fetch context for AI
    const category = await getCategory(supabase, category_id);
    const rules = await getRules(supabase, grant_id);
    const budget = await getBudget(supabase, grant_id);
    // Prepare AI content
    const content = JSON.stringify({
      transaction,
      grant_rules: rules,
      grant_budget: budget,
      category
    }, null, 2);
    const ai = new GoogleGenAI(Deno.env.get("GEMINI_API_KEY"));
    const llmRes = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${system_content}\n${content}`
            }
          ]
        }
      ]
    });
    const llmJson = await llmRes.json();
    const llmOutput = JSON.parse(llmJson.choices[0].message.content);
    // Log + update
    await supabase.from("llm_logs").insert({
      transaction_id: transaction.transaction_id,
      log: llmOutput
    });
    await supabase.from("transactions").update({
      status: llmOutput.verdict
    }).eq("transaction_id", transaction.transaction_id);
    return new Response(JSON.stringify({
      transaction_id: transaction.transaction_id,
      llm_verdict: llmOutput
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error(err);
    return new Response(`Error: ${err.message}`, {
      status: 500,
      headers: corsHeaders
    });
  }
});
