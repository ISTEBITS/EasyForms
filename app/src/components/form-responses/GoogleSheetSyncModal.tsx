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
      throw new Error("Could not open spreadsheet. Please provide a valid Sheet URL.");
    }
    
    var sheetName = data.sheetName || "Responses";
    var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    
    if (data.action === "sync_all" && data.headers && Array.isArray(data.rows)) {
      sheet.clear();
      sheet.appendRow(data.headers);
      
      if (data.rows.length > 0) {
        var numCols = data.headers.length;
        var formattedRows = data.rows.map(function(row) {
          var formatted = [];
          for (var i = 0; i < numCols; i++) {
            var val = (row && row[i] !== undefined && row[i] !== null) ? row[i] : "";
            formatted.push(typeof val === "object" ? JSON.stringify(val) : String(val));
          }
          return formatted;
        });
        sheet.getRange(2, 1, formattedRows.length, numCols).setValues(formattedRows);
      }
      try { sheet.autoResizeColumns(1, data.headers.length); } catch (e) {}
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", count: data.rows.length }))
        .setMimeType(ContentService.MimeType.JSON);
    } 
    
    if (data.action === "append_row" && data.row) {
      var rowToAppend = Array.isArray(data.row) ? data.row.map(function(v) {
        return (v === undefined || v === null) ? "" : (typeof v === "object" ? JSON.stringify(v) : String(v));
      }) : [String(data.row)];
      
      sheet.appendRow(rowToAppend);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", appended: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "ready" }))
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
