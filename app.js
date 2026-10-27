import { STORAGE_KEY, MODES, emptyState, makeSession, selectAnswer, summarize, restoreState } from './engine.mjs';

const LABELS = ['Telinga, Pendengaran, dan Keseimbangan', 'Hidung dan Sinus Paranasal', 'Laring Faring', 'Bronkoesofagologi', 'Onkologi THT', 'Fasial Plastik Rekonstruksi', 'Lain-lain'];
const REFERENCES = {
  R1: 'Chandrasekhar SS, dkk. Clinical Practice Guideline: Sudden Hearing Loss (Update). Otolaryngol Head Neck Surg. 2019;161(1 Suppl):S1-S45.',
  R2: 'Bhattacharyya N, dkk. Clinical Practice Guideline: Benign Paroxysmal Positional Vertigo (Update). Otolaryngol Head Neck Surg. 2017;156(3 Suppl):S1-S47.',
  R3: 'Tunkel DE, dkk. Clinical Practice Guideline: Nosebleed (Epistaxis). Otolaryngol Head Neck Surg. 2020;162(1 Suppl):S1-S38.',
  R4: 'Katz PO, dkk. ACG Clinical Guideline for the Diagnosis and Management of Gastroesophageal Reflux Disease. Am J Gastroenterol. 2022;117:27-56.',
  R5: 'Birk M, dkk. Removal of foreign bodies in the upper gastrointestinal tract in adults: ESGE Clinical Guideline. Endoscopy. 2016;48:489-496.',
  R6: 'Pynnonen MA, dkk. Clinical Practice Guideline: Evaluation of the Neck Mass in Adults. Otolaryngol Head Neck Surg. 2017;157(2 Suppl):S1-S30.',
  R7: 'Stachler RJ, dkk. Clinical Practice Guideline: Hoarseness (Dysphonia) (Update). Otolaryngol Head Neck Surg. 2018;158(1 Suppl):S1-S42.',
  R8: 'Mubarak A, dkk. Diagnosis, Management, and Prevention of Button Battery Ingestion in Childhood: ESPGHAN Position Paper. J Pediatr Gastroenterol Nutr. 2021;73:129-136.'
};
const main = document.querySelector('#main');
const dialog = document.querySelector('#dialog');
const status = document.querySelector('#save-status');
let chapters = [], byId = {}, state = emptyState(), reviewing = false, storageAvailable = true;

const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label = mode => mode === 'random' ? 'Random 25 soal campur' : LABELS[Number(mode) - 1];
const letter = index => String.fromCharCode(65 + index);
const count = session => summarize(session, byId);

function updateStatus() {
  status.textContent = !storageAvailable ? 'Progres hanya untuk sesi ini' : !navigator.onLine ? 'Offline · progres tersimpan' : 'Progres tersimpan di perangkat ini';
}
function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageAvailable = true; }
  catch { storageAvailable = false; }
  updateStatus();
}
function focusHeading(selector = '.view-heading') { document.querySelector(selector)?.focus({ preventScroll: true }); }
function goTop() { window.scrollTo({ top: 0, behavior: 'instant' }); focusHeading(); }
function goHome() { state.lastMode = null; reviewing = false; persist(); render(); goTop(); }

function modal(title, content, actions) {
  dialog.querySelector('#dialog-body').innerHTML = `<h2 id="dialog-title">${escape(title)}</h2>${content}`;
  const container = dialog.querySelector('#dialog-actions');
  container.replaceChildren();
  for (const action of actions) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = `btn ${action.style || ''}`; button.textContent = action.label;
    button.addEventListener('click', () => { dialog.close(); action.run?.(); });
    container.append(button);
  }
  dialog.showModal();
}

function start(mode) {
  if (!MODES.includes(mode)) return;
  if (!state.sessions[mode]) state.sessions[mode] = makeSession(mode, chapters);
  state.lastMode = mode; reviewing = false; persist(); render(); goTop();
}

