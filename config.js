// ===== Metanoia — configuration partagée =====
export const SUPABASE_URL = 'https://mfbrnmhtoqqklmywclxt.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_YzwLgEs90iScg1i54zYliQ_Js7Fl3jm';
export const TABLE = 'entrainements';
export const DEBUT = '2026-08-28'; // le compteur compte à partir de cette date
export const TYPES = ['Footing', 'Fractionné', 'Sortie longue', 'Seuil', 'Compétition', 'Salle de sport'];

let sb = null;

// Le SDK Supabase pèse plus de cent kilooctets et vient d'un CDN tiers.
// Les pages publiques ne font que lire : un simple fetch sur l'API REST suffit,
// et le SDK n'est chargé que si une écriture ou une connexion le demande.
const ENTETES = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

async function lire(table, requete = 'select=*') {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${requete}`, { headers: ENTETES });
  if (!r.ok) throw new Error(`${table} : ${r.status}`);
  return r.json();
}

/** Charge le SDK à la demande — écritures, session, authentification. */
export async function client() {
  if (sb) return sb;
  const m = await import('https://esm.sh/@supabase/supabase-js@2');
  sb = m.createClient(SUPABASE_URL, SUPABASE_KEY);
  return sb;
}
let mem = []; // secours sans Supabase (session uniquement)

export async function list() {
  try { return (await lire(TABLE, 'select=*&order=date.desc')); }
  catch (e) { return [...mem].sort((a, b) => b.date.localeCompare(a.date)); }
}
async function _listAncien() {
  const cl = await client(); if (!cl) return [...mem].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const { data, error } = await cl.from(TABLE).select('*').order('date', { ascending: false }).order('id', { ascending: false });
  if (error) throw error; return data;
}
export async function insert(row) {
  const cl = await client(); if (!cl) { mem.push({ ...row, id: Date.now() }); return; }
  const { error } = await cl.from(TABLE).insert(row); if (error) throw error;
}
export async function update(id, row) {
  const cl = await client(); if (!cl) { const i = mem.findIndex(r => r.id === id); if (i > -1) mem[i] = { ...mem[i], ...row }; return; }
  const { error } = await cl.from(TABLE).update(row).eq('id', id); if (error) throw error;
}
export async function remove(id) {
  const cl = await client(); if (!cl) { mem = mem.filter(r => r.id !== id); return; }
  const { error } = await cl.from(TABLE).delete().eq('id', id); if (error) throw error;
}

// résultats de course
export async function listResultats() {
  try { return await lire('resultats', 'select=*&order=date.desc'); } catch (e) { return []; }
}
async function _listResultats() {
  const cl = await client(); if (!cl) return [];
  const { data, error } = await cl.from('resultats').select('*').order('date', { ascending: false });
  if (error) throw error; return data;
}
export async function insertResultat(row) {
  const cl = await client(); if (!cl) return; const { error } = await cl.from('resultats').insert(row); if (error) throw error;
}
export async function updateResultat(id, row) {
  const cl = await client(); if (!cl) return; const { error } = await cl.from('resultats').update(row).eq('id', id); if (error) throw error;
}
export async function removeResultat(id) {
  const cl = await client(); if (!cl) return; const { error } = await cl.from('resultats').delete().eq('id', id); if (error) throw error;
}

// compétitions
export async function listCompetitions() {
  try { return await lire('competitions', 'select=*&order=date.asc'); } catch (e) { return []; }
}
async function _listCompetitions() {
  const cl = await client(); if (!cl) return [];
  const { data, error } = await cl.from('competitions').select('*').order('date', { ascending: true });
  if (error) throw error; return data;
}
export async function prochaineCompetition() {
  const today = new Date().toISOString().slice(0, 10);
  const all = await listCompetitions();
  return all.find(c => c.date >= today) || null;
}
export async function insertCompetition(row) {
  const cl = await client(); if (!cl) return; const { error } = await cl.from('competitions').insert(row); if (error) throw error;
}
export async function updateCompetition(id, row) {
  const cl = await client(); if (!cl) return; const { error } = await cl.from('competitions').update(row).eq('id', id); if (error) throw error;
}
export async function removeCompetition(id) {
  const cl = await client(); if (!cl) return; const { error } = await cl.from('competitions').delete().eq('id', id); if (error) throw error;
}

// objectifs
export async function listObjectifs() {
  try { return await lire('objectifs', 'select=*'); } catch (e) { return []; }
}
async function _listObjectifs() {
  const cl = await client(); if (!cl) return [];
  const { data, error } = await cl.from('objectifs').select('*').order('date', { ascending: true });
  if (error) throw error; return data;
}
export async function objectifActif() {
  const today = new Date().toISOString().slice(0, 10);
  const all = await listObjectifs();
  return all.find(o => o.actif && o.date >= today) || null;
}
export async function insertObjectif(row) {
  const cl = await client(); if (!cl) return; const { error } = await cl.from('objectifs').insert(row); if (error) throw error;
}
export async function updateObjectif(id, row) {
  const cl = await client(); if (!cl) return; const { error } = await cl.from('objectifs').update(row).eq('id', id); if (error) throw error;
}
export async function removeObjectif(id) {
  const cl = await client(); if (!cl) return; const { error } = await cl.from('objectifs').delete().eq('id', id); if (error) throw error;
}

// compteur de visites
export async function enregistrerVisite() {
  try {
    if (localStorage.getItem('metanoia_visite')) return;
    localStorage.setItem('metanoia_visite', '1');
    await fetch(`${SUPABASE_URL}/rest/v1/visites`, {
      method: 'POST', headers: { ...ENTETES, 'Content-Type': 'application/json' }, body: '{}'
    });
  } catch (e) { /* silencieux */ }
}
export async function nbVisites() {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/visites?select=id`, 
      { headers: { ...ENTETES, Prefer: 'count=exact', Range: '0-0' } });
    const c = r.headers.get('content-range');
    return c ? Number(c.split('/')[1]) : null;
  } catch (e) { return null; }
}
async function _nbVisites() {
  const cl = await client(); if (!cl) return null;
  const { count, error } = await cl.from('visites').select('*', { count: 'exact', head: true });
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
  try { return await lire('plan', `select=*&projet_id=eq.${projetId}&order=date.asc`); } catch (e) { return []; }
}
export async function insertPlan(rows) {
  const cl = await client(); if (!cl) return;
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await cl.from('plan').insert(rows.slice(i, i + 200));
    if (error) throw error;
  }
}
export async function updatePlan(id, row) {
  const cl = await client(); if (!cl) return; const { error } = await cl.from('plan').update(row).eq('id', id); if (error) throw error;
}
export async function removePlan(objectifId) {
  const cl = await client(); if (!cl) return; const { error } = await cl.from('plan').delete().eq('objectif_id', objectifId); if (error) throw error;
}

