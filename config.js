// ===== Metanoia — configuration partagée =====
export const SUPABASE_URL = 'https://mfbrnmhtoqqklmywclxt.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_YzwLgEs90iScg1i54zYliQ_Js7Fl3jm';
export const TABLE = 'entrainements';
export const DEBUT = '2026-08-28'; // le compteur compte à partir de cette date
export const TYPES = ['Footing', 'Fractionné', 'Sortie longue', 'Seuil', 'Compétition', 'Salle de sport'];

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

// objectifs
export async function listObjectifs() {
  await sbReady; if (!sb) return [];
  const { data, error } = await sb.from('objectifs').select('*').order('date', { ascending: true });
  if (error) throw error; return data;
}
export async function objectifActif() {
  const today = new Date().toISOString().slice(0, 10);
  const all = await listObjectifs();
  return all.find(o => o.actif && o.date >= today) || null;
}
export async function insertObjectif(row) {
  await sbReady; if (!sb) return; const { error } = await sb.from('objectifs').insert(row); if (error) throw error;
}
export async function updateObjectif(id, row) {
  await sbReady; if (!sb) return; const { error } = await sb.from('objectifs').update(row).eq('id', id); if (error) throw error;
}
export async function removeObjectif(id) {
  await sbReady; if (!sb) return; const { error } = await sb.from('objectifs').delete().eq('id', id); if (error) throw error;
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

// plan d'entraînement
export async function listPlan(objectifId) {
  await sbReady; if (!sb) return [];
  const { data, error } = await sb.from('plan').select('*').eq('objectif_id', objectifId).order('date');
  if (error) throw error; return data;
}
export async function insertPlan(rows) {
  await sbReady; if (!sb) return;
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await sb.from('plan').insert(rows.slice(i, i + 200));
    if (error) throw error;
  }
}
export async function updatePlan(id, row) {
  await sbReady; if (!sb) return; const { error } = await sb.from('plan').update(row).eq('id', id); if (error) throw error;
}
export async function removePlan(objectifId) {
  await sbReady; if (!sb) return; const { error } = await sb.from('plan').delete().eq('objectif_id', objectifId); if (error) throw error;
}

// projet à dix ans + paliers
export async function projetActif() {
  await sbReady; if (!sb) return null;
  const { data, error } = await sb.from('projet').select('*').eq('actif', true).order('id').limit(1);
  if (error) throw error; return data[0] || null;
}
export async function listPaliers(projetId) {
  await sbReady; if (!sb) return [];
  const { data, error } = await sb.from('paliers').select('*').eq('projet_id', projetId).order('ordre');
  if (error) throw error; return data;
}
export async function updatePalier(id, row) {
  await sbReady; if (!sb) return; const { error } = await sb.from('paliers').update(row).eq('id', id); if (error) throw error;
}
export async function updateProjet(id, row) {
  await sbReady; if (!sb) return; const { error } = await sb.from('projet').update(row).eq('id', id); if (error) throw error;
}

// authentification
export async function sbClient() { await sbReady; return sb; }
export async function utilisateur() {
  await sbReady; if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data?.user || null;
}
export async function connexion(email, motDePasse) {
  await sbReady; if (!sb) throw new Error('Supabase indisponible');
  const { error } = await sb.auth.signInWithPassword({ email, password: motDePasse });
  if (error) throw error;
}
export async function inscription(email, motDePasse) {
  await sbReady; if (!sb) throw new Error('Supabase indisponible');
  const { error } = await sb.auth.signUp({ email, password: motDePasse });
  if (error) throw error;
}
export async function deconnexion() {
  await sbReady; if (!sb) return; await sb.auth.signOut();
}
/** À placer en tête d'une page privée : redirige si non connecté. */
export async function exigerConnexion(retour = 'connexion.html') {
  const u = await utilisateur();
  if (!u) { location.href = retour + '?suite=' + encodeURIComponent(location.pathname.split('/').pop()); return null; }
  return u;
}

// journal quotidien
export async function listJournal(jours = 60) {
  await sbReady; if (!sb) return [];
  const d = new Date(); d.setDate(d.getDate() - jours);
  const depuis = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const { data, error } = await sb.from('journal').select('*').gte('date', depuis).order('date', { ascending: false });
  if (error) throw error; return data;
}
export async function upsertJournal(row) {
  await sbReady; if (!sb) return;
  const { error } = await sb.from('journal').upsert(row, { onConflict: 'date' });
  if (error) throw error;
}
export async function journalDuJour(date) {
  await sbReady; if (!sb) return null;
  const { data, error } = await sb.from('journal').select('*').eq('date', date).limit(1);
  if (error) throw error; return data[0] || null;
}

// préférences alimentaires
export async function litGouts() {
  await sbReady; if (!sb) return null;
  const { data, error } = await sb.from('gouts').select('*').eq('id', 1).limit(1);
  if (error) throw error; return data[0] || null;
}
export async function ecritGouts(row) {
  await sbReady; if (!sb) return;
  const { error } = await sb.from('gouts').upsert(row, { onConflict: 'id' });
  if (error) throw error;
}
