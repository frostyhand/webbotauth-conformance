// Renders results as a Markdown table and a summary line.
export function toMarkdown(label, results) {
  const n = (r) => results.filter((x) => x.result === r).length;
  const lines = [
    `### ${label}`,
    '',
    `Scored: ${n('pass')} pass, ${n('fail')} fail. Also ${n('info')} reported only, ${n('n/a')} not applicable, ${n('error')} errors.`,
    '',
    '| Case | Expected | Observed | Result | Notes |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const r of results) {
    const observed = r.observed ? `${r.observed}${r.coarse ? ' (status only)' : ''}${r.status ? `, HTTP ${r.status}` : ''}` : '';
    const notes = [r.note, r.error].filter(Boolean).join(' ').replace(/\|/g, '/');
    lines.push(`| ${r.id} ${r.name} | ${r.expected} | ${observed} | ${r.result} | ${notes} |`);
  }
  return lines.join('\n');
}
