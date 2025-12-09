import { Workbook } from "exceljs";
import type { Style } from "exceljs";
// @ts-ignore
import { saveAs } from "file-saver";

/**
 * Styles and utilities for building Excel files
 */

export const headerStyle: Partial<Style> = {
  fill: {
    type: "pattern" as const,
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  },
  font: {
    bold: true,
    color: { argb: "FFFFFFFF" },
    size: 11,
  },
  alignment: {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  },
  border: {
    top: { style: "thin" as const },
    left: { style: "thin" as const },
    bottom: { style: "thin" as const },
    right: { style: "thin" as const },
  },
};

export const summaryHeaderStyle: Partial<Style> = {
  fill: {
    type: "pattern" as const,
    pattern: "solid",
    fgColor: { argb: "FF70AD47" },
  },
  font: {
    bold: true,
    color: { argb: "FFFFFFFF" },
    size: 11,
  },
  alignment: {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  },
  border: {
    top: { style: "thin" as const },
    left: { style: "thin" as const },
    bottom: { style: "thin" as const },
    right: { style: "thin" as const },
  },
};

export const altRowStyle: Partial<Style> = {
  fill: {
    type: "pattern" as const,
    pattern: "solid",
    fgColor: { argb: "FFF2F2F2" },
  },
};

export const currencyFormat = '$#,##0.00;($#,##0.00);$0.00';

/**
 * Create Budget Summary sheet
 */
