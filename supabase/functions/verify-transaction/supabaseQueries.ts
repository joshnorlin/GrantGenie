export async function getMembership(supabase, grant_id, user_id) {
  const { data, error } = await supabase.from('grant_memberships').select('*').eq('grant_id', grant_id).eq('user_id', user_id).eq('status', 'active').single();
  if (error) throw error;
  return data;
}
export async function insertTransaction(supabase, payload) {
  const { data, error } = await supabase.from('transactions').insert(payload).select().single();
  if (error) throw error;
  return data;
}
export async function getCategory(supabase, category_id) {
  const { data, error } = await supabase.from('category').select('category').eq('category_id', category_id);
  if (error) throw error;
  return data;
}
export async function getRules(supabase, grant_id) {
  const { data, error } = await supabase.from('institutional_rules').select('ruleset').eq('grant_id', grant_id).single();
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
