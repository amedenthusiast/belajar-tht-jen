// Local learning history. Imports are untrusted data and are validated before merging.
export const LEADERBOARD_KEY = 'belajar-tht-jen:leaderboard:v1';
export const BANK_VERSION = 'klinis-v2';
export const BACKUP_FORMAT = 'belajar-tht-jen-leaderboard';
export const TOPICS = ['Telinga, Pendengaran, dan Keseimbangan','Hidung dan Sinus Paranasal','Laring Faring','Bronkoesofagologi','Onkologi THT','Fasial Plastik Rekonstruksi','Lain-lain'];
const MODES = ['1','2','3','4','5','6','7','random'];
const MAX_RECORDS = 10000;

export function normalizeName(value) {
  if (typeof value !== 'string') throw new Error('Nama harus berupa teks.');
  const name = value.replace(/[\u0000-\u001f\u007f]/g,'').trim().replace(/\s+/g,' ');
  if (name.length < 2 || name.length > 50) throw new Error('Isi nama antara 2 dan 50 karakter.');
  return name;
}

export function validateRecord(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Catatan skor tidak valid.');
  const { id, mode, bankVersion, completedAt, total, correct, wrong, unanswered, score } = raw;
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{8,100}$/.test(id)) throw new Error('Identitas sesi tidak valid.');
  if (!MODES.includes(mode)) throw new Error('Topik pada cadangan tidak dikenal.');
  if (typeof bankVersion !== 'string' || !/^[a-zA-Z0-9._-]{1,40}$/.test(bankVersion)) throw new Error('Versi bank soal tidak valid.');
  if (typeof completedAt !== 'string' || !Number.isFinite(Date.parse(completedAt))) throw new Error('Tanggal skor tidak valid.');
  if (total !== 25 || ![correct,wrong,unanswered,score].every(Number.isInteger) || [correct,wrong,unanswered].some(n=>n<0||n>25) || correct+wrong+unanswered!==25 || score!==correct*4) throw new Error('Perhitungan skor dalam cadangan tidak konsisten.');
  return { id, name: normalizeName(raw.name), mode, chapter: mode==='random'?'Random 25 soal campur':TOPICS[Number(mode)-1], bankVersion, completedAt:new Date(completedAt).toISOString(), total, correct, wrong, unanswered, score };
}

export function recordFromFinishedSession(session, stats, name, mode) {
  if (!session?.finished || !session.attemptId || !session.completedAt) throw new Error('Tekan Selesai sebelum menyimpan skor.');
  return validateRecord({id:session.attemptId,name,mode,bankVersion:BANK_VERSION,completedAt:session.completedAt,...stats});
}

export function mergeRecords(existing, incoming) {
  if (!Array.isArray(existing) || !Array.isArray(incoming) || existing.length+incoming.length>MAX_RECORDS*2) throw new Error('Jumlah catatan melebihi batas cadangan.');
  const records=new Map();
  for (const raw of [...existing,...incoming]) {
    const item=validateRecord(raw), previous=records.get(item.id);
    if (previous && JSON.stringify(previous)!==JSON.stringify(item)) throw new Error('Ada identitas sesi yang sama dengan isi berbeda. Cadangan tidak digabungkan.');
    records.set(item.id,item);
  }
  if (records.size>MAX_RECORDS) throw new Error('Maksimal 10.000 catatan per cadangan.');
  return [...records.values()].sort((a,b)=>b.completedAt.localeCompare(a.completedAt)||a.id.localeCompare(b.id));
}

export function parseBackup(text) {
  if (typeof text!=='string' || text.length>4_000_000) throw new Error('Berkas cadangan terlalu besar.');
  let parsed;try{parsed=JSON.parse(text);}catch{throw new Error('Berkas bukan JSON yang valid.');}
  if (!parsed || parsed.format!==BACKUP_FORMAT || parsed.version!==1 || !Array.isArray(parsed.records)) throw new Error('Format cadangan tidak sesuai. Gunakan hasil ekspor website ini.');
  return mergeRecords([],parsed.records);
}

export function makeBackup(records) {
  return JSON.stringify({format:BACKUP_FORMAT,version:1,exportedAt:new Date().toISOString(),records:mergeRecords([],records)},null,2);
}

export function loadRecords(raw) {
  if (!raw) return [];
  return parseBackup(raw);
}

export function rankRecords(records, {mode='all',name='',version=BANK_VERSION,sort='score'}={}) {
  const wanted=name.trim().toLocaleLowerCase('id');
  return records.filter(r=>(mode==='all'||r.mode===mode)&&(!wanted||r.name.toLocaleLowerCase('id').includes(wanted))&&(version==='all'||r.bankVersion===version)).sort((a,b)=>sort==='date'||version==='all'?b.completedAt.localeCompare(a.completedAt):b.score-a.score||b.completedAt.localeCompare(a.completedAt));
}
