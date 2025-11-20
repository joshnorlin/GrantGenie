export async function getMembership(supabase, grant_id, user_id) {
  const { data, error } = await supabase
    .from('grant_memberships')
    .select('*')
    .eq('grant_id', grant_id)
    .eq('user_id', user_id)
    .eq('status', 'active')
    .single();
  if (error) throw error;
  return data;
}

export async function insertTransaction(supabase, payload) {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      grant_budget_item_id: payload.grant_budget_item_id,
      grant_id: payload.grant_id,
      amount: payload.amount,
      entered_by: payload.entered_by,
      status: 'pending',
      category_id: payload.category_id,
      additional_details: payload.additional_details,
      redo_of_transaction_id: payload.redo_of_transaction_id
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getCategory(supabase, category_id) {
  const { data, error } = await supabase
    .from('category_lookup')
    .select('category')
    .eq('category_id', category_id)
    .single();
  if (error) throw error;
  return data;
}

export async function getRules(supabase, grant_id) {
  const { data, error } = await supabase
    .from('institutional_rules')
    .select('ruleset')
    .eq('grant_id', grant_id)
    .single();
  if (error) throw error;
  return data;
}

export async function getBudget(supabase, grant_id) {
  const { data, error } = await supabase.rpc('get_budget_summary', {
    p_grant_id: grant_id
  });
  if (error) throw error;
  return data;
}

export async function getRecentTransactions(supabase, grant_id, category_id, months = 3) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('grant_id', grant_id)
    .eq('category_id', category_id)
    .gte('created_at', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
