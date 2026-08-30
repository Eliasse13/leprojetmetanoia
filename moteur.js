// ===== Metanoia — moteur de calcul course à pied =====
// Aucune dépendance. Formules de Jack Daniels (VDOT) et ratio de charge aiguë/chronique.
// Toutes les durées sont en secondes, toutes les distances en mètres.

export const DISTANCES = {
  '5k':      5000,
  '10k':    10000,
  'semi':   21097,
  'marathon': 42195
};

export const NOMS = { '5k': '5 km', '10k': '10 km', 'semi': 'Semi-marathon', 'marathon': 'Marathon' };

// ---------------------------------------------------------------- VDOT
// Daniels & Gilbert : VO2 demandé par une vitesse, et % de VO2max tenable
// selon la durée de l'effort. Le VDOT est la valeur qui réconcilie les deux.

function vo2Demande(vitesse) {              // vitesse en m/min
  return -4.60 + 0.182258 * vitesse + 0.000104 * vitesse * vitesse;
}

function fractionVo2(minutes) {             // part de VO2max tenable sur cette durée
  return 0.8
       + 0.1894393 * Math.exp(-0.012778 * minutes)
       + 0.2989558 * Math.exp(-0.1932605 * minutes);
}

/** VDOT à partir d'une performance. metres + secondes → nombre (1 décimale) */
export function vdot(metres, secondes) {
  if (!(metres > 0) || !(secondes > 0)) return null;
  const minutes = secondes / 60;
  const v = metres / minutes;
  const val = vo2Demande(v) / fractionVo2(minutes);
  return Math.round(val * 10) / 10;
}

/** Temps prévu sur une distance pour un VDOT donné. → secondes */
export function tempsPour(vdotVal, metres) {
  if (!(vdotVal > 0) || !(metres > 0)) return null;
  // on cherche la durée t telle que vo2Demande(metres/t) / fractionVo2(t) = vdotVal
  let bas = 1, haut = 60 * 60 * 12;         // de 1 min à 12 h
  for (let i = 0; i < 80; i++) {
    const t = (bas + haut) / 2;             // minutes
    const estime = vo2Demande(metres / t) / fractionVo2(t);
    if (estime > vdotVal) bas = t; else haut = t;
  }
  return Math.round(((bas + haut) / 2) * 60);
}

/** Chrono équivalent sur une autre distance. */
export function equivalent(metresConnus, secondesConnues, metresCibles) {
  const v = vdot(metresConnus, secondesConnues);
  return v === null ? null : tempsPour(v, metresCibles);
}

// ---------------------------------------------------------------- allures
// Pourcentages de VDOT propres à chaque zone (Daniels).
const ZONES = [
  { cle: 'endurance',  nom: 'Endurance',  sous: 'fondamental',  pct: 0.68 },
  { cle: 'marathon',   nom: 'Marathon',   sous: 'allure course', pct: 0.84 },
  { cle: 'seuil',      nom: 'Seuil',      sous: 'tempo',         pct: 0.88 },
  { cle: 'intervalle', nom: 'Intervalle', sous: 'VMA',           pct: 0.98 },
  { cle: 'repetition', nom: 'Répétition', sous: 'vitesse',       pct: 1.06 }
];

/** Vitesse (m/min) correspondant à un VO2 demandé — inverse de vo2Demande. */
function vitessePourVo2(vo2) {
  const a = 0.000104, b = 0.182258, c = -4.60 - vo2;
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
}

/** Les cinq allures d'entraînement. → [{cle, nom, sous, secondesParKm}] */
export function allures(vdotVal) {
  if (!(vdotVal > 0)) return [];
  return ZONES.map(z => {
    const v = vitessePourVo2(vdotVal * z.pct);        // m/min
    return { ...z, secondesParKm: Math.round(60000 / v) };
  });
}

// ---------------------------------------------------------------- charge
/**
 * Ratio de charge aiguë / chronique.
 * seances : [{ date:'2026-08-28', distance_km, denivele_m }]
 * La charge d'une séance = km + dénivelé/100 (100 m de D+ ≈ 1 km de plat).
 */
