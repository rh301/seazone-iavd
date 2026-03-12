/**
 * Formata markdown básico do chat para HTML seguro (sem dangerouslySetInnerHTML).
 * Escapa HTML antes de aplicar formatações.
 */
export function formatChatContent(content: string): string {
  // Escapa HTML primeiro
  const escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  // Aplica formatações em cima do texto escapado
  return escaped
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(
      /^&gt; (.+)$/gm,
      '<span class="italic text-gray-500">$1</span>'
    )
    .replace(/^• /gm, "· ");
}
