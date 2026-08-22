const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const sanitizeUrl = (value: string) => {
  if (/^(https?:\/\/|mailto:)/i.test(value)) return value;
  return "#";
};

const renderInlineMarkdown = (value: string) =>
  value
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      (_, text: string, href: string) =>
        `<a href="${sanitizeUrl(href)}" target="_blank" rel="noopener noreferrer" class="text-accent-7 hover:text-foreground underline underline-offset-2">${text}</a>`,
    )
    .replace(
      /`([^`]+)`/g,
      '<code class="px-1.5 py-0.5 rounded-xs bg-accent-1 border border-border text-foreground">$1</code>',
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/~~([^~]+)~~/g, "<s>$1</s>");

const closeLists = (output: string[], inUl: boolean, inOl: boolean) => {
  if (inUl) output.push("</ul>");
  if (inOl) output.push("</ol>");
};

export const renderMarkdownPreview = (value: string) => {
  const lines = escapeHtml(value).split(/\r?\n/);
  const output: string[] = [];
  let inUl = false;
  let inOl = false;
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        output.push(
          `<pre class="overflow-x-auto rounded-sm border border-border bg-accent-1 p-3"><code>${codeBuffer.join("\n")}</code></pre>`,
        );
        inCodeBlock = false;
        codeBuffer = [];
      } else {
        closeLists(output, inUl, inOl);
        inUl = false;
        inOl = false;
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    if (!line) {
      closeLists(output, inUl, inOl);
      inUl = false;
      inOl = false;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      closeLists(output, inUl, inOl);
      inUl = false;
      inOl = false;
      const level = heading[1].length;
      const sizeClass =
        level === 1
          ? "text-2xl sm:text-3xl"
          : level === 2
            ? "text-xl sm:text-2xl"
            : "text-base sm:text-lg";
      output.push(
        `<h${level} class="font-semibold text-foreground ${sizeClass}">${renderInlineMarkdown(heading[2])}</h${level}>`,
      );
      continue;
    }

    const ulItem = line.match(/^[-*]\s+(.+)$/);
    if (ulItem) {
      if (inOl) {
        output.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        output.push('<ul class="list-disc ml-5 space-y-1.5 text-accent-6">');
        inUl = true;
      }
      output.push(`<li>${renderInlineMarkdown(ulItem[1])}</li>`);
      continue;
    }

    const olItem = line.match(/^\d+\.\s+(.+)$/);
    if (olItem) {
      if (inUl) {
        output.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        output.push('<ol class="list-decimal ml-5 space-y-1.5 text-accent-6">');
        inOl = true;
      }
      output.push(`<li>${renderInlineMarkdown(olItem[1])}</li>`);
      continue;
    }

    closeLists(output, inUl, inOl);
    inUl = false;
    inOl = false;

    const quote = line.match(/^>\s+(.+)$/);
    if (quote) {
      output.push(
        `<blockquote class="border-l-2 border-accent-2 pl-3 italic text-accent-5">${renderInlineMarkdown(quote[1])}</blockquote>`,
      );
      continue;
    }

    if (/^---+$/.test(line)) {
      output.push('<hr class="border-border my-2" />');
      continue;
    }

    output.push(`<p class="text-accent-6">${renderInlineMarkdown(line)}</p>`);
  }

  if (inCodeBlock) {
    output.push(
      `<pre class="overflow-x-auto rounded-sm border border-border bg-accent-1 p-3"><code>${codeBuffer.join("\n")}</code></pre>`,
    );
  }
  closeLists(output, inUl, inOl);
  return output.join("");
};

export const formHeaderMarkdownSource = (
  title: string,
  description: string | undefined,
  fallbackDescription: string,
) =>
  title?.trim()
    ? `# ${title}\n\n${description || ""}`
    : `# Untitled Form\n\n${fallbackDescription}`;

export const stripMarkdown = (value: string): string => {
  if (!value) return "";
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/^>\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .trim();
};

export const renderInlineMarkdownHtml = (value: string): string => {
  if (!value) return "";
  const escaped = escapeHtml(value);
  return renderInlineMarkdown(escaped);
};