function renderHome() {
  const active = MODES.map(mode => [mode, state.sessions[mode]]).find(([,s]) => s && count(s).answered > 0 && !s.finished);
  main.innerHTML = `<section class="hero"><div><span class="eyebrow">DARI DOKTER UMUM, MENUJU THT-KL</span><h1>Belajar satu kasus.<br><em>Pahami setiap alasan.</em></h1><p>Ruang kecil untuk mempersiapkan langkah besar. Pilih topikmu, kerjakan soal klinis, lalu pelajari mengapa suatu jawaban paling tepat.</p></div><aside class="study-note" aria-label="175 soal, 25 soal per sesi"><span class="eyebrow">TEMAN BELAJAR MANDIRI</span><span class="note-number">175<span aria-hidden="true">.</span></span><p>soal dari Buku THT-BKL UI 2024</p><span class="note-rule"></span><p>25 soal per sesi.<br>Satu langkah lebih paham.</p></aside></section>
    ${active ? `<div class="resume-banner"><div><strong>Masih ada sesi yang bisa dilanjutkan.</strong><p>${escape(label(active[0]))} · ${count(active[1]).answered}/25 terjawab</p></div><button class="btn small" data-start="${active[0]}">Lanjut belajar <span aria-hidden="true">↗</span></button></div>` : ''}
    <section aria-labelledby="topic-heading"><div class="section-header"><div><h2 id="topic-heading" class="view-heading" tabindex="-1">Hari ini, mau belajar apa?</h2><p>Pilih satu dari tujuh topik, atau campurkan semuanya.</p></div><span class="eyebrow">01—08 / PILIH SESIMU</span></div><div class="topic-grid">${MODES.map((mode,i) => {
      const session = state.sessions[mode], stats = session ? count(session) : null;
      const caption = session?.finished ? `Skor ${stats.score}/100` : stats?.answered ? `${stats.answered}/25 terjawab` : mode === 'random' ? 'Dari seluruh topik' : 'Pembahasan A–E';
      const action = session?.finished ? 'Lihat hasil' : session ? 'Lanjutkan' : 'Mulai belajar';
      return `<button class="topic-card ${mode === 'random' ? 'random' : ''}" type="button" data-start="${mode}" aria-label="${escape(label(mode))}: ${escape(action)}"><span class="card-top"><span class="card-number" aria-hidden="true">${mode === 'random' ? '↝' : `0${i+1}`}</span><span class="pill">25 soal</span></span><h3>${escape(label(mode))}</h3><span class="card-bottom"><span>${escape(caption)}<br>${action}</span><span class="arrow" aria-hidden="true">↗</span></span>${stats?.answered ? `<span class="tiny-track"><span class="percent-${stats.progress}"></span></span>` : ''}</button>`;
    }).join('')}</div></section><div class="home-bottom"><p>${storageAvailable ? 'Progres disimpan otomatis pada peramban dan perangkat yang sama. Menghapus data peramban atau menggunakan mode privat dapat menghilangkan progres.' : 'Penyimpanan peramban tidak tersedia. Kamu tetap dapat belajar, tetapi progres bisa hilang saat halaman ditutup.'}</p><button class="text-button" data-action="reset-all">Reset semua progres</button></div>`;
}

function feedback(q, chosen) {
  const correct = chosen === q.answer, unanswered = chosen === undefined;
  return `<section class="feedback" aria-labelledby="feedback-heading"><span class="feedback-badge ${unanswered ? 'neutral' : correct ? '' : 'miss'}">${unanswered ? 'Belum dijawab' : correct ? '✓ Jawaban benar' : '× Jawaban belum tepat'}</span><h3 id="feedback-heading" tabindex="-1">Mari pahami alasannya.</h3><p class="correct-answer"><strong>Jawaban: ${letter(q.answer)}. ${escape(q.choices[q.answer].text)}</strong></p>${q.choices.map((choice,i) => `<p class="reason ${i === q.answer ? 'is-correct' : ''}"><strong>${letter(i)} — ${i === q.answer ? 'Benar.' : 'Tidak tepat pada kasus ini.'}</strong> ${escape(choice.why)}</p>`).join('')}<div class="reference"><strong>Baca kembali</strong>${escape(q.reference)}${q.extras?.length ? `<details><summary>Pedoman tambahan</summary>${q.extras.map(r => `<p>${escape(REFERENCES[r] || r)}</p>`).join('')}</details>` : ''}</div></section>`;
}

