import type { FormResponse, Question } from "@/types/form";

/**
 * Formats a raw response value into a clean readable string.
 */
export function formatAnswerValue(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "Not answered";
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "object") {
    if ("name" in (value as Record<string, unknown>)) {
      return String((value as Record<string, unknown>).name);
    }
    // Multiple Choice Grid record: { rowName: colChoice }
    return Object.entries(value as Record<string, string>)
      .map(([row, col]) => `${row}: ${col}`)
      .join(" | ");
  }
  return String(value);
}

/**
 * Downloads a candidate submission as a formatted Microsoft Word (.doc) document.
 */
export function exportCandidateToDoc(
  response: FormResponse,
  questions: Question[],
  formTitle: string
) {
  const candidateEmail = response.respondentEmail || "Anonymous Respondent";
  const submissionDate = new Date(response.submittedAt).toLocaleString();
  const status = (response.status || "unreviewed").toUpperCase();

  const rowsHtml = questions
    .filter((q) => q.type !== "section_break")
    .map((q, idx) => {
      const ans = response.answers?.find((a) => a.questionId === q.id);
      const formattedVal = formatAnswerValue(ans?.value);

      return `
      <tr>
        <td style="padding: 12px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600; width: 35%; vertical-align: top; color: #171717;">
          ${idx + 1}. ${escapeHtml(q.title)}
        </td>
        <td style="padding: 12px; border: 1px solid #e5e7eb; color: #374151; vertical-align: top;">
          ${escapeHtml(formattedVal)}
        </td>
      </tr>
    `;
    })
    .join("");

  const notesHtml =
    response.notes && response.notes.length > 0
      ? `
      <h3 style="margin-top: 24px; font-size: 16px; color: #171717;">Internal Notes</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
        ${response.notes
          .map(
            (n) => `
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600; width: 30%; color: #4b5563;">
              ${escapeHtml(n.author)} (${new Date(n.createdAt).toLocaleDateString()})
            </td>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb; color: #374151;">
              ${escapeHtml(n.text)}
            </td>
          </tr>
        `
          )
          .join("")}
      </table>
    `
      : "";

  const docHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${escapeHtml(formTitle)} - ${escapeHtml(candidateEmail)}</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #171717; margin: 24px; }
        h1 { font-size: 22px; color: #171717; margin-bottom: 4px; }
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; background-color: #f3f4f6; border-radius: 4px; }
        .meta-table td { padding: 10px 14px; border: 1px solid #e5e7eb; }
        .data-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(formTitle)}</h1>
      <p style="color: #6b7280; font-size: 13px; margin-top: 0; margin-bottom: 16px;">Candidate Submission Report • EasyForms</p>
      
      <table class="meta-table">
        <tr>
          <td><strong>Respondent:</strong> ${escapeHtml(candidateEmail)}</td>
          <td><strong>Status:</strong> ${escapeHtml(status)}</td>
        </tr>
        <tr>
          <td><strong>Submission Date:</strong> ${escapeHtml(submissionDate)}</td>
          <td><strong>Submission ID:</strong> ${escapeHtml(response.id || response._id || "")}</td>
        </tr>
      </table>

      <h2 style="font-size: 17px; margin-bottom: 8px; color: #171717;">Submitted Answers</h2>
      <table class="data-table">
        ${rowsHtml}
      </table>

      ${notesHtml}
    </body>
    </html>
  `;

  const blob = new Blob(["\ufeff", docHtml], {
    type: "application/msword",
  });

  downloadBlob(
    blob,
    `${sanitizeFilename(formTitle)}_${sanitizeFilename(candidateEmail)}_Response.doc`
  );
}

/**
 * Downloads a candidate submission as a Microsoft Excel XML / CSV spreadsheet (.xlsx compatible).
 */
export function exportCandidateToExcel(
  response: FormResponse,
  questions: Question[],
  formTitle: string
) {
  const candidateEmail = response.respondentEmail || "Anonymous Respondent";
  const submissionDate = new Date(response.submittedAt).toLocaleString();
  const status = response.status || "unreviewed";

  const rows: Array<[string, string]> = [
    ["Form Title", formTitle],
    ["Respondent Email", candidateEmail],
    ["Submission Date", submissionDate],
    ["Status", status],
    ["Response ID", response.id || response._id || ""],
    ["", ""],
    ["Question", "Answer"],
  ];

  questions
    .filter((q) => q.type !== "section_break")
    .forEach((q, idx) => {
      const ans = response.answers?.find((a) => a.questionId === q.id);
      const val = formatAnswerValue(ans?.value);
      rows.push([`${idx + 1}. ${q.title}`, val]);
    });

  if (response.notes && response.notes.length > 0) {
    rows.push(["", ""]);
    rows.push(["Internal Notes", ""]);
    response.notes.forEach((n) => {
      rows.push([`${n.author} (${new Date(n.createdAt).toLocaleDateString()})`, n.text]);
    });
  }

  // Generate clean CSV with UTF-8 BOM
  const csvContent =
    "\ufeff" +
    rows
      .map((r) =>
        r
          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(
    blob,
    `${sanitizeFilename(formTitle)}_${sanitizeFilename(candidateEmail)}_Response.csv`
  );
}

/**
 * Generates a clean, high-resolution printable report and triggers PDF print dialog.
 */
export function exportCandidateToPdf(
  response: FormResponse,
  questions: Question[],
  formTitle: string
) {
  const candidateEmail = response.respondentEmail || "Anonymous Respondent";
  const submissionDate = new Date(response.submittedAt).toLocaleString();
  const status = (response.status || "unreviewed").toUpperCase();

  const questionsHtml = questions
    .filter((q) => q.type !== "section_break")
    .map((q, idx) => {
      const ans = response.answers?.find((a) => a.questionId === q.id);
      const val = formatAnswerValue(ans?.value);

      return `
      <div class="q-block">
        <div class="q-title">${idx + 1}. ${escapeHtml(q.title)}</div>
        <div class="q-ans ${ans?.value ? "answered" : "empty"}">${escapeHtml(val)}</div>
      </div>
    `;
    })
    .join("");

  const notesHtml =
    response.notes && response.notes.length > 0
      ? `
      <div class="notes-section">
        <h3>Internal Notes</h3>
        ${response.notes
          .map(
            (n) => `
          <div class="note-item">
            <strong>${escapeHtml(n.author)}</strong> <span class="note-date">(${new Date(
              n.createdAt
            ).toLocaleDateString()})</span>:
            <p>${escapeHtml(n.text)}</p>
          </div>
        `
          )
          .join("")}
      </div>
    `
      : "";

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download and print the candidate PDF report.");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${escapeHtml(formTitle)} - ${escapeHtml(candidateEmail)}</title>
      <style>
        @page { size: A4; margin: 18mm 16mm; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #171717;
          background: #ffffff;
          line-height: 1.5;
          margin: 0;
          padding: 24px;
        }
        .header {
          border-bottom: 2px solid #171717;
          padding-bottom: 12px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .header h1 {
          margin: 0 0 4px 0;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .header .sub {
          margin: 0;
          font-size: 13px;
          color: #6b7280;
        }
        .badge {
          display: inline-block;
          padding: 4px 10px;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          background: #fafafa;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 14px;
          margin-bottom: 24px;
        }
        .meta-item { font-size: 13px; }
        .meta-item .label { color: #6b7280; font-weight: 500; }
        .meta-item .val { font-weight: 600; color: #111827; }
        .section-title {
          font-size: 16px;
          font-weight: 700;
          margin: 20px 0 12px 0;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 6px;
        }
        .q-block {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px 14px;
          margin-bottom: 10px;
          page-break-inside: avoid;
        }
        .q-title {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 6px;
        }
        .q-ans {
          font-size: 14px;
          color: #111827;
          background: #f9fafb;
          border: 1px solid #f3f4f6;
          border-radius: 4px;
          padding: 8px 10px;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .q-ans.empty {
          color: #9ca3af;
          font-style: italic;
        }
        .notes-section {
          margin-top: 24px;
          padding-top: 14px;
          border-top: 1px solid #e5e7eb;
          page-break-inside: avoid;
        }
        .note-item {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 10px;
          margin-top: 8px;
          font-size: 13px;
        }
        .note-date { color: #6b7280; font-size: 12px; }
        .note-item p { margin: 4px 0 0 0; color: #374151; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>${escapeHtml(formTitle)}</h1>
          <p class="sub">Candidate Response Report • EasyForms</p>
        </div>
        <div>
          <span class="badge">${escapeHtml(status)}</span>
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-item"><span class="label">Respondent:</span> <span class="val">${escapeHtml(
          candidateEmail
        )}</span></div>
        <div class="meta-item"><span class="label">Submitted Date:</span> <span class="val">${escapeHtml(
          submissionDate
        )}</span></div>
        <div class="meta-item"><span class="label">Response ID:</span> <span class="val">${escapeHtml(
          response.id || response._id || ""
        )}</span></div>
      </div>

      <div class="section-title">Form Answers</div>
      ${questionsHtml}
      ${notesHtml}

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeFilename(str: string): string {
  return String(str || "export")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 40);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
