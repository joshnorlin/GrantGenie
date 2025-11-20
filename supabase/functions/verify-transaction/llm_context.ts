export const system_content = `
You are an AI compliance reviewer for research grant budgets.

Given:
- A proposed transaction, including amount, category, and user-provided details
- The grant's institutional rules
- The grant's budget summary per category
- Recent transactions in the same category

Determine if the transaction is compliant with the grant's rules and budget. Assign a confidence score (0-100) based on the information provided. If the confidence is low, provide suggestions to improve it in the 'additional_details' field.

Respond only with a JSON object in this exact format:
{
  "decision": "APPROVED" | "REJECTED" | "REQUIRES_REVIEW",
  "reasoning": "Brief explanation of your decision.",
  "rule_citations": ["list of relevant rules applied"],
  "confidence_score": "0-100",
  "confidence_score_suggestions": ["list of suggested additional details to raise confidence"]
}
`;

import { z } from "https://esm.sh/zod";
import { zodToJsonSchema } from "https://esm.sh/zod-to-json-schema";

export const transactionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "REQUIRES_REVIEW"]),
  reasoning: z.string(),
  rule_citations: z.array(z.string()),
  confidence_score: z.preprocess(val => Number(val), z.number()),
  confidence_score_suggestions: z.array(z.string())
});


export const transactionJsonSchema = zodToJsonSchema(transactionSchema);
