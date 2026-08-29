// ===== Metanoia — configuration partagée =====
export const SUPABASE_URL = 'https://mfbrnmhtoqqklmywclxt.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_YzwLgEs90iScg1i54zYliQ_Js7Fl3jm';
export const TABLE = 'entrainements';
export const DEBUT = '2026-08-28'; // le compteur compte à partir de cette date
export const TYPES = ['Footing', 'Fractionné', 'Sortie longue', 'Seuil', 'Compétition'];

let sb = null;
let sbReady = Promise.resolve();
if (SUPABASE_URL && SUPABASE_KEY) {
  sbReady = (async () => {
    try { const m = await import('https://esm.sh/@supabase/supabase-js@2'); sb = m.createClient(SUPABASE_URL, SUPABASE_KEY); }
    catch (e) { console.warn('Supabase indisponible', e); }
  })();
}
let mem = []; // secours sans Supabase (session uniquement)

export async function list() {
  await sbReady; if (!sb) return [...mem].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const { data, error } = await sb.from(TABLE).select('*').order('date', { ascending: false }).order('id', { ascending: false });
  if (error) throw error; return data;
}
export async function insert(row) {
  await sbReady; if (!sb) { mem.push({ ...row, id: Date.now() }); return; }
  const { error } = await sb.from(TABLE).insert(row); if (error) throw error;
}
export async function update(id, row) {
  await sbReady; if (!sb) { const i = mem.findIndex(r => r.id === id); if (i > -1) mem[i] = { ...mem[i], ...row }; return; }
  const { error } = await sb.from(TABLE).update(row).eq('id', id); if (error) throw error;
}
export async function remove(id) {
  await sbReady; if (!sb) { mem = mem.filter(r => r.id !== id); return; }
  const { error } = await sb.from(TABLE).delete().eq('id', id); if (error) throw error;
}

// résultats de course
export async function listResultats() {
  await sbReady; if (!sb) return [];
  const { data, error } = await sb.from('resultats').select('*').order('date', { ascending: false });
  if (error) throw error; return data;
}
export async function insertResultat(row) {
  await sbReady; if (!sb) return; const { error } = await sb.from('resultats').insert(row); if (error) throw error;
}
export async function updateResultat(id, row) {
  await sbReady; if (!sb) return; const { error } = await sb.from('resultats').update(row).eq('id', id); if (error) throw error;
}
export async function removeResultat(id) {
  await sbReady; if (!sb) return; const { error } = await sb.from('resultats').delete().eq('id', id); if (error) throw error;
}

// compétitions
export async function listCompetitions() {
  await sbReady; if (!sb) return [];
  const { data, error } = await sb.from('competitions').select('*').order('date', { ascending: true });
  if (error) throw error; return data;
}
export async function prochaineCompetition() {
  const today = new Date().toISOString().slice(0, 10);
  const all = await listCompetitions();
  return all.find(c => c.date >= today) || null;
}
export async function insertCompetition(row) {
  await sbReady; if (!sb) return; const { error } = await sb.from('competitions').insert(row); if (error) throw error;
}
export async function updateCompetition(id, row) {
  await sbReady; if (!sb) return; const { error } = await sb.from('competitions').update(row).eq('id', id); if (error) throw error;
}
export async function removeCompetition(id) {
  await sbReady; if (!sb) return; const { error } = await sb.from('competitions').delete().eq('id', id); if (error) throw error;
}

// compteur de visites
export async function enregistrerVisite() {
  try {
    if (localStorage.getItem('metanoia_visite')) return;
    localStorage.setItem('metanoia_visite', '1');
    await sbReady; if (!sb) return;
    await sb.from('visites').insert({});
  } catch (e) { /* silencieux */ }
}
export async function nbVisites() {
  await sbReady; if (!sb) return null;
  const { count, error } = await sb.from('visites').select('*', { count: 'exact', head: true });
  if (error) throw error; return count;
}

// utilitaires
export const parseTime = s => { s = (s || '').trim().replace(/,/g, ':'); const p = s.split(':').map(Number); if (!s || p.some(isNaN)) return null;
  return Math.round(p.length === 3 ? p[0]*3600 + p[1]*60 + p[2] : p.length === 2 ? p[0]*60 + p[1] : p[0]*60); };
export const parseKm = s => { const n = parseFloat(String(s ?? '').trim().replace(',', '.')); return isNaN(n) ? null : n; };
export const fmtTime = sec => { const h = Math.floor(sec/3600), m = Math.floor(sec/60)%60, s = sec%60;
  return h ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`; };
export const fmtPace = (sec, km) => { if (!sec || !km) return '—'; const p = Math.round(sec/km); return `${Math.floor(p/60)}'${String(p%60).padStart(2,'0')}"`; };
export const fmtDate = d => new Date(d + 'T00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export const fr = (n, d = 1) => Number(n).toLocaleString('fr-FR', { maximumFractionDigits: d });
