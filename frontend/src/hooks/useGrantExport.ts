import { useState, useCallback } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  selectTransactionsForExport,
  selectBudgetItemsForExport,
  selectBudgetSummaryForExport,
  selectLLMLogsForExport,
  selectGrantInfo,
} from "../utils/supabase-client-queries/exportData";
import { buildAndDownloadGrantExcel } from "../utils/excelBuilder";

interface UseGrantExportOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseGrantExportReturn {
  isLoading: boolean;
  error: Error | null;
  exportGrant: (grantId: number) => Promise<void>;
}

/**
 * Custom hook to orchestrate grant data export
 * Fetches all necessary data from Supabase and generates Excel file
 */
export function useGrantExport(
  supabase: SupabaseClient,
  options?: UseGrantExportOptions
): UseGrantExportReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportGrant = useCallback(
    async (grantId: number) => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch all required data in parallel
        const [
          grantInfo,
          budgetSummary,
          transactions,
          budgetItems,
          llmLogs,
        ] = await Promise.all([
          selectGrantInfo(supabase, grantId),
          selectBudgetSummaryForExport(supabase, grantId),
          selectTransactionsForExport(supabase, grantId),
          selectBudgetItemsForExport(supabase, grantId),
          selectLLMLogsForExport(supabase, grantId),
        ]);

        if (!grantInfo) {
          throw new Error("Grant not found");
        }

        console.log("Export data fetched:", {
          grantInfo,
          budgetSummary,
          transactionCount: transactions?.length,
          budgetItemCount: budgetItems?.length,
          llmLogCount: llmLogs?.length,
        });

        // Build and download Excel file
        await buildAndDownloadGrantExcel(
          grantInfo.name,
          grantInfo.grant_number,
          budgetSummary,
          transactions,
          budgetItems,
          llmLogs
        );

        options?.onSuccess?.();
      } catch (err) {
        console.error("Export error details:", err);
        const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
        const error = new Error(`Export failed: ${errorMessage}`);
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, options]
  );

  return {
    isLoading,
    error,
    exportGrant,
  };
}
