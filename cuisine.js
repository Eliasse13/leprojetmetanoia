// ===== Metanoia — banque de recettes et génération de la semaine =====
// Aucune dépendance. Les recettes portent des étiquettes ; le générateur
// écarte celles qui heurtent une exclusion et choisit selon la séance du jour.

/**
 * moment  : matin | midi | soir
 * glu     : densité en glucides, 1 à 3 — 3 = repas d'avant séance dure
 * prot    : protéines approximatives, en grammes
 * kcal    : approximation pour une portion de coureur
 * cont    : ce que la recette contient, comparé aux exclusions
 * aime    : étiquettes de goût, pour favoriser ce qui plaît
 * cout    : 1 bon marché, 3 plus cher
 * boite   : se transporte et se mange froid ou réchauffé
 */
export const RECETTES = [
  // ---------- matin ----------
  { id:'m-oeufs-tomates', moment:'matin', fibres:1, nom:'Œufs brouillés, pain grillé, tomates',
    detail:'3 œufs, 2 tranches de pain complet, tomates cerises poêlées à l’huile d’olive et à l’origan.',
    glu:2, prot:24, kcal:620, cont:['oeufs','gluten'], aime:['oeufs','tomate'], cout:1, boite:false, sale:true },
  { id:'m-houmous', moment:'matin', fibres:3, nom:'Houmous, pain, œuf dur, tomates',
    detail:'Houmous maison, deux tranches de pain complet, un œuf dur, tomates.',
    glu:2, prot:22, kcal:600, cont:['oeufs','gluten','sesame','legumineuses','poischiches'], aime:['legumineuses','tomate'], cout:1, boite:true, sale:true },
  { id:'m-omelette', moment:'matin', fibres:1, nom:'Omelette aux herbes, pain, tomates',
    detail:'Deux à trois œufs, persil, ciboulette. Fromage blanc au miel à côté.',
    glu:2, prot:30, kcal:660, cont:['oeufs','gluten','laitage'], aime:['oeufs'], cout:1, boite:false, sale:true },
  { id:'m-coque-avocat', moment:'matin', fibres:2, nom:'Œufs à la coque, pain, avocat',
    detail:'Jaune coulant, blanc bien pris. Avocat écrasé au citron.',
    glu:2, prot:20, kcal:640, cont:['oeufs','gluten'], aime:['oeufs'], cout:2, boite:false, sale:true },
  { id:'m-porridge', moment:'matin', fibres:2, nom:'Porridge avoine-banane',
    detail:'80 g de flocons d’avoine, lait, une banane écrasée, cannelle.',
    glu:3, prot:16, kcal:580, cont:['gluten','laitage'], aime:['sucre'], cout:1, boite:true, sale:false },
  { id:'m-fromage-blanc', moment:'matin', fibres:2, nom:'Fromage blanc, avoine, fruits',
    detail:'Fromage blanc, 50 g d’avoine, fruits de saison, miel.',
    glu:3, prot:28, kcal:560, cont:['laitage','gluten'], aime:['sucre'], cout:1, boite:true, sale:false },
  { id:'m-pain-miel', moment:'matin', fibres:2, nom:'Pain, œufs, banane, miel',
    detail:'Salé d’abord, puis du pain au miel. Le carburant d’avant sortie longue.',
    glu:3, prot:20, kcal:700, cont:['oeufs','gluten'], aime:['oeufs'], cout:1, boite:false, sale:true },

  // ---------- midi ----------
  { id:'d-lentilles', moment:'midi', fibres:3, nom:'Salade de lentilles tièdes',
    detail:'Lentilles, carottes, oignon rouge, tomates séchées, persil, vinaigrette moutarde. Deux œufs durs, pain, un yaourt.',
    glu:2, prot:36, kcal:820, cont:['oeufs','gluten','laitage','legumineuses','oignon','lentilles'], aime:['legumineuses','tomate'], cout:1, boite:true },
  { id:'d-riz-poulet', moment:'midi', fibres:2, nom:'Riz complet, poulet, légumes rôtis',
    detail:'Poulet grillé, poivrons, oignons, courgettes bien dorées — jamais fondues. Un yaourt.',
    glu:3, prot:42, kcal:880, cont:['volaille','laitage','courgette','oignon'], aime:['volaille'], cout:2, boite:true },
  { id:'d-taboule', moment:'midi', fibres:3, nom:'Taboulé de quinoa',
    detail:'Quinoa, tomates, concombre, menthe, pois chiches, huile d’olive, citron. Un yaourt.',
    glu:2, prot:30, kcal:760, cont:['laitage','legumineuses','poischiches'], aime:['legumineuses','tomate'], cout:2, boite:true },
  { id:'d-pates-lentilles-froid', moment:'midi', fibres:3, nom:'Salade de pâtes, lentilles, tomates',
    detail:'Pâtes froides, lentilles, tomates cerises, oignon rouge, herbes, huile d’olive.',
    glu:3, prot:32, kcal:850, cont:['gluten','lentilles','legumineuses'], aime:['pates','tomate'], cout:1, boite:true },
  { id:'d-risotto-champ', moment:'midi', fibres:1, nom:'Risotto aux champignons',
    detail:'Riz arborio, champignons de Paris, oignon, bouillon de légumes. Un yaourt.',
    glu:3, prot:22, kcal:820, cont:['laitage','champignons','oignon'], aime:['risotto'], cout:2, boite:true },
  { id:'d-pates-tomate', moment:'midi', fibres:3, nom:'Pâtes complètes, sauce tomate-lentilles',
    detail:'Grosse assiette. C’est le carburant de la séance du soir.',
    glu:3, prot:32, kcal:900, cont:['gluten','legumineuses','lentilles'], aime:['tomate','legumineuses'], cout:1, boite:true },
  { id:'d-pates-poulet', moment:'midi', fibres:1, nom:'Pâtes, sauce tomate, poulet',
    detail:'Le repas de récupération : glucides et protéines ensemble. Fromage blanc au miel en dessert.',
    glu:3, prot:44, kcal:950, cont:['gluten','volaille','laitage'], aime:['tomate','volaille'], cout:2, boite:true },
  { id:'d-pates-blanches', moment:'midi', fibres:1, nom:'Pâtes blanches, sauce tomate, poulet',
    detail:'Pâtes non complètes, sauce tomate simple, poulet. Léger à digérer, plein de glucides.',
    glu:3, prot:40, kcal:900, cont:['gluten','volaille'], aime:['pates','tomate','volaille'], cout:2, boite:true },
  { id:'d-riz-blanc-oeufs', moment:'midi', fibres:1, nom:'Riz blanc, œufs, tomates',
    detail:'Riz blanc, deux à trois œufs, tomates poêlées. Le repas d’avant séance par excellence.',
    glu:3, prot:26, kcal:820, cont:['oeufs'], aime:['riz','oeufs','tomate'], cout:1, boite:true },
  { id:'d-riz-haricots', moment:'midi', fibres:3, nom:'Riz, haricots rouges, avocat',
    detail:'Chili doux sans viande, coriandre et citron vert. Un yaourt.',
    glu:3, prot:30, kcal:840, cont:['laitage','legumineuses','coriandre','haricots'], aime:['legumineuses','tomate'], cout:1, boite:true },

  // ---------- soir ----------
  { id:'s-risotto-tomate', moment:'soir', fibres:1, nom:'Risotto à la tomate et au basilic',
    detail:'Riz arborio, coulis de tomates, oignon, bouillon, huile d’olive en finition. Crémeux sans fromage.',
    glu:3, prot:20, kcal:780, cont:['oignon'], aime:['risotto','tomate'], cout:2, boite:true },
  { id:'s-chili', moment:'soir', fibres:3, nom:'Chili doux aux haricots rouges',
    detail:'Haricots, tomates concassées, maïs, oignons, cumin, paprika doux. Riz à côté.',
    glu:3, prot:28, kcal:820, cont:['legumineuses','oignon','haricots'], aime:['legumineuses','tomate'], cout:1, boite:true },
  { id:'s-boulettes', moment:'soir', fibres:3, nom:'Semoule, boulettes de pois chiches, tomates',
    detail:'Boulettes au four, jamais frites. Semoule et sauce tomate maison.',
    glu:3, prot:30, kcal:830, cont:['oeufs','gluten','legumineuses','oignon','poischiches','semoule'], aime:['legumineuses','tomate'], cout:1, boite:true },
  { id:'s-lentilles-riz', moment:'soir', fibres:3, nom:'Riz complet, lentilles, légumes rôtis',
    detail:'Lentilles vertes fermes, riz complet, légumes bien dorés, huile d’olive et herbes.',
    glu:3, prot:30, kcal:820, cont:['lentilles','legumineuses'], aime:['riz','legumineuses'], cout:1, boite:true },
  { id:'s-haricots-pdt', moment:'soir', fibres:2, nom:'Haricots blancs, pommes de terre, tomates',
    detail:'Mijoté doux, haricots blancs, pommes de terre en gros dés, sauce tomate à l’origan.',
    glu:3, prot:26, kcal:780, cont:['haricots','legumineuses'], aime:['tomate','pommedeterre'], cout:1, boite:true },
  { id:'s-dinde-pdt', moment:'soir', fibres:1, nom:'Dinde, pommes de terre au four, salade',
    detail:'Escalope poêlée, pommes de terre en quartiers bien rôtis.',
    glu:2, prot:40, kcal:800, cont:['volaille'], aime:['volaille'], cout:2, boite:true },
  { id:'s-soupe-pois', moment:'soir', fibres:3, texture:['puree'], nom:'Soupe de pois chiches, pain complet',
    detail:'Pois chiches, tomates, épinards, cumin. Épaisse, pas en purée.',
    glu:2, prot:26, kcal:700, cont:['gluten','legumineuses','poischiches'], aime:['legumineuses','tomate'], cout:1, boite:true },
  { id:'s-oeufs-riz', moment:'soir', fibres:1, nom:'Œufs, riz, légumes rôtis',
    detail:'Simple et rapide. Quand la digestion a assez travaillé.',
    glu:2, prot:26, kcal:720, cont:['oeufs'], aime:['oeufs'], cout:1, boite:true },
  { id:'s-omelette-pdt', moment:'soir', fibres:1, nom:'Omelette aux pommes de terre',
    detail:'Trois œufs, pommes de terre, oignons, salade verte, pain.',
    glu:2, prot:28, kcal:760, cont:['oeufs','gluten','oignon'], aime:['oeufs'], cout:1, boite:false },
  { id:'s-gratin-boulgour', moment:'soir', fibres:2, nom:'Gratin de courgettes et boulgour',
    detail:'Boulgour, courgettes dorées, œuf. Au four.',
    glu:2, prot:24, kcal:700, cont:['oeufs','gluten','courgette'], aime:[], cout:1, boite:true }
];

