// supabaseQueries.ts

/**
 * Get active membership of a user for a given grant.
 * Returns the membership object or null if none exists.
 */
export async function getMembership(supabase, grant_id: number, user_id: string) {
  const { data, error } = await supabase
    .from('grant_memberships')
    .select('*')
    .eq('grant_id', grant_id)
    .eq('user_id', user_id)
    .eq('status', 'active')
    .maybeSingle(); // safe: returns null if no row

  if (error) throw error;
  return data; // null if no membership
}

/**
 * Insert a new transaction.
 * Returns the inserted transaction object.
 */
export async function insertTransaction(supabase, payload: {
  grant_budget_item_id?: number,
  grant_id: number,
  amount: number,
  entered_by: string,
  status?: string,
  category_id: number,
  additional_details?: string,
  redo_of_transaction_id?: number
}) {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      grant_budget_item_id: payload.grant_budget_item_id,
      grant_id: payload.grant_id,
      amount: payload.amount,
      entered_by: payload.entered_by,
      status: payload.status || 'pending',
      category_id: payload.category_id,
      additional_details: payload.additional_details,
      redo_of_transaction_id: payload.redo_of_transaction_id
    })
    .select()
    .maybeSingle(); // safe: returns null if insert fails

  if (error) throw error;
  return data;
}

/**
 * Get category details by category_id.
 * Returns the category object or null if not found.
 */
export async function getCategory(supabase, category_id: number) {
  const { data, error } = await supabase
    .from('category_lookup')
    .select('*')
    .eq('category_id', category_id)
    .maybeSingle();

  if (error) throw error;
  return data; // null if no category
}

/**
 * Get institutional rules for a grant.
 * Returns the rules object or null if not found.
 */
export async function getRules(supabase, grant_id: number) {
  const { data, error } = await supabase
    .from('institutional_rules')
    .select('*')
    .eq('grant_id', grant_id)
    .maybeSingle();

  if (error) throw error;
  return data; // null if no rules
}

/**
 * Get budget summary for a grant.
 * Returns an array of budget items.
 */
export async function getBudget(supabase, grant_id: number) {
  const { data, error } = await supabase
    .rpc('get_budget_summary', { p_grant_id: grant_id });

  if (error) throw error;
  return data || []; // empty array if no budget
}

/**
 * Get recent transactions for a grant/category in the last N months.
 * Returns an array of transactions (can be empty).
 */
export async function getRecentTransactions(
  supabase,
  grant_id: number,
  category_id: number,
  months = 3
) {
  const sinceDate = new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('grant_id', grant_id)
    .eq('category_id', category_id)
    .gte('created_at', sinceDate)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
