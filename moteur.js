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
export const ALLURE_MIN = 130;    // 2'10"/km — plus rapide que le record du monde
export const ALLURE_MAX = 900;    // 15'/km — plus lent que de la marche rapide

/** Une performance est-elle physiquement plausible ? */
export function plausible(metres, secondes) {
  if (!(metres > 0) || !(secondes > 0)) return false;
  const allure = secondes / (metres / 1000);
  return allure >= ALLURE_MIN && allure <= ALLURE_MAX;
}

export function vdot(metres, secondes) {
  if (!plausible(metres, secondes)) return null;
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
  let aigue = 0, chronique = 0, nb28 = 0, plusVieux = 0;

  for (const s of seances) {
    const j = jour(s.date);
    if (j < 0) continue;
    if (j > plusVieux) plusVieux = j;
    const c = Number(s.distance_km || 0) + Number(s.denivele_m || 0) / 100;
    if (j < 7)  aigue += c;
    if (j < 28) { chronique += c; nb28++; }
  }

  // le ratio n'a aucun sens sans un historique réel : il faut au moins
  // trois semaines de données et une poignée de séances.
  const historique = Math.min(28, plusVieux + 1);
  if (nb28 < 5 || historique < 21) {
    return {
      km7: Math.round(aigue * 10) / 10,
      km28: Math.round(chronique * 10) / 10,
      ratio: null,
      etat: 'insuffisant',
      jours: historique,
      seances: nb28
    };
  }

  const moyenneHebdo = chronique / (historique / 7);   // ramené à une semaine réelle
  const ratio = moyenneHebdo > 0 ? aigue / moyenneHebdo : null;
  let etat = 'inconnu';
  if (ratio !== null) {
    if (ratio < 0.8)       etat = 'sous-entraine';
    else if (ratio <= 1.3) etat = 'optimal';
    else if (ratio <= 1.5) etat = 'eleve';
    else                   etat = 'risque';
  }
  return {
    km7: Math.round(aigue * 10) / 10,
    km28: Math.round(chronique * 10) / 10,
    ratio: ratio === null ? null : Math.round(ratio * 100) / 100,
    etat, jours: historique, seances: nb28
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

// ---------------------------------------------------------------- génération du plan
/**
 * Construit le plan complet, du lendemain jusqu'à la veille de la course.
 * Retourne [{ date, titre, phase, km, blocs }] — les jours de repos sont inclus.
 */
export function genererPlan(vdotVal, dateCourse, debut = new Date()) {
  const fin = new Date(dateCourse + 'T00:00:00');
  const jours = [];
  const d = new Date(debut); d.setHours(0,0,0,0); d.setDate(d.getDate() + 1);

  while (d < fin) {
    const restants = Math.round((fin - d) / 864e5);
    const s = seanceDuJour(vdotVal, restants, d.getDay());
    jours.push({
      date: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
      titre: s.titre,
      phase: s.phase,
      km: s.km,
      blocs: s.blocs
    });
    d.setDate(d.getDate() + 1);
  }

  // la veille : déblocage court ; le jour J n'est pas dans le plan
  if (jours.length) {
    const veille = jours[jours.length - 1];
    veille.titre = 'Veille de course';
    veille.km = 4;
    veille.blocs = [{ nom: 'Footing très souple', detail: '20 min', zone: 'endurance',
                      secondesParKm: (allures(vdotVal).find(z => z.cle === 'endurance') || {}).secondesParKm }];
  }
  return jours;
}

/** Bilan d'un plan : combien de séances prévues, faites, manquées. */
export function bilanPlan(plan, aujourdhui = new Date()) {
  const auj = aujourdhui.toISOString().slice(0,10);
  let prevues = 0, faites = 0, manquees = 0, aVenir = 0;
  for (const p of plan) {
    if (!p.blocs || p.blocs.length === 0) continue;   // les repos ne comptent pas
    prevues++;
    if (p.etat === 'faite') faites++;
    else if (p.date < auj) manquees++;
    else aVenir++;
  }
  return { prevues, faites, manquees, aVenir,
           taux: prevues ? Math.round(faites / (faites + manquees || 1) * 100) : null };
}

// ---------------------------------------------------------------- nature d'une séance
export const NATURES = {
  qualite:    { nom: 'Qualité',         couleur: '#8258DD' },
  juste:      { nom: 'Endurance',       couleur: '#12B85F' },
  grise:      { nom: 'Zone grise',      couleur: '#E5A93A' },
  recup:      { nom: 'Récupération',    couleur: '#93B8D4' },
  usante:     { nom: 'Séance qui use',  couleur: '#D63B27' },
  renfo:      { nom: 'Renforcement',    couleur: '#404C58' }
};

/**
 * Classe une séance par rapport aux zones du coureur.
 * seance : { type, distance_km, temps_s, date }
 * veille : la séance de la veille, ou null (sert à détecter deux jours durs d'affilée)
 */
export function nature(seance, vdotVal, veille = null) {
  if ((seance.type || '').toLowerCase().includes('salle')) return 'renfo';
  const km = Number(seance.distance_km), t = Number(seance.temps_s);
  if (!(km > 0) || !(t > 0)) return 'renfo';
  const a = Object.fromEntries(allures(vdotVal).map(z => [z.cle, z.secondesParKm]));
  // une sortie en côte est ramenée à son équivalent plat avant d'être classée
  const eq = equivalentPlat(km * 1000, t, Number(seance.denivele_m) || 0);
  const p = eq.secondes / km;                        // secondes par km, corrigées du relief

  let n;
  if (p <= a.seuil + 12)            n = 'qualite';
  else if (p < a.endurance - 8)     n = 'grise';
  else if (p <= a.endurance + 30)   n = 'juste';
  else                              n = 'recup';

  // deux jours durs consécutifs, sans récupération entre les deux
  if ((n === 'qualite' || n === 'grise') && veille) {
    const dur = nature(veille, vdotVal, null);
    const ecart = Math.abs(new Date(seance.date) - new Date(veille.date)) / 864e5;
    if (ecart <= 1.5 && (dur === 'qualite' || dur === 'grise')) n = 'usante';
  }
  return n;
}

export const COMMENTAIRES = {
  qualite: 'Séance rapide, au seuil ou au-dessus. C’est ce qui fait progresser le chrono.',
  juste:   'Pile dans la zone qui construit le foncier. C’est ce genre de sortie qui paie dans six mois.',
  grise:   'Trop rapide pour un footing, trop lent pour développer. La sortie qui fatigue sans faire progresser.',
  recup:   'Très souple, largement sous l’allure d’endurance. Du repos actif.',
  usante:  'Deuxième jour dur d’affilée, sans récupération entre les deux. C’est comme ça qu’on se blesse.',
  renfo:   'Séance de salle. Elle ne compte pas dans les kilomètres mais tient le reste debout.'
};

// ---------------------------------------------------------------- séance recommandée
/**
 * Décide de la séance du jour à partir de ce qui a été fait récemment.
 * seances : [{date, type, distance_km, temps_s}]  — l'historique complet
 * Renvoie { titre, pourquoi, blocs:[{nom,detail,zone,secondesParKm}], km, intensite }
 */
export function recommandation(seances, vdotVal, aujourdhui = new Date()) {
  const a = Object.fromEntries(allures(vdotVal).map(z => [z.cle, z.secondesParKm]));
  const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const auj = iso(aujourdhui);
  const jour = d => Math.round((new Date(auj) - new Date(d)) / 864e5);

  const passees = seances
    .filter(s => s.date < auj)
    .sort((x, y) => y.date.localeCompare(x.date));

  const sur7 = passees.filter(s => jour(s.date) <= 7);
  const sur14 = passees.filter(s => jour(s.date) <= 14);

  const nat = s => nature(s, vdotVal, null);
  const derniere = passees[0] || null;
  const veille = derniere && jour(derniere.date) <= 1 ? derniere : null;

  const dursSur7 = sur7.filter(s => ['qualite','grise','usante'].includes(nat(s))).length;
  const qualiteSur7 = sur7.filter(s => nat(s) === 'qualite').length;
  const joursDepuisQualite = (() => {
    const q = passees.find(s => nat(s) === 'qualite');
    return q ? jour(q.date) : 99;
  })();
  const joursDepuisRepos = (() => {
    for (let i = 1; i <= 10; i++) {
      const d = new Date(aujourdhui); d.setDate(d.getDate() - i);
      if (!passees.some(s => s.date === iso(d))) return i;
    }
    return 99;
  })();
  const kmSur7 = sur7.reduce((t, s) => t + Number(s.distance_km || 0), 0);
  const plusLongue7 = Math.max(0, ...sur7.map(s => Number(s.distance_km || 0)));
  const dimanche = aujourdhui.getDay() === 0 || aujourdhui.getDay() === 6;

  const B = (nom, detail, zone) => ({ nom, detail, zone, secondesParKm: a[zone] });
  const ech = B('Échauffement', '20 min', 'endurance');
  const cal = B('Retour au calme', '15 min', 'endurance');

  // 1. rien depuis 7 jours sans repos → repos
  if (joursDepuisRepos >= 7) {
    return { titre: 'Repos complet', intensite: 'repos', km: 0, blocs: [],
      pourquoi: `Sept jours d’affilée sans repos. Le progrès se fait pendant la récupération, pas pendant l’effort.` };
  }
  // 2. la veille était dure → souple obligatoire
  if (veille && ['qualite','usante'].includes(nat(veille))) {
    return { titre: 'Endurance très souple', intensite: 'souple',
      km: 8, blocs: [B('Footing lent', '45 min', 'endurance')],
      pourquoi: `Séance dure hier. Aujourd’hui c’est ${fmtAllure(a.endurance)}/km ou plus lent, sans exception.` };
  }
  // 3. aucune séance de qualité depuis longtemps → seuil
  if (qualiteSur7 === 0 && joursDepuisQualite >= 3) {
    return { titre: 'Seuil', intensite: 'dure', km: 13,
      blocs: [ech, B('2 × 10 min', 'récup 3 min en trot', 'seuil'), cal],
      pourquoi: `Aucune séance rapide depuis ${joursDepuisQualite === 99 ? 'très longtemps' : joursDepuisQualite + ' jours'}. C’est le manque le plus coûteux pour ton 5 km.` };
  }
  // 4. une qualité déjà faite, et 3 jours de repos derrière → VMA
  if (qualiteSur7 >= 1 && joursDepuisQualite >= 3 && dursSur7 < 3) {
    return { titre: 'Intervalles courts', intensite: 'dure', km: 11,
      blocs: [ech, B('8 × 400 m', 'récup 1 min 30 en trot', 'intervalle'), cal],
      pourquoi: `Le seuil est fait cette semaine. Là on travaille la vitesse pure, celle qui manque sur la fin d’un 5 km.` };
  }
  // 5. week-end et pas de sortie longue cette semaine → sortie longue
  if (dimanche && plusLongue7 < 12) {
    const cible = Math.max(12, Math.round(kmSur7 * 0.35));
    return { titre: 'Sortie longue', intensite: 'moyenne', km: cible,
      blocs: [B('Continu', `${cible} km`, 'endurance')],
      pourquoi: `Ta plus longue sortie de la semaine fait ${plusLongue7.toFixed(1)} km. Le foncier se construit sur la durée, pas sur l’intensité.` };
  }
  // 6. par défaut → endurance
  return { titre: 'Endurance', intensite: 'souple', km: 10,
    blocs: [B('Footing continu', '55 min', 'endurance')],
    pourquoi: `Journée facile. Reste au-dessus de ${fmtAllure(a.endurance)}/km : c’est ce qui te permettra d’aller vite le jour de la séance dure.` };
}

// ---------------------------------------------------------------- records
const CLES_DISTANCE = [
  { cle: '5k',       metres: 5000,  nom: '5 km',     tol: 200 },
  { cle: '10k',      metres: 10000, nom: '10 km',    tol: 350 },
  { cle: 'semi',     metres: 21097, nom: 'Semi',     tol: 1200 },
  { cle: 'marathon', metres: 42195, nom: 'Marathon', tol: 900 }
];

/**
 * Records personnels par distance officielle.
 * resultats : [{nom, date, distance_km, temps_s, classement, participants}]
 */
export function records(resultats) {
  return CLES_DISTANCE.map(d => {
    const lot = (resultats || []).filter(r => {
      const m = Number(r.distance_km) * 1000;
      return Math.abs(m - d.metres) <= d.tol && plausible(m, Number(r.temps_s));
    });
    if (!lot.length) return { ...d, vide: true };
    const best = lot.reduce((a, b) => (Number(a.temps_s) <= Number(b.temps_s) ? a : b));
    const mReels = Number(best.distance_km) * 1000;
    const dPlus = Number(best.denivele_m) || 0;
    const eq = equivalentPlat(mReels, Number(best.temps_s), dPlus);
    return {
      ...d, vide: false,
      temps: Number(best.temps_s),
      date: best.date,
      course: best.nom,
      denivele: dPlus,
      tempsPlat: eq.secondes,
      vdot: vdot(mReels, eq.secondes),          // distance réelle, corrigée du relief
      courses: lot.length
    };
  });
}

/** La meilleure performance toutes distances confondues, en VDOT. */
export function meilleurVdot(resultats) {
  const r = records(resultats).filter(x => !x.vide);
  if (!r.length) return null;
  return r.reduce((a, b) => (a.vdot >= b.vdot ? a : b));
}

/** Palmarès trié du plus récent au plus ancien, avec le record marqué. */
export function palmares(resultats) {
  const rs = (resultats || []).slice().sort((a, b) => b.date.localeCompare(a.date));
  const meilleurs = {};
  for (const d of CLES_DISTANCE) {
    const lot = rs.filter(r => Math.abs(Number(r.distance_km) * 1000 - d.metres) <= d.tol);
    if (lot.length) meilleurs[d.cle] = lot.reduce((a, b) => (Number(a.temps_s) <= Number(b.temps_s) ? a : b));
  }
  return rs.map(r => {
    const d = CLES_DISTANCE.find(x => Math.abs(Number(r.distance_km) * 1000 - x.metres) <= x.tol);
    const est = d && meilleurs[d.cle] === r;
    const part = Number(r.participants) || 0, cl = Number(r.classement) || 0;
    const ok = plausible(Number(r.distance_km) * 1000, Number(r.temps_s));
    return {
      ...r,
      distanceNom: d ? d.nom : Number(r.distance_km).toString().replace('.', ',') + ' km',
      record: !!est && ok,
      douteux: !ok,
      vdot: ok ? vdot(Number(r.distance_km) * 1000,
                      equivalentPlat(Number(r.distance_km) * 1000, Number(r.temps_s),
                                     Number(r.denivele_m) || 0).secondes) : null,
      denivele: Number(r.denivele_m) || 0,
      allure: Number(r.temps_s) / Number(r.distance_km),
      pourcent: part && cl ? Math.max(1, Math.round(cl / part * 100)) : null
    };
  });
}

// ---------------------------------------------------------------- dénivelé
/**
 * Équivalent plat d'une performance en côte.
 *
 * Règle de terrain largement admise : en montée, on perd environ 0,4 % de temps
 * par mètre de D+ rapporté au kilomètre ; en descente on en regagne la moitié,
 * jamais plus. Sur un parcours vallonné (montées ET descentes), le D+ total
 * pénalise encore, mais moins qu'une montée sèche.
 *
 * metres     : distance en mètres
 * secondes   : temps réalisé
 * denivele_m : dénivelé positif total
 * profil     : 'vallonne' (montées et descentes, défaut) | 'montee' (montée sèche)
 */
export function equivalentPlat(metres, secondes, denivele_m, profil = 'vallonne') {
  const d = Number(denivele_m) || 0;
  if (!(metres > 0) || !(secondes > 0) || d <= 0) return { secondes, gain: 0, pente: 0 };

  const km = metres / 1000;
  const dParKm = d / km;                            // mètres de D+ par kilomètre
  const pente = d / metres * 100;                   // pente moyenne en %

  // 0,4 % de temps par m/km en montée sèche, 0,25 % si le parcours redescend
  const coef = profil === 'montee' ? 0.004 : 0.0025;
  // au-delà de 60 m/km la pénalité sature : on marche autant qu'on court
  const effectif = Math.min(dParKm, 60) + Math.max(0, dParKm - 60) * 0.4;

  const facteur = 1 / (1 + effectif * coef);
  const equiv = Math.round(secondes * facteur);
  return {
    secondes: equiv,
    gain: secondes - equiv,                         // temps « rendu » par la correction
    pente: Math.round(pente * 10) / 10,
    dParKm: Math.round(dParKm)
  };
}

/** VDOT corrigé du dénivelé. */
export function vdotCorrige(metres, secondes, denivele_m, profil) {
  const e = equivalentPlat(metres, secondes, denivele_m, profil);
  return { vdot: vdot(metres, e.secondes), ...e };
}