// projet à dix ans + paliers
export async function projetActif() {
  try { const d = await lire('projet', 'select=*&id=eq.1'); return d[0] || null; } catch (e) { return null; }
}
async function _projetActif() {
  const cl = await client(); if (!cl) return null;
  const { data, error } = await cl.from('projet').select('*').eq('actif', true).order('id').limit(1);
  if (error) throw error; return data[0] || null;
}
export async function listPaliers(projetId) {
  try { return await lire('paliers', `select=*&projet_id=eq.${projetId}&order=ordre.asc`); }
  catch (e) { return []; }
}
async function _listPaliers(projetId) {
  const cl = await client(); if (!cl) return [];
  const { data, error } = await cl.from('paliers').select('*').eq('projet_id', projetId).order('ordre');
  if (error) throw error; return data;
}
export async function updatePalier(id, row) {
  const cl = await client(); if (!cl) return; const { error } = await cl.from('paliers').update(row).eq('id', id); if (error) throw error;
}
export async function updateProjet(id, row) {
  const cl = await client(); if (!cl) return; const { error } = await cl.from('projet').update(row).eq('id', id); if (error) throw error;
}

// authentification
export async function sbClient() { const cl = await client(); return sb; }
export async function utilisateur() {
  const cl = await client(); if (!cl) return null;
  const { data } = await cl.auth.getUser();
  return data?.user || null;
}
export async function connexion(email, motDePasse) {
  const cl = await client(); if (!cl) throw new Error('Supabase indisponible');
  const { error } = await cl.auth.signInWithPassword({ email, password: motDePasse });
  if (error) throw error;
}
export async function inscription(email, motDePasse) {
  const cl = await client(); if (!cl) throw new Error('Supabase indisponible');
  const { error } = await cl.auth.signUp({ email, password: motDePasse });
  if (error) throw error;
}
export async function deconnexion() {
  const cl = await client(); if (!cl) return; await cl.auth.signOut();
}
/** À placer en tête d'une page privée : redirige si non connecté. */
export async function exigerConnexion(retour = 'connexion.html') {
  const u = await utilisateur();
  if (!u) { location.href = retour + '?suite=' + encodeURIComponent(location.pathname.split('/').pop()); return null; }
  return u;
}

