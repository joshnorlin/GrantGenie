import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fetch all transactions for a grant with category name and user name joined
 */
export async function selectTransactionsForExport(
  client: SupabaseClient,
  grantId: number
) {
  const { data, error } = await client
    .from("transactions")
    .select(`
      transaction_id,
      amount,
      created_at,
      status,
      category_id,
      additional_details,
      entered_by,
      category_lookup:category_id (
        category_id,
        category
      )
    `)
    .eq("grant_id", grantId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Get all unique user IDs from transactions
  const userIds = Array.from(
    new Set((data || []).map((tx: any) => tx.entered_by).filter(Boolean))
  );

  // Fetch user information for all those IDs using the RPC function
  // (RPC function needed to bypass RLS policies on users table)
  let userMap = new Map<string, { uid: string; name: string }>();
  if (userIds.length > 0) {
    const { data: users, error: userError } = await client.rpc(
      "get_user_names_for_export",
      { user_ids: userIds }
    );

    if (!userError && users) {
      userMap = new Map(users.map((u: any) => [u.uid, { uid: u.uid, name: u.name }]));
    }
  }

  // Attach user information to transactions
  const transactionsWithUsers = (data || []).map((tx: any) => ({
    ...tx,
    users: userMap.get(tx.entered_by) || null,
  }));

  return transactionsWithUsers;
}

/**
 * Fetch all budget items for a grant with category name and spending info
 */
export async function selectBudgetItemsForExport(
  client: SupabaseClient,
  grantId: number
) {
  const { data, error } = await client
    .from("grant_budget_items")
    .select(`
      grant_budget_item_id,
      amount,
      category_id,
      created_at,
      category_lookup:category_id (
        category_id,
        category
      )
    `)
    .eq("grant_id", grantId)
    .order("category_id", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch spending summary by category for a grant
 * Groups transactions by category and sums amounts
 */
export async function selectSpendingByCategory(
  client: SupabaseClient,
  grantId: number
) {
  const { data, error } = await client
    .from("transactions")
    .select(
      `
      category_id,
      amount,
      status,
      category_lookup:category_id (
        category_id,
        category
      )
    `
    )
    .eq("grant_id", grantId)
    .eq("status", "APPROVED");

  if (error) throw error;

  // Group and sum by category
  const spendingMap = new Map<
    number,
    { category: string; total_spent: number; category_id: number }
  >();

  (data || []).forEach((transaction: any) => {
    const categoryId = transaction.category_id;
    const categoryName =
      transaction.category_lookup?.category || "Unknown";
    const amount = Number(transaction.amount) || 0;

    if (spendingMap.has(categoryId)) {
      const existing = spendingMap.get(categoryId)!;
      existing.total_spent += amount;
    } else {
      spendingMap.set(categoryId, {
        category_id: categoryId,
        category: categoryName,
        total_spent: amount,
      });
    }
  });

  return Array.from(spendingMap.values());
}

/**
 * Fetch all LLM logs linked to transactions in a grant
 */
export async function selectLLMLogsForExport(
  client: SupabaseClient,
  grantId: number
) {
  // First get all transaction IDs for the grant
  const { data: transactions, error: txError } = await client
    .from("transactions")
    .select("transaction_id")
    .eq("grant_id", grantId);

  if (txError) throw txError;

  if (!transactions || transactions.length === 0) {
    return [];
  }

  const transactionIds = transactions.map((tx: any) => tx.transaction_id);

  // Then fetch LLM logs for those transactions
  // Use the specific foreign key relationship (llm_logs_transaction_id_fkey)
  const { data, error } = await client
    .from("llm_logs")
    .select(
      `
      log_id,
      transaction_id,
      log,
      created_at,
      transactions!llm_logs_transaction_id_fkey (
        transaction_id,
        grant_id,
        amount,
        category_id,
        status
      )
    `
    )
    .in("transaction_id", transactionIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch budget summary for a grant (using the DB function)
 * This provides a high-level overview of budgeted vs spent by category
 */
export async function selectBudgetSummaryForExport(
  client: SupabaseClient,
  grantId: number
) {
  const { data, error } = await client.rpc("get_budget_summary", {
    p_grant_id: grantId,
  });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch basic grant info
 */
export async function selectGrantInfo(
  client: SupabaseClient,
  grantId: number
) {
  const { data, error } = await client
    .from("grants")
    .select("grant_id, grant_number, name, created_at, created_by")
    .eq("grant_id", grantId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