// une exclusion déclarée écarte toutes les recettes qui contiennent l'ingrédient
const CORRESPOND = {
  poisson:['poisson'], crustaces:['crustaces'], porc:['porc'],
  boeuf:['boeuf'], agneau:['agneau'], volaille:['volaille'],
  fromage:['fromage'], laitage:['laitage','fromage'],
  oeufs:['oeufs'], gluten:['gluten'], oleagineux:['oleagineux','sesame'],
  tofu:['tofu','soja'], legumineuses:['legumineuses','poischiches','lentilles','haricots'],
  champignons:['champignons'], choux:['choux'], aubergine:['aubergine'],
  poischiches:['poischiches'], semoule:['semoule'], lentilles:['lentilles'], haricots:['haricots'],
  courgette:['courgette'], oignon:['oignon'], coriandre:['coriandre'], olives:['olives']
};

export function recettesPossibles(gouts) {
  const ex = new Set();
  for (const e of (gouts?.exclusions || [])) (CORRESPOND[e] || [e]).forEach(x => ex.add(x));

  const reg = gouts?.regime;
  if (reg === 'vegetarien') ['volaille','boeuf','agneau','porc','poisson','crustaces'].forEach(x => ex.add(x));
  if (reg === 'vegetalien') ['volaille','boeuf','agneau','porc','poisson','crustaces','oeufs','laitage','fromage'].forEach(x => ex.add(x));
  if (reg === 'halal' || reg === 'casher') ex.add('porc');

  const tex = new Set(gouts?.textures || []);
  const froid = gouts?.midi === 'boite-froid';

  return RECETTES.filter(r => {
    if (r.cont.some(c => ex.has(c))) return false;
    if ((r.texture || []).some(t => tex.has(t))) return false;
    if (froid && r.moment === 'midi' && r.boite === false) return false;
    if (gouts?.petit_dej === 'sale' && r.moment === 'matin' && r.sale === false) return false;
    if (gouts?.petit_dej === 'sucre' && r.moment === 'matin' && r.sale === true) return false;
    return true;
  });
}

