const ALLOWED_TAGS = new Set(["b", "strong", "em", "i", "br"]);

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function restoreAllowedTags(escaped: string): string {
  let html = escaped;

  for (const tag of ALLOWED_TAGS) {
    if (tag === "br") {
      html = html.replace(/&lt;br\s*\/?&gt;/gi, "<br />");
      continue;
    }
    html = html.replace(new RegExp(`&lt;(${tag})&gt;`, "gi"), "<$1>");
    html = html.replace(new RegExp(`&lt;/(${tag})&gt;`, "gi"), "</$1>");
  }

  return html;
}

/** Consente solo tag inline sicuri impostati dall'admin (b, strong, em, i, br). */
export function sanitizeInlineHtml(html: string): string {
  return restoreAllowedTags(escapeHtml(html));
}