function renderQuiz(session, mode) {
  const q = byId[session.ids[session.index]], stats = count(session), chosen = session.answers[q.id];
  const revealed = chosen !== undefined || session.finished;
  main.innerHTML = `<div class="quiz-heading"><div><button class="back" data-action="home">← Semua topik</button><span class="eyebrow">${mode === 'random' ? 'CAMPURAN TUJUH TOPIK' : `BAB ${mode}`}${session.finished ? ' · TINJAU JAWABAN' : ''}</span><h1 class="view-heading" tabindex="-1">${escape(label(mode))}</h1></div><button class="btn secondary small" data-action="reset-session">${mode === 'random' ? 'Acak sesi baru' : 'Ulangi sesi'}</button></div>
    <div class="progress-panel"><div class="progress-label"><span>${stats.answered} dari 25 soal terjawab</span><strong>${stats.progress}%</strong></div><div class="progress-track" role="progressbar" aria-label="Progres soal terjawab" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${stats.progress}"><div class="progress-fill percent-${stats.progress}"></div></div></div>
    <div class="quiz-layout"><div class="question-panel"><div class="question-meta"><span>SOAL ${String(session.index+1).padStart(2,'0')} / 25</span><span>${escape(LABELS[q.chapter-1])} · ${escape(q.id)}</span></div><h2 class="question-text" id="question-heading" tabindex="-1">${escape(q.stem)}</h2><div class="options" role="group" aria-labelledby="question-heading">${q.choices.map((choice,i) => {
      const selected = chosen === i, isCorrect = revealed && i === q.answer, isWrong = selected && i !== q.answer;
      return `<button type="button" class="option ${isCorrect ? 'correct' : isWrong ? 'incorrect' : ''}" data-answer="${i}" aria-pressed="${selected}" ${revealed ? 'disabled' : ''}><span class="letter">${letter(i)}</span><span class="option-text">${escape(choice.text)}</span>${isCorrect || isWrong ? `<span class="choice-status">${isCorrect ? '✓ Benar' : '× Pilihanmu'}</span>` : ''}</button>`;
    }).join('')}</div>${revealed ? feedback(q,chosen) : '<p class="answer-hint">Pilih satu jawaban. Pilihan pertama dikunci; pembahasan langsung terbuka setelahnya.</p>'}${stats.answered === 25 && !session.finished ? '<p class="all-done">✓ Semua soal sudah terjawab. Tekan Selesai untuk melihat skor.</p>' : ''}<div class="quiz-bottom"><button class="btn secondary" data-action="previous" ${session.index === 0 ? 'disabled' : ''}>← Sebelumnya</button><div class="quiz-bottom-right">${session.index < 24 ? '<button class="btn" data-action="next">Berikutnya →</button>' : ''}${session.finished ? '<button class="btn" data-action="results">Lihat hasil</button>' : session.index === 24 || stats.answered === 25 ? '<button class="btn" data-action="finish">Selesai ✓</button>' : ''}</div></div></div><aside class="sidebar"><div class="map-card"><h2>Navigasi soal</h2><div class="number-grid">${session.ids.map((id,i) => {
      const value = session.answers[id], statusText = value === undefined ? 'belum dijawab' : value === byId[id].answer ? 'benar' : 'salah';
      return `<button class="number-button ${value === undefined ? '' : value === byId[id].answer ? 'right' : 'wrong'} ${session.index === i ? 'current' : ''}" type="button" data-jump="${i}" ${session.index === i ? 'aria-current="step"' : ''} aria-label="Soal ${i+1}, ${statusText}">${i+1}</button>`;
    }).join('')}</div><div class="legend"><span>Benar</span><span>Salah</span></div></div><p class="sidebar-note">“Bukan sekadar ingat jawaban, tetapi mengerti alasannya.”<small>Gunakan nomor soal untuk berpindah. Progres bertambah 4% setiap kali satu soal dijawab.</small></p></aside></div>`;
}