const score = (r, aimes) => (r.aime || []).filter(a => (aimes || []).includes(a)).length;

/**
 * Construit les 21 repas de la semaine.
 * jours : [{ nom, seance, intensite }] — 7 entrées, du lundi au dimanche
 */
export const ENCAS = [
  { id:'e-pain-miel', nom:'Pain, miel, banane', detail:'Deux tranches, du miel, une banane.',
    kcal:420, prot:9, cont:['gluten'], fibres:2 },
  { id:'e-yaourt', nom:'Yaourt, avoine, miel', detail:'Un gros yaourt, deux cuillères d’avoine, du miel.',
    kcal:380, prot:16, cont:['laitage','gluten'], fibres:2 },
  { id:'e-oeufs-pain', nom:'Deux œufs durs, pain', detail:'Le plus efficace après une séance.',
    kcal:400, prot:18, cont:['oeufs','gluten'], fibres:1 },
  { id:'e-fruits', nom:'Fruits et fromage blanc', detail:'Pommes, banane, fromage blanc.',
    kcal:360, prot:18, cont:['laitage'], fibres:2 },
  { id:'e-houmous', nom:'Houmous et pain', detail:'Deux belles tartines.',
    kcal:430, prot:13, cont:['gluten','sesame'], fibres:3 }
];