export function charge(seances, aujourdhui = new Date()) {
  const jour = d => Math.floor((aujourdhui - new Date(d + 'T00:00:00')) / 864e5);
  let aigue = 0, chronique = 0;
  for (const s of seances) {
    const j = jour(s.date);
    if (j < 0) continue;
    const c = Number(s.distance_km || 0) + Number(s.denivele_m || 0) / 100;
    if (j < 7)  aigue += c;
    if (j < 28) chronique += c;
  }
  const moyenne28 = chronique / 4;                     // ramené à une semaine
  const ratio = moyenne28 > 0 ? aigue / moyenne28 : null;
  let etat = 'inconnu';
  if (ratio !== null) {
    if (ratio < 0.8)      etat = 'sous-entraine';
    else if (ratio <= 1.3) etat = 'optimal';
    else if (ratio <= 1.5) etat = 'eleve';
    else                   etat = 'risque';
  }
  return {
    km7: Math.round(aigue * 10) / 10,
    km28: Math.round(chronique * 10) / 10,
    ratio: ratio === null ? null : Math.round(ratio * 100) / 100,
    etat
  };
}

// ---------------------------------------------------------------- objectif
const GAIN_MENSUEL = 1.0;      // points de VDOT par mois d'entraînement régulier
const FACTEUR_SEANCES = { 2: 0.55, 3: 0.8, 4: 1.0, 5: 1.15, 6: 1.25 };

/**
 * Faisabilité d'un objectif.
 * ref : { metres, secondes, date }   la performance de référence
 * cible : { metres, secondes, date } la course visée
 */
export function faisabilite(ref, cible, seancesSemaine = 4) {
  const vActuel = vdot(ref.metres, ref.secondes);
  const vRequis = vdot(cible.metres, cible.secondes);
  if (vActuel === null || vRequis === null) return null;

  const jours = Math.max(1, Math.round((new Date(cible.date) - new Date()) / 864e5));
  const mois  = jours / 30.44;
  const fac   = FACTEUR_SEANCES[Math.min(6, Math.max(2, seancesSemaine))] || 1;

  // le gain ralentit à mesure qu'on monte : au-delà de VDOT 50 il faut plus de temps
  const frein = vActuel > 50 ? 1 - (vActuel - 50) * 0.012 : 1;
  const gainPossible = GAIN_MENSUEL * mois * fac * Math.max(0.4, frein);
  const gainDemande  = vRequis - vActuel;

  const marge = gainPossible === 0 ? 0 : gainDemande / gainPossible;
  let verdict, couleur;
  if (gainDemande <= 0)      { verdict = 'deja-atteint'; couleur = 'vert'; }
  else if (marge <= 0.7)     { verdict = 'confortable';  couleur = 'vert'; }
  else if (marge <= 1.05)    { verdict = 'ambitieux';    couleur = 'or'; }
  else if (marge <= 1.5)     { verdict = 'tres-difficile'; couleur = 'orange'; }
  else                       { verdict = 'hors-portee';  couleur = 'rouge'; }

  const projete = tempsPour(vActuel + gainPossible, cible.metres);

  // fourchette : ±35 % sur le gain réellement obtenu
  const bas  = tempsPour(vActuel + gainPossible * 1.35, cible.metres);
  const haut = tempsPour(vActuel + gainPossible * 0.65, cible.metres);

  return {
    vdotActuel: vActuel,
    vdotRequis: Math.round(vRequis * 10) / 10,
    gainDemande: Math.round(gainDemande * 10) / 10,
    gainPossible: Math.round(gainPossible * 10) / 10,
    jours,
    chronoActuel: tempsPour(vActuel, cible.metres),
    chronoProjete: projete,
    fourchette: [bas, haut],
    ecart: tempsPour(vActuel, cible.metres) - cible.secondes,
    verdict, couleur
  };
}

// ---------------------------------------------------------------- séance du jour
/**
 * Choisit un type de séance selon la place dans le cycle et le temps restant.
 * Cycle simple sur 7 jours, phase déterminée par les jours restants.
 */
