// Pure quiz logic shared by the browser and the automated checks.
export const STORAGE_KEY = 'belajar-tht-jen:progress:v1';
export const VERSION = 1;
export const SESSION_SIZE = 25;
export const MODES = ['1', '2', '3', '4', '5', '6', '7', 'random'];

export function shuffled(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function emptyState() { return { version: VERSION, sessions: {}, lastMode: null }; }

export function makeSession(mode, chapters, random = Math.random) {
  if (!MODES.includes(mode)) throw new Error('Topik tidak dikenal.');
  const pool = mode === 'random' ? chapters.flatMap(c => c.questions) : chapters.find(c => String(c.n) === mode)?.questions;
  if (!pool || pool.length < SESSION_SIZE) throw new Error('Materi belum lengkap.');
  const questions = mode === 'random' ? shuffled(pool, random).slice(0, SESSION_SIZE) : pool.slice(0, SESSION_SIZE);
  return { ids: questions.map(q => q.id), answers: {}, index: 0, finished: false };
}

export function selectAnswer(session, id, choice) {
  if (session.finished || !session.ids.includes(id) || !Number.isInteger(choice) || choice < 0 || choice > 4 || Object.hasOwn(session.answers, id)) return session;
  return { ...session, answers: { ...session.answers, [id]: choice } };
}

export function summarize(session, byId) {
  let answered = 0, correct = 0;
  for (const id of session.ids) {
    if (Object.hasOwn(session.answers, id)) {
      answered++;
      if (session.answers[id] === byId[id].answer) correct++;
    }
  }
  const total = session.ids.length;
  return { total, answered, correct, wrong: answered - correct, unanswered: total - answered,
    progress: Math.round(answered / total * 100), score: Math.round(correct / total * 100) };
}

export function restoreState(raw, chapters) {
  const clean = emptyState();
  if (!raw) return clean;
  let parsed;
  try { parsed = JSON.parse(raw); } catch { return clean; }
  if (!parsed || parsed.version !== VERSION || typeof parsed.sessions !== 'object' || !parsed.sessions) return clean;
  const byId = Object.fromEntries(chapters.flatMap(c => c.questions).map(q => [q.id, q]));
  for (const mode of MODES) {
    const s = parsed.sessions[mode];
    if (!s || !Array.isArray(s.ids) || s.ids.length !== SESSION_SIZE || new Set(s.ids).size !== SESSION_SIZE) continue;
    if (s.ids.some(id => !byId[id] || (mode !== 'random' && String(byId[id].chapter) !== mode))) continue;
    if (!Number.isInteger(s.index) || s.index < 0 || s.index >= SESSION_SIZE || !s.answers || typeof s.answers !== 'object' || Array.isArray(s.answers)) continue;
    const answers = {};
    for (const id of s.ids) if (Number.isInteger(s.answers[id]) && s.answers[id] >= 0 && s.answers[id] < 5) answers[id] = s.answers[id];
    clean.sessions[mode] = { ids: [...s.ids], index: s.index, answers, finished: s.finished === true };
  }
  clean.lastMode = MODES.includes(parsed.lastMode) && clean.sessions[parsed.lastMode] ? parsed.lastMode : null;
  return clean;
}