/** Le catalogue est-il assez fourni pour construire une semaine variée ? */
export function couverture(gouts) {
  const d = recettesPossibles(gouts);
  const par = m => d.filter(r => r.moment === m).length;
  const min = Math.min(par('matin'), par('midi'), par('soir'));
  return {
    total: d.length, matin: par('matin'), midi: par('midi'), soir: par('soir'),
    suffisant: min >= 3,
    alerte: min >= 3 ? null
      : `Tes contraintes ne laissent que ${min} recette${min>1?'s':''} pour un des repas. `
        + `La semaine se répétera. Retire une exclusion, ou dis-le moi et j'ajoute des recettes.`
  };
}

export function genererSemaine(gouts, jours) {
  const dispo = recettesPossibles(gouts);
  const aimes = gouts?.aimes || [];
  const parMoment = m => dispo.filter(r => r.moment === m)
    .sort((a, b) => score(b, aimes) - score(a, aimes) || a.cout - b.cout);

  const ex = new Set();
  for (const e of (gouts?.exclusions || [])) (CORRESPOND[e] || [e]).forEach(x => ex.add(x));
  const encasOk = ENCAS.filter(e => !e.cont.some(c => ex.has(c)));

  const compte = {};                       // combien de fois chaque recette est déjà servie
  const piocher = (moment, filtre) => {
    let lot = parMoment(moment).filter(filtre || (() => true));
    if (!lot.length) lot = parMoment(moment);
    if (!lot.length) return null;
    // la moins servie d'abord ; à égalité, celle qui correspond le mieux aux goûts
    lot = lot.slice().sort((a, b) => (compte[a.id] || 0) - (compte[b.id] || 0)
                                  || score(b, aimes) - score(a, aimes));
    const choix = lot[0];
    compte[choix.id] = (compte[choix.id] || 0) + 1;
    return choix;
  };

  return jours.map(j => {
    const dure = j.intensite === 'dure';
    const longue = /longue/i.test(j.seance || '');
    const repos = j.intensite === 'repos' || /repos/i.test(j.seance || '');

    // avant une séance dure : beaucoup de glucides, peu de fibres.
    // après : protéines qui digèrent vite, donc pas de légumineuses.
    const matin = piocher('matin', r => (longue || dure)
      ? (r.glu >= 3 || r.sale) && (r.fibres || 2) <= 2 : true);
    const midi  = piocher('midi',  r => dure
      ? r.glu === 3 && (r.fibres || 2) <= 2 : true);
    const soir  = piocher('soir',  r => dure
      ? r.prot >= 26 && !r.cont.includes('legumineuses') : true);

    const notes = {};
    if (dure && !longue)  notes.midi = 'Peu de fibres avant une séance dure : c’est ce qui évite le mal de ventre. Une banane deux heures avant.';
    if (dure)             notes.soir = 'Protéines qui digèrent vite dans les trente minutes : œufs, laitages, volaille. Pas de légumineuses ce soir.';
    if (longue)           notes.matin = 'Deux heures avant. Emporte une banane au-delà d’1 h 15.';
    if (longue)           notes.midi = 'Dans l’heure qui suit la sortie.';
    if (repos)            notes.soir = null;

    const i = jours.indexOf(j);
    const pool = (dure || longue) ? encasOk.filter(e => (e.fibres || 2) <= 2) : encasOk;
    const lot = pool.length ? pool : encasOk;
    const encas = lot.length ? [lot[i % lot.length]] : [];
    if ((dure || longue) && lot.length > 1) encas.push(lot[(i + 2) % lot.length]);

    const brut = (matin?.kcal || 0) + (midi?.kcal || 0) + (soir?.kcal || 0)
               + encas.reduce((t, e) => t + e.kcal, 0);
    return { ...j, matin, midi, soir, encas, notes, kcal: brut,
      prot: (matin?.prot || 0) + (midi?.prot || 0) + (soir?.prot || 0)
          + encas.reduce((t, e) => t + e.prot, 0) };
  });
}

