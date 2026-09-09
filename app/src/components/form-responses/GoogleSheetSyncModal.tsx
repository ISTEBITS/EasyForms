import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Check,
  RefreshCw,
  Unlink,
  Copy,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Highlight, themes } from "prism-react-renderer";
import type { Form, GoogleSheetIntegration } from "@/types/form";

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: Form;
  onSaveConfig: (config: Partial<GoogleSheetIntegration>) => Promise<void>;
  onSyncNow: () => Promise<void>;
  isSyncing: boolean;
}

const APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var raw = e.postData ? e.postData.contents : "";
    var data = typeof raw === "string" && raw.length > 0 ? JSON.parse(raw) : (e.parameter || {});
        
    var ss = null;
    if (data.sheetUrl) {
      try { ss = SpreadsheetApp.openByUrl(data.sheetUrl); } catch (err) {}
    }
    if (!ss && data.sheetId) {
      try { ss = SpreadsheetApp.openById(data.sheetId); } catch (err) {}
    }
    if (!ss) {
      try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (err) {}
    }
    if (!ss) {
      throw new Error("Could not open spreadsheet. Please ensure the script is attached to your sheet or a valid Sheet URL is provided.");
    }
        
    var sheetName = data.sheetName || "Responses";
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    function formatVal(val) {
      if (val === undefined || val === null) return "";
      return typeof val === "object" ? JSON.stringify(val) : String(val);
    }

    // Helper: Finds the actual last row of EasyForms responses based on Column 1 (Response ID)
    // This prevents custom user columns (e.g. pre-filled down to row 50) from pushing new responses down
    function getEasyFormsLastRow(targetSheet) {
      var totalRows = targetSheet.getLastRow();
      if (totalRows <= 1) return totalRows;
      var col1Values = targetSheet.getRange(1, 1, totalRows, 1).getValues();
      for (var r = col1Values.length - 1; r >= 0; r--) {
        var v = col1Values[r][0];
        if (v !== undefined && v !== null && String(v).trim() !== "") {
          return r + 1;
        }
      }
      return 1;
    }

    // 1. ACTION: sync_all (Preserves custom user columns if present)
    if (data.action === "sync_all" && data.headers && Array.isArray(data.rows)) {
      var numEasyCols = data.headers.length;
      var lastCol = Math.max(sheet.getLastColumn(), numEasyCols);
      var prevEasyLastRow = Math.max(getEasyFormsLastRow(sheet), 1);

      // Write/update EasyForms headers in Row 1 without wiping custom columns
      var formattedHeaders = data.headers.map(formatVal);
      sheet.getRange(1, 1, 1, numEasyCols).setValues([formattedHeaders]);

      // Format header with Google Forms style
      formatHeaderRow(sheet, lastCol, data.rows.length);

      // Write EasyForms row data starting at Row 2, Columns 1..numEasyCols
      if (data.rows.length > 0) {
        var formattedRows = data.rows.map(function(row) {
          var formatted = [];
          for (var i = 0; i < numEasyCols; i++) {
            formatted.push(formatVal(row && row[i]));
          }
          return formatted;
        });

        sheet.getRange(2, 1, formattedRows.length, numEasyCols).setValues(formattedRows);

        // Format data rows with comfortable cell padding & middle alignment
        formatDataRows(sheet, 2, formattedRows.length, numEasyCols);

        if (prevEasyLastRow > formattedRows.length + 1) {
          sheet.getRange(formattedRows.length + 2, 1, prevEasyLastRow - (formattedRows.length + 1), numEasyCols).clearContent();
        }
      } else {
        if (prevEasyLastRow > 1) {
          sheet.getRange(2, 1, prevEasyLastRow - 1, numEasyCols).clearContent();
        }
      }

      // Apply alternating grayish zebra striping across data rows
      applyAlternatingRowColors(sheet, (data.rows.length || 0) + 1, lastCol);

      // Apply generous column width padding matching Google Forms
      adjustColumnWidthsAndPadding(sheet, numEasyCols);

      return ContentService.createTextOutput(JSON.stringify({ status: "success", count: data.rows.length }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. ACTION: append_row (Appends new submission cleanly right after the last EasyForms response)
    if (data.action === "append_row" && data.row) {
      var rowData = Array.isArray(data.row) ? data.row.map(formatVal) : [formatVal(data.row)];
      var numCols = rowData.length;
      var easyLastRow = getEasyFormsLastRow(sheet);

      if (easyLastRow === 0 && data.headers && Array.isArray(data.headers)) {
        sheet.getRange(1, 1, 1, data.headers.length).setValues([data.headers.map(formatVal)]);
        formatHeaderRow(sheet, data.headers.length, 1);
        adjustColumnWidthsAndPadding(sheet, data.headers.length);
        easyLastRow = 1;
      }

      var nextRow = easyLastRow + 1;
      sheet.getRange(nextRow, 1, 1, numCols).setValues([rowData]);

      // Apply cell formatting & 32px height only to the newly appended row
      formatDataRows(sheet, nextRow, 1, numCols);

      // Apply alternating subtle grayish background touch to the new row
      var rowBg = (nextRow % 2 === 0) ? "#FFFFFF" : "#F8F9FA";
      sheet.getRange(nextRow, 1, 1, numCols).setBackground(rowBg);

      return ContentService.createTextOutput(JSON.stringify({ status: "success", appended: true, rowNumber: nextRow }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. ACTION: update_row (Updates specific row in-place by uniqueKey matching Column 1)
    if (data.action === "update_row" && data.row) {
      var rowData = Array.isArray(data.row) ? data.row.map(formatVal) : [formatVal(data.row)];
      var numCols = rowData.length;
      var uniqueKey = String(data.uniqueKey || (rowData.length > 0 ? rowData[0] : "")).trim();

      var easyLastRow = getEasyFormsLastRow(sheet);
      var foundRow = -1;

      if (easyLastRow > 1) {
        var idColumnValues = sheet.getRange(2, 1, easyLastRow - 1, 1).getValues();
        for (var r = 0; r < idColumnValues.length; r++) {
          if (String(idColumnValues[r][0]).trim() === uniqueKey) {
            foundRow = r + 2;
            break;
          }
        }
      }

      if (foundRow > 0) {
        // Update ONLY EasyForms columns so user custom columns are NEVER modified
        sheet.getRange(foundRow, 1, 1, numCols).setValues([rowData]);
        formatDataRows(sheet, foundRow, 1, numCols);

        var updateBg = (foundRow % 2 === 0) ? "#FFFFFF" : "#F8F9FA";
        sheet.getRange(foundRow, 1, 1, numCols).setBackground(updateBg);
        return ContentService.createTextOutput(JSON.stringify({ status: "success", updated: true, rowNumber: foundRow }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        var targetRow = easyLastRow + 1;
        sheet.getRange(targetRow, 1, 1, numCols).setValues([rowData]);
        formatDataRows(sheet, targetRow, 1, numCols);

        var newBg = (targetRow % 2 === 0) ? "#FFFFFF" : "#F8F9FA";
        sheet.getRange(targetRow, 1, 1, numCols).setBackground(newBg);
        return ContentService.createTextOutput(JSON.stringify({ status: "success", appended: true, rowNumber: targetRow }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 4. ACTION: delete_row (Deletes specific row by uniqueKey matching Column 1)
    if (data.action === "delete_row" && data.uniqueKey) {
      var uniqueKey = String(data.uniqueKey).trim();
      var easyLastRow = getEasyFormsLastRow(sheet);
      if (easyLastRow > 1) {
        var idColumnValues = sheet.getRange(2, 1, easyLastRow - 1, 1).getValues();
        for (var r = 0; r < idColumnValues.length; r++) {
          if (String(idColumnValues[r][0]).trim() === uniqueKey) {
            sheet.deleteRow(r + 2);
            return ContentService.createTextOutput(JSON.stringify({ status: "success", deleted: true }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "not_found", message: "Row not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
        
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Ready" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function formatHeaderRow(sheet, numColumns, totalDataRows) {
  if (!numColumns || numColumns < 1) return;
  var headerRange = sheet.getRange(1, 1, 1, numColumns);

  headerRange
    .setBackground("#5E35B1")        // Google Forms Purple header
    .setFontColor("#FFFFFF")         // White text
    .setFontWeight("bold")           // Bold text
    .setFontFamily("Roboto")
    .setFontSize(10)
    .setHorizontalAlignment("left")  // Clean left alignment matching questions
    .setVerticalAlignment("middle")  // Middle vertical alignment for padding
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

  sheet.setRowHeight(1, 40);
  sheet.setFrozenRows(1);

  try {
    var existingFilter = sheet.getFilter();
    if (existingFilter) {
      existingFilter.remove();
    }
    var filterRows = Math.max((totalDataRows || 0) + 1, 2);
    sheet.getRange(1, 1, filterRows, numColumns).createFilter();
  } catch (filterErr) {}
}

function formatDataRows(sheet, startRow, numRows, numColumns) {
  if (!startRow || !numRows || numRows < 1 || !numColumns || numColumns < 1) return;
  try {
    var dataRange = sheet.getRange(startRow, 1, numRows, numColumns);
    dataRange
      .setFontFamily("Roboto")
      .setFontSize(10)
      .setFontColor("#202124")
      .setHorizontalAlignment("left")
      .setVerticalAlignment("middle")
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

    // Set subtle light border for crisp Google Sheets cell separation
    dataRange.setBorder(true, true, true, true, true, true, "#E8EAED", SpreadsheetApp.BorderStyle.SOLID);

    // Set 32px height for comfortable vertical cell padding
    for (var r = 0; r < numRows; r++) {
      try { sheet.setRowHeight(startRow + r, 32); } catch (hErr) {}
    }
  } catch (err) {}
}

function adjustColumnWidthsAndPadding(sheet, numColumns) {
  if (!numColumns || numColumns < 1) return;
  try {
    sheet.autoResizeColumns(1, numColumns);
    for (var c = 1; c <= numColumns; c++) {
      var currentWidth = sheet.getColumnWidth(c);
      // Add +32px extra padding so text never touches cell edges, with min width of 140px
      var paddedWidth = Math.max(currentWidth + 32, 140);
      sheet.setColumnWidth(c, paddedWidth);
    }
  } catch (err) {}
}

function applyAlternatingRowColors(sheet, totalRows, numColumns) {
  if (!totalRows || totalRows <= 1 || !numColumns || numColumns < 1) return;
  try {
    var bandings = sheet.getBandings();
    for (var i = 0; i < bandings.length; i++) {
      bandings[i].remove();
    }
    var tableRange = sheet.getRange(1, 1, totalRows, numColumns);
    tableRange.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false)
      .setHeaderRowColor("#5E35B1")
      .setFirstRowColor("#FFFFFF")
      .setSecondRowColor("#F8F9FA");
  } catch (e) {
    for (var r = 2; r <= totalRows; r++) {
      var bg = (r % 2 === 0) ? "#FFFFFF" : "#F8F9FA";
      sheet.getRange(r, 1, 1, numColumns).setBackground(bg);
    }
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "ready", message: "EasyForms Google Sheets Webhook is active." }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  isOpen,
  onClose,
  form,
  onSaveConfig,
  onSyncNow,
  isSyncing,
}) => {
  const currentConfig = form.settings?.googleSheet || {
    connected: false,
    sheetUrl: "",
    sheetId: "",
    sheetName: "Responses",
    webhookUrl: "",
    syncMode: "manual",
    lastSyncedAt: null,
    autoSync: false,
  };

  const [sheetUrl, setSheetUrl] = useState(currentConfig.sheetUrl || "");
  const [sheetName, setSheetName] = useState(currentConfig.sheetName || "Responses");
  const [syncMode, setSyncMode] = useState<"manual" | "automated">(
    currentConfig.syncMode || (currentConfig.autoSync ? "automated" : "manual")
  );
  const [webhookUrl, setWebhookUrl] = useState(currentConfig.webhookUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = form.settings?.googleSheet;
      setSheetUrl(cfg?.sheetUrl || "");
      setSheetName(cfg?.sheetName || "Responses");
      setSyncMode(cfg?.syncMode || (cfg?.autoSync ? "automated" : "manual"));
      setWebhookUrl(cfg?.webhookUrl || "");
    }
  }, [isOpen, form.settings?.googleSheet]);

  // Copy handler with inline visual feedback without calling toast
  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSave = async () => {
    if (!sheetUrl.trim() && !webhookUrl.trim()) {
      toast.error("Enter your Google Sheet URL or Webhook URL");
      return;
    }

    if (!webhookUrl.trim()) {
      toast.warning("Paste your Google Apps Script Webhook URL to enable sync");
      return;
    }

    let sheetId = "";
    const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      sheetId = match[1];
    }

    try {
      setIsSaving(true);
      await onSaveConfig({
        connected: true,
        sheetUrl: sheetUrl.trim(),
        sheetId,
        sheetName: sheetName.trim() || "Responses",
        syncMode,
        autoSync: syncMode === "automated",
        webhookUrl: webhookUrl.trim(),
      });
      toast.success("Google Sheet connection saved");
      onClose();
    } catch {
      toast.error("Failed to save Google Sheet settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Google Sheet from this form?")) return;
    try {
      setIsSaving(true);
      await onSaveConfig({
        connected: false,
        sheetUrl: "",
        sheetId: "",
        webhookUrl: "",
        syncMode: "manual",
        autoSync: false,
      });
      toast.success("Google Sheet disconnected");
      onClose();
    } catch {
      toast.error("Failed to disconnect Google Sheet");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <DialogContent className="w-full max-w-[95vw] sm:max-w-3xl max-h-[88vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 font-sans bg-background border-border hide-scrollbar rounded-md box-border">
    {/* Modal Header */}
    <DialogHeader className="space-y-1 pb-3 border-b border-border w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base sm:text-lg font-bold text-foreground font-sans truncate">
              Google Sheets Integration
            </DialogTitle>
            <p className="text-sm text-accent-5 font-sans truncate">
              Synchronize form responses directly to your Google Spreadsheet
            </p>
          </div>
        </div>

        {currentConfig.connected && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <span className="flex items-center gap-1.5 rounded-xs border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Connected</span>
            </span>
            {currentConfig.sheetUrl && (
              <a
                href={currentConfig.sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-xs border border-border bg-background px-2.5 py-1 text-sm font-medium text-foreground hover:bg-accent-1 transition-colors"
              >
                <span>Open</span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
              </a>
            )}
          </div>
        )}
      </div>
    </DialogHeader>

    <div className="space-y-4 sm:space-y-5 pt-3 w-full min-w-0">
      {/* Sync Mode Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full min-w-0">
        <button
          type="button"
          onClick={() => setSyncMode("manual")}
          className={`p-3 rounded-sm border transition-all flex items-center justify-between text-left cursor-pointer min-w-0 ${
            syncMode === "manual"
              ? "border-foreground bg-accent-1 text-foreground"
              : "border-border bg-background text-accent-5 hover:border-accent-4 hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-sm font-semibold font-sans truncate">Manual</span>
          </div>
          {syncMode === "manual" && <Check className="h-4 w-4 shrink-0 text-foreground ml-2" />}
        </button>

        <button
          type="button"
          onClick={() => setSyncMode("automated")}
          className={`p-3 rounded-sm border transition-all flex items-center justify-between text-left cursor-pointer min-w-0 ${
            syncMode === "automated"
              ? "border-foreground bg-accent-1 text-foreground"
              : "border-border bg-background text-accent-5 hover:border-accent-4 hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-sm font-semibold font-sans truncate">Automated</span>
          </div>
          {syncMode === "automated" && <Check className="h-4 w-4 shrink-0 text-foreground ml-2" />}
        </button>
      </div>

      {/* Step 1: Spreadsheet Destination */}
      <div className="rounded-sm border border-border bg-background p-3.5 sm:p-4 space-y-3 shadow-xs w-full min-w-0 box-border">
        <div className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-sm font-semibold">
            1
          </span>
          <h4 className="text-sm font-semibold text-foreground font-sans truncate">
            Spreadsheet Details
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 w-full min-w-0">
          <div className="space-y-1.5 md:col-span-2 min-w-0">
            <Label className="text-sm font-medium text-foreground font-sans truncate block">
              Google Spreadsheet URL *
            </Label>
            <Input
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="text-sm font-sans bg-background w-full truncate"
            />
          </div>

          <div className="space-y-1.5 min-w-0">
            <Label className="text-sm font-medium text-foreground font-sans truncate block">
              Worksheet Name
            </Label>
            <Input
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              placeholder="Responses"
              className="text-sm font-sans bg-background w-full truncate"
            />
          </div>
        </div>
      </div>

      {/* Step 2: Google Apps Script Webhook Guide & Colorful Code */}
      <div className="rounded-sm border border-border bg-background p-3.5 sm:p-4 space-y-3 shadow-xs w-full min-w-0 box-border overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-sm font-semibold">
              2
            </span>
            <h4 className="text-sm font-semibold text-foreground font-sans truncate">
              Deploy Webhook Script
            </h4>
          </div>
          <span className="text-xs sm:text-sm text-accent-5 font-sans truncate">
            Extensions &gt; Apps Script &gt; Deploy as Web App
          </span>
        </div>

        {/* Code Box with Prism Syntax Highlighting, Inline Copy, and Hidden Scrollbars */}
        <div className="rounded-sm border border-zinc-800 bg-zinc-950 overflow-hidden shadow-inner w-full min-w-0">
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-zinc-800/80 bg-zinc-900/60">
            <div className="flex items-center gap-2 min-w-0">
              <Layers className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span className="text-sm font-medium text-zinc-300 font-sans truncate">
                code.gs
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 rounded-xs bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-sm font-medium text-zinc-200 transition-colors cursor-pointer shrink-0"
            >
              {copiedCode ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3.5 max-h-52 sm:max-h-60 overflow-y-auto overflow-x-auto text-sm hide-scrollbar w-full">
            <Highlight
              theme={themes.nightOwl}
              code={APPS_SCRIPT_CODE}
              language="javascript"
            >
              {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <pre
                  className={`${className} font-mono text-sm leading-relaxed whitespace-pre hide-scrollbar`}
                  style={{ ...style, backgroundColor: "transparent" }}
                >
                  {tokens.map((line, i) => (
                    <div key={i} {...getLineProps({ line })}>
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </div>
                  ))}
                </pre>
              )}
            </Highlight>
          </div>
        </div>
      </div>

      {/* Step 3: Webhook Endpoint URL */}
      <div className="rounded-sm border border-border bg-background p-3.5 sm:p-4 space-y-3 shadow-xs w-full min-w-0 box-border">
        <div className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-sm font-semibold">
            3
          </span>
          <h4 className="text-sm font-semibold text-foreground font-sans truncate">
            Connect Webhook URL
          </h4>
        </div>

        <div className="space-y-1.5 pt-1 w-full min-w-0">
          <Label className="text-sm font-medium text-foreground font-sans truncate block">
            Google Apps Script Webhook URL *
          </Label>
          <Input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="text-sm font-sans bg-background w-full truncate"
          />
        </div>
      </div>

      {/* Modal Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 pt-3 w-full min-w-0">
        <div className="w-full sm:w-auto">
          {currentConfig.connected && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={isSaving || isSyncing}
              className="w-full sm:w-auto gap-1.5 text-sm font-sans text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/30"
            >
              <Unlink className="h-4 w-4 shrink-0" />
              <span>Disconnect</span>
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSaving || isSyncing}
            className="text-sm font-sans w-full sm:w-auto"
          >
            Cancel
          </Button>

          {currentConfig.connected && (
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await onSyncNow();
              }}
              disabled={isSaving || isSyncing}
              className="gap-1.5 text-sm font-sans w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 shrink-0 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || isSyncing}
            className="gap-1.5 text-sm font-sans w-full sm:w-auto"
          >
            <Check className="h-4 w-4 shrink-0" />
            <span>{isSaving ? "Saving..." : "Save & Connect"}</span>
          </Button>
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>
  );
};