function renderResults(session, mode) {
  const stats = count(session);
  main.innerHTML = `<section class="results"><button class="back" data-action="home">← Semua topik</button><div class="result-card"><span class="eyebrow">SESI SELESAI · ${mode === 'random' ? 'SOAL CAMPURAN' : `BAB ${mode}`}</span><h1 class="view-heading result-title" tabindex="-1">Satu sesi, satu langkah maju.</h1><p>${escape(label(mode))}</p><div class="score-circle"><strong>${stats.score}</strong><small>SKOR DARI 100</small></div><p>${stats.correct} dari 25 soal dijawab benar.<br>${stats.score >= 80 ? 'Pertahankan pemahamanmu dan tinjau bagian yang masih perlu dikuatkan.' : 'Gunakan pembahasan untuk mengenali konsep yang perlu dipelajari kembali.'}</p><div class="result-stats"><div><strong>${stats.correct}</strong><span>Benar</span></div><div><strong>${stats.wrong}</strong><span>Salah</span></div><div><strong>${stats.unanswered}</strong><span>Belum dijawab</span></div></div><div class="result-actions"><button class="btn" data-action="review">Tinjau pembahasan</button><button class="btn secondary" data-action="reset-session">${mode === 'random' ? 'Acak 25 soal baru' : 'Ulangi topik ini'}</button></div><p class="score-note">Skor = jawaban benar ÷ 25 × 100. Soal yang belum dijawab bernilai 0.<br>Skor ini untuk evaluasi belajar, bukan prediksi hasil seleksi.</p></div></section>`;
}

function render() {
  if (!state.lastMode) return renderHome();
  const session = state.sessions[state.lastMode];
  if (session.finished && !reviewing) renderResults(session,state.lastMode);
  else renderQuiz(session,state.lastMode);
}

function finish() {
  const mode = state.lastMode, session = state.sessions[mode], stats = count(session);
  const commit = () => { session.finished = true; reviewing = false; persist(); render(); goTop(); };
  if (stats.unanswered) modal('Selesaikan sesi ini?', `<p>Masih ada <strong>${stats.unanswered} soal yang belum dijawab</strong>. Jika diselesaikan sekarang, soal tersebut bernilai 0. Kamu tetap bisa membaca seluruh pembahasan setelahnya.</p>`, [{label:'Lanjut belajar',style:'secondary'},{label:'Selesai & hitung skor',run:commit}]);
  else commit();
}

function resetSession() {
  const mode = state.lastMode;
  modal(mode === 'random' ? 'Acak sesi baru?' : 'Ulangi topik ini?', `<p>Jawaban dan skor <strong>sesi ini</strong> akan dikosongkan.${mode === 'random' ? ' Sebanyak 25 soal akan diacak kembali dari seluruh bank soal.' : ' Kamu akan kembali ke soal pertama.'} Progres topik lain tetap tersimpan.</p>`, [{label:'Batal',style:'secondary'},{label:mode === 'random' ? 'Acak & mulai lagi' : 'Ulangi dari awal',run:()=>{ state.sessions[mode]=makeSession(mode,chapters); reviewing=false;persist();render();goTop(); }}]);
}

main.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button || button.disabled) return;
  if (button.dataset.start) return start(button.dataset.start);
  const mode = state.lastMode, session = state.sessions[mode];
  if (button.dataset.answer !== undefined && session) {
    const id = session.ids[session.index];
    state.sessions[mode] = selectAnswer(session,id,Number(button.dataset.answer));
    persist();render();
    document.querySelector('#feedback-heading')?.focus({preventScroll:true});
    document.querySelector('.feedback')?.scrollIntoView({block:'nearest',behavior:'instant'});
    return;
  }
  if (button.dataset.jump !== undefined && session) { session.index = Number(button.dataset.jump);persist();render();goTop();return; }
  switch (button.dataset.action) {
    case 'home': goHome();break;
    case 'next': case 'previous':
      session.index=Math.max(0,Math.min(24,session.index+(button.dataset.action==='next'?1:-1)));persist();render();goTop();break;
    case 'finish':finish();break;
    case 'results':reviewing=false;render();goTop();break;
    case 'review':reviewing=true;session.index=0;persist();render();goTop();break;
    case 'reset-session':resetSession();break;
    case 'reset-all':modal('Reset semua progres?', '<p>Seluruh jawaban dan skor dari tujuh topik serta sesi acak pada perangkat ini akan dikosongkan. Bank soal tetap tersedia.</p>', [{label:'Batal',style:'secondary'},{label:'Reset semua',style:'danger',run:()=>{state=emptyState();reviewing=false;persist();render();goTop();}}]);break;
  }
});