/** Besoin énergétique quotidien, méthode Mifflin-St Jeor. */
export function besoins(gouts, kmSemaine = 45) {
  const p = Number(gouts?.poids_kg) || 70, t = Number(gouts?.taille_cm) || 178, age = 30;
  const mb = 10*p + 6.25*t - 5*age + 5;
  const kcal = Math.round(mb * 1.55 + kmSemaine * p * 0.95 / 7);
  return { kcal, proteines: Math.round(p * 1.7), glucides: Math.round(kcal*0.55/4), lipides: Math.round(kcal*0.27/9) };
}

/**
 * Écart entre ce que le plan apporte et ce dont le corps a besoin.
 * Sert à dire « augmente les portions de tant » plutôt qu'à inventer des repas.
 */
export function ajustement(semaine, besoin) {
  const moyenne = Math.round(semaine.reduce((t, j) => t + j.kcal, 0) / semaine.length);
  const moyProt = Math.round(semaine.reduce((t, j) => t + j.prot, 0) / semaine.length);
  const ecart = besoin.kcal - moyenne;
  return {
    moyenne, moyProt, ecart,
    coef: Math.round((besoin.kcal / moyenne) * 100) / 100,
    conseil: ecart > 250
      ? `Sers-toi environ ${Math.round(ecart / moyenne * 100)} % de plus à chaque assiette : `
        + `féculents surtout, c'est là que se trouvent les calories manquantes.`
      : ecart < -250
      ? `Le plan dépasse ton besoin. Réduis les féculents d'environ ${Math.round(-ecart / moyenne * 100)} %.`
      : `Les portions standard suffisent.`
  };
}

