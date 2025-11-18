export type GrantBudgetItemValue = number | "";

export interface GrantBudgetItem {
  grant_id: number;
  value: GrantBudgetItemValue;
  category_id: number;
}