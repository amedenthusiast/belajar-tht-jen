import {LEADERBOARD_KEY,BANK_VERSION,TOPICS,loadRecords,mergeRecords,recordFromFinishedSession,rankRecords,parseBackup,makeBackup} from './leaderboard.mjs?v=3';

export function createHistoryUI({dialog,escape,onSaved}) {
  let records=[],readError='',filters={mode:'all',name:'',version:BANK_VERSION,sort:'score'};
  try{records=loadRecords(localStorage.getItem(LEADERBOARD_KEY));}catch{readError='Riwayat belum dapat dibaca. Penyimpanan mungkin dibatasi atau data tidak valid. Data yang ada tidak ditimpa.';}
  const body=()=>dialog.querySelector('#dialog-body');
  const actions=()=>dialog.querySelector('#dialog-actions');
  const date=value=>new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
  function open(){if(!dialog.open)dialog.showModal();}
  function download(text){const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`belajar-tht-riwayat-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function refresh(){records=loadRecords(localStorage.getItem(LEADERBOARD_KEY));readError='';}
  function write(next){localStorage.setItem(LEADERBOARD_KEY,makeBackup(next));records=next;readError='';}
  function showMessage(text,isError=false){const box=body().querySelector('#history-message');if(box){box.textContent=text;box.className=isError?'form-message error':'form-message';}}
  function table(){
    const rows=rankRecords(records,filters),container=body().querySelector('#history-table');
    if(!container)return;
    container.innerHTML=rows.length?`<div class="table-scroll"><table class="history-table"><thead><tr><th scope="col">#</th><th scope="col">Nama</th><th scope="col">Bab / mode</th><th scope="col">Skor</th><th scope="col">Tanggal</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><th scope="row">${escape(r.name)}</th><td>${escape(r.chapter)}<small>${escape(r.bankVersion)}</small></td><td><strong>${r.score}</strong><small>${r.correct} benar · ${r.wrong} salah · ${r.unanswered} kosong</small></td><td>${escape(date(r.completedAt))}</td></tr>`).join('')}</tbody></table></div><p class="history-count">${rows.length} catatan ditampilkan. Setiap percobaan disimpan tersendiri; skor lama tidak ditimpa oleh percobaan baru.</p>`:'<p class="history-empty">Belum ada skor untuk filter ini. Kerjakan kuis, tekan Selesai, lalu masukkan nama untuk mencatat hasil.</p>';
  }
  function show(){
    try{refresh();}catch{readError='Riwayat belum dapat dibaca. Periksa izin penyimpanan atau gunakan cadangan. Data lama tidak ditimpa.';}
    dialog.classList.add('history-dialog');
    body().innerHTML=`<h2 id="dialog-title">Leaderboard & riwayat belajar</h2><p>Nama, bab, dan hasil setiap sesi tersimpan pada peramban ini. Unduh cadangan berkala agar riwayat dapat dipulihkan saat berganti perangkat.</p><p class="history-version">Bank soal aktif: <strong>${BANK_VERSION}</strong>. Peringkat membandingkan skor dalam versi yang sama.</p><div class="history-filters"><label>Cari nama<input id="history-name" type="search" maxlength="50" placeholder="Nama peserta" value="${escape(filters.name)}"></label><label>Bab<select id="history-mode"><option value="all">Semua bab</option>${TOPICS.map((t,i)=>`<option value="${i+1}" ${filters.mode===String(i+1)?'selected':''}>${escape(t)}</option>`).join('')}<option value="random" ${filters.mode==='random'?'selected':''}>Random 25 soal campur</option></select></label><label>Urutan<select id="history-sort"><option value="score" ${filters.sort==='score'?'selected':''}>Skor tertinggi</option><option value="date" ${filters.sort==='date'?'selected':''}>Terbaru</option></select></label><label>Versi bank<select id="history-version"><option value="${BANK_VERSION}" ${filters.version===BANK_VERSION?'selected':''}>${BANK_VERSION}</option><option value="all" ${filters.version==='all'?'selected':''}>Semua versi (riwayat)</option></select></label></div><p id="history-message" class="form-message ${readError?'error':''}" role="status">${escape(readError)}</p><div id="history-table"></div><p class="history-note">Reset latihan tidak menghapus leaderboard. Riwayat ini bersifat lokal, bukan leaderboard bersama. Penghapusan data peramban dapat menghilangkannya; berkas ekspor adalah cadangannya.</p><input id="history-import" type="file" accept="application/json,.json" hidden>`;
    actions().innerHTML='<button class="btn secondary" id="export-history" type="button">Ekspor cadangan</button><button class="btn secondary" id="import-history" type="button">Impor cadangan</button><button class="btn" id="close-history" type="button">Tutup</button>';
    for(const [id,key] of [['history-name','name'],['history-mode','mode'],['history-sort','sort'],['history-version','version']])body().querySelector('#'+id).addEventListener(key==='name'?'input':'change',event=>{filters[key]=event.target.value;table();});
    actions().querySelector('#close-history').onclick=()=>dialog.close();
    actions().querySelector('#export-history').onclick=()=>{try{refresh();download(makeBackup(records));showMessage('Cadangan diunduh. Simpan berkas JSON di tempat yang aman.');}catch{showMessage('Cadangan belum dapat dibuat karena riwayat tidak dapat dibaca.',true);}};
    actions().querySelector('#import-history').onclick=()=>body().querySelector('#history-import').click();
    body().querySelector('#history-import').onchange=async event=>{
      const file=event.target.files?.[0];if(!file)return;
      try{
        if(file.size>4_000_000)throw new Error('Ukuran cadangan melebihi 4 MB.');
        const incoming=parseBackup(await file.text());refresh();const next=mergeRecords(records,incoming),added=next.length-records.length;write(next);table();showMessage(`${added} catatan baru diimpor. Catatan duplikat dilewati; riwayat yang sudah ada tetap tersimpan.`);onSaved?.();
      }catch(error){showMessage(error.message||'Impor gagal. Riwayat tidak diubah.',true);}finally{event.target.value='';}
    };
    table();open();
  }
  function prompt(session,stats,mode){
    if(!session?.finished)return;
    try{refresh();}catch{readError='Penyimpanan tidak dapat dibaca. Riwayat lama tidak akan ditimpa.';}
    if(records.some(r=>r.id===session.attemptId)){onSaved?.();return;}
    dialog.classList.remove('history-dialog');
    body().innerHTML=`<h2 id="dialog-title">Simpan hasil belajarmu</h2><p>${escape(mode==='random'?'Random 25 soal campur':TOPICS[Number(mode)-1])} · <strong>${stats.score}/100</strong></p><form id="score-form"><label class="name-label" for="score-name">Nama peserta</label><input id="score-name" class="name-input" name="name" type="text" autocomplete="given-name" minlength="2" maxlength="50" required placeholder="Masukkan nama"><p class="history-note">Skor baru dicatat setelah nama disimpan. Satu sesi hanya dicatat satu kali; reset latihan tidak menghapus catatan ini.</p><p id="score-error" class="form-message error" role="alert">${escape(readError)}</p></form>`;
    actions().innerHTML='<button class="btn secondary" id="later-score" type="button">Simpan nanti</button><button class="btn" type="submit" form="score-form">Simpan ke leaderboard</button>';
    actions().querySelector('#later-score').onclick=()=>dialog.close();
    body().querySelector('#score-form').onsubmit=event=>{
      event.preventDefault();const errorBox=body().querySelector('#score-error');
      try{const record=recordFromFinishedSession(session,stats,body().querySelector('#score-name').value,mode);refresh();write(mergeRecords(records,[record]));dialog.close();onSaved?.();}
      catch(error){errorBox.textContent=error.message||'Skor belum tersimpan. Periksa izin atau kapasitas penyimpanan peramban, lalu coba lagi.';}
    };
    open();body().querySelector('#score-name').focus();
  }
  dialog.addEventListener('close',()=>dialog.classList.remove('history-dialog'));
  window.addEventListener('storage',event=>{if(event.key===LEADERBOARD_KEY){try{records=loadRecords(event.newValue);}catch{readError='Riwayat dari tab lain belum dapat dibaca.';}if(dialog.open&&body().querySelector('#history-table')){table();showMessage(readError,!!readError);}onSaved?.();}});
  return {show,prompt,has:id=>records.some(r=>r.id===id),name:id=>records.find(r=>r.id===id)?.name};
}