/** Liste de courses agrégée à partir des recettes retenues. */
export function courses(semaine) {
  const ids = new Set();
  semaine.forEach(j => ['matin','midi','soir'].forEach(m => j[m] && ids.add(j[m].id)));
  const paniers = {
    'Sec et épicerie': new Set(), 'Frais': new Set(), 'Fruits et légumes': new Set(), 'Base': new Set()
  };
  const AJOUT = {
    'm-oeufs-tomates':[['Frais','Œufs bio'],['Base','Pain complet'],['Fruits et légumes','Tomates cerises']],
    'm-houmous':[['Sec et épicerie','Pois chiches secs'],['Sec et épicerie','Tahini'],['Base','Pain complet']],
    'm-omelette':[['Frais','Œufs bio'],['Frais','Fromage blanc'],['Sec et épicerie','Miel']],
    'm-coque-avocat':[['Frais','Œufs bio'],['Fruits et légumes','Avocats']],
    'm-porridge':[['Sec et épicerie','Flocons d’avoine'],['Fruits et légumes','Bananes']],
    'm-fromage-blanc':[['Frais','Fromage blanc'],['Sec et épicerie','Flocons d’avoine']],
    'm-pain-miel':[['Base','Pain complet'],['Sec et épicerie','Miel'],['Fruits et légumes','Bananes']],
    'd-lentilles':[['Sec et épicerie','Lentilles vertes'],['Fruits et légumes','Carottes'],['Sec et épicerie','Tomates séchées'],['Frais','Yaourts nature']],
    'd-riz-poulet':[['Sec et épicerie','Riz complet'],['Frais','Poulet'],['Fruits et légumes','Poivrons'],['Fruits et légumes','Courgettes']],
    'd-taboule':[['Sec et épicerie','Quinoa'],['Fruits et légumes','Concombre'],['Fruits et légumes','Tomates']],
    'd-risotto-champ':[['Sec et épicerie','Riz arborio'],['Frais','Champignons de Paris'],['Sec et épicerie','Bouillon de légumes']],
    'd-pates-tomate':[['Sec et épicerie','Pâtes complètes'],['Sec et épicerie','Tomates concassées'],['Sec et épicerie','Lentilles vertes']],
    'd-pates-poulet':[['Sec et épicerie','Pâtes complètes'],['Frais','Poulet'],['Sec et épicerie','Tomates concassées']],
    'd-riz-haricots':[['Sec et épicerie','Riz complet'],['Sec et épicerie','Haricots rouges secs'],['Fruits et légumes','Avocats']],
    's-risotto-tomate':[['Sec et épicerie','Riz arborio'],['Sec et épicerie','Tomates concassées'],['Fruits et légumes','Oignons']],
    's-chili':[['Sec et épicerie','Haricots rouges secs'],['Sec et épicerie','Maïs'],['Sec et épicerie','Tomates concassées']],
    's-boulettes':[['Sec et épicerie','Pois chiches secs'],['Sec et épicerie','Semoule complète'],['Frais','Œufs bio']],
    's-dinde-pdt':[['Frais','Escalope de dinde'],['Fruits et légumes','Pommes de terre'],['Fruits et légumes','Salade']],
    's-soupe-pois':[['Sec et épicerie','Pois chiches secs'],['Fruits et légumes','Épinards frais']],
    's-oeufs-riz':[['Frais','Œufs bio'],['Sec et épicerie','Riz complet']],
    's-omelette-pdt':[['Frais','Œufs bio'],['Fruits et légumes','Pommes de terre']],
    's-gratin-boulgour':[['Sec et épicerie','Boulgour'],['Fruits et légumes','Courgettes'],['Frais','Œufs bio']]
  };
  ids.forEach(id => (AJOUT[id] || []).forEach(([r, a]) => paniers[r].add(a)));
  semaine.forEach(j => {
    if (!j.encas) return;
    if (j.encas.id === 'e-pain-miel') { paniers['Base'].add('Pain complet'); paniers['Sec et épicerie'].add('Miel'); paniers['Fruits et légumes'].add('Bananes'); }
    if (j.encas.id === 'e-yaourt')    { paniers['Frais'].add('Yaourts nature'); paniers['Sec et épicerie'].add('Flocons d’avoine'); paniers['Sec et épicerie'].add('Miel'); }
    if (j.encas.id === 'e-oeufs-pain'){ paniers['Frais'].add('Œufs bio'); paniers['Base'].add('Pain complet'); }
    if (j.encas.id === 'e-fruits')    { paniers['Frais'].add('Fromage blanc'); paniers['Fruits et légumes'].add('Pommes'); paniers['Fruits et légumes'].add('Bananes'); }
    if (j.encas.id === 'e-houmous')   { paniers['Sec et épicerie'].add('Pois chiches secs'); paniers['Sec et épicerie'].add('Tahini'); paniers['Base'].add('Pain complet'); }
  });
  paniers['Base'].add('Huile d’olive');
  paniers['Base'].add('Épices : cumin, paprika doux, origan');
  paniers['Fruits et légumes'].add('Oignons');
  return Object.entries(paniers)
    .map(([rayon, set]) => [rayon, [...set].sort((a, b) => a.localeCompare(b, 'fr'))])
    .filter(([, l]) => l.length);
}
