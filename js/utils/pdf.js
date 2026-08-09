/**
 * PDF Export (lightweight, no library)
 * Uses browser print-to-PDF as the primary method.
 * Falls back to a printable HTML overlay.
 */

/**
 * Export a checklist to PDF via the browser's print dialog.
 * @param {string} title - Document title
 * @param {Array} items - Array of { text: string, checked?: boolean }
 * @param {object} options - { subtitle, language }
 */
export function exportChecklistPDF(title, items, options = {}) {
  const { subtitle = '', language = 'en' } = options;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to export PDF.');
    return;
  }

  const styles = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', 'Noto Sans Devanagari', system-ui, sans-serif;
      line-height: 1.5;
      color: #1e293b;
      padding: 2rem;
      max-width: 700px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #1565C0;
    }
    .header h1 {
      font-size: 1.5rem;
      color: #1565C0;
      margin-bottom: 0.25rem;
    }
    .header .subtitle {
      font-size: 0.875rem;
      color: #64748b;
    }
    .header .disclaimer {
      font-size: 0.7rem;
      color: #94a3b8;
      margin-top: 0.5rem;
    }
    .item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.9rem;
    }
    .checkbox {
      width: 18px;
      height: 18px;
      border: 2px solid #94a3b8;
      border-radius: 3px;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .footer {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      font-size: 0.7rem;
      color: #94a3b8;
      text-align: center;
    }
    @media print {
      body { padding: 1rem; }
      .no-print { display: none; }
    }
  `;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <title>${title} - MeroKagaj</title>
      <style>${styles}</style>
    </head>
    <body>
      <div class="no-print" style="text-align:center;margin-bottom:1rem">
        <button onclick="window.print()" style="padding:0.5rem 1.5rem;background:#1565C0;color:white;border:none;border-radius:6px;cursor:pointer;font-size:0.9rem">
          Print / Save as PDF
        </button>
      </div>
      <div class="header">
        <h1>${escapeHTML(title)}</h1>
        ${subtitle ? `<div class="subtitle">${escapeHTML(subtitle)}</div>` : ''}
        <div class="disclaimer">MeroKagaj (मेरोकागज) — Independent informational platform. Verify with official offices.</div>
      </div>
      ${items.map(item => `
        <div class="item">
          <div class="checkbox"></div>
          <span>${escapeHTML(item.text)}</span>
        </div>
      `).join('')}
      <div class="footer">
        Generated from MeroKagaj (merokagaj.com) — ${new Date().toLocaleDateString(language === 'ne' ? 'ne-NP' : 'en-US')}
      </div>
    </body>
    </html>
  `);

  printWindow.document.close();
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