// journal quotidien
export async function listJournal(jours = 60) {
  const d = new Date(); d.setDate(d.getDate() - (jours || 60));
  const depuis = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  try { return await lire('journal', `select=*&date=gte.${depuis}&order=date.desc`); } catch (e) { return []; }
}
export async function upsertJournal(row) {
  const cl = await client(); if (!cl) return;
  const { error } = await cl.from('journal').upsert(row, { onConflict: 'date' });
  if (error) throw error;
}
export async function journalDuJour(date) {
  const cl = await client(); if (!cl) return null;
  const { data, error } = await cl.from('journal').select('*').eq('date', date).limit(1);
  if (error) throw error; return data[0] || null;
}

// préférences alimentaires
export async function litGouts() {
  try { const d = await lire('gouts', 'select=*&id=eq.1'); return d[0] || null; } catch (e) { return null; }
}
async function _litGouts() {
  const cl = await client(); if (!cl) return null;
  const { data, error } = await cl.from('gouts').select('*').eq('id', 1).limit(1);
  if (error) throw error; return data[0] || null;
}
export async function ecritGouts(row) {
  const cl = await client(); if (!cl) return;
  const { error } = await cl.from('gouts').upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

// règles quotidiennes et tâches du jour
export async function litRegles() {
  try { const d = await lire('regles', 'select=*&id=eq.1'); return d[0] || null; } catch (e) { return null; }
}
async function _litRegles() {
  const cl = await client(); if (!cl) return null;
  const { data, error } = await cl.from('regles').select('*').eq('id', 1).limit(1);
  if (error) throw error; return data[0] || null;
}
export async function ecritRegles(row) {
  const cl = await client(); if (!cl) return;
  const { error } = await cl.from('regles').upsert({ id: 1, ...row }, { onConflict: 'id' });
  if (error) throw error;
}
export async function listTaches(date) {
  try { return await lire('taches', `select=*&date=eq.${date}`); } catch (e) { return []; }
}
export async function bascule(date, cle, pilier, titre, detail, fait) {
  const cl = await client(); if (!cl) return;
  const { error } = await cl.from('taches').upsert(
    { date, cle, pilier, titre, detail, fait, fait_a: fait ? new Date().toISOString() : null },
    { onConflict: 'date,cle' });
  if (error) throw error;
}
export async function serieTaches(jours = 60) {
  const d = new Date(); d.setDate(d.getDate() - (jours || 60));
  const depuis = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  try { return await lire('taches', `select=date,fait&date=gte.${depuis}`); } catch (e) { return []; }
}
