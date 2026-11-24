/**
 * Utility to format and export study notes as clean printable PDFs or text files
 */

export function exportStudyNoteAsPrintable(title: string, markdownContent: string) {
  // Strip code blocks or cleanup formatting for print
  const cleanTitle = title || 'Scheda di Studio Fuglor AI';
  const dateStr = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Convert basic markdown to clean HTML for print
  let formattedHtml = markdownContent
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 16px; margin-top: 16px; margin-bottom: 6px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 18px; margin-top: 20px; margin-bottom: 8px; color: #0f172a;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="font-size: 22px; margin-top: 22px; margin-bottom: 10px; color: #0f172a;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px;">$1</code>')
    .replace(/^\* (.*$)/gim, '<li style="margin-bottom: 4px;">$1</li>')
    .replace(/^- (.*$)/gim, '<li style="margin-bottom: 4px;">$1</li>')
    .replace(/\n\n/gim, '</p><p style="margin-bottom: 10px; line-height: 1.6;">')
    .replace(/\n/gim, '<br/>');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Consenti i popup per stampare o scaricare la scheda di studio.');
    return;
  }

  const printDocument = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>${cleanTitle} · Fuglor AI</title>
  <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400..700&display=swap" rel="stylesheet" />
  <style>
    @page { margin: 20mm; }
    body {
      font-family: 'Google Sans Flex', 'Google Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 24px;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .brand {
      font-size: 20px;
      font-weight: 800;
      color: #0369a1;
      letter-spacing: -0.5px;
    }
    .tagline {
      font-size: 12px;
      color: #64748b;
    }
    .date {
      font-size: 12px;
      color: #64748b;
      font-family: monospace;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 16px;
    }
    .content {
      font-size: 14px;
      color: #334155;
    }
    .footer {
      margin-top: 40px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Fuglor AI · Scheda di Studio</div>
      <div class="tagline">Assistente Didattico per la Scuola e i Compiti</div>
    </div>
    <div class="date">${dateStr}</div>
  </div>

  <h1 class="title">${cleanTitle}</h1>

  <div class="content">
    <p style="margin-bottom: 10px; line-height: 1.6;">${formattedHtml}</p>
  </div>

  <div class="footer">
    <span>Fuglor AI · Sviluppato da Gabriel, Luca e Federico</span>
    <span>https://fuglor.ai.studio/</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
`;

  printWindow.document.write(printDocument);
  printWindow.document.close();
}

export function downloadStudyNoteAsTxt(title: string, markdownContent: string) {
  const cleanTitle = title ? title.replace(/[^a-zA-Z0-9_-]/g, '_') : 'appunti_fuglor';
  const banner = `=======================================================\nFUGLOR AI - SCHEDA DI STUDIO E APPUNTI\nCreato da Gabriel, Luca e Federico\nData: ${new Date().toLocaleDateString('it-IT')}\n=======================================================\n\n`;

  const blob = new Blob([banner + markdownContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cleanTitle}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