export function seanceDuJour(vdotVal, joursRestants, indexJour = new Date().getDay()) {
  const a = Object.fromEntries(allures(vdotVal).map(z => [z.cle, z.secondesParKm]));
  const phase = joursRestants > 56 ? 'base' : joursRestants > 21 ? 'specifique' : 'affutage';

  const PLANS = {
    base: [
      { jour:1, titre:'Endurance', blocs:[['Footing continu','60 min','endurance']], km:10 },
      { jour:2, titre:'Repos',     blocs:[] },
      { jour:3, titre:'Côtes',     blocs:[['Échauffement','20 min','endurance'],
                                          ['8 × 45 s en côte','récup descente','repetition'],
                                          ['Retour au calme','15 min','endurance']], km:11 },
      { jour:4, titre:'Endurance', blocs:[['Footing souple','45 min','endurance']], km:8 },
      { jour:5, titre:'Repos',     blocs:[] },
      { jour:6, titre:'Seuil',     blocs:[['Échauffement','20 min','endurance'],
                                          ['2 × 15 min','récup 3 min trot','seuil'],
                                          ['Retour au calme','15 min','endurance']], km:14 },
      { jour:0, titre:'Sortie longue', blocs:[['Continu','1 h 45','endurance']], km:18 }
    ],
    specifique: [
      { jour:1, titre:'Endurance', blocs:[['Footing continu','60 min','endurance']], km:10 },
      { jour:2, titre:'Repos',     blocs:[] },
      { jour:3, titre:'Intervalle', blocs:[['Échauffement','20 min','endurance'],
                                          ['6 × 1000 m','récup 2 min trot','intervalle'],
                                          ['Retour au calme','15 min','endurance']], km:14 },
      { jour:4, titre:'Endurance', blocs:[['Footing souple','45 min','endurance']], km:8 },
      { jour:5, titre:'Repos',     blocs:[] },
      { jour:6, titre:'Allure course', blocs:[['Échauffement','20 min','endurance'],
                                          ['12 km à allure objectif','','marathon'],
                                          ['Retour au calme','10 min','endurance']], km:17 },
      { jour:0, titre:'Sortie longue', blocs:[['Continu','2 h 10','endurance']], km:24 }
    ],
    affutage: [
      { jour:1, titre:'Endurance', blocs:[['Footing court','40 min','endurance']], km:7 },
      { jour:2, titre:'Repos',     blocs:[] },
      { jour:3, titre:'Rappel',    blocs:[['Échauffement','20 min','endurance'],
                                          ['4 × 800 m','récup 2 min','intervalle'],
                                          ['Retour au calme','10 min','endurance']], km:10 },
      { jour:4, titre:'Repos',     blocs:[] },
      { jour:5, titre:'Déblocage', blocs:[['Footing','30 min','endurance'],
                                          ['4 × 100 m en accélération','','repetition']], km:6 },
      { jour:6, titre:'Endurance', blocs:[['Footing souple','40 min','endurance']], km:7 },
      { jour:0, titre:'Repos',     blocs:[] }
    ]
  };

  const plan = PLANS[phase].find(p => p.jour === indexJour) || PLANS[phase][0];
  return {
    phase,
    titre: plan.titre,
    km: plan.km || 0,
    blocs: plan.blocs.map(([nom, detail, zone]) => ({
      nom, detail, zone, secondesParKm: a[zone] || null
    }))
  };
}

// ---------------------------------------------------------------- formats
export const fmtChrono = s => {
  if (s == null) return '—';
  s = Math.round(s);
  const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sec = s % 60;
  return h ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
           : `${m}:${String(sec).padStart(2,'0')}`;
};

export const fmtAllure = s => s == null ? '—'
  : `${Math.floor(s / 60)}'${String(Math.round(s) % 60).padStart(2,'0')}"`;

export const fmtEcart = s => {
  if (s == null) return '—';
  const signe = s > 0 ? '−' : '+';                 // s>0 = il faut gagner du temps
  const a = Math.abs(Math.round(s));
  const m = Math.floor(a / 60), sec = a % 60;
  return m ? `${signe}${m} min ${sec ? sec + ' s' : ''}`.trim() : `${signe}${sec} s`;
};

export const VERDICTS = {
  'deja-atteint':  'Tu es déjà à ce niveau. Vise plus haut.',
  'confortable':   'Objectif confortable au vu de ta progression.',
  'ambitieux':     'Ambitieux mais tenable.',
  'tres-difficile':'Très difficile. Il faudrait progresser bien plus vite que la moyenne.',
  'hors-portee':   'Hors de portée dans ce délai. Recule la date ou revois le chrono.'
};
