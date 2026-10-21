(function (root) {
  function parseCsv(text) {
    const lines = String(text || '').trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const cells = line.split(',').map((cell) => cell.trim());
      return Object.fromEntries(headers.map((header, index) => [header, cells[index] || '']));
    });
  }

  function parseRows(text) {
    const input = String(text || '').trim();
    if (!input) return [];
    try {
      const parsed = JSON.parse(input);
      return Array.isArray(parsed) ? parsed.filter((row) => row && typeof row === 'object') : [];
    } catch (_) {
      return parseCsv(input);
    }
  }

  function audit(rows) {
    const issues = [];
    const required = ['order_id', 'customer_id', 'amount', 'updated_at'];
    const seenOrders = new Map();
    let negativeAmounts = 0;
    rows.forEach((row, index) => {
      const line = index + 1;
      required.forEach((field) => {
        if (!String(row[field] || '').trim()) issues.push({ severity: 'high', issue: `Row ${line} is missing ${field}`, action: 'Quarantine the record before it enters the warehouse.' });
      });
      const order = String(row.order_id || '').trim();
      if (order) {
        if (seenOrders.has(order)) issues.push({ severity: 'high', issue: `Order "${order}" appears on rows ${seenOrders.get(order)} and ${line}`, action: 'Deduplicate by business key and keep the freshest update.' });
        seenOrders.set(order, line);
      }
      const amount = Number(row.amount);
      if (String(row.amount || '').trim() && (!Number.isFinite(amount) || amount < 0)) {
        negativeAmounts += 1;
        issues.push({ severity: 'medium', issue: `Row ${line} amount "${row.amount}" is not a valid non-negative number`, action: 'Validate currency conversion and source-system mapping.' });
      }
      const updated = Date.parse(row.updated_at || '');
      if (String(row.updated_at || '').trim() && Number.isNaN(updated)) issues.push({ severity: 'medium', issue: `Row ${line} updated_at "${row.updated_at}" is not a valid timestamp`, action: 'Normalize timestamp formats during ingestion.' });
    });
    const score = Math.max(0, 100 - issues.reduce((sum, issue) => sum + (issue.severity === 'high' ? 18 : 8), 0));
    return { rowCount: rows.length, negativeAmounts, score, issues };
  }

  function render(result) {
    const output = document.querySelector('#results');
    if (!output) return;
    if (!result.rowCount) {
      output.innerHTML = '<p class="empty-state">Paste order records to validate the pipeline.</p>';
      return;
    }
    const issueItems = result.issues.length ? result.issues.map((issue) => `<li><strong>${issue.severity.toUpperCase()}:</strong> ${issue.issue}<br><span>${issue.action}</span></li>`).join('') : '<li>No blocking pipeline-quality issues found.</li>';
    output.innerHTML = `<article><div class="score-row"><h4>Pipeline quality score</h4><span class="score">${result.score}/100</span></div><p>${result.rowCount} records inspected. ${result.negativeAmounts} invalid amounts found.</p><ul>${issueItems}</ul></article>`;
  }

  function boot() {
    const input = document.querySelector('#recordInput');
    const button = document.querySelector('#auditButton');
    if (!input || !button) return;
    button.addEventListener('click', () => render(audit(parseRows(input.value))));
  }

  const api = { audit, parseRows, parseCsv };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root.document) root.MetasysPipelineQA = api;
  if (root.document) root.addEventListener('DOMContentLoaded', boot);
})(typeof window !== 'undefined' ? window : globalThis);