document.querySelector('#brand').addEventListener('click',event=>{event.preventDefault();if(chapters.length)goHome();});
document.querySelector('#about-button').addEventListener('click',()=>modal('Tentang ruang belajar ini', `<div class="about-copy"><p>175 soal berbahasa Indonesia untuk membantu dokter umum memperkuat dasar THT-KL menuju PPDS. Tersedia 25 soal per BAB dan pilihan acak 25 soal dari seluruh bank.</p><p><strong>Sumber utama:</strong> Suwento R, Poerbonegoro NL, Hutauruk SM, editor. <em>Buku Pendidikan Dasar Ilmu Kesehatan Telinga Hidung Tenggorok - Bedah Kepala Leher.</em> Edisi pertama, Buku Pertama dan Buku Kedua. Media Aesculapius; 2024.</p><ul><li>Kasus disusun untuk latihan; bukan soal atau kisi-kisi resmi FKUI/RSCM.</li><li>Setiap pembahasan memuat alasan pilihan A–E serta halaman cetak dan PDF.</li><li>Jawaban pertama dikunci agar skor mencerminkan percobaan pertama.</li><li>Progres tersimpan pada peramban dan perangkat yang sama, tanpa akun. Mode privat atau penghapusan data peramban dapat menghapusnya.</li><li>Setelah kunjungan pertama dan cache siap, halaman dapat digunakan kembali saat offline pada peramban yang mendukungnya.</li></ul><details><summary>Catatan penting untuk membaca materi</summary><p>Dix-Hallpike membantu diagnosis BPPV posterior; Epley merupakan terapi reposisi. Pada bunyi oral, velofaring menutup; pada bunyi nasal, jalur ke hidung terbuka. Nasalance merupakan proporsi energi akustik, bukan ukuran defek anatomi. Massa leher kistik baru pada dewasa tetap perlu diagnosis yang jelas. Baterai esofagus merupakan kegawatdaruratan. Vertigo kontinu dengan tuli baru tetap memerlukan penilaian penyebab sentral sesuai konteks.</p></details><details><summary>Pedoman tambahan</summary>${Object.entries(REFERENCES).map(([r,c])=>`<p class="citation"><strong>${r}.</strong> ${escape(c)}</p>`).join('')}</details><p>Materi disusun dan ditelaah 27 Oktober 2026. Referensi pada soal adalah bacaan topik; vignette dan penalaran merupakan sintesis pembelajaran.</p></div>`,[{label:'Kembali belajar'}]));
window.addEventListener('online',updateStatus);window.addEventListener('offline',updateStatus);
// Keep the current tab consistent when another tab updates or resets the same quiz.
window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY){state=restoreState(event.newValue,chapters);reviewing=false;render();updateStatus();}});

async function boot() {
  try {
    chapters = await Promise.all(Array.from({length:7},(_,i)=>fetch(new URL(`./data/chapter-${i+1}.json`,import.meta.url),{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('Materi gagal dimuat.');return r.json();})));
    byId=Object.fromEntries(chapters.flatMap(c=>c.questions).map(q=>[q.id,q]));
    if (Object.keys(byId).length!==175 || chapters.some(c=>c.questions.length!==25)) throw new Error('Bank soal tidak lengkap.');
    let raw=null;try{raw=localStorage.getItem(STORAGE_KEY);}catch{storageAvailable=false;}
    state=restoreState(raw,chapters);updateStatus();render();
    if ('serviceWorker' in navigator && location.protocol==='https:') navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(()=>{/* Quiz and local progress remain usable without offline caching. */});
  } catch {
    main.innerHTML='<section class="error-panel"><span class="eyebrow">MATERI BELUM TERMUAT</span><h1>Yuk, coba sekali lagi.</h1><p>Periksa koneksi internet. Saat pertama kali membuka situs, seluruh materi perlu dimuat terlebih dahulu.</p><button class="btn" id="retry">Muat ulang materi</button></section>';
    document.querySelector('#retry').addEventListener('click',()=>location.reload());status.textContent='Materi belum termuat';
  }
}
boot();