export function addBudgetSummarySheet(
  workbook: Workbook,
  budgetSummary: any[]
) {
  const sheet = workbook.addWorksheet("Budget Summary");

  // Headers
  const headers = ["Category", "Budgeted", "Spent", "Remaining", "% Utilized"];
  const headerRow = sheet.addRow(headers);
  headerRow.eachCell((cell) => {
    Object.assign(cell.style, headerStyle);
  });

  // Calculate totals
  let totalBudgeted = 0;
  let totalSpent = 0;

  // Data rows
  (budgetSummary || []).forEach((item, index) => {
    const budgeted = Number(item.budgeted) || 0;
    const spent = Number(item.spent) || 0;
    const remaining = budgeted - spent;
    const utilized = budgeted > 0 ? (spent / budgeted) * 100 : 0;

    totalBudgeted += budgeted;
    totalSpent += spent;

    const row = sheet.addRow([
      item.category || "Unknown",
      budgeted,
      spent,
      remaining,
      utilized,
    ]);

    // Alternate row coloring
    if (index % 2 === 1) {
      row.eachCell((cell) => {
        Object.assign(cell.style, altRowStyle);
      });
    }

    // Currency and percentage formatting
    row.getCell(2).numFmt = currencyFormat;
    row.getCell(3).numFmt = currencyFormat;
    row.getCell(4).numFmt = currencyFormat;
    row.getCell(5).numFmt = '0.00"%"';
  });

  // Total row
  const totalRow = sheet.addRow([
    "TOTAL",
    totalBudgeted,
    totalSpent,
    totalBudgeted - totalSpent,
    totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
  ]);
  totalRow.eachCell((cell) => {
    Object.assign(cell.style, summaryHeaderStyle);
  });
  totalRow.getCell(2).numFmt = currencyFormat;
  totalRow.getCell(3).numFmt = currencyFormat;
  totalRow.getCell(4).numFmt = currencyFormat;
  totalRow.getCell(5).numFmt = '0.00"%"';

  // Column widths
  sheet.columns = [
    { width: 25 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
  ];
}

/**
 * Create Transactions sheet
 */
export function addTransactionsSheet(workbook: Workbook, transactions: any[]) {
  const sheet = workbook.addWorksheet("Transactions");

  // Headers
  const headers = [
    "Transaction ID",
    "Date",
    "Category",
    "Amount",
    "Status",
    "Entered By",
    "Details",
  ];
  const headerRow = sheet.addRow(headers);
  headerRow.eachCell((cell) => {
    Object.assign(cell.style, headerStyle);
  });

  // Data rows
  (transactions || []).forEach((tx, index) => {
    const date = tx.created_at
      ? new Date(tx.created_at).toLocaleDateString()
      : "";
    
    const userName = tx.users?.name || "Unknown User";
    
    const row = sheet.addRow([
      tx.transaction_id || "",
      date,
      tx.category_lookup?.category || "Unknown",
      tx.amount || 0,
      tx.status || "Unknown",
      userName,
      tx.additional_details || "",
    ]);

    // Alternate row coloring
    if (index % 2 === 1) {
      row.eachCell((cell) => {
        Object.assign(cell.style, altRowStyle);
      });
    }

    // Currency formatting for amount
    row.getCell(4).numFmt = currencyFormat;

    // Wrap text for details
    if (row.getCell(7).alignment) {
      row.getCell(7).alignment.wrapText = true;
    } else {
      row.getCell(7).alignment = { wrapText: true };
    }
  });

  // Column widths
  sheet.columns = [
    { width: 15 },
    { width: 12 },
    { width: 20 },
    { width: 15 },
    { width: 12 },
    { width: 15 },
    { width: 30 },
  ];
}

/**
 * Create Budget Items sheet
 */
export function addBudgetItemsSheet(workbook: Workbook, budgetItems: any[]) {
  const sheet = workbook.addWorksheet("Budget Items");

  // Headers
  const headers = ["Category", "Budgeted Amount", "Created Date"];
  const headerRow = sheet.addRow(headers);
  headerRow.eachCell((cell) => {
    Object.assign(cell.style, headerStyle);
  });

  // Data rows
  (budgetItems || []).forEach((item, index) => {
    const date = item.created_at
      ? new Date(item.created_at).toLocaleDateString()
      : "";
    const row = sheet.addRow([
      item.category_lookup?.category || "Unknown",
      item.amount || 0,
      date,
    ]);

    // Alternate row coloring
    if (index % 2 === 1) {
      row.eachCell((cell) => {
        Object.assign(cell.style, altRowStyle);
      });
    }

    // Currency formatting
    row.getCell(2).numFmt = currencyFormat;
  });

  // Column widths
  sheet.columns = [{ width: 25 }, { width: 15 }, { width: 15 }];
}

/**
 * Create LLM Logs sheet
 */
export function addLLMLogsSheet(workbook: Workbook, llmLogs: any[]) {
  const sheet = workbook.addWorksheet("LLM Logs");

  // Headers
  const headers = [
    "Log ID",
    "Transaction ID",
    "Date",
    "Amount",
    "Status",
    "Log Content",
  ];
  const headerRow = sheet.addRow(headers);
  headerRow.eachCell((cell) => {
    Object.assign(cell.style, headerStyle);
  });

  // Data rows
  (llmLogs || []).forEach((log, index) => {
    const date = log.created_at
      ? new Date(log.created_at).toLocaleDateString()
      : "";
    const txData = log.transactions;
    const row = sheet.addRow([
      log.log_id || "",
      txData?.transaction_id || "",
      date,
      txData?.amount || 0,
      txData?.status || "Unknown",
      log.log || "",
    ]);

    // Alternate row coloring
    if (index % 2 === 1) {
      row.eachCell((cell) => {
        Object.assign(cell.style, altRowStyle);
      });
    }

    // Currency formatting
    row.getCell(4).numFmt = currencyFormat;

    // Wrap text for log content
    if (row.getCell(6).alignment) {
      row.getCell(6).alignment.wrapText = true;
    } else {
      row.getCell(6).alignment = { wrapText: true };
    }
  });

  // Column widths
  sheet.columns = [
    { width: 12 },
    { width: 15 },
    { width: 12 },
    { width: 15 },
    { width: 12 },
    { width: 40 },
  ];
}

/**
 * Build and download Excel workbook with all grant data
 */
export async function buildAndDownloadGrantExcel(
  grantName: string,
  grantNumber: string,
  budgetSummary: any[],
  transactions: any[],
  budgetItems: any[],
  llmLogs: any[]
) {
  try {
    const workbook = new Workbook();

    // Remove default sheet if it exists
    const defaultSheet = workbook.getWorksheet(1);
    if (defaultSheet) {
      workbook.removeWorksheet(defaultSheet.id);
    }

    console.log("Adding sheets...");
    // Add sheets in order
    addBudgetSummarySheet(workbook, budgetSummary);
    addTransactionsSheet(workbook, transactions);
    addBudgetItemsSheet(workbook, budgetItems);
    addLLMLogsSheet(workbook, llmLogs);

    console.log("Generating Excel buffer...");
    // Generate file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Create filename with grant info and timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Grant_Export_${grantNumber || grantName}_${timestamp}.xlsx`;

    console.log(`Downloading file: ${filename}`);
    saveAs(blob, filename);
    console.log("Export completed successfully");
  } catch (error) {
    console.error("Error in buildAndDownloadGrantExcel:", error);
    throw error;
  }
}
