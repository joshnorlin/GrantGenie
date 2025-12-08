export type GrantBudgetItemValue = number | "";

export interface GrantBudgetItem {
  grant_id: number;
  value: GrantBudgetItemValue;
  category_id: number;
}

export interface LLMVerdict {
  decision: "APPROVED" | "REJECTED" | "REQUIRES_REVIEW";
  reasoning: string;
  rule_citations: string[];
  confidence_score: number;
  confidence_score_suggestions: string[];
}

export interface VerifyTransactionResponse {
  transaction_id: number;
  llm_verdict: LLMVerdict;
}
