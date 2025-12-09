# GrantGenie Export Feature - Quick Reference

## Files Created/Modified

### New Files
1. **`src/utils/supabase-client-queries/exportData.ts`** - Export data fetching layer
2. **`src/utils/excelBuilder.ts`** - Excel workbook generation and formatting
3. **`src/hooks/useGrantExport.ts`** - Custom React hook for export orchestration
4. **`src/types/file-saver.d.ts`** - TypeScript declarations for file-saver

### Modified Files
1. **`src/components/GrantDetailsModal.tsx`** - Added export button and notifications

## Integration Points

### Data Flow
```
GrantDetailsModal (UI)
    ↓
useGrantExport hook
    ↓
selectTransactionsForExport
selectBudgetItemsForExport
selectBudgetSummaryForExport
selectLLMLogsForExport
selectGrantInfo
    ↓
buildAndDownloadGrantExcel
    ↓
Excel file created and downloaded
```

### Key Functions

#### Query Functions (exportData.ts)
```tsx
// Fetch transactions with user/category joins
const transactions = await selectTransactionsForExport(supabase, grantId);

// Fetch budget items with spending info
const budgetItems = await selectBudgetItemsForExport(supabase, grantId);

// Get budget summary
const budgetSummary = await selectBudgetSummaryForExport(supabase, grantId);

// Get LLM logs linked to transactions
const llmLogs = await selectLLMLogsForExport(supabase, grantId);

// Get grant info for filename
const grantInfo = await selectGrantInfo(supabase, grantId);
```

#### Excel Builder (excelBuilder.ts)
```tsx
// Build and download Excel file
await buildAndDownloadGrantExcel(
  grantName,
  grantNumber,
  budgetSummary,
  transactions,
  budgetItems,
  llmLogs
);

// Add individual sheets if needed
const workbook = new Workbook();
addBudgetSummarySheet(workbook, budgetSummary);
addTransactionsSheet(workbook, transactions);
addBudgetItemsSheet(workbook, budgetItems);
addLLMLogsSheet(workbook, llmLogs);
```

#### Hook Usage (useGrantExport.ts)
```tsx
const { exportGrant, isLoading, error } = useGrantExport(supabase, {
  onSuccess: () => console.log("Export complete!"),
  onError: (error) => console.error("Export failed:", error),
});

// Trigger export
await exportGrant(grantId);
```

## Excel Output Structure

### Budget Summary Sheet
- **Purpose**: Overview of budget allocation vs spending
- **Columns**: Category, Budgeted, Spent, Remaining, % Utilized
- **Features**: Formatted currencies, total row, color-coded header

### Transactions Sheet
- **Purpose**: Complete transaction history
- **Columns**: Transaction ID, Date, Category, Amount, Status, Entered By, Details
- **Features**: User names and categories pre-joined, text wrapping for details

### Budget Items Sheet
- **Purpose**: Budget allocation by category
- **Columns**: Category, Budgeted Amount, Created Date
- **Features**: Formatted currencies, creation tracking

### LLM Logs Sheet
- **Purpose**: AI verification audit trail
- **Columns**: Log ID, Transaction ID, Date, Amount, Status, Log Content
- **Features**: Linked to transactions, full log content with wrapping

## Styling Applied
- **Headers**: Blue background (#4472C4) with white text
- **Summary Rows**: Green background (#70AD47) with white text
- **Alternating Rows**: Light gray (#F2F2F2) for readability
- **Borders**: Thin borders on all cells
- **Text**: Centered headers, wrapped text in detail columns
- **Numbers**: Currency format ($) and percentage format

## Testing Checklist

- [ ] Export button appears in Grant Details Modal footer
- [ ] Button shows loading state during export
- [ ] Excel file downloads with correct filename format
- [ ] Budget Summary sheet contains all categories and totals
- [ ] Transactions sheet shows all transactions with user/category names
- [ ] Budget Items sheet displays all budget allocations
- [ ] LLM Logs sheet shows linked logs with transaction details
- [ ] Success notification appears after export
- [ ] Error notification appears on export failure
- [ ] File can be opened in Excel/Sheets/LibreOffice
- [ ] Formatting is applied correctly (colors, currencies, etc.)
- [ ] Column widths are appropriate for content

## Debugging Tips

### Export Button Not Showing
- Check that FileDownloadIcon is imported from @mui/icons-material
- Verify useGrantExport hook is imported
- Check browser console for errors

### File Not Downloading
- Check browser console for JavaScript errors
- Verify file-saver module is installed: `npm list file-saver`
- Check if popup blockers are preventing download

### Incorrect Data in Excel
- Check Supabase queries are returning data (add console.logs)
- Verify joins are working (category_lookup, users relationships)
- Check if transactions/logs exist for the grant

### Formatting Issues
- Verify ExcelJS version (4.4.0+)
- Check that Partial<Style> types are used correctly
- Test in different Excel applications

## Performance Considerations
- Export fetches data in parallel using Promise.all()
- Large datasets (1000+ transactions) may take a few seconds
- File generation is client-side (no server load)
- Consider adding pagination for very large grants

## Security Notes
- All data is subject to existing RLS policies
- Users can only export grants they have access to
- No data transmission beyond user's browser
- File is created locally and deleted from memory after download
