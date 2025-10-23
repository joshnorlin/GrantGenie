// supabase/functions/verifyTransaction/index.ts
import { createClient } from 'jsr:@supabase/supabase-js';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { system_content } from './prompt_content.ts';
import { GoogleGenAI } from "https://esm.sh/@google/genai";
serve(async (req)=>{
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Missing auth header', {
        status: 401
      });
    }
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response('Unauthorized', {
        status: 401
      });
    }
    const body = await req.json();
    const { grant_id, amount, category_id, description } = body;
    const { data: membership } = await supabaseClient.from('grant_memberships').select('\*').eq('grant_id', grant_id).eq('user_id', user.id).eq('status', 'accepted').single();
    if (!membership) {
      return new Response('Forbidden: not a grant member', {
        status: 403
      });
    }
    const { data: transaction, error: txError } = await supabaseClient.from('transactions').insert({
      grant_id,
      amount,
      category_id,
      entered_by: user.id,
      status: 'pending',
      provided_details: description
    }).select().single();
    if (txError) throw txError;
    const { data: category, error: category_error } = await supabaseClient.from('category').select('category').eq('category_id', category_id);
    const { data: rules } = await supabaseClient.from('institutional_rules').select('ruleset').eq('grant_id', grant_id).single();
    if (category_error) throw category_error;
    const { data: budget } = await supabaseClient.rpc('get_budget_summary', {
      p_grant_id: grant_id
    });
    const user_content = [
      {
        text: JSON.stringify({
          transaction: {
            id: transaction.transaction_id,
            amount: transaction.amount,
            category: category,
            description: transaction.description
          },
          grant_rules: rules,
          grant_budget: budget
        }, null, 2)
      }
    ];
    const ai = new GoogleGenAI(Deno.env.get("GEMINI_API_KEY"));
    const llmRes = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${system_content}
              Here is the input data:
              ${user_content}`
            }
          ]
        }
      ]
    });
    const llmData = await llmRes.json();
    const llmOutput = JSON.parse(llmData.choices[0].message.content);
    await supabaseClient.from('llm_logs').insert({
      transaction_id: transaction.transaction_id,
      log: llmOutput
    });
    await supabaseClient.from('transactions').update({
      status: llmOutput.verdict
    }).eq('transaction_id', transaction.transaction_id);
    return new Response(JSON.stringify({
      transaction_id: transaction.transaction_id,
      llm_verdict: llmOutput
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error(err);
    return new Response(`Error: ${err.message}`, {
      status: 500
    });
  }
});
