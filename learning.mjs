// Structured educational content is rendered as text, never as trusted HTML.
const escape = text => String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function renderLesson(lesson) {
  let body = '', steps = [];
  const flushSteps = () => {
    if (steps.length) body += `<ol class="clinical-steps">${steps.map(text=>`<li>${escape(text)}</li>`).join('')}</ol>`;
    steps = [];
  };
  for (const block of lesson.blocks) {
    if (block.type === 'step') { steps.push(block.text); continue; }
    flushSteps();
    switch (block.type) {
      case 'paragraph': body += `<p>${escape(block.text)}</p>`; break;
      case 'heading': body += `<h5>${escape(block.text)}</h5>`; break;
      case 'table':
        body += `<div class="lesson-table-scroll" role="region" tabindex="0" aria-label="Tabel ${escape(lesson.title)}"><table class="lesson-table"><thead><tr>${block.headers.map(h=>`<th scope="col">${escape(h)}</th>`).join('')}</tr></thead><tbody>${block.rows.map(row=>`<tr>${row.map((cell,i)=>i===0?`<th scope="row">${escape(cell)}</th>`:`<td>${escape(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
        break;
      case 'pearl': case 'pitfall': case 'mnemonic': {
        const title = {pearl:'Pearl klinis',pitfall:'Pitfall',mnemonic:'Jembatan keledai'}[block.type];
        body += `<aside class="learning-callout ${block.type}"><strong>${title}</strong><p>${escape(block.text)}</p></aside>`;
        break;
      }
      default: throw new Error('Blok pembelajaran tidak dikenal.');
    }
  }
  flushSteps();
  return `<section class="learning-module"><h4>${escape(lesson.title)}</h4>${body}<p class="lesson-source"><strong>Bacaan topik:</strong> ${escape(lesson.reference)}</p></section>`;
}
