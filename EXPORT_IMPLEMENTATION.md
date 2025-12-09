# GrantGenie XLSX Export Implementation

## Overview
A complete Excel export system for grant data has been implemented, allowing users to export comprehensive grant information including budget summary, transactions with user and category details, budget items, and LLM logs.

## Components Created

### 1. **Export Data Queries** (`src/utils/supabase-client-queries/exportData.ts`)
Supabase query functions for fetching export data:
- `selectTransactionsForExport()` - Fetches transactions with joined category names and user names
- `selectBudgetItemsForExport()` - Fetches budget items with category information
- `selectSpendingByCategory()` - Groups and sums spending by category
- `selectLLMLogsForExport()` - Fetches LLM logs linked to grant transactions
- `selectBudgetSummaryForExport()` - Fetches budget summary using DB RPC function
- `selectGrantInfo()` - Fetches basic grant information

### 2. **Excel Builder Utility** (`src/utils/excelBuilder.ts`)
ExcelJS-based utility to build and format Excel workbooks:
- `addBudgetSummarySheet()` - Creates "Budget Summary" sheet with:
  - Category, Budgeted, Spent, Remaining, % Utilized columns
  - Total row with calculations
  - Formatted currency values and percentages
  
- `addTransactionsSheet()` - Creates "Transactions" sheet with:
  - Transaction ID, Date, Category, Amount, Status, Entered By, Details
  - Full transaction history
  
- `addBudgetItemsSheet()` - Creates "Budget Items" sheet with:
  - Category, Budgeted Amount, Created Date
  
- `addLLMLogsSheet()` - Creates "LLM Logs" sheet with:
  - Log ID, Transaction ID, Date, Amount, Status, Log Content
  
- `buildAndDownloadGrantExcel()` - Orchestrates workbook creation and file download

Features:
- Professional styling (blue headers, alternating row colors)
- Currency formatting ($)
- Percentage formatting
- Text wrapping for long content
- Responsive column widths
- Automatic filename with grant number and date

### 3. **Custom Export Hook** (`src/hooks/useGrantExport.ts`)
React hook that orchestrates the export workflow:
- `useGrantExport(supabase, options)` - Custom hook for managing export state
  - `isLoading` - Export in progress
  - `error` - Error object if export fails
  - `exportGrant(grantId)` - Async function to trigger export
  - Callbacks: `onSuccess`, `onError`

Fetches all required data in parallel for optimal performance.

### 4. **Updated UI Component** (`src/components/GrantDetailsModal.tsx`)
Enhanced the Grant Details Modal with:
- **Export Button** - Green "Export to Excel" button in footer (left-aligned)
- **Loading State** - Button shows "Exporting..." while processing
- **Success Notification** - Snackbar alert on successful export
- **Error Notification** - Snackbar alert on export failure
- **Disabled State** - Button disabled during export

## Data Structure

### Budget Summary Sheet
| Category | Budgeted | Spent | Remaining | % Utilized |
|----------|----------|-------|-----------|------------|
| Personnel | $50,000 | $35,000 | $15,000 | 70.00% |
| Travel | $10,000 | $8,500 | $1,500 | 85.00% |
| ... | ... | ... | ... | ... |
| **TOTAL** | **$X,XXX** | **$X,XXX** | **$X,XXX** | **X.00%** |

### Transactions Sheet
| Transaction ID | Date | Category | Amount | Status | Entered By | Details |
|---|---|---|---|---|---|---|
| 1 | 12/08/2024 | Personnel | $5,000.00 | APPROVED | John Smith | Project salary |

### Budget Items Sheet
| Category | Budgeted Amount | Created Date |
|---|---|---|
| Personnel | $50,000.00 | 12/01/2024 |

### LLM Logs Sheet
| Log ID | Transaction ID | Date | Amount | Status | Log Content |
|---|---|---|---|---|---|
| 1 | 1 | 12/08/2024 | $5,000.00 | APPROVED | [AI verification log] |

## File Generated
Export files are named: `Grant_Export_{GRANT_NUMBER}_{DATE}.xlsx`
Example: `Grant_Export_NSF-2024-001_2024-12-08.xlsx`

## Usage

### From UI
1. Click on a grant in the Grants list to open the Grant Details Modal
2. Click the green "Export to Excel" button in the footer
3. The file will automatically download with all grant data

### Programmatically
```tsx
import { useGrantExport } from "../hooks/useGrantExport";

const { exportGrant, isLoading, error } = useGrantExport(supabase, {
  onSuccess: () => console.log("Export complete!"),
  onError: (err) => console.error("Export failed:", err),
});

// Trigger export
await exportGrant(grantId);
```

## Technical Details

### Dependencies Used
- `exceljs` - v4.4.0 - Excel file generation
- `file-saver` - v2.0.5 - Browser file download
- React hooks - State management for loading/errors
- Supabase client - Data fetching

### Performance
- Parallel data fetching with `Promise.all()`
- Single workbook generation
- Client-side file creation (no server overhead)

### Error Handling
- Try-catch blocks for data fetching
- User-friendly error notifications
- State management for loading and error states

## Browser Compatibility
Works in all modern browsers that support:
- ES6+
- Blob API
- Promise
- Fetch API

## Future Enhancements
- CSV export option
- Customizable sheet selection
- Email export functionality
- Scheduled exports
- Export templates
