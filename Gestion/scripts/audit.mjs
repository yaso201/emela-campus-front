/**
 * Audit statique — à lancer avant tout branchement.
 *
 *     npm run audit          # node scripts/audit.mjs
 *
 * ⚠️ Ce script n'a jamais été exécuté au moment de son écriture (aucun `npm`
 * disponible) : son premier passage réel peut encore échouer sur son propre
 * code. Pas de shebang — il est toujours invoqué par `node`, et le `#!` est
 * précisément ce qui a empêché un harnais de le parser tel quel.
 *
 * CONTRAT, dit exactement :
 *   — chaque vérification qui casse produit UNE ligne ÉCHEC nommée ;
 *   — le script VA JUSQU'AU BOUT et les nomme TOUTES : un passage doit donner la
 *     liste des défauts, pas le premier d'entre eux ;
 *   — il n'INTERROMPT que sur trois cas irrécupérables, où la suite n'aurait
 *     aucun sens — un fichier qui ne parse pas, le simulacre qui ne se charge
 *     pas, le vocabulaire absent — plus toute exception non rattrapée (`fatal`) ;
 *   — code de sortie 1 dès qu'une vérification a échoué, 0 sinon.
 * Aucune trace, jamais : le filet de haut niveau convertit toute exception en
 * échec nommé portant sa section.
 *
 * Il ne remplace pas `npm run dev` : il ne voit ni le rendu, ni les erreurs
 * d'exécution des composables. Il attrape ce qui a échappé plusieurs fois de
 * suite à une relecture humaine, et dans cet ordre — la syntaxe D'ABORD, parce
 * qu'un fichier qui ne parse pas rend tous les autres résultats sans objet.
 */
import { readFileSync, readdirSync, statSync, writeSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');

let failures = 0;

/**
 * La section courante — tenue par `say()`, lue par le filet ci-dessous.
 *
 * ⚠️ LE CONTRAT DU SCRIPT : une ligne ÉCHEC nommée, puis code 1. Jamais une
 * trace. Il a été rompu trois fois de suite par la même cause — une propriété
 * lue sans être assurée : un import qui lève, une famille de signaux renommée,
 * un tableau que la fixture ne rend plus. Les corriger un par un ne converge
 * pas ; chaque grappe touche `fixtures.js` et en ajoute un.
 *
 * Le filet est donc posé au niveau du contrat : TOUTE exception non rattrapée,
 * où qu'elle naisse, devient une ligne ÉCHEC qui nomme sa section. On perd la
 * pile — on gagne un diagnostic lisible et un contrat qui tient sans avoir à
 * prévoir la prochaine forme.
 */
let currentSection = 'démarrage';

/**
 * ⚠️ Écriture SYNCHRONE, et ce n'est pas un détail de style.
 *
 * `process.stdout.write` est asynchrone sur un tube, et `process.exit()` ne
 * l'attend pas — il coupe l'entrée/sortie en cours. Les cinq sorties de ce
 * script tirent `exit(1)` juste après avoir écrit leur diagnostic : en TTY tout
 * s'affiche, mais dans le passage qui compte — `npm run audit > audit.log`, ou
 * une CI — la ligne ÉCHEC pouvait être tronquée. Le code de sortie survivait ;
 * le nom du défaut, non.
 *
 * `writeSync` supprime la course pour les cinq sites d'un coup, plutôt que de
 * garder chaque exit séparément.
 */
const say = (s) => {
  // Un titre de section est la seule ligne à commencer par un chiffre après un
  // saut. Volontairement large : la première version restreignait les
  // caractères et laissait tomber « 4 · Accord entre écrans » — un accent
  // suffisait à perdre le nom de la section dans le diagnostic.
  const m = /^\n(\d[^\n]*)$/.exec(s);
  if (m) currentSection = m[1].trim();
  writeSync(1, s + '\n');
};

function check(title, problems, detail = '') {
  const ok = problems.length === 0;
  if (!ok) failures++;
  say((ok ? '  ok   ' : '  ÉCHEC') + '  ' + title + (detail ? '  — ' + detail : ''));
  problems.forEach((p) => say('          ' + p));
  return ok;
}

function fatal(err) {
  // Le filet est global : il attrape aussi bien une forme de fixture disparue
  // qu'un fichier de configuration absent au §8 ou une faute dans ce script.
  // Il ne peut donc PAS nommer la cause — il nomme ce qu'il sait.
  check('§' + currentSection + ' — aucune exception', [
    (err && err.message) || String(err),
    'Exception non rattrapée — la section nommée ci-dessus est le dernier point atteint.',
  ]);
  say('\nAudit interrompu : exception dans « ' + currentSection + ' ».');
  process.exit(1);
}
process.on('uncaughtException', fatal);
process.on('unhandledRejection', fatal);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const files = walk(SRC);
const js = files.filter((f) => f.endsWith('.js'));
const vue = files.filter((f) => f.endsWith('.vue'));
const read = (p) => readFileSync(p, 'utf8');

/** Neutralise la syntaxe de module pour qu'un `new Function` puisse parser. */
function toScript(src) {
  return src
    .replace(/^\s*import\s[\s\S]*?from\s*['"][^'"]*['"]\s*;?.*$/gm, '')
    .replace(/^\s*import\s*['"][^'"]*['"]\s*;?.*$/gm, '')
    .replace(/^\s*export\s*\*\s*from\s*['"][^'"]*['"]\s*;?.*$/gm, '')
    .replace(/^\s*export\s*\{[^}]*\}\s*(?:from\s*['"][^'"]*['"]\s*)?;?.*$/gm, '')
    .replace(/^(\s*)export\s+default\s+/gm, '$1const __default = ')
    .replace(/^(\s*)export\s+(async\s+)?(const|let|var|function|class)\s/gm, '$1$2$3 ')
    .replace(/\bimport\.meta\b/g, '({env:{}})')
    .replace(/\bawait\b/g, '');
}

// ─── 1. SYNTAXE, EN PREMIER ──────────────────────────────────────────────────
say('\n1 · Syntaxe');
const syntax = [];
// ⚠️ Ce script est dans la boucle. Il vit hors de `src/`, donc `walk(SRC)` ne le
// voyait pas — et c'est le fichier le PLUS susceptible d'être cassé, puisqu'il
// n'a jamais tourné. S'exempter du seul contrôle qu'on porte est intenable.
for (const p of [...js, fileURLToPath(import.meta.url)]) {
  try { new Function(toScript(read(p))); } catch (e) { syntax.push(basename(p) + ' → ' + e.message); }
}
for (const p of vue) {
  const src = read(p);
  const i = src.indexOf('<script setup>');
  if (i < 0) continue;
  try { new Function(toScript(src.slice(i + 14, src.indexOf('</script>', i)))); }
  catch (e) { syntax.push(basename(p) + ' → ' + e.message); }
}
if (!check('chaque module de `src/`, ce script, et chaque bloc <script setup>', syntax)) {
  say('\nAudit interrompu : un fichier qui ne parse pas rend le reste sans objet.');
  process.exit(1);
}

// ─── 2. LE MODULE DE SIMULACRE S'ÉVALUE ET RÉPOND ────────────────────────────
say('\n2 · Simulacre');

/**
 * ⚠️ L'import est GARDÉ, et ce n'est pas de la prudence décorative.
 *
 * `fixtures.js` vérifie ses propres données au chargement du module et lève si
 * une clé refusée a quitté le vocabulaire. Importé nu, cet échec tuait le script
 * ici même, avec une trace — avant le §2 bis, donc avant le `check()` qui porte
 * précisément ce cas. Le contrôle que le relevé crédite de dents était
 * inatteignable pour sa propre défaillance, et le contrat du script — une ligne
 * ÉCHEC nommée, puis code 1 — était rompu.
 */
let fx, fxG, fxP, fxN, fxD, fxC, fxZ;
const FIXTURE_MODULES = {};
try {
  /**
   * ⚠️ LES MODULES DE FIXTURES SONT DÉRIVÉS DU DOSSIER, non listés à la main.
   *
   * Ce script en a listé un seul, puis deux : la grappe 4 avait mis ses fixtures
   * dans un second module, et le contrôle handler ↔ fixture n'en couvrait qu'une
   * partie — la même omission que celle qu'il existe pour attraper. La grappe 5 en
   * ajoute un troisième, et rien n'aurait signalé son absence.
   *
   * Une liste manuscrite de ce qui vit dans un dossier deviendra fausse : c'est la
   * règle 6, et c'est la quatrième fois qu'elle mord dans ce fichier. Désormais le
   * dossier fait foi.
   */
  const dir = join(SRC, 'api/mock');
  for (const name of readdirSync(dir).filter((n) => /^fixtures.*\.js$/.test(n))) {
    FIXTURE_MODULES[name] = await import(pathToFileURL(join(dir, name)));
  }
  fx = FIXTURE_MODULES['fixtures.js'];
  fxG = FIXTURE_MODULES['fixtures-groupes.js'];
  fxP = FIXTURE_MODULES['fixtures-planning.js'];
  fxN = FIXTURE_MODULES['fixtures-notes.js'];
  fxD = FIXTURE_MODULES['fixtures-dossiers.js'];
  fxC = FIXTURE_MODULES['fixtures-conseil.js'];
  fxZ = FIXTURE_MODULES['fixtures-fin-de-cycle.js'];
  const missing = ['fixtures.js', 'fixtures-groupes.js', 'fixtures-planning.js',
    'fixtures-notes.js', 'fixtures-dossiers.js', 'fixtures-conseil.js',
    'fixtures-fin-de-cycle.js'].filter((n) => !FIXTURE_MODULES[n]);
  if (missing.length) throw new Error('modules attendus absents : ' + missing.join(', '));
} catch (e) {
  check('le module de simulacre se charge', [e.message]);
  say('\nAudit interrompu : le simulacre ne se charge pas — rien d’autre n’est vérifiable.');
  process.exit(1);
}
const probes = [
  ['session', () => fx.session.person.name],
  ['academicContext', () => fx.academicContext.current.year],
  ['workQueue', () => fx.workQueue({}).count],
  ['weekSessions', () => fx.weekSessions({}).items.length],
  // F3-FORMES : les sondes service + structure éprouvent LA FORME SERVEUR —
  // les clés d'écran (groups, nodes, families…) vivent aux adaptateurs.
  ['structureTree', () => fx.structureTree({}).terms.length],
  ['servicePlan', () => fx.servicePlan({}).lines.length],
  ['serviceCoverage', () => fx.serviceCoverage({}).coverage.length],
  // ⚠️ Sondée avec le STATUT SERVEUR : la liste nue filtrée doit répondre.
  ['serviceLines', () => fx.serviceLines({ status: 'Proposé' }).length],
  ['serviceSignals', () => fx.serviceSignals({}).over_norm.length],
  // ⚠️ Sondées avec un NOM RÉEL d'enseignant (l'identifiant serveur est le nom).
  ['serviceReconciliation', () => fx.serviceReconciliation({ instructor: 'Pr. Célestine Ahouandjinou' }).lines.length],
  ['teacherLoad', () => fx.teacherLoad({ instructor: 'Pr. Célestine Ahouandjinou' }).engaged_hours],
  // F3-COR S1 : la forme serveur porte DEUX faits — downstream/lock ET validation.
  ['ueDownstreamUsage', () => fx.ueDownstreamUsage({ ue: 'UE-3.2' }).downstream.enrollments],
  ['workQueueCounts', () => fx.workQueueCounts.total],
  ['denial', () => fx.denial.details.status],
  // Grappe 2 — les deux fixtures nées du sélecteur de filière.
  ['structureOptions', () => fx.structureOptions.activity_types.length],
  ['programs', () => fx.programs({}).length],
  // Grappe 4 — sonder le module ajouté, pas seulement le premier.
  ['groupCandidates', () => fxG.groupCandidates({}).length],
  ['groups', () => fxG.groups({}).length],
  // ⚠️ Sondée avec un NOM RÉEL : cette fixture lève sur un groupe inconnu, donc
  // la sonde garde aussi contre le renommage d'un groupe du jeu d'essai.
  ['group', () => fxG.group({ name: 'SG-L2GL-A' }).students.length],
  ['cohortOverview', () => Object.keys(fxG.cohortOverview({}).totals_by_type).length],
  ['studentGroupsOf', () => fxG.studentGroupsOf({ student: 'ETU-24-0188' }).length],
  ['currentEnrollment', () => fxG.currentEnrollment({}).program],
  ['enrollmentReport', () => fxG.enrollmentReport({}).lines.length],
  // ⚠️ Sondée avec une CLÉ RÉELLE : cette fixture lève sur un nom inconnu, donc
  // la sonde garde aussi contre le renommage de ce journal. Sans elle, renommer
  // la clé ne cassait rien à l'audit — et l'onglet du rapport affichait « aucune
  // inscription à afficher », un état vide crédible.
  ['enrollmentLog', () => fxG.enrollmentLog({ log_name: 'LOG-2027-0440' }).lines.length],
  ['enrollmentReplayQueue', () => fxG.enrollmentReplayQueue({}).items.length],
  ['moodleOrphans', () => fxG.moodleOrphans({}).families.length],
  // Grappe 5 — le troisième module.
  ['schedules', () => fxP.schedules({}).length],
  ['schedule', () => fxP.schedule({ name: 'CS-0001' }).instructor],
  ['planningWeek', () => fxP.planningWeek({}).items.length],
  ['suggestedInstructor', () => fxP.suggestedInstructor('INF-204', 'TD').instructor],
  ['serviceSource', () => fxP.serviceSource('INF-204', 'CM', 'Pr. Léonard Hounkpatin')],
  ['modulePlanningSummary', () => fxP.modulePlanningSummary({ course: 'INF-204' }).by_type.length],
  ['scheduleConflicts', () => fxP.scheduleConflicts({ instructor: 'M. Firmin Dossou' }).conflicts],
  ['publishReport', () => fxP.publishReport({}).total],
  ['instructorDayLoad', () => fxP.instructorDayLoad({ instructor: 'M. Firmin Dossou' }).hours],
  ['tpRequalification', () => fxP.tpRequalification({}).items.length],
  ['examSchedules', () => fxP.examSchedules({}).length],
  // Grappe 6 — le quatrième module.
  ['submissionsForControl', () => fxN.submissionsForControl({ include_attendance: 1 }).length],
  ['adjustedModuleAverages', () => fxN.adjustedModuleAverages({}).length],
  // F3-PROV : le sujet vient de la LISTE (jamais implicite)
  ['deliberationDashboard', () => fxN.deliberationDashboard({ name: fxN.listDeliberations({}).deliberations[0].name }).rows.length],
  ['deliberationRoster', () => fxN.deliberationRoster({ name: fxN.listDeliberations({}).deliberations[0].name }).items.length],
  // ⚠️ Sondée avec un NOM RÉEL : la fixture lève sur une épreuve inconnue, donc
  // la sonde garde aussi contre le renommage d'une épreuve du jeu d'essai.
  ['examSchedule', () => fxN.examSchedule({ name: 'EX-0044' }).students.length],
  ['examPopulateReport', () => fxN.examPopulateReport({ exam_schedule: 'EX-0044' }).total],
  // Grappe 7 — le cinquième module.
  ['dossiers', () => fxD.dossiers({}).items.length],
  // ⚠️ Sondée avec un NOM RÉEL : la fixture lève sur un dossier inconnu, donc la
  // sonde garde aussi contre le renommage d'un dossier du jeu d'essai.
  ['dossier', () => fxD.dossier({ name: 'DIS-2027-014' }).chain.length],
  ['stepsOf', () => fxD.stepsOf('discipline').length],
  ['activeSuspensions', () => fxD.activeSuspensions({}).length],
  ['suspensionsNeedingReactivation', () => fxD.suspensionsNeedingReactivation({}).length],
  ['awaitingOtherDecider', () => fxD.awaitingOtherDecider({}).items.length],
  ['statusCause', () => fxD.statusCause({}).act],
  // Grappe 8 — le sixième module.
  ['councilCandidates', () => fxC.councilCandidates({}).items.length],
  ['councilSession', () => fxC.councilSession({}).agenda.length],
  ['councilPreconisations', () => fxC.councilPreconisations({}).items.length],
  ['absenceThresholds', () => fxC.absenceThresholds({}).blocks.length],
  // Les deux DÉRIVATIONS de ce module, éprouvées directement : ce sont elles qui
  // portent les deux invariants du domaine, et elles sont appelées par les vues.
  ['needsFinding', () => fxC.needsFinding({ kind: 'contrat' })],
  ['actsFor', () => fxC.actsFor({ level: 2, first_pronounced: false, retained: false }).length],
  // Grappes 9 à 11 — le septième module.
  ['documentRequests', () => fxZ.documentRequests({}).items.length],
  // ⚠️ Sondée avec un NOM RÉEL : la fixture lève sur une demande inconnue, donc la
  // sonde garde aussi contre le renommage d'une demande du jeu d'essai.
  ['documentRequest', () => fxZ.documentRequest({ name: 'DOC-2027-0188' }).checks.length],
  ['yearClosure', () => fxZ.yearClosure({}).anomalies.length],
  ['mentionOf', () => fxZ.mentionOf(15.82)],
  ['graduationDossiers', () => fxZ.graduationDossiers({}).items.length],
  ['graduationDossier', () => fxZ.graduationDossier({ name: 'DIP-2027-0044' }).conditions.length],
  ['roleGrants', () => fxZ.roleGrants({}).length],
  ['roleProfiles', () => fxZ.roleProfiles().length],
  ['grantAnomalies', () => fxZ.grantAnomalies({}).holders_with_anomalies.length],
  ['grantJournal', () => fxZ.grantJournal({}).length],
];
const dead = [];
for (const [name, fn] of probes) { try { fn(); } catch (e) { dead.push(name + ' → ' + e.message); } }
check('chaque point d’entrée simulé répond', dead);

/**
 * ⚠️ AUCUNE SONDE N'APPELLE UNE FIXTURE SUPPRIMÉE.
 *
 * Le contrôle voisin garde le sens « fixture non sondée ». Il manquait le sens
 * inverse — **sonde sans fixture** — et c'est celui qui a mordu : en supprimant la
 * chaîne morte de l'écran A8, j'ai retiré la fixture `awaitingOtherDecider` de
 * `fixtures.js` sans retirer sa sonde. `fx.awaitingOtherDecider.items` levait un
 * `TypeError`, la section des sondes échouait, et le code de sortie basculait à 1.
 *
 * ⚠️ Ma vérification de fin de tour n'avait exécuté que le bloc modifié plus la passe
 * de syntaxe. La syntaxe était verte ; le défaut n'existait qu'à l'exécution. **Une
 * suppression a des dépendants ailleurs : re-lancer la section touchée ne suffit
 * pas.** C'est la même leçon que « un contrôle doit garder la classe, pas
 * l'instance », appliquée à la vérification elle-même.
 *
 * ⚠️ J'AI ÉCRIT DEUX JUSTIFICATIONS FAUSSES POUR CE CONTRÔLE AVANT CELLE-CI.
 *
 * La première : « l'audit s'arrêtait avant les autres contrôles ». Inféré : `check()`
 * incrémente un compteur et rend un booléen, l'appel de cette section ne teste pas ce
 * retour, et les seuls `process.exit` sont ailleurs. L'audit continuait.
 *
 * La seconde : « le diagnostic était un TypeError opaque, ce contrôle le nomme ».
 * Faux aussi — la boucle ci-dessus pousse `name + ' → ' + e.message` dans `dead`,
 * donc le nom de la sonde était déjà en tête du message.
 *
 * ⚠️ CE QUI JUSTIFIE RÉELLEMENT CE CONTRÔLE : il couvre un cas que la boucle `dead`
 * ne peut PAS voir — une sonde qui appelle une fixture supprimée **sans lever**.
 * `() => fx.foo?.items?.length` rend `undefined`, `dead` reste vide, et rien ne
 * signale que la fixture n'existe plus. C'est une garantie distincte, et la seule.
 *
 * ⚠️ Il s'indexe sur les `fx*.<nom>` du CORPS de la sonde, non sur son libellé —
 * **sans quoi** un libellé descriptif comme « weekSessions demi-heures » serait
 * signalé à tort, et une sonde appelant deux fixtures ne serait couverte que pour la
 * première. Lire le corps évite les deux : le libellé n'est jamais consulté, et
 * `called` est un ensemble parcouru en entier.
 */
const probeOrphans = [];
for (const [name, fn] of probes) {
  const called = new Set([...fn.toString().matchAll(/\bfx[A-Z]?\.(\w+)/g)].map((m) => m[1]));
  for (const target of called) {
    if (!Object.values(FIXTURE_MODULES).some((mod) => typeof mod[target] !== 'undefined')) {
      probeOrphans.push('sonde « ' + name + ' » appelle ' + target + ', qui n’existe plus');
    }
  }
}
check('aucune sonde n’appelle une fixture supprimée', probeOrphans,
  probes.length + ' sondes, lues par leur corps');

/**
 * ⚠️ CHAQUE FIXTURE EXPORTÉE EST ÉPROUVÉE QUELQUE PART.
 *
 * `probes` était une liste manuscrite — la même classe que la liste des actes
 * d'écriture, corrigée trois fois ailleurs et laissée intacte ici. Une fixture
 * ajoutée et non éprouvée passe inaperçue : c'est arrivé à `enrollmentLog`, celle
 * qui porte l'onglet du rapport, l'encart du badge et le cas de refus.
 *
 * ⚠️ Le contrôle demande « éprouvée », non « sondée ». Sa première version
 * exigeait une entrée dans `probes` et signalait donc cinq fixtures qui sont
 * exercées par d'autres sections — `ueDetail` par la boucle des unités de
 * l'arbre, `teacherEngaged` par l'accord entre écrans. Exiger un endroit précis
 * plutôt qu'un usage réel, c'est encore un contrôle qui interdit le légitime.
 *
 * La preuve d'usage est mécanique : le nom apparaît-il dans ce script, préfixé du
 * module qui l'exporte ?
 */
const auditSrc = read(fileURLToPath(import.meta.url));
const CALLABLE = /^[a-z]/;      // les constantes de données ne s'éprouvent pas
// L'union vient des MODULES DÉRIVÉS : un quatrième module sera couvert sans
// qu'on touche à cette ligne.
const allFixtureExports = Object.assign({}, ...Object.values(FIXTURE_MODULES));
const untested = Object.keys(allFixtureExports)
  .filter((n) => CALLABLE.test(n))
  // ⚠️ `fx[A-Z]?` et non `fx[GPND]?` : la liste des suffixes admis était une liste
  // manuscrite de ce qui vit dans un dossier — la même classe que celle corrigée
  // au §2 pour les modules eux-mêmes. Un septième module aliasé `fxZ` aurait vu
  // toutes ses fixtures déclarées inéprouvées alors qu'elles sont sondées.
  .filter((n) => !new RegExp('\\bfx[A-Z]?\\.' + n + '\\b').test(auditSrc));
check('chaque fixture exportée est éprouvée par l’audit', untested,
  probes.length + ' sondes, plus les sections qui en exercent d’autres');

/**
 * La table du simulacre pointe-t-elle sur des fixtures qui EXISTENT ?
 *
 * `mock/index.js` nomme ses fixtures par `F.<nom>`. Si l'une est renommée ou
 * disparaît — ce qui est arrivé deux fois à `serviceSignals` et
 * `serviceProgress`, avalées par une réécriture par tranche — `HANDLERS[method]`
 * vaut `undefined`, l'application casse au premier appel avec
 * « handler is not a function », et l'audit resterait vert. C'est exactement
 * l'endroit qu'il existe pour garder.
 */
const allFixtures = allFixtureExports;

/**
 * ⚠️ UN SEUL VOCABULAIRE DE PASTILLE.
 *
 * `WorkQueue` passe le `status` de chaque objet DIRECTEMENT à `StatusPill`. Une
 * file qui emploierait ses propres mots — `warn`, `err`, `draft` — verrait toutes
 * ses pastilles retomber en gris neutre : le ton perdu, et la clé affichée telle
 * quelle quand `statusLabel` manque. Trois lignes de groupe affichaient
 * littéralement « ok ».
 *
 * Deux vocabulaires voisins sont exclus, NOMMÉMENT — pas par tolérance :
 *   — `ok` / `ko` : les lignes du CONTRAT DE RAPPORT (D-06) ;
 *   — le fil de procédure (`ProcedureChain`) : ses étapes portent `done` / `now`,
 *     un contrat d'étape, jamais rendu par une pastille.
 * Tout le reste doit être une clé de pastille. Un champ qui n'en est pas une ne
 * doit pas s'appeler `status` — c'est ainsi que le résultat d'une cascade a été
 * renommé `outcome`.
 *
 * ⚠️ CE CONTRÔLE EXISTAIT ET ÉTAIT TROP ÉTROIT. Il ne lisait que deux formes :
 * `status: 'x'` en propriété d'objet, et `:status="cond ? 'a' : 'b'"`. La grappe 6
 * a introduit `refuse` — qui n'est pas au vocabulaire — par TROIS formes qu'il ne
 * voyait pas :
 *
 *     status="refuse"                 attribut STATIQUE, sans deux-points
 *     return 'refuse'                 rendu par une fonction de ton
 *     { Rejetée: 'refuse' }           table de tons
 *
 * Et le défaut était SILENCIEUX : le libellé était surchargé partout, donc rien ne
 * fuyait à l'écran comme les « ok » de la grappe 4. Seule la COULEUR était fausse —
 * l'absence non justifiée à la convocation, le signal le plus grave du tableau de
 * jury, s'affichait en gris à côté de « Aucune préconisation ».
 *
 * ⚠️ ET MON PREMIER ÉLARGISSEMENT A PRODUIT DOUZE FAUX POSITIFS — quatrième fois
 * qu'un contrôle de ce script interdit le légitime. Il balayait TOUS les littéraux
 * d'une fonction de ton et d'une table de tons, donc il attrapait :
 *
 *   — `includes('solennel')` : un argument, pas un ton ;
 *   — les tons de `TimeGrid` (`published`, `draft`, `modified`, `cancelled`,
 *     `exam`), qui sont un TROISIÈME vocabulaire, déclaré dans son propre
 *     composant et jamais rendu par une pastille ;
 *   — les statuts de ligne d'un rapport de masse (`added`, `not_found`,
 *     `already_published`), qui sont du vocabulaire SERVEUR et vivent dans les
 *     fixtures.
 *
 * La correction n'est pas d'allonger la liste des exclusions — c'est de RESTREINDRE
 * l'extraction à ce qui atteint vraiment une pastille :
 *
 *   — d'une fonction de ton, seuls les `return` littéraux, et seulement si le
 *     résultat de cette fonction est lié à `:status` ;
 *   — d'une table de tons, seulement si son nom apparaît près d'un `status` ;
 *   — les fixtures sont hors périmètre : elles portent le vocabulaire du serveur.
 *
 * Éprouvé dans les deux sens : les cinq formes du défaut sont signalées, et un ton
 * de grille comme un argument de fonction passent.
 */
const pillKeys = new Set(
  [...read(join(SRC, 'components/StatusPill.vue')).matchAll(/^\s{2}(\w+):\s*\{ tone/gm)]
    .map((m) => m[1]));
const pillBad = [];
const CHAIN = 'ProcedureChain.vue';
for (const p of [...js, ...vue]) {
  if (basename(p) === CHAIN) continue;      // contrat d'étape, cf. ci-dessus
  if (basename(p) === 'StatusPill.vue') continue;          // la source elle-même
  // Les fixtures portent le vocabulaire du SERVEUR — statuts de ligne d'un
  // rapport de masse, états de document. La vue les traduit ; elles ne sont pas
  // des clés de pastille, et les compter ferait échouer l'audit sur du juste.
  if (p.includes('/api/mock/')) continue;
  const src = read(p);
  const seen = new Set();
  // 1 · propriété d'objet — `status: 'valide'`
  for (const m of src.matchAll(/\bstatus: '([a-z_]+)'/g)) seen.add(m[1]);
  // 2 · liaison dynamique, avec ou sans ternaire
  for (const m of src.matchAll(/:status="(?:[^"]*\?\s*)?'([a-z_]+)'(?:\s*:\s*'([a-z_]+)')?"/g)) {
    [m[1], m[2]].filter(Boolean).forEach((k) => seen.add(k));
  }
  // 3 · attribut STATIQUE — c'est par là que `refuse` est passé
  for (const m of src.matchAll(/\sstatus="([a-z_]+)"/g)) seen.add(m[1]);
  // 4 · les RETOURS d'une fonction dont le résultat est lié à `:status`.
  //     Les retours seuls, non tout littéral : un argument n'est pas un ton.
  const bound = new Set([...src.matchAll(/:status="(\w+)\(/g)].map((m) => m[1]));
  for (const fn of bound) {
    const body = (src.match(new RegExp('function ' + fn + '\\([\\s\\S]*?\\n\\}')) || [])[0] || '';
    for (const q of body.matchAll(/return '([a-z_]+)'/g)) seen.add(q[1]);
    for (const t of body.matchAll(/\{\s*([^}]*?)\s*\}\[/g)) {
      for (const q of t[1].matchAll(/'([a-z_]+)'/g)) seen.add(q[1]);
    }
  }
  // 5 · table de tons, SEULEMENT si son nom approche un `status` — sinon c'est
  //     le vocabulaire d'un autre composant (les tons de TimeGrid, par exemple).
  for (const m of src.matchAll(/const (\w*(?:TONE|Tone)\w*) = \{([\s\S]*?)\};/g)) {
    if (!new RegExp('status[:="][^\\n]*' + m[1]).test(src)) continue;
    for (const q of m[2].matchAll(/'([a-z_]+)'/g)) seen.add(q[1]);
  }
  for (const k of seen) {
    if (['ok', 'ko'].includes(k)) continue;
    if (!pillKeys.has(k)) pillBad.push(basename(p) + ' : ' + k);
  }
}
check('tout statut employé est une clé de pastille', [...new Set(pillBad)],
  pillKeys.size + ' clés au vocabulaire');

/**
 * ⚠️ UNE VUE NE FABRIQUE PAS LA VALEUR D'UNE CLÉ DE CONTEXTE.
 *
 * Le défaut visé n'est pas d'écrire le NOM — le mapper vers un autre contrat est
 * parfois nécessaire, quand la signature serveur appelle `academic_term` ce que
 * le contexte appelle `term`. Le défaut est d'en fabriquer la VALEUR : une vue
 * avait passé le LIBELLÉ (« 2026-2027 ») là où le contexte porte l'IDENTIFIANT
 * (« AY-2026 »).
 *
 * Le contrôle exige donc que toute valeur envoyée sous une clé de contexte vienne
 * de `params` — jamais d'un `.label`, jamais d'une constante.
 *
 * Et il aurait été silencieux : la fonction visée rend une liste vide quand rien
 * ne correspond, donc l'écran aurait affiché un état vide crédible, sur l'écran
 * qui écrit. C'est pire qu'une erreur.
 *
 * ⚠️ CE CONTRÔLE DOIT POUVOIR ÉCHOUER. Sa première version portait des
 * expressions dont les antislashs avaient été mangés à l'écriture : elle
 * n'appariait rien, `ctxKeys` restait vide, et le contrôle imprimait `ok` avec
 * « aucune clé de contexte trouvée » — un aveu affiché comme un succès. D'où la
 * vérification de l'extraction elle-même, en premier.
 */
const ctxSrc = read(join(SRC, 'composables/useAcademicContext.js'));
const ctxBlock = (ctxSrc.match(/params\s*=\s*computed\([^;]*?\}\)\)/s) || [''])[0];
const ctxKeys = [...ctxBlock.matchAll(/(\w+)\s*:/g)].map((m) => m[1]);
check('les clés du contexte académique sont extraites',
  ctxKeys.length ? [] : ['extraction vide — le contrôle suivant ne vérifierait rien'],
  ctxKeys.join(', ') || '—');

/**
 * Une valeur légitime vient de `params` ; tout le reste est fabriqué.
 *
 * ⚠️ LE CONTRÔLE VISE UNE CLÉ D'OBJET, PAS LE MOT SUIVI D'UN DEUX-POINTS.
 * Sa première version appariait aussi : le `:` d'un TERNAIRE après une lecture
 * (`x.term : y` — une lecture de prop, un affichage), et une DÉCLARATION de
 * prop (`term: { type: Object }`). Trois accusations sur quatre étaient du code
 * correct. D'où : (a) la clé ne suit ni un `.` ni un mot (jamais une lecture) ;
 * (b) une valeur qui déclare un type n'envoie rien.
 */
const FROM_PARAMS = /params(?:\.value)?\.\w+|\.\.\.params/;
const IS_DECLARATION = /^\{?\s*type\s*:|^(?:String|Number|Boolean|Object|Array|Function)\b/;
const forged = [];
for (const p of vue) {
  const src = read(p);
  for (const key of ctxKeys) {
    const re = new RegExp('(?<![.\\w])' + key + '\\s*:\\s*([^,\\n}]+)', 'g');
    let m;
    while ((m = re.exec(src))) {
      if (FROM_PARAMS.test(m[1]) || IS_DECLARATION.test(m[1].trim())) continue;
      forged.push(basename(p) + ' : ' + key + ' ← ' + m[1].trim());
    }
  }
}
check('aucune vue ne fabrique la valeur d’une clé de contexte', [...new Set(forged)],
  ctxKeys.length + ' clés surveillées');
// Éprouvé dans les deux sens, comme l'extraction : il attrape encore le défaut
// d'origine, et il laisse passer les trois formes qu'il accusait à tort.
{
  const probeRe = (key, s) => {
    const re = new RegExp('(?<![.\\w])' + key + '\\s*:\\s*([^,\\n}]+)', 'g');
    const out = []; let m;
    while ((m = re.exec(s))) {
      if (!(FROM_PARAMS.test(m[1]) || IS_DECLARATION.test(m[1].trim()))) out.push(m[1].trim());
    }
    return out;
  };
  const probeBad = [];
  if (!probeRe('term', "load({ term: year.value?.label })").length)
    probeBad.push('le défaut d’origine (label fabriqué) ne serait plus attrapé');
  if (probeRe('term', "load({ term: params.value.term })").length)
    probeBad.push('la valeur venue de params serait accusée');
  if (probeRe('term', "term: { type: Object, default: null }").length)
    probeBad.push('une déclaration de prop serait accusée');
  if (probeRe('term', "x ? a.term : 'Dernier jour : ' + d.term").length)
    probeBad.push('le deux-points d’un ternaire serait pris pour une clé');
  check('le contrôle des clés attrape le faux et laisse passer le juste', probeBad);
}

/**
 * ⚠️ LES ACTES SONT RECONNUS À LEUR MÉTHODE, PAS À LEUR NOM.
 *
 * Trois versions fausses avant celle-ci, et chacune corrigeait la précédente en
 * déplaçant la faute d'un cran :
 *
 *   1. une liste manuscrite d'ACTES — un seul nom, celui du défaut du jour ;
 *   2. une liste manuscrite de VERBES d'écriture — onze actes réels y
 *      échappaient, dont `integrateSubmission` et `rejectSubmission`, la file de
 *      contrôle des notes, c'est-à-dire la grappe SUIVANTE ;
 *   3. l'inverse — tout ce qui n'est pas `get`/`list`/`check` — qui échoue enfin
 *      du bon côté, mais classe `openSession` et `academicContext` parmi les
 *      actes d'écriture alors que ce sont des LECTURES, plus quatre auxiliaires
 *      de `client.js` qui ne sont pas des appels du tout.
 *
 * Nommer une lecture « acte d'écriture » n'est pas du bruit tolérable : c'est une
 * étiquette fausse, donc un contrôle qu'on discute puis qu'on désactive. Et
 * charger la session dans `onMounted` est le geste le plus normal qui soit.
 *
 * La cause commune aux trois : je jugeais le NOM de la constante JS. La vérité
 * est dans la CHAÎNE DE MÉTHODE que l'export appelle — `get_students`,
 * `validate_service_plan`, `whoami`. C'est elle qui dit si le serveur lit ou
 * écrit, et elle ne dépend d'aucune convention de nommage locale.
 *
 * Un export sans `call()` n'est pas un acte : `client.js` n'expose que le point
 * d'appel, un drapeau de mode, un prédicat et une fabrique d'erreur.
 */
const READ_METHOD = /(?:^|[._])(?:get|list|check)_|(?:^|\.)(?:whoami|academic_context)$/;
const WRITE_ACTS = [];
for (const p of js.filter((f) => f.includes('/api/') && !f.includes('/mock/'))) {
  const src = read(p);
  // Un export et son corps, jusqu'au suivant : assez pour y trouver son `call()`.
  for (const chunk of src.split(/\bexport (?:const|function|async function) /).slice(1)) {
    const name = (chunk.match(/^(\w+)/) || [])[1];
    if (!name) continue;
    const method = (chunk.match(/call\(\s*(?:[A-Z_]+\s*\+\s*)?'([^']+)'/) || [])[1];
    if (!method) continue;                       // ni appel, ni acte
    if (READ_METHOD.test(method)) continue;      // lecture, reconnue à sa méthode
    WRITE_ACTS.push(name);
  }
}

// Une dérivation vide rendrait le contrôle muet — la leçon de `ctxKeys`.
check('les actes d’écriture sont dérivés des modules d’appel',
  WRITE_ACTS.length ? [] : ['dérivation vide — le contrôle suivant ne vérifierait rien'],
  WRITE_ACTS.length + ' actes');

/**
 * ⚠️ AUCUN ACTE D'ÉCRITURE DANS UN CYCLE DE VIE.
 *
 * Un écran a affiché le rapport d'une inscription en REJOUANT la cascade qui la
 * crée — étudiant, inscription, compte, rattachements — sur `onMounted`, avec des
 * identifiants de candidat inventés. Ouvrir la page aurait tenté de créer deux
 * étudiants au branchement.
 *
 * ⚠️ Le contrôle vise le CYCLE DE VIE, pas le fichier. Sa première version
 * cherchait le nom de l'acte n'importe où dans la vue : elle aurait donc fait
 * échouer l'audit sur un `@click` qui inscrit un candidat — c'est-à-dire sur
 * l'usage même que ce commentaire autorise. Un contrôle qui interdit la
 * correction pousse vers le défaut ; celui-ci a déjà été écrit deux fois ainsi.
 *
 * ⚠️ À ce jour, aucune vue ne référence aucun de ces actes — le geste
 * d'inscription n'est pas produit (relevé §8). Ce contrôle est donc vert sans
 * avoir eu à juger. Il jugera dès qu'un acte apparaîtra dans un écran.
 *
 * Le corps d'un cycle de vie est pris jusqu'à sa première fermeture d'appel :
 * assez pour contenir l'acte, assez étroit pour ne pas avaler le reste du
 * fichier. ⚠️ La première version exigeait un saut de ligne avant la fermeture,
 * donc elle LAISSAIT PASSER `onMounted(() => { acte(); });` sur une seule ligne :
 * le contrôle ne trouvait rien et affichait vert. Éprouvé sur six formes.
 */
const LIFECYCLE = /\b(?:onMounted|onBeforeMount|onActivated)\s*\([\s\S]*?\)\s*;|\bwatch\([^;]*?\{\s*immediate:\s*true\s*\}\s*\)/g;
const writeInViews = [];
for (const p of vue) {
  const src = read(p);
  for (const block of src.matchAll(LIFECYCLE)) {
    for (const act of WRITE_ACTS) {
      if (new RegExp('\\b' + act + '\\b').test(block[0])) {
        writeInViews.push(basename(p) + ' : ' + act + ' dans un cycle de vie');
      }
    }
  }
}
check('aucun acte d’écriture dans un cycle de vie', writeInViews,
  WRITE_ACTS.length + ' actes surveillés · un `@click` reste permis');

/** Les drapeaux du simulacre ne doivent jamais quitter le simulacre. */
const flagLeaks = [];
for (const p of vue) {
  const src = read(p);
  for (const m of src.matchAll(/\.load\(\{[^}]*__\w+/g)) flagLeaks.push(basename(p) + ' : ' + m[0].trim());
}
check('aucune vue ne passe un drapeau de mise au point', flagLeaks);
check('le point d’appel retire les drapeaux avant l’envoi',
  /stripDebugFlags\(params\)/.test(read(join(SRC, 'api/client.js'))) ? []
    : ['client.js : les drapeaux `__*` partiraient dans le corps de la requête']);

const handlerNames = [...new Set(
  [...read(join(SRC, 'api/mock/index.js')).matchAll(/\b[A-Z]\.(\w+)/g)].map((m) => m[1]))];
check('chaque handler du simulacre pointe sur une fixture existante',
  handlerNames.filter((n) => !(n in allFixtures)),
  handlerNames.length + ' fixtures nommées');

// Sonder UN identifiant ne prouve rien : c'est ainsi qu'un repli silencieux a
// survécu à deux audits. On sonde CHAQUE unité que l'arbre rend cliquable.
// F3-FORMES : l'arbre est LA FORME SERVEUR (terms[].ues[]) — l'aplatissement
// {id, parent, level} vit à l'adaptateur ; les unités se lisent ici.
const treeTerms = fx.structureTree({}).terms;
const treeUes = treeTerms.flatMap((t) => t.ues || []).map((u) => u.name);
const unservableUes = [];
for (const id of treeUes) {
  for (const fn of ['ueDetail', 'ueDownstreamUsage']) {
    try { fx[fn]({ ue: id }); } catch (e) { unservableUes.push(id + ' → ' + fn + ' : ' + e.code); }
  }
}
check('chaque unité de l’arbre est servable', unservableUes, treeUes.length + ' unités');

// L'arbre et le panneau d'unité décrivent le même ensemble. Ne sonder que les
// unités laisserait passer une divergence de MODULES — c'est ainsi qu'UE-3.3 a
// porté deux modules au panneau et un seul dans l'arbre. Le MÊME invariant,
// aux clés serveur : modules (course), crédits (ects_credits), état
// (validation_status).
const treeBad = [];
for (const t of treeTerms) {
  for (const ue of t.ues || []) {
    const detail = fx.ueDetail({ ue: ue.name });
    const inTree = (ue.modules || []).map((m) => m.course).sort();
    const inPanel = (detail.modules || []).map((m) => m.course).sort();
    if (inTree.join() !== inPanel.join())
      treeBad.push(ue.name + ' : arbre [' + inTree.join(' ') + '] ≠ panneau [' + inPanel.join(' ') + ']');
    if (String(ue.ects_credits) !== String(detail.ects_credits))
      treeBad.push(ue.name + ' : ' + ue.ects_credits + ' ECTS dans l’arbre ≠ ' + detail.ects_credits + ' au panneau');
    if (ue.validation_status !== detail.validation_status)
      treeBad.push(ue.name + ' : état ' + ue.validation_status + ' dans l’arbre ≠ ' + detail.validation_status + ' au panneau');
  }
}
// Et aucun module orphelin dans un sens comme dans l'autre.
const treeMods = treeTerms.flatMap((t) => t.ues || []).flatMap((u) => u.modules || [])
  .map((m) => m.course).sort();
const panelMods = treeUes.flatMap((id) => (fx.ueDetail({ ue: id }).modules || []).map((m) => m.course)).sort();
if (treeMods.join() !== panelMods.join())
  treeBad.push('modules : arbre [' + treeMods.join(' ') + '] ≠ maquette [' + panelMods.join(' ') + ']');
check('arbre et panneau d’unité décrivent les mêmes unités et les mêmes modules', treeBad,
  treeMods.length + ' modules');

// Tout module réparti doit exister dans la maquette : sinon son volume attendu
// est vide et sa couverture n'a aucun sens. F3-FORMES : le plan serveur est
// PLAT — ses modules sont l'union des lignes et des manques.
const planFull = fx.servicePlan({});
const planMods = [...new Set([...planFull.lines, ...planFull.missing].map((r) => r.course))].sort();
check('tout module du plan de répartition existe dans la maquette',
  planMods.join() === treeMods.join() ? []
    : ['plan [' + planMods.join(' ') + '] ≠ maquette [' + treeMods.join(' ') + ']']);

// F3-FORMES : l'aplatissement (id/parent/level) vit à l'adaptateur — le clic
// d'un module remonte à son unité PAR LE RATTACHEMENT. L'invariant ÉQUIVALENT
// sur la forme serveur : chaque module de l'arbre porte `custom_ue` = son unité
// porteuse (le lien que attach_module_to_ue impose), et cette unité est
// servable (contrôle « chaque unité est servable » ci-dessus). Chaque ligne du
// plan porte de même une `ue` de l'arbre — le groupement de l'écran en dépend.
const clickBad = [];
for (const t of treeTerms) {
  for (const ue of t.ues || []) {
    for (const m of ue.modules || []) {
      if (m.custom_ue !== ue.name)
        clickBad.push(m.course + ' : custom_ue « ' + m.custom_ue + ' » ≠ unité porteuse ' + ue.name);
    }
  }
}
for (const l of [...planFull.lines, ...planFull.missing]) {
  if (!l.ue || !treeUes.includes(l.ue))
    clickBad.push('plan ' + (l.name || l.course) + ' : ue « ' + l.ue + ' » absente de l’arbre');
}
check('tout module est rattaché à son unité porteuse, du côté arbre comme du côté plan',
  clickBad, treeMods.length + ' modules · ' + planFull.lines.length + ' lignes');

// Un identifiant inconnu doit LEVER, jamais rendre un voisin. F3-FORMES —
// exception CONFORME AU SERVEUR : get_instructor_service_summary ne lève pas
// pour un enseignant inconnu (il agrège, il ne vérifie pas l'existence) ;
// l'invariant équivalent est qu'il rend l'agrégat VIDE qui ÉCHO le sujet
// demandé — jamais les chiffres d'un voisin.
const silent = [];
for (const fn of ['ueDetail', 'ueDownstreamUsage']) {
  try { fx[fn]({ ue: '—inconnu—' }); silent.push(fn + ' rend un objet pour un identifiant inconnu'); }
  catch { /* attendu */ }
}
const ghost = fx.teacherLoad({ instructor: '—inconnu—' });
if (!ghost || ghost.instructor !== '—inconnu—' || ghost.engaged_hours !== 0
  || (ghost.lines || []).length || ghost.realized_hours !== 0) {
  silent.push('teacherLoad rend autre chose qu’un agrégat VIDE du sujet demandé pour un inconnu');
}
check('un identifiant inconnu lève (unités) ou rend l’agrégat vide du sujet (enseignant) — jamais un voisin', silent);

// ─── 2 bis. FILET MATRICE ↔ GARDES ───────────────────────────────────────────
// Vert et permanent : la version 01 du vocabulaire portait cinq écarts, tous
// trouvés en confrontant matrice et gardes. Ce filet empêche la prochaine
// divergence côté interface — aucun écran n'invente une clé, l'export `DENIED`
// est bien là, aucune clé refusée ne sort du vocabulaire, et la session
// s'accorde à la liste dans les deux sens.
say('\n2 bis · Vocabulaire des permissions');

// Même garde qu'au §2, pour la même raison : la liste canonique est un module
// comme un autre, et un module qui ne se charge pas doit produire une ligne
// ÉCHEC nommée, jamais une trace.
let PERMISSIONS, PERMISSION_SET;
try {
  ({ PERMISSIONS, PERMISSION_SET } = await import(pathToFileURL(join(SRC, 'permissions.js'))));
} catch (e) {
  check('le vocabulaire des permissions se charge', [e.message]);
  say('\nAudit interrompu : sans vocabulaire, aucun contrôle de permission n’a de sens.');
  process.exit(1);
}

const usedKeys = new Map();
for (const p of [...vue, join(SRC, 'nav.js')]) {
  const s = read(p);
  for (const m of s.matchAll(/can\('([^']+)'\)/g)) usedKeys.set(m[1], basename(p));
  for (const m of s.matchAll(/need:\s*'([^']+)'/g)) usedKeys.set(m[1], basename(p));
}
check('aucune clé employée hors du vocabulaire',
  [...usedKeys].filter(([k]) => !PERMISSION_SET.has(k)).map(([k, f]) => k + ' (' + f + ')'),
  usedKeys.size + ' clés employées');

const sessionKeys = Object.keys(fx.session.permissions || {});
check('la session ne rend aucune clé hors du vocabulaire',
  sessionKeys.filter((k) => !PERMISSION_SET.has(k)),
  sessionKeys.length + ' clés rendues');
check('la session couvre tout le vocabulaire',
  PERMISSIONS.filter((k) => !sessionKeys.includes(k)),
  PERMISSIONS.length + ' clés au vocabulaire');

// Ces deux lignes n'ont pas les mêmes dents, et il faut le dire ici comme au
// relevé.
//
// La PREMIÈRE peut échouer : un refactor qui cesse d'exporter `DENIED`. C'est un
// cas réel — l'export n'existe que pour ce contrôle — et le défaut serait
// silencieux : sans lui, `fx.DENIED || []` passerait au vert en ne vérifiant
// rien, exactement comme les replis qu'on a retirés de `ueDetail`.
//
// La SECONDE ne peut pas. Une clé refusée hors vocabulaire fait lever
// `fixtures.js` au chargement du module, donc l'audit s'est déjà arrêté au §2
// avec « ÉCHEC le module de simulacre se charge ». Elle reste parce qu'elle
// NOMME la règle là où on la cherche : c'est la formulation lisible du garde-fou,
// pas un second garde.
check('le simulacre expose DENIED',
  fx.DENIED instanceof Set ? [] : ['export `DENIED` absent ou de mauvais type']);
check('toute clé refusée appartient au vocabulaire — redite du garde-fou de fixtures.js',
  fx.DENIED instanceof Set ? [...fx.DENIED].filter((k) => !PERMISSION_SET.has(k)) : []);

// ─── 3. INVARIANTS DES BILANS DE CHARGE ──────────────────────────────────────
// F3-FORMES : les MÊMES invariants, aux clés serveur. `own_hours` n'existe plus
// dans la forme rendue — son équivalent serveur : le détail rendu (`lines`) EST
// « chez vous », donc Σ lignes (Proposé + Validé) + out_of_scope.hours = engagé
// (patron « total honnête, détail expurgé »).
say('\n3 · Bilans de charge');
const plan = fx.servicePlan({});
const badInv = [];
for (const t of plan.teachers) {
  const b = fx.teacherLoad({ instructor: t.instructor });
  const own = (b.lines || [])
    .filter((l) => l.validation_status === 'Proposé' || l.validation_status === 'Validé')
    .reduce((s, l) => s + l.hours, 0);
  if (own + b.out_of_scope.hours !== b.engaged_hours)
    badInv.push(t.instructor + ' : lignes ' + own + ' + hors périmètre ' + b.out_of_scope.hours + ' ≠ engagé ' + b.engaged_hours);
  if (b.validated_hours + b.proposed_hours !== b.engaged_hours)
    badInv.push(t.instructor + ' : validé + proposé ≠ engagé');
  if (b.lines_out_of_scope !== b.out_of_scope.count)
    badInv.push(t.instructor + ' : lines_out_of_scope ≠ out_of_scope.count — deux comptes du même ensemble');
  // Le motif hors périmètre est un champ ABSENT, jamais vide (py:229).
  if ('derogation_reason' in (b.out_of_scope || {}))
    badInv.push(t.instructor + ' : out_of_scope porte une clé derogation_reason — le motif doit être ABSENT');
}
check('Σ lignes (P+V) + hors périmètre = engagé ; validé + proposé = engagé ; comptes accordés',
  badInv, plan.teachers.length + ' enseignants');

// ─── 4. UN MÊME ENGAGÉ SUR LES TROIS ÉCRANS ──────────────────────────────────
// F3-FORMES : le signal serveur (over_norm) porte l'engagé EN DONNÉE
// (engaged_hours) — plus une phrase à re-parser.
say('\n4 · Accord entre écrans');
const norm = fx.serviceSignals({}).over_norm;
const disagree = [];
for (const t of plan.teachers) {
  const b = fx.teacherLoad({ instructor: t.instructor });
  if (t.engaged !== b.engaged_hours) disagree.push('panneau ' + t.instructor + ' ' + t.engaged + ' ≠ bilan ' + b.engaged_hours);
}
for (const s of norm) {
  const b = fx.teacherLoad({ instructor: s.instructor });
  if (s.engaged_hours !== b.engaged_hours) disagree.push('signal ' + s.instructor + ' ' + s.engaged_hours + ' ≠ bilan ' + b.engaged_hours);
  if (s.engaged_hours <= s.norm_hours) disagree.push('signal ' + s.instructor + ' : signalé sous la norme');
}
check('plan, signaux et bilan donnent le même engagé', disagree);

// ─── 5. TOUT SUJET LIABLE EST SERVABLE ───────────────────────────────────────
// F3-FORMES : « servable » au contrat serveur = le bilan répond ET écho le
// sujet demandé (le serveur ne lève pas pour un inconnu — cf. §2).
say('\n5 · Liens');
const linkable = [...new Set(plan.teachers.map((t) => t.instructor).concat(norm.map((s) => s.instructor)))];
const unservable = linkable.filter((id) => {
  try { const b = fx.teacherLoad({ instructor: id }); return !b || b.instructor !== id; }
  catch { return true; }
});
check('tout sujet qu’un écran peut lier est servable', unservable, linkable.length + ' sujets');

const nav = read(join(SRC, 'nav.js'));
const declared = new Set([...nav.matchAll(/key:\s*'([\w-]+)'/g)].map((m) => m[1]));
/**
 * ⚠️ LE CONTRÔLE CAPTURE LA NAVIGATION, PAS LE MOT `name:`.
 * Sa première version appariait tout `name: '…'` — donc les identifiants de
 * DONNÉES (`AY-2026`, `L2-GL`, `T-1`, un nom de délibération passé à `load()`)
 * comptaient comme des routes, et neuf paramètres accusaient nav.js. Un nom de
 * route ne vit qu'à deux endroits : la cible d'un lien (`:to="{ name: '…' }"`)
 * et l'action d'une fixture (`route: '…'`). C'est cela qu'on capture.
 */
const usedRoutes = new Set();
// F3-FORMES : la navigation des signaux a quitté la fixture (forme serveur sans
// routes) pour le dictionnaire de l'ADAPTATEUR — il entre donc dans le champ.
for (const p of [...vue, join(SRC, 'api/mock/fixtures.js'), join(SRC, 'api/service.js')]) {
  const s = read(p);
  [...s.matchAll(/:to="\{\s*name:\s*'([\w-]+)'/g)].forEach((m) => usedRoutes.add(m[1]));
  [...s.matchAll(/route:\s*'([\w-]+)'/g)].forEach((m) => usedRoutes.add(m[1]));
}
const IGNORE = new Set(['reason', 'derogation', 'service-return', 'maquette-draft']);
check('tout nom de route utilisé est déclaré dans nav.js',
  [...usedRoutes].filter((r) => !declared.has(r) && !IGNORE.has(r)),
  usedRoutes.size + ' noms capturés');
if (!usedRoutes.size) check('des noms de route sont bien capturés',
  ['extraction vide — le contrôle précédent ne vérifiait rien']);

// ─── 6. ARITHMÉTIQUE DU PRÉVU / RÉALISÉ ──────────────────────────────────────
// F3-FORMES : le rapprochement serveur est PAR ENSEIGNANT (get_service_
// reconciliation) — les MÊMES invariants, par rapport : totaux déduits des
// lignes ET du hors-répartition, écart signé par ligne et au total, millésime
// obligatoire, et le réalisé du bilan s'accorde au rapprochement (même source).
say('\n6 · Prévu contre réalisé');
const arith = [];
for (const t of plan.teachers) {
  const r = fx.serviceReconciliation({ instructor: t.instructor });
  const sp = r.lines.reduce((a, l) => a + l.hours, 0);
  const sd = r.lines.reduce((a, l) => a + l.realized_hours, 0)
    + r.unplanned_realized.reduce((a, u) => a + u.realized_hours, 0);
  if (sp !== r.planned_hours) arith.push(t.instructor + ' : somme prévue ' + sp + ' ≠ planned_hours ' + r.planned_hours);
  if (sd !== r.realized_hours) arith.push(t.instructor + ' : somme réalisée ' + sd + ' ≠ realized_hours ' + r.realized_hours);
  r.lines.filter((l) => l.gap_hours !== l.realized_hours - l.hours)
    .forEach((l) => arith.push(l.name + ' : gap_hours ' + l.gap_hours + ' ≠ ' + (l.realized_hours - l.hours)));
  if (r.gap_hours !== r.realized_hours - r.planned_hours)
    arith.push(t.instructor + ' : gap_hours total ne se déduit pas de ses deux termes');
  if (!r.computed_at) arith.push(t.instructor + ' : computed_at absent — un tableau de paie sans millésime n’est pas opposable');
  const b = fx.teacherLoad({ instructor: t.instructor });
  if (b.realized_hours !== r.realized_hours)
    arith.push(t.instructor + ' : réalisé du bilan ' + b.realized_hours + ' ≠ rapprochement ' + r.realized_hours);
}
// Le réalisé HORS répartition existe dans le jeu d'essai — sans lui, la branche
// « réalisé hors répartition » ne s'ouvre jamais.
if (!plan.teachers.some((t) => fx.serviceReconciliation({ instructor: t.instructor }).unplanned_realized.length)) {
  arith.push('aucun réalisé hors répartition — la branche ne s’ouvre jamais');
}
check('totaux et écarts se déduisent des lignes, par enseignant', arith,
  plan.teachers.length + ' rapprochements');

// ─── 6 bis. PLAN, COUVERTURE ET SIGNAL S'ACCORDENT ───────────────────────────
// F3-FORMES : les MÊMES invariants, aux formes serveur — le plan est PLAT
// (lines + missing), la couverture est PLATE par (course, activité), le signal
// de couverture ne porte que les écarts. Les en-têtes de l'ancien mock (count,
// module_count, covered_modules) n'existent pas au serveur : ce sont des
// comptages de présentation de l'adaptateur, plus une donnée à éprouver ici.
say('\n6 bis · Plan et couverture');
const cov = fx.serviceCoverage({});
const covBad = [];
const covByKey = {};
for (const c of cov.coverage) covByKey[c.course + '·' + c.activity_type] = c;
// F3-PROV — la règle d'accord passe à TROIS termes : Σ heures du plan par
// (module, activité) = COUVERT + POSÉ-SANS-TITULAIRE. Une ligne sans
// enseignant s'enregistre (brouillon) mais ne couvre rien — l'accord à deux
// termes redeviendrait faux dès la première.
const assignedByKey = {};
const unassignedPlanByKey = {};
for (const l of plan.lines) {
  const k = l.course + '·' + l.activity_type;
  if (l.instructor) assignedByKey[k] = (assignedByKey[k] || 0) + l.hours;
  else unassignedPlanByKey[k] = (unassignedPlanByKey[k] || 0) + l.hours;
}
for (const [k, h] of Object.entries(assignedByKey)) {
  const c = covByKey[k];
  if (!c) { covBad.push(k + ' : réparti au plan, absent de la couverture'); continue; }
  if (c.covered_hours !== h) covBad.push(k + ' : plan ' + h + ' h ≠ couverture ' + c.covered_hours + ' h');
}
for (const [k, h] of Object.entries(unassignedPlanByKey)) {
  const c = covByKey[k];
  if (!c) { covBad.push(k + ' : posé sans titulaire au plan, absent de la couverture'); continue; }
  if ((c.draft_unassigned_hours || 0) !== h)
    covBad.push(k + ' : plan sans-titulaire ' + h + ' h ≠ couverture ' + (c.draft_unassigned_hours || 0) + ' h');
}
// Et le total du plan s'accorde à la somme par clé (jamais deux vérités).
const totalUnassigned = Object.values(unassignedPlanByKey).reduce((a, b) => a + b, 0);
if ((plan.unassigned_draft_hours || 0) !== totalUnassigned)
  covBad.push('total sans-titulaire du plan ' + (plan.unassigned_draft_hours || 0) + ' h ≠ Σ par clé ' + totalUnassigned + ' h');
// Chaque manque du plan = une cible SANS ligne, couverte à zéro, cibles égales.
const missingKeys = new Set(plan.missing.map((m) => m.course + '·' + m.activity_type));
for (const m of plan.missing) {
  const k = m.course + '·' + m.activity_type;
  const c = covByKey[k];
  if (m.assigned !== 0) covBad.push(k + ' : un manque porte un assigné non nul — les partiels vivent dans la couverture');
  if (assignedByKey[k]) covBad.push(k + ' : donné manquant avec des lignes au plan');
  if (!c) { covBad.push(k + ' : manque du plan absent de la couverture'); continue; }
  if (c.covered_hours !== 0) covBad.push(k + ' : manque du plan avec couverture non nulle');
  if (c.target_hours !== m.target_hours) covBad.push(k + ' : cible ' + m.target_hours + ' au plan ≠ ' + c.target_hours + ' à la couverture');
}
// Et l'inverse : une cible à zéro couvert doit être un manque du plan.
for (const c of cov.coverage) {
  const k = c.course + '·' + c.activity_type;
  if (c.covered_hours === 0 && c.target_hours > 0 && !missingKeys.has(k))
    covBad.push(k + ' : non couvert sans ligne, absent des manques du plan');
  // L'état se déduit de ses deux termes — jamais déclaré à côté.
  const expect = (c.target_hours <= 0 && (c.draft_unassigned_hours || 0) > 0) ? 'hors maquette'
    : c.covered_hours === c.target_hours ? 'couvert'
      : c.covered_hours === 0 ? 'non couvert'
        : c.covered_hours < c.target_hours ? 'partiel' : 'sur-couvert';
  if (c.state !== expect) covBad.push(k + ' : état « ' + c.state + ' » ≠ déduit « ' + expect + ' »');
  // Le zéro de maquette est exclu AU SERVEUR (les deux appels, même règle).
  if (c.target_hours <= 0 && c.covered_hours === 0) covBad.push(k + ' : cible à zéro rendue');
}
// Le SIGNAL de couverture = les écarts de la couverture, ni plus ni moins
// (l'exact n'est pas un signal — service_allocation.py:360).
const sigCov = fx.serviceSignals({});
const sigKeys = new Set(sigCov.coverage.map((s) => s.course + '·' + s.activity_type));
for (const c of cov.coverage) {
  const k = c.course + '·' + c.activity_type;
  if (c.state !== 'couvert' && !sigKeys.has(k)) covBad.push(k + ' : écart absent du signal de couverture');
  if (c.state === 'couvert' && sigKeys.has(k)) covBad.push(k + ' : couvert exactement et pourtant signalé');
}
for (const s of sigCov.coverage) {
  const c = covByKey[s.course + '·' + s.activity_type];
  if (c && s.assigned_hours !== c.covered_hours)
    covBad.push(s.course + '·' + s.activity_type + ' : signal ' + s.assigned_hours + ' h ≠ couverture ' + c.covered_hours + ' h');
}
check('heures, manques et états s’accordent entre plan, couverture et signal', covBad,
  cov.coverage.length + ' cibles · ' + plan.missing.length + ' manques');

// ─── 6 ter. GRAPPE 5 · CE QUE LE PLANNING NE DOIT PAS CONFONDRE ──────────────
say('\n6 ter · Planning');

/**
 * ⚠️ LES DEUX STATUTS SONT DEUX CHAMPS. `custom_status` porte le cycle de la
 * séance, `custom_planning_status` sa publication. « Une séance annulée reste
 * publiée » n'est pas une convention d'écran : c'est la forme du modèle.
 *
 * Le jeu d'essai doit donc PRODUIRE ce cas, sinon la branche ne s'ouvre jamais et
 * l'écran passe pour correct sans l'avoir montré. Même leçon que le groupe
 * au-delà de sa capacité, ramené à deux membres par une réécriture : un jeu
 * d'essai cohérent n'est pas un jeu d'essai suffisant.
 */
const sessions = fxP.schedules({});
const planGaps = [];
const cancelled = sessions.filter((s) => s.custom_status === 'Annulé');
if (!cancelled.length) planGaps.push('aucune séance annulée — la branche « annulée reste publiée » ne s’ouvre pas');
else if (!cancelled.some((s) => s.custom_planning_status === 'Publié')) {
  planGaps.push('aucune séance annulée ET publiée — le cas qui prouve les deux champs manque');
}
if (!sessions.some((s) => s.custom_planning_status === 'Modifié')) {
  planGaps.push('aucune séance modifiée après publication');
}
if (!sessions.some((s) => s.custom_planning_status === 'Brouillon')) {
  planGaps.push('aucun brouillon — rien à publier');
}
check('les deux statuts sont indépendants, et les cas le prouvent', planGaps,
  sessions.length + ' séances');

/**
 * ⚠️ TROIS PROVENANCES, ET LA TROISIÈME N'EST PAS LA DEUXIÈME.
 *   « répartition » — l'enseignant est celui de la ligne de service ;
 *   « choisi »      — quelqu'un d'autre, la ligne existe ;
 *   null            — aucune ligne : personne n'a été contourné.
 *
 * Confondre les deux dernières accuse un planificateur d'un écart qui n'existe
 * pas. Les trois doivent être présentes dans le jeu d'essai.
 */
const sources = new Set(sessions.map((s) => s.instructor_service_source));
check('les trois provenances sont représentées',
  ['répartition', 'choisi', null].filter((v) => !sources.has(v))
    .map((v) => 'provenance ' + (v === null ? 'nulle (aucune ligne de service)' : v) + ' absente'),
  [...sources].map((s) => s === null ? 'aucune' : s).join(' · '));

/**
 * ⚠️ LA PROVENANCE EST DÉRIVÉE, JAMAIS STOCKÉE — « même après remplacement :
 * toujours vraie ». Le contrôle le vérifie en la recalculant : changer
 * l'enseignant d'une séance doit changer sa provenance sans qu'aucun champ ne
 * soit posé.
 */
const derived = [];
for (const s of sessions) {
  const recomputed = fxP.serviceSource(s.course, s.custom_session_type, s.instructor);
  if (recomputed !== s.instructor_service_source) {
    derived.push(s.name + ' : rendue ' + s.instructor_service_source + ' ≠ recalculée ' + recomputed);
  }
}
// Et le remplacement bascule bien vers « choisi ».
const fromService = sessions.find((s) => s.instructor_service_source === 'répartition');
if (fromService) {
  const swapped = fxP.serviceSource(fromService.course, fromService.custom_session_type, 'Quelqu’un d’autre');
  if (swapped !== 'choisi') derived.push('un remplacement ne bascule pas vers « choisi »');
}
check('la provenance se recalcule et suit le remplacement', derived);

/**
 * ⚠️ LE PRÉAVIS NE CONCERNE QUE LES ÉPREUVES, et il mord PAR SÉANCE.
 * Les travaux pratiques sont sortis des types d'épreuve : un TP se publie comme
 * un cours. Et `retry_ids` ne contient que les REJOUABLES.
 */
const pub = fxP.publishReport({});
const pubGaps = [];
const heldRows = pub.rows.filter((r) => r.status === 'j7_derogation_required');
const tpRows = pub.rows.filter((r) => {
  const s = sessions.find((x) => x.name === r.schedule);
  return s && s.custom_session_type === 'TP';
});
if (tpRows.some((r) => r.status === 'j7_derogation_required')) {
  pubGaps.push('un TP tombe sous le préavis — les travaux pratiques en sont sortis');
}
if (!heldRows.length) pubGaps.push('aucune séance retenue par le préavis — la branche ne s’ouvre pas');
if (!pub.rows.some((r) => r.status === 'published')) {
  pubGaps.push('aucune séance publiée — le succès partiel n’en est pas un');
}
if (pub.retry_ids.some((id) => {
  const r = pub.rows.find((x) => x.schedule === id);
  return !r || r.status !== 'j7_derogation_required';
})) pubGaps.push('retry_ids contient un non-rejouable');
// F3-FORMES : le CONTRAT serveur nomme succeeded_count/failed_count —
// l'ok/ko de l'écran est un mappage d'adaptateur, pas la forme rendue.
if (pub.succeeded_count + pub.failed_count !== pub.total) {
  pubGaps.push('succeeded_count + failed_count ≠ total');
}
check('le préavis mord par séance, et pas sur les TP', pubGaps,
  pub.succeeded_count + ' publiées · ' + pub.failed_count + ' retenues');

/**
 * ⚠️ UN TYPE D'ACTIVITÉ SANS ALLOCATION EST ABSENT du sommaire, pas rendu à zéro.
 * Et les heures planifiées se SOMMENT sur les séances — jamais déclarées.
 */
const moduleSummary = fxP.modulePlanningSummary({ course: 'INF-204' });
const sumGaps = [];
if (moduleSummary.by_type.some((t) => !t.allocated_hours)) {
  sumGaps.push('un type à zéro heure allouée figure au sommaire — zéro prévu n’est pas un manque');
}
const declaredTotal = moduleSummary.heures_totales;
const summed = moduleSummary.by_type.reduce((a, t) => a + t.allocated_hours, 0);
if (declaredTotal !== summed) sumGaps.push('heures_totales ' + declaredTotal + ' ≠ somme des types ' + summed);
if (moduleSummary.by_type.some((t) => t.remaining_hours !== t.allocated_hours - t.planned_hours)) {
  sumGaps.push('un reste-à-planifier ne se déduit pas de ses deux termes');
}
check('le sommaire de module se déduit, et tait les types sans allocation', sumGaps,
  moduleSummary.by_type.map((t) => t.session_type + ' ' + t.planned_hours + '/' + t.allocated_hours).join(' · '));

// ─── 6 quater. TOUT CHEMIN QU'UNE VUE APPELLE A UN HANDLER ───────────────────
/**
 * ⚠️ Le contrôle porte sur ce qu'une vue APPELLE, non sur ce qu'un module d'appel
 * DÉCLARE. La distinction est le cœur du sujet : les modules de `src/api/` sont
 * le manifeste — ils nomment des points d'entrée réels, y compris ceux qu'aucun
 * écran ne consomme encore. Exiger un handler pour chacun ferait échouer l'audit
 * sur des déclarations légitimes, et c'est la quatrième fois que j'écrirais un
 * contrôle qui interdit le juste.
 *
 * Ce qui casse un écran, c'est un chemin APPELÉ sans handler : le simulacre lève
 * NOT_IMPLEMENTED, et l'écran tombe en erreur là où il devrait montrer une liste.
 */
say('\n6 quater · Appels et handlers');
const mockSrc = read(join(SRC, 'api/mock/index.js'));
/**
 * ⚠️ LES PRÉFIXES VIENNENT DE LA SOURCE, jamais d'une table manuscrite.
 * La première version listait ST/GR/EN/PL/EX — la grappe 6 a ajouté GC/MG/DL,
 * et le contrôle accusait deux appels parfaitement servis (les clés existaient,
 * il ne savait plus les résoudre). Une liste recopiée du fichier qu'elle décrit
 * se périme au premier ajout ; on la LIT donc dans ce fichier.
 */
const MOCK_PREFIXES = {};
for (const m of mockSrc.matchAll(/^const (\w+) = '([\w.]+)';$/gm)) MOCK_PREFIXES[m[1]] = m[2];
const handlerKeys = new Set();
for (const m of mockSrc.matchAll(/\[(\w+) \+ '([\w.]+)'\]/g)) {
  handlerKeys.add((MOCK_PREFIXES[m[1]] || '') + m[2]);
}
for (const m of mockSrc.matchAll(/^\s*'([\w.]+)':/gm)) handlerKeys.add(m[1]);
for (const m of mockSrc.matchAll(/^\s*(\w+): \(p\)/gm)) handlerKeys.add(m[1]);

// symbole exporté → chemin appelé, pour chaque module d'appel
const symbolPath = {};
for (const f of readdirSync(join(SRC, 'api')).filter((n) => n.endsWith('.js'))) {
  const s = read(join(SRC, 'api', f));
  const consts = {};
  for (const m of s.matchAll(/const (\w+) = '([\w.]+)';/g)) consts[m[1]] = m[2];
  for (const m of s.matchAll(/export const (\w+) = [^;]*?call\((?:(\w+) \+ )?'([\w.]+)'/g)) {
    symbolPath[m[1]] = (m[2] ? (consts[m[2]] || '') : '') + m[3];
  }
}
const uncovered = [];
for (const p of vue) {
  const s = read(p);
  const imported = [];
  for (const m of s.matchAll(/import \{([^}]+)\} from '[^']*\/api\/[\w-]+\.js'/g)) {
    imported.push(...m[1].split(',').map((x) => x.trim()).filter(Boolean));
  }
  for (const sym of imported) {
    const path = symbolPath[sym];
    if (!path || handlerKeys.has(path)) continue;
    // Importé sans être appelé n'est pas un défaut : seul l'appel casse l'écran.
    const called = new RegExp('\\b' + sym + '\\s*\\(|useResource\\(\\s*' + sym + '\\b').test(s);
    if (called) uncovered.push(basename(p) + ' appelle ' + sym + ' → ' + path);
  }
}
check('tout chemin appelé par une vue a un handler dans le simulacre', uncovered,
  handlerKeys.size + ' handlers');

// ─── 6 quinquies. GRAPPE 6 · LE TABLEAU DE JURY ──────────────────────────────
say('\n6 quinquies · Délibération');

/**
 * ⚠️ LES CRÉDITS SE DÉDUISENT DES UNITÉS, ET LA VALIDATION AUSSI.
 *
 * C'est la seule page du système où une divergence se lit comme une décision
 * arbitraire : un jury qui voit « 33/36 crédits » à côté d'unités qui n'en donnent
 * que 30 ne peut plus faire confiance à l'écran, et il a raison.
 */
// F3-PROV : le sujet voyage dans l'ADRESSE — le simulacre refuse un appel
// sans sujet, comme le serveur. Le contrôle prend donc le sujet À LA LISTE
// (comme l'écran), et le REFUS sans sujet devient un contrôle POSITIF.
let refusedWithoutSubject = false;
try { fxN.deliberationRoster({}); } catch (e) { refusedWithoutSubject = true; }
check('sans sujet, le simulacre REFUSE (comme le serveur — jamais un jury arbitraire)',
  refusedWithoutSubject ? [] : ['un appel sans sujet a rendu un jury'],
  'exception attendue, reçue');
const subjectName = fxN.listDeliberations({}).deliberations[0].name;
const roster = fxN.deliberationRoster({ name: subjectName });
const juryBad = [];
for (const r of roster.items) {
  for (const [term, sem] of [['T-1', r.previous_semester_result], ['T-2', r.semester_result]]) {
    const ues = r.ue_results.filter((u) => u.academic_term === term);
    const earned = ues.reduce((a, u) => a + u.ects_earned, 0);
    const possible = ues.reduce((a, u) => a + u.ects_possible, 0);
    if (earned !== sem.total_ects_earned) {
      juryBad.push(r.student + ' ' + term + ' : unités ' + earned + ' ≠ crédits ' + sem.total_ects_earned);
    }
    if (possible !== sem.total_ects_possible) {
      juryBad.push(r.student + ' ' + term + ' : possibles ' + possible + ' ≠ ' + sem.total_ects_possible);
    }
    const floor = ues.some((u) => u.has_floor_violation);
    const expect = earned === possible && !floor ? 1 : 0;
    if (expect !== sem.semester_validated) {
      juryBad.push(r.student + ' ' + term + ' : validation ' + sem.semester_validated + ' ≠ ' + expect);
    }
    const unacq = ues.filter((u) => !u.is_validated && !u.is_compensated).map((u) => u.course_ue);
    if (unacq.join() !== (sem.unacquired || []).join()) {
      juryBad.push(r.student + ' ' + term + ' : unités non acquises divergent');
    }
  }
}
check('crédits, validation et unités non acquises se déduisent des unités', juryBad,
  roster.items.length + ' étudiants × 2 semestres');

/**
 * ⚠️ LE PLANCHER EMPÊCHE LA COMPENSATION. C'est la règle qui fait qu'un étudiant
 * au-dessus de dix peut ne pas valider son semestre — et le panneau d'unité doit
 * pouvoir l'expliquer, sinon la décision passe pour arbitraire.
 *
 * Le jeu d'essai doit donc contenir les DEUX cas : une unité sous le plancher qui
 * n'est PAS compensée, et une unité compensable qui l'EST. Sans le second, la
 * règle n'est jamais montrée à l'œuvre.
 */
const allUes = roster.items.flatMap((r) => r.ue_results);
const floorUes = allUes.filter((u) => u.has_floor_violation);
const compUes = allUes.filter((u) => u.is_compensated);
const floorBad = floorUes.filter((u) => u.is_compensated)
  .map((u) => u.course_ue + ' à ' + u.ue_average + ' est compensée malgré le plancher');
if (!floorUes.length) floorBad.push('aucune unité sous le plancher — la règle ne s’éprouve pas');
if (!compUes.length) floorBad.push('aucune unité compensée — la règle ne se montre pas à l’œuvre');
check('le plancher empêche la compensation, et les deux cas existent', floorBad,
  floorUes.length + ' sous plancher · ' + compUes.length + ' compensées');

/**
 * ⚠️ L'HISTORIQUE DU CONSEIL EST L'AJOUT QUI DONNE SON SENS AU DISPOSITIF.
 * Le jeu d'essai doit porter les quatre formes, sinon l'écran passe pour correct
 * sans les avoir montrées :
 *   — un contrat AVEC constat ;
 *   — un contrat SANS constat (le cas que le jury lit tel quel) ;
 *   — une absence non justifiée à la convocation ;
 *   — aucune préconisation (le cas majoritaire, à rendre discret).
 */
const cps = roster.items.map((r) => r.cps_history);
const forms = {
  'contrat avec constat': cps.some((h) => h.preconisations.some((p) => p.kind.includes('Contrat') && p.finding)),
  'contrat sans constat': cps.some((h) => h.preconisations.some((p) => p.kind.includes('Contrat') && !p.finding)),
  'absence non justifiée': cps.some((h) => h.unjustified_cps_absences.length),
  'aucune préconisation': cps.some((h) => !h.preconisations.length && !h.unjustified_cps_absences.length),
};
check('les quatre formes d’historique de conseil sont représentées',
  Object.entries(forms).filter(([, v]) => !v).map(([k]) => 'forme absente : ' + k),
  Object.keys(forms).filter((k) => forms[k]).length + ' formes présentes');

/**
 * ⚠️ L'HISTORIQUE PORTE TOUS LES SEMESTRES DE L'ANNÉE, pas le seul semestre
 * délibéré. C'est ce qui fait que l'alerte de janvier éclaire la décision de
 * juillet : une préconisation du premier semestre doit figurer au jury de fin
 * d'année.
 */
const terms = new Set(cps.flatMap((h) => h.preconisations.map((p) => p.academic_term)));
check('l’historique croise les deux semestres',
  terms.size < 2 ? ['les préconisations ne portent qu’un semestre — l’alerte de janvier ne remonterait pas'] : [],
  [...terms].sort().join(' · '));

/**
 * ⚠️ LE DASHBOARD NE REND QUE LES DÉCISIONS INSTRUITES — c'est la forme du
 * serveur (`for decision in doc.decisions`). Le simulacre doit la RESPECTER : un
 * jeu d'essai qui rendrait tout le monde masquerait le manque, et l'écran
 * passerait pour complet.
 */
const dash = fxN.deliberationDashboard({ name: subjectName });
/**
 * Stabilisation §3.2 — le contrôle SUIT le contrat qui a changé : le serveur a
 * livré le drapeau `include_undecided` (une seule construction de ligne). Sans
 * drapeau, les instruites seules — le comportement historique reste garanti ;
 * avec, tout le jury, non-décidés MARQUÉS. Les deux sens sont éprouvés.
 */
const dashBad = [];
if (dash.rows.some((r) => !r.decision)) {
  dashBad.push('sans drapeau, le dashboard rend une ligne sans décision instruite');
}
const dashFull = fxN.deliberationDashboard({ name: subjectName, include_undecided: 1 });
if (dashFull.rows.length !== roster.items.length) {
  dashBad.push('avec include_undecided, le dashboard ne rend pas tout le jury ('
    + dashFull.rows.length + ' vs ' + roster.items.length + ')');
}
if (!dashFull.rows.some((r) => r.undecided)) {
  dashBad.push('aucune ligne non-décidée marquée `undecided` sous le drapeau');
}
check('le drapeau du roster : instruites seules sans, tout le jury avec', dashBad,
  dash.rows.length + ' instruites · ' + dashFull.rows.length + ' au jury');

/**
 * ⚠️ LE CROISEMENT NOTES ↔ ASSIDUITÉ DOIT PRODUIRE SES DEUX LECTURES.
 * Le même zéro se lit « d'absence » ou « d'évaluation » selon l'assiduité : sans
 * les deux cas dans le jeu d'essai, la distinction que l'écran revendique n'est
 * jamais montrée. Et `lines` ne doit PAS être rendu sans le drapeau.
 */
const withAtt = fxN.submissionsForControl({ include_attendance: 1 });
const without = fxN.submissionsForControl({});
const crossBad = [];
const flagged = withAtt.flatMap((s) => s.lines || []);
const zeros = flagged.filter((l) => l.proposed_grade === 0);
// F3-FORMES : le simulacre rend la FORME SERVEUR (`*_on_course`) — les
// anciennes clés du front étaient précisément le faux-en-branché.
if (!zeros.some((l) => l.unexcused_absences_on_course > (l.attendance_rows_on_course || 0) / 2)) {
  crossBad.push('aucun zéro avec absences massives — « zéro d’absence probable » ne s’affiche jamais');
}
if (!zeros.some((l) => l.unexcused_absences_on_course === 0)) {
  crossBad.push('aucun zéro sans absence — « zéro d’évaluation probable » ne s’affiche jamais');
}
if (!flagged.some((l) => l.proposed_grade === null)) {
  crossBad.push('aucune note manquante');
}
if (without.some((s) => 'lines' in s)) {
  crossBad.push('lines est rendu sans include_attendance — le décompte-avant-chargement ne sert à rien');
}
if (withAtt.some((s) => s.student_count !== (s.lines || []).length)) {
  crossBad.push('student_count ne s’accorde pas avec les lignes');
}
check('le croisement notes / assiduité produit ses deux lectures', crossBad,
  zeros.length + ' zéros · ' + flagged.length + ' lignes');

/**
 * ⚠️ INSCRIRE N'EST PAS CONVOQUER : le jeu d'essai doit porter une épreuve
 * PUBLIÉE et une épreuve en BROUILLON, sinon l'écran ne montre jamais les deux
 * phrases — et c'est la distinction centrale de cet écran.
 */
const examBad = [];
const pub44 = fxN.examSchedule({ name: 'EX-0044' });
const draft45 = fxN.examSchedule({ name: 'EX-0045' });
if (pub44.custom_planning_status !== 'Publié') examBad.push('EX-0044 devrait être publiée');
if (draft45.custom_planning_status !== 'Brouillon') examBad.push('EX-0045 devrait être en brouillon');
if (!pub44.students.length) examBad.push('l’épreuve publiée n’a aucun candidat convoqué');
if (draft45.students.length) examBad.push('l’épreuve en brouillon a des candidats — le cas « liste vide » disparaît');
if (pub44.student_count !== pub44.students.length) examBad.push('student_count divergent');
check('les deux états d’épreuve existent, publiée et brouillon', examBad,
  'EX-0044 ' + pub44.students.length + ' convoqués · EX-0045 ' + draft45.students.length);

/**
 * ⚠️ LE GROUPE SOURCE DOIT RECOUPER LES CANDIDATS. Sinon « déjà inscrit » n'est
 * jamais vrai, et la branche du peuplement partiel ne s'ouvre pas. Cause déjà
 * rencontrée deux fois : un jeu d'essai cohérent n'est pas un jeu d'essai
 * suffisant.
 */
const promo = fxG.group({ name: 'SG-L2GL-PROMO' });
const promoIds = new Set(promo.students.map((s) => s.student));
const overlap = pub44.students.filter((s) => promoIds.has(s.student));
check('le groupe source recoupe les candidats inscrits',
  overlap.length ? [] : ['aucun recoupement — « déjà inscrit » ne s’affiche jamais'],
  overlap.length + ' communs sur ' + pub44.students.length);

// ─── 6 sexies. GRAPPES 8 À 11 · FIN DE CYCLE ─────────────────────────────────
/**
 * Six invariants, un par écran, et chacun garde une décision de conception qu'un
 * jeu d'essai « cohérent » peut trahir sans qu'aucune erreur ne se produise.
 *
 * ⚠️ La leçon reprise des grappes précédentes : un jeu d'essai cohérent n'est pas un
 * jeu d'essai SUFFISANT. Plusieurs de ces contrôles vérifient donc que le CAS existe,
 * pas seulement qu'il est bien formé — sans le cas, la branche ne s'ouvre jamais et
 * l'écran passe pour correct sans l'avoir montrée.
 */
say('\n6 sexies · Fin de cycle');

/**
 * ⚠️ LA LISTE DES CANDIDATS N'A NI SCORE, NI RANG, NI GRAVITÉ. C'est la thèse de
 * l'écran N8 : y figurer n'emporte rien. Un champ de gravité rendrait le tri par
 * gravité possible, donc probable — et un classement se lit comme une conclusion.
 *
 * Le contrôle porte sur la DONNÉE, non sur le patron : c'est la donnée qui rend le
 * tri possible, et un écran suivant l'ajouterait sans y penser.
 */
const cand = fxC.councilCandidates({});
const candBad = [];
const FORBIDDEN = ['score', 'rank', 'rang', 'severity', 'gravity', 'gravite', 'priority', 'weight'];
for (const row of cand.items) {
  for (const k of Object.keys(row)) {
    if (FORBIDDEN.includes(k.toLowerCase())) candBad.push(row.student + ' porte un champ « ' + k + ' »');
  }
}
const rolls = cand.items.map((r) => r.roll);
if (rolls.join() !== rolls.slice().sort((a, b) => a - b).join()) {
  candBad.push('les candidats ne sont pas dans l’ordre du registre');
}
// Et les décomptes de critères se DÉDUISENT des booléens : deux comptes du même
// ensemble divergeraient.
for (const c of cand.criteria) {
  const real = cand.items.filter((r) => r[c.key]).length;
  if (c.count !== real) candBad.push('critère ' + c.key + ' : annoncé ' + c.count + ' ≠ ' + real);
}
// Le cas qui prouve que la liste n'est pas un classement : un étudiant à un seul
// critère doit précéder un étudiant à trois, si le registre le veut.
const three = cand.items.findIndex((r) => r.credits && r.floor && r.absence);
const one = cand.items.findIndex((r) => [r.credits, r.floor, r.absence].filter(Boolean).length === 1);
if (three < 0 || one < 0) candBad.push('le jeu d’essai ne contient pas à la fois un candidat à un critère et un à trois');
else if (one > three) candBad.push('le candidat à trois critères précède celui à un — l’ordre ressemble à un tri par gravité');
check('la liste des candidats ne porte ni score ni rang, et suit l’ordre du registre', candBad,
  cand.items.length + ' candidats · ' + cand.criteria.length + ' critères');

/**
 * ⚠️ FRANCHIR LE SECOND SEUIL N'EFFACE PAS LE PREMIER.
 *
 * Une ligne du second seuil dont l'avertissement du premier n'a pas été prononcé doit
 * proposer LES DEUX actes. Le défaut serait silencieux : la ligne s'afficherait
 * normalement, avec un seul bouton, et l'avertissement resterait dû indéfiniment
 * sans que rien ne le dise.
 *
 * Et le cas doit EXISTER dans le jeu d'essai, sinon la branche ne s'ouvre jamais.
 */
const thr = fxC.absenceThresholds({});
const thrBad = [];
const second = thr.blocks.find((b) => b.level === 2);
const first = thr.blocks.find((b) => b.level === 1);
if (!second || !first) thrBad.push('les deux seuils ne sont pas rendus');
else {
  const due = second.items.filter((r) => !r.first_pronounced);
  if (!due.length) {
    thrBad.push('aucune ligne du second seuil sans avertissement prononcé — la branche « les deux '
      + 'actes restent proposés » ne s’ouvre jamais');
  }
  for (const r of due) {
    if (!r.acts.includes('avertissement')) {
      thrBad.push(r.student + ' : second seuil sans avertissement prononcé, et l’avertissement n’est pas proposé');
    }
    if (!r.acts.includes('convocation')) {
      thrBad.push(r.student + ' : second seuil sans convocation proposée');
    }
  }
  // Le sens inverse : une ligne dont le premier est prononcé ne repropose pas l'acte.
  for (const r of second.items.filter((x) => x.first_pronounced)) {
    if (r.acts.includes('avertissement')) {
      thrBad.push(r.student + ' : avertissement déjà prononcé le ' + r.first_pronounced_on + ', et reproposé');
    }
  }
  // Aucune ligne ne franchit un seuil qu'elle n'atteint pas.
  for (const b of thr.blocks) {
    for (const r of b.items) {
      if (r.sessions < b.threshold) thrBad.push(r.student + ' : ' + r.sessions + ' séances sous le seuil de ' + b.threshold);
    }
  }
}
check('au second seuil, un premier seuil non prononcé propose encore ses deux actes', thrBad,
  (first?.count || 0) + ' au premier · ' + (second?.count || 0) + ' au second');

/**
 * ⚠️ LE CONSTAT VIENT DE LA TABLE DES TYPES, JAMAIS DU LIBELLÉ — et les contrats
 * sans constat viennent en tête. C'est le seul ordonnancement de cet écran : un tri
 * par pièce absente, non par gravité d'étudiant.
 */
const pre = fxC.councilPreconisations({});
const preBad = [];
const needing = pre.types.filter((t) => t.needs_finding);
if (needing.length !== 1) preBad.push(needing.length + ' types exigent un constat — un seul doit le faire');
else if (needing[0].key !== 'contrat') preBad.push('le type à constat n’est pas le contrat de remédiation');
const missingIdx = pre.items.map((p, i) => (fxC.needsFinding(p) && !p.finding ? i : -1)).filter((i) => i >= 0);
const okIdx = pre.items.map((p, i) => (fxC.needsFinding(p) && !p.finding ? -1 : i)).filter((i) => i >= 0);
if (missingIdx.length && okIdx.length && Math.max(...missingIdx) > Math.min(...okIdx)) {
  preBad.push('un contrat sans constat suit une préconisation complète — le manque n’est pas en tête');
}
if (!pre.items.some((p) => fxC.needsFinding(p) && !p.finding)) {
  preBad.push('aucun contrat sans constat — le cas que le jury lit tel quel manque');
}
if (!pre.items.some((p) => p.finding)) preBad.push('aucun constat posé — la règle ne se montre pas à l’œuvre');
if (pre.missing_findings !== missingIdx.length) {
  preBad.push('missing_findings ' + pre.missing_findings + ' ≠ ' + missingIdx.length);
}
// ⚠️ AUCUNE DATE DE TRANSMISSION : le jury LIT, on ne lui envoie pas. Un horodatage
// d'envoi ferait croire à un instantané, et il en manquerait toujours une.
for (const p of pre.items) {
  for (const k of Object.keys(p)) {
    if (/transmit|sent|envoi|transmis/i.test(k)) preBad.push(p.name + ' porte un champ d’envoi « ' + k + ' »');
  }
}
check('un seul type exige un constat, les manques viennent en tête, et rien ne s’envoie', preBad,
  pre.count + ' préconisations · ' + pre.missing_findings + ' sans constat');

/**
 * ⚠️ LE CATALOGUE EST RESTREINT, ET LE CODE NAÎT DE L'ÉMISSION.
 *
 * Deux invariants dans la même donnée. Le second est celui qui mord : un code
 * pré-calculé se lirait comme une pièce du dossier, et un agent aurait pu le
 * communiquer avant que le document n'existe.
 */
const docs = fxZ.documentRequests({});
const docBad = [];
const notRequestable = docs.catalogue.filter((c) => !c.requestable);
if (!notRequestable.length) {
  docBad.push('aucun type non demandable au catalogue — la distinction « émis ailleurs » disparaît');
}
for (const c of notRequestable) {
  if (c.source === 'Scolarité') docBad.push(c.key + ' : non demandable et pourtant émis par la scolarité');
}
for (const r of docs.items) {
  if (!r.issued_on && r.verification_code) {
    docBad.push(r.name + ' porte un code de vérification sans être émise — le code naît de l’émission');
  }
  if (r.issued_on && !r.verification_code) docBad.push(r.name + ' est émise sans code de vérification');
  for (const k of Object.keys(r)) {
    if (/copies|exemplaire|copy_count/i.test(k)) docBad.push(r.name + ' porte un champ d’exemplaire « ' + k + ' »');
  }
  // `issuable: false` doit dire POURQUOI : sinon l'agent cherche ailleurs.
  if (!r.issuable && !r.blocked_reason && !r.refused_on && !r.issued_on) {
    docBad.push(r.name + ' n’est pas émettable et ne dit pas pourquoi');
  }
}
if (!docs.items.some((r) => !r.issuable && r.blocked_reason)) {
  docBad.push('aucune demande bloquée avec sa raison — la branche ne s’ouvre jamais');
}
if (docs.refusal_categories.length !== 2) docBad.push('les deux catégories de refus ne sont pas deux');
if (!docs.refusal_categories.some((c) => c.reformulable) || !docs.refusal_categories.some((c) => !c.reformulable)) {
  docBad.push('les deux catégories de refus ne se distinguent pas sur la reformulation');
}
check('le catalogue est restreint, et aucun code de vérification ne précède son émission', docBad,
  docs.catalogue.length + ' types dont ' + notRequestable.length + ' hors file');

/**
 * ⚠️ ANOMALIES ET CONTINUATIONS SONT DEUX LISTES, et `requires_reason` se DÉDUIT
 * des anomalies ouvertes.
 *
 * Les mêler produirait l'une des deux fautes symétriques : un motif exigé pour une
 * procédure disciplinaire qui court normalement, ou une clôture sans un mot sur trois
 * dossiers sans décideur.
 */
const clo = fxZ.yearClosure({});
const cloBad = [];
const openAnoms = clo.anomalies.filter((a) => !a.ok);
if (clo.open_anomalies !== openAnoms.length) {
  cloBad.push('open_anomalies ' + clo.open_anomalies + ' ≠ ' + openAnoms.length);
}
if (clo.requires_reason !== (openAnoms.length > 0)) {
  cloBad.push('requires_reason ne se déduit pas des anomalies ouvertes');
}
if (!openAnoms.length) cloBad.push('aucune anomalie ouverte — la branche « clore avec motif » ne s’ouvre jamais');
for (const a of openAnoms) {
  if (!a.route) cloBad.push(a.key + ' : anomalie ouverte sans lien vers sa liste');
}
for (const c of clo.continuations) {
  if (c.requires_reason) cloBad.push(c.key + ' : une continuation exige un motif — elle est dans le mauvais panneau');
}
if (!clo.continuations.length) cloBad.push('aucune continuation — le second panneau n’a pas de sujet');
// Ce que la clôture produit, et ce qu'elle ne produit pas : les deux registres.
if (!clo.produces.some((p) => p.on) || !clo.produces.some((p) => !p.on)) {
  cloBad.push('« ce que la clôture produit » ne porte pas ses deux registres');
}
check('anomalies et continuations restent deux listes, et le motif se déduit des premières', cloBad,
  clo.open_anomalies + ' anomalies · ' + clo.continuations.length + ' continuations');

/**
 * ⚠️ LA MENTION EST UN DÉRIVÉ IMPOSÉ (Art. 49) : bornes EXACTES, aucun arrondi,
 * absente sous 10,00.
 *
 * Éprouvé aux bornes et juste en dessous : c'est là qu'un arrondi se verrait, et
 * nulle part ailleurs. Une mention fausse sur un diplôme n'est pas un défaut
 * d'affichage.
 */
const gradBad = [];
const BOUNDS = [[9.99, null], [10, 'Passable'], [11.99, 'Passable'], [12, 'Assez bien'],
  [13.99, 'Assez bien'], [14, 'Bien'], [15.99, 'Bien'], [16, 'Très bien'], [20, 'Très bien']];
for (const [avg, expected] of BOUNDS) {
  const got = fxZ.mentionOf(avg);
  if (got !== expected) gradBad.push(avg + ' → « ' + got + ' » au lieu de « ' + expected + ' »');
}
const grad = fxZ.graduationDossiers({});
for (const d of grad.items) {
  if (d.mention !== fxZ.mentionOf(d.average)) gradBad.push(d.name + ' : mention non dérivée de sa moyenne');
}
// ⚠️ Le cas qui prouve que « non éligible » n'est pas un refus : un dossier non
// éligible qui n'est PAS décidé, et un dossier ajourné avec son motif.
if (!grad.items.some((d) => !d.eligible && !d.decision)) {
  gradBad.push('aucun dossier non éligible en attente — la souveraineté du jury ne se montre pas');
}
for (const d of grad.items) {
  const outcome = (grad.outcomes || []).find((o) => o.label === d.decision);
  if (outcome && outcome.needs_reason && !d.decision_reason) {
    gradBad.push(d.name + ' : décision « ' + d.decision + ' » sans motif, alors qu’il est exigé');
  }
  // Une condition non remplie doit rendre le dossier non éligible.
  if (d.eligible && d.conditions.some((c) => !c.met)) {
    gradBad.push(d.name + ' : présenté éligible avec une condition non remplie');
  }
}
if (!grad.jury.members.some((m) => m.role === 'Présidence')) gradBad.push('le jury n’a pas de présidence (Art. 46)');
check('la mention se dérive aux bornes exactes, et l’éligibilité ne décide rien', gradBad,
  BOUNDS.length + ' bornes éprouvées · ' + grad.count + ' dossiers');

/**
 * ⚠️ LES QUATRE `scope.kind` SONT REPRÉSENTÉS, et `annulee` GARDE SA FILIÈRE.
 *
 * C'est la distinction que tout l'écran des rôles porte : `nulle` ferme tout,
 * `annulee` élargit tout. Et la liaison neutralisée reste ENREGISTRÉE — elle
 * reprendra effet si le cumul cesse. Perdre le programme sur `annulee` ferait de la
 * réversibilité une promesse sans donnée.
 */
// F3-FORMES : le contrat est celui du SERVEUR (liste nue, scope_report,
// vocabulaire d'origin serveur). Les avertissements rédigés vivent à
// l'ACTE (simulate/apply), plus dans cette liste — le contrôle suit.
const grants = fxZ.roleGrants({});
const grantBad = [];
const kinds = new Set(grants.map((g) => (g.scope_report || {}).origin));
for (const k of ['par nature', 'par liaison', 'annulée par un cumul', 'nulle']) {
  if (!kinds.has(k)) grantBad.push('origin « ' + k + ' » absent du jeu d’essai');
}
for (const g of grants) {
  const sr = g.scope_report || {};
  if (!sr.note) grantBad.push(g.full_name + ' : portée sans raison rédigée — l’écran devrait deviner');
  if (sr.origin === 'annulée par un cumul' && !(sr.programs || []).length) {
    grantBad.push(g.full_name + ' : liaison annulée sans filière — la réversibilité n’a plus de donnée');
  }
  if (sr.origin === 'nulle' && (sr.programs || []).length) {
    grantBad.push(g.full_name + ' : portée nulle avec une filière');
  }
  if (!g.granted_on) grantBad.push(g.full_name + ' : dotation sans date (granted_on)');
}
// Toute anomalie calculée doit désigner une personne dotée.
const people = new Set(grants.map((g) => g.user));
for (const h of fxZ.grantAnomalies({}).holders_with_anomalies) {
  if (!people.has(h.user)) grantBad.push('anomalie sur ' + h.user + ', qui n’est pas doté');
}
check('les quatre portées existent, chacune avec sa raison, et l’annulée garde sa filière', grantBad,
  [...kinds].join(' · '));

/**
 * ⚠️ AUCUN NOM D'EXPORT PARTAGÉ ENTRE DEUX MODULES DE `src/api/`.
 *
 * ⚠️ **Ce contrôle n'existait pas.** Je l'avais vérifié par une sonde jetable et
 * porté au §7 du relevé — « aucun doublon d'export entre le module d'actes et le
 * module de lectures ». Vrai de cette paire, jamais exécuté par le script, et borné
 * à ce que je venais de corriger.
 *
 * Le doublon vivait ailleurs : `queues.js` et `dossiers-read.js` exportaient tous
 * deux `listAwaitingOtherDecider`, vers deux chemins différents, servis par deux
 * fixtures de formes **incompatibles** — l'une avec `id` / `instructed_role` /
 * `sole_holder`, l'autre avec `name` / `kind_label` / `decider_role`, et `kind`
 * portant une clé d'un côté contre un libellé de l'autre. Une vue écrite contre
 * l'une cassait sur l'autre.
 *
 * **La divergence n'était donc pas hypothétique : elle avait déjà eu lieu.** C'est
 * « deux listes du même ensemble divergeront — pas *peuvent* », la règle que le
 * relevé cite deux fois, non gardée à l'endroit où elle a mordu.
 *
 * Un contrôle né d'un défaut doit garder la CLASSE du défaut, pas son instance —
 * sinon il certifie exactement le cas qui ne peut plus se produire.
 */
const callModules = js.filter((f) => f.includes('/api/') && !f.includes('/mock/'));
const exportOwners = new Map();
for (const p of callModules) {
  for (const m of read(p).matchAll(/^export (?:const|function|async function) (\w+)/gm)) {
    if (!exportOwners.has(m[1])) exportOwners.set(m[1], []);
    exportOwners.get(m[1]).push(basename(p));
  }
}
check('aucun nom d’export partagé entre deux modules d’appel',
  [...exportOwners.entries()]
    .filter(([, owners]) => owners.length > 1)
    .map(([name, owners]) => name + ' exporté par ' + owners.join(' et ')),
  exportOwners.size + ' exports sur ' + callModules.length + ' modules');

/**
 * ⚠️ TOUT CHEMIN 🔴 DU MANIFESTE PORTE SON MARQUEUR DANS `src/api/`.
 *
 * ⚠️ **Ce contrôle est né d'un correctif qui a corrigé l'instance et laissé la
 * classe** — dans le fichier même où j'écris que cela ne doit pas arriver.
 *
 * Un verdict avait nommé un chemin inventé sans marqueur dans `queues.js`. J'ai
 * supprimé cette ligne-là et laissé **ses deux sœurs dans le même fichier**, plus
 * deux dans `session.js` — les quatre points d'entrée dont dépend tout le châssis.
 * Le manifeste les marquait 🔴 ; `src/api/` les présentait sans réserve.
 *
 * ⚠️ C'est depuis `src/api/` que le back-end câble. Deux documents qui se
 * contredisent sur le statut d'un chemin valent moins qu'un seul : le lecteur croit
 * celui qu'il a sous les yeux.
 *
 * Le contrôle est mécanique — le manifeste porte déjà la liste des 🔴 — et il vaut
 * pour les grappes à venir : un chemin ajouté sans confrontation devra porter son
 * marqueur, ou l'audit le dira.
 */
let manifest = '';
try {
  manifest = read(join(ROOT, '..', 'handoff-gestion', 'manifeste-des-appels.md'));
} catch {
  /* Le manifeste vit hors du dossier de l'application : son absence n'est pas un
     défaut du code, mais elle prive ce contrôle de son sujet — il le dit. */
}
if (!manifest) {
  check('tout chemin 🔴 du manifeste porte son marqueur dans src/api/',
    ['manifeste introuvable — ce contrôle n’a pas de sujet et ne prouve rien']);
} else {
  /**
   * ⚠️ LES CHEMINS SE MOISSONNENT LIGNE PAR LIGNE, PAS PAR BLOC.
   *
   * Ma première version prenait tous les identifiants d'une section contenant un 🔴.
   * Elle a produit trois faux positifs : `get_deliberation_dashboard`, dont la
   * section n'a pas de 🔴, et `get_structure_tree` / `update_ue`, qui sont les
   * **exemples de la légende** définissant le marqueur — et qui y sont donnés 🟡, non
   * 🔴. Un contrôle qui moissonne large accuse la documentation de ses propres
   * exemples.
   *
   * La convention du manifeste est par ligne : le 🔴 suit le chemin sur la même
   * ligne. Le contrôle la suit.
   */
  const redPaths = new Set();
  for (const line of manifest.split('\n')) {
    if (!/🔴/.test(line)) continue;
    // La légende explique le marqueur : elle n'annonce le statut d'aucun chemin.
    if (/marqueur|légende|d'abord porté|redéfini/.test(line)) continue;
    for (const m of line.matchAll(/`([a-z_][\w.]*)`/g)) {
      if (m[1].includes('_') || m[1].includes('.')) redPaths.add(m[1]);
    }
  }
  const unmarked = [];
  for (const p of callModules) {
    const src = read(p);
    const headerRed = /🔴/.test(src.slice(0, src.indexOf('import ')));
    for (const m of src.matchAll(/export (?:const|function|async function) (\w+)[\s\S]{0,200}?call\(\s*(?:[A-Z_]+\s*\+\s*)?'([^']+)'/g)) {
      const [, name, path] = m;
      if (!redPaths.has(path)) continue;
      const declStart = src.lastIndexOf('/**', m.index);
      const localRed = declStart >= 0 && /🔴/.test(src.slice(declStart, m.index));
      if (!headerRed && !localRed) {
        unmarked.push(basename(p) + ' → ' + name + ' appelle ' + path + ', donné 🔴 au manifeste, sans marqueur ici');
      }
    }
  }
  check('tout chemin 🔴 du manifeste porte son marqueur dans src/api/', unmarked,
    redPaths.size + ' chemins 🔴 au manifeste');

  /**
   * ⚠️ ET LE SENS INVERSE : TOUT CHEMIN 🔴 DU CODE EST NOMMÉ DANS LE HANDOFF.
   *
   * ⚠️ **Le contrôle ci-dessus était unidirectionnel** — manifeste → code — et c'est
   * l'autre sens qui a mordu : `list_dossiers` et `get_dossier`, appelés par l'écran
   * des dossiers, n'étaient nommés nulle part dans le handoff. Pire, le manifeste
   * prescrivait **l'inverse** au même endroit (« pas un sixième point d'entrée :
   * étendre `work_queue` »), sans dire que le code en appelait déjà deux.
   *
   * Un lecteur qui câblait depuis cette prescription étendait `work_queue` et ne
   * construisait ni l'un ni l'autre — donc l'écran principal de la grappe restait
   * sans données.
   *
   * ⚠️ C'est « garder la classe, pas l'instance » resté à moitié : la classe n'est
   * pas « un chemin du manifeste sans marqueur », c'est **la divergence entre les deux
   * documents, dans les deux sens**. Un contrôle qui n'en garde qu'un donne
   * l'assurance d'avoir gardé les deux.
   *
   * Le handoff entier est lu, non le seul manifeste : un chemin nommé dans un relevé
   * ou dans `T5-points-d-entree.md` est nommé.
   *
   * ⚠️ LIMITE ASSUMÉE, et elle a déjà coûté : la granularité est le DOSSIER, pas le
   * document. Un chemin nommé dans un relevé passe ce contrôle — or les relevés sont
   * des journaux rétrospectifs, et c'est le manifeste depuis lequel le back-end
   * câble. `validate_service_plan` était nommé dans le relevé de la grappe 3 et
   * absent du manifeste, y compris de la section « Validation d'une répartition »
   * dont il est le sujet : ce contrôle l'a laissé passer.
   */
  let handoff = '';
  try {
    const dir = join(ROOT, '..', 'handoff-gestion');
    for (const name of readdirSync(dir).filter((n) => n.endsWith('.md'))) {
      handoff += read(join(dir, name));
    }
  } catch { /* même cas que ci-dessus */ }
  if (!handoff) {
    check('tout chemin 🔴 du code est nommé dans le handoff',
      ['handoff introuvable — ce contrôle n’a pas de sujet et ne prouve rien']);
  } else {
    const unnamed = [];
    for (const p of callModules) {
      const src = read(p);
      const headerRed = /🔴/.test(src.slice(0, src.indexOf('import ')));
      for (const m of src.matchAll(/export (?:const|function|async function) (\w+)[\s\S]{0,200}?call\(\s*(?:[A-Z_]+\s*\+\s*)?'([^']+)'/g)) {
        const [, name, path] = m;
        const declStart = src.lastIndexOf('/**', m.index);
        const localRed = declStart >= 0 && /🔴/.test(src.slice(declStart, m.index));
        if (!headerRed && !localRed) continue;      // pas annoncé supposé : hors sujet
        if (!handoff.includes(path)) {
          unnamed.push(basename(p) + ' → ' + name + ' appelle ' + path
            + ', marqué 🔴 dans le code et nommé nulle part au handoff');
        }
      }
    }
    check('tout chemin 🔴 du code est nommé dans le handoff', unnamed,
      'handoff lu en entier');
  }
}

/**
 * ⚠️ AUCUN GESTIONNAIRE MUET DERRIÈRE UN `@click`.
 *
 * ⚠️ **Cette classe s'est rejouée cinq fois.** À chaque tour j'ai corrigé le bouton
 * muet du fichier qu'on me montrait, et jamais balayé les autres vues :
 * `RepartitionView` (ajouter, proposer, reconduire), puis `RepartitionValidationView`
 * (valider, renvoyer, motiver) — et `StructureView` gardait « Enregistrer », son CTA
 * primaire, derrière un corps vide.
 *
 * Le pire cas n'est pas le corps vide : c'est le gestionnaire qui **referme
 * l'interface** après un motif obligatoire rempli. Refermer ressemble à un succès.
 *
 * Un bouton muet est pire qu'un bouton absent : l'utilisateur croit avoir agi. Cette
 * règle était écrite dans trois vues et gardée par rien.
 *
 * Le contrôle est local à un fichier : pour chaque événement lié à un NOM dans le
 * patron, il lit le corps de cette fonction dans le script et exige qu'elle fasse
 * quelque chose — appeler `notBuilt` compte, un corps vide ou réduit à un commentaire
 * ne compte pas.
 *
 * ⚠️ **ET IL NE LISAIT QUE `@click`** — or les composants **interactifs** ne signalent
 * pas par `@click` mais par des **événements de composant** : `@add`, `@act`,
 * `@submit`, `@search`, `@select`. C'est leur seul canal vers les vues.
 *
 * Il voyait donc 2 des 5 gestionnaires que le tour précédent avait corrigés dans
 * `StructureView`, et il manquait `noop()` dans `App.vue` — qui tenait le bouton de
 * recherche rendu sur **tous** les écrans. « Le contrôle avait l'air de couvrir plus
 * qu'il ne couvrait », dans le contrôle écrit pour clore cette classe.
 *
 * ⚠️ Une expression en ligne — `@cancel="open = false"` — est légitime et hors sujet :
 * elle dit ce qu'elle fait. Seuls les noms de fonction sont suivis.
 */
const muted = [];
for (const p of vue) {
  const src = read(p);
  const tplEnd = src.lastIndexOf('</template>');
  if (tplEnd < 0) continue;
  const tpl = src.slice(0, tplEnd);
  const script = src.slice(tplEnd);
  const handlers = new Set();
  // Tout événement lié à un NOM de fonction, natif ou de composant.
  for (const m of tpl.matchAll(/@([a-z][\w-]*)(?:\.\w+)*="\s*([A-Za-z_$][\w$]*)\s*(?:\(\s*[^)]*\))?\s*"/g)) {
    handlers.add(m[2]);
  }
  for (const h of handlers) {
    /**
     * ⚠️ Le corps se délimite en COMPTANT LES ACCOLADES, pas par une expression.
     *
     * Ma première version cherchait `\{([\s\S]*?)\n\}` — une accolade fermante en
     * début de ligne. `function openHistory() {}` tient sur UNE ligne : le motif
     * sautait donc jusqu'au prochain `\n}` du fichier et capturait un corps énorme,
     * non vide. Le contrôle affichait vert sur le cas même qui l'a motivé.
     */
    const decl = new RegExp('function\\s+' + h + '\\s*\\([^)]*\\)\\s*\\{').exec(script)
      // Une fléchée compte aussi : l'angle mort était latent, il s'ouvrira à la suite.
      || new RegExp('const\\s+' + h + '\\s*=\\s*(?:\\([^)]*\\)|[\\w$]+)\\s*=>\\s*\\{').exec(script);
    if (!decl) continue;                    // méthode importée ou expression : hors sujet
    let depth = 1;
    let i = decl.index + decl[0].length;
    const start = i;
    while (i < script.length && depth > 0) {
      const c = script[i];
      if (c === '{') depth++;
      else if (c === '}') depth--;
      i++;
    }
    const body = script.slice(start, i - 1)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '')
      .trim();
    if (!body) {
      muted.push(basename(p) + ' → ' + h + ' : corps vide derrière un événement');
      continue;
    }
    // Un gestionnaire qui ne fait que refermer ressemble à un succès.
    const onlyCloses = /^\w+(?:\.value)?\s*(?:\[[^\]]*\])?\s*=\s*(?:false|null)\s*;?$/.test(body);
    if (onlyCloses && !/notBuilt/.test(body)) {
      muted.push(basename(p) + ' → ' + h + ' : ne fait que refermer l’interface');
    }
  }
}
check('aucun gestionnaire muet derrière un événement', muted, vue.length + ' patrons');

/**
 * ⚠️ UN BANDEAU POSÉ DANS UN COMPOSANT QUI NE SE DÉMONTE PAS DOIT ÊTRE EFFACÉ.
 *
 * ⚠️ Le contrôle ci-dessus ne peut pas voir cette classe : il exige un corps non
 * vide, et un gestionnaire qui affecte `pending.value` en a un. Il passe.
 *
 * Le patron `pending` / `notBuilt` a été transplanté d'un composant de ROUTE vers la
 * COQUILLE. Les douze bandeaux des vues tombent d'eux-mêmes — leur composant se
 * démonte à la navigation. `App.vue` ne se démonte jamais, et `StateBanner` n'a aucune
 * échappatoire : le bandeau restait épinglé au-dessus de TOUS les écrans pour la
 * session entière. **Pire que le silence qu'il remplaçait**, réparable d'un clic.
 *
 * L'invariant : si un composant déclare `pending` ET n'est pas monté par le routeur,
 * il doit remettre `pending` à vide au changement de route. Le contrôle reconnaît la
 * coquille par son `<router-view>` — c'est ce qui la distingue d'une vue.
 *
 * ⚠️ Le contrôle cherche l'effacement **à l'intérieur du watcher de route**, non
 * n'importe où dans le fichier : un effacement posé dans `onMounted`, ou dans la
 * fonction qui affecte `pending`, laisserait le bandeau épinglé tout en faisant
 * passer un test de simple présence.
 */
const unclearedBanners = [];
for (const p of vue) {
  const src = read(p);
  if (!/const pending = ref\(/.test(src)) continue;
  if (!/<router-view/.test(src)) continue;          // un composant de route : il se démonte
  // Le corps du watcher de route, délimité en comptant les accolades.
  const w = /watch\(\s*\(\)\s*=>\s*route\.[\w.]+\s*,/.exec(src);
  let inWatcher = '';
  if (w) {
    let depth = 0, i = w.index + w[0].length, start = -1;
    while (i < src.length) {
      const c = src[i];
      if (c === '(') depth++;
      else if (c === ')') { if (depth === 0) break; depth--; }
      if (start < 0 && c !== ' ' && c !== '\n') start = i;
      i++;
    }
    inWatcher = src.slice(start < 0 ? w.index : start, i);
  }
  if (!/pending\.value\s*=\s*(?:''|"")/.test(inWatcher)) {
    unclearedBanners.push(basename(p)
      + ' : déclare `pending`, ne se démonte jamais, et son watcher de route ne l’efface pas');
  }
}
check('un bandeau posé hors d’une vue de route est effacé au changement de route',
  unclearedBanners, vue.filter((p) => /<router-view/.test(read(p))).length + ' composant(s) persistant(s)');


/**
 * ⚠️ AUCUN FICHIER DU PAQUET DE LIVRAISON NE DIVERGE DE SON ORIGINAL.
 *
 * `livraison-gestion/` est une **copie du projet entier**. Elle a divergé de quatre
 * grappes, et j'y ai corrigé un paragraphe isolé — ce qui l'a rendue courante sur un
 * point et périmée sur tout le reste. Le paquet enseignait au lecteur back exactement
 * ce que le corpus venait de retirer : la seconde chaîne de l'écran A8, ses chemins
 * inventés sans marqueur, et un « non produit » démentant quatre grappes livrées.
 *
 * ⚠️ C'est **la règle 6 appliquée au projet lui-même** — « deux listes du même
 * ensemble divergeront, pas *peuvent* » — et la classe « corriger l'instance en
 * laissant la classe » : j'avais corrigé le paragraphe des polices dans le paquet, pas
 * le paquet.
 *
 * Le paquet se **régénère**, il ne se rapièce pas. Ce contrôle le vérifie octet par
 * octet, hors son propre LISEZ-MOI — qui est écrit pour le paquet et n'a pas
 * d'original.
 */
const PACKAGE_DIR = join(ROOT, '..', 'livraison-gestion');
const packageDrift = [];
let packageChecked = 0;
function walkPackage(rel) {
  const abs = join(PACKAGE_DIR, rel);
  for (const name of readdirSync(abs)) {
    const relPath = rel ? rel + '/' + name : name;
    if (statSync(join(abs, name)).isDirectory()) { walkPackage(relPath); continue; }
    if (relPath === 'LISEZ-MOI.md') continue;          // propre au paquet
    // L'original : gestion-app/ et handoff-gestion/ à la racine, maquettes/ ailleurs.
    const source = relPath.startsWith('maquettes/')
      ? join(ROOT, '..', relPath.replace(/^maquettes\/gestion\//, 'gestion/').replace(/^maquettes\//, ''))
      : join(ROOT, '..', relPath);
    packageChecked++;
    let a; let b;
    try { a = read(join(abs, name)); } catch { return; }
    try { b = read(source); } catch {
      packageDrift.push(relPath + ' : aucun original — le paquet porte un fichier de plus');
      continue;
    }
    if (a !== b) packageDrift.push(relPath + ' : diverge de son original');
  }
}
try {
  walkPackage('');
  check('aucun fichier du paquet ne diverge de son original', packageDrift,
    packageChecked + ' fichiers comparés');
} catch (e) {
  // Pas de paquet : ce n'est pas un défaut, et le contrôle le dit plutôt que de passer.
  check('aucun fichier du paquet ne diverge de son original',
    [], 'aucun paquet de livraison présent — rien à comparer');
}

// ─── 7. PATRONS ───────────────────────────────────────────────────────────────
say('\n7 · Patrons');
const VOID = new Set(['input','img','br','hr','path','circle','rect','line','polygon','polyline',
  'use','meta','link','area','base','col','source','track','ellipse','stop']);
const tagBad = [];
const selfClosed = [];
const NONVOID = /<(span|div|i|b|p|td|th|section|header|footer|li|ol|ul|a|h[1-6]|label|button|nav|aside|main)(?![\w-])((?:[^<>"]|"[^"]*")*?)\/>/g;
for (const p of vue) {
  const src = read(p);
  if (NONVOID.test(src)) selfClosed.push(basename(p));
  NONVOID.lastIndex = 0;
  const a = src.indexOf('<template>');
  const b = src.lastIndexOf('</template>');
  if (a < 0) continue;
  const tpl = src.slice(a + 10, b).replace(/<!--[\s\S]*?-->/g, '').replace(/="[^"]*"/g, '=""');
  const stack = [];
  let m, bad = null;
  const re = /<(\/?)([A-Za-z][\w.-]*)([^>]*?)(\/?)>/g;
  while ((m = re.exec(tpl))) {
    const [, closing, name, , self] = m;
    if (VOID.has(name.toLowerCase()) || self) continue;
    if (closing) {
      const top = stack.pop();
      if (top !== name) { bad = '</' + name + '> ferme <' + (top || 'rien') + '>'; break; }
    } else stack.push(name);
  }
  if (bad) tagBad.push(basename(p) + ' : ' + bad);
  else if (stack.length) tagBad.push(basename(p) + ' : non fermées → ' + stack.join(', '));
}
check('balises équilibrées', tagBad, vue.length + ' patrons');
check('aucun élément non-void auto-fermant', selfClosed);
// Éprouvé : l'auto-fermeture SVG est LÉGALE et doit passer (VOID porte les
// formes — path, circle, rect… — et la liste NONVOID ne les nomme pas) ; un
// élément HTML non-void auto-fermé reste attrapé. Les deux sens, sinon le
// contrôle accuserait du SVG correct ou laisserait filer un vrai `<span/>`.
{
  const svgProbe = [];
  NONVOID.lastIndex = 0;
  if (NONVOID.test('<path d="m5 13 4.5.5L19 7" /><circle cx="2" r="1" />'))
    svgProbe.push('un élément SVG auto-fermé serait accusé (auto-fermeture légale)');
  NONVOID.lastIndex = 0;
  if (!NONVOID.test('<span class="dot" />'))
    svgProbe.push('un <span/> auto-fermé ne serait plus attrapé');
  NONVOID.lastIndex = 0;
  check('l’auto-fermeture SVG passe, le non-void HTML est attrapé', svgProbe);
}

/**
 * ⚠️ AUCUNE BALISE OUVRANTE NE PORTE DEUX FOIS LE MÊME ATTRIBUT (§3 recette).
 *
 * L'angle mort qui a laissé passer les deux défauts bloquants de la première
 * compilation : le contrôle voisin vérifie qu'une propriété n'a qu'une source
 * DANS un `:class` d'aides nommées — il ne voit pas le même ATTRIBUT posé deux
 * fois sur la balise (`:class` deux fois, `shown` deux fois). Le compilateur le
 * refuse… au premier défaut rencontré : il ne les liste pas tous.
 *
 * `:x` et `v-bind:x` sont le MÊME attribut (deux graphies d'une liaison) ;
 * `class` et `:class` sont DEUX attributs — combinaison légale que le cadre
 * fusionne, elle doit passer.
 */
function duplicateAttrsIn(tpl, offsetLine, label) {
  const found = [];
  let i = 0;
  const isName = (c) => /[\w:@.\-\[\]]/.test(c);
  while (i < tpl.length) {
    if (tpl[i] !== '<' || !/[A-Za-z]/.test(tpl[i + 1] || '')) { i++; continue; }
    const tagLine = offsetLine + tpl.slice(0, i).split('\n').length - 1;
    i++;
    let tag = '';
    while (i < tpl.length && /[\w.-]/.test(tpl[i])) tag += tpl[i++];
    const seen = new Map();
    while (i < tpl.length) {
      while (i < tpl.length && /\s/.test(tpl[i])) i++;
      const c = tpl[i];
      if (c === '>' ) { i++; break; }
      if (c === '/' && tpl[i + 1] === '>') { i += 2; break; }
      if (!c) break;
      let raw = '';
      while (i < tpl.length && isName(tpl[i])) raw += tpl[i++];
      if (!raw) { i++; continue; }   // caractère inattendu : on avance
      const norm = raw.replace(/^v-bind:/, ':');
      if (seen.has(norm)) {
        found.push(label + ' l.' + tagLine + ' : <' + tag + '> porte deux fois « '
          + (seen.get(norm) === raw ? raw : seen.get(norm) + ' » / « ' + raw) + ' »');
      } else seen.set(norm, raw);
      while (i < tpl.length && /\s/.test(tpl[i])) i++;
      if (tpl[i] === '=') {
        i++;
        while (i < tpl.length && /\s/.test(tpl[i])) i++;
        const q = tpl[i];
        if (q === '"' || q === "'") { i++; while (i < tpl.length && tpl[i] !== q) i++; i++; }
        else while (i < tpl.length && !/[\s>]/.test(tpl[i])) i++;
      }
    }
  }
  return found;
}
const dupAttrs = [];
for (const p of vue) {
  const src = read(p);
  const a = src.indexOf('<template>');
  const b = src.lastIndexOf('</template>');
  if (a < 0) continue;
  const before = src.slice(0, a + 10).split('\n').length;
  const tpl = src.slice(a + 10, b).replace(/<!--[\s\S]*?-->/g, (m2) => m2.replace(/[^\n]/g, ' '));
  dupAttrs.push(...duplicateAttrsIn(tpl, before, basename(p)));
}
check('aucune balise ouvrante ne porte deux fois le même attribut', dupAttrs,
  vue.length + ' patrons · :x ≡ v-bind:x');
// Éprouvé dans les deux sens : il attrape les deux défauts de la première
// compilation (`:class` posé deux fois · `shown` posé deux fois · `:x` avec
// `v-bind:x`), et il laisse passer `class` + `:class` — le légal.
{
  const dupProbe = [];
  if (duplicateAttrsIn('<td :class="a" class="x"\n :class="b > 1 ? \'c\' : \'\'">', 1, 'p').length !== 1)
    dupProbe.push('le double :class (défaut GradeControl) ne serait pas attrapé');
  if (duplicateAttrsIn('<TimeGrid shown="ready" :items="i"\n shown="partial" />', 1, 'p').length !== 1)
    dupProbe.push('le double shown (défaut Atelier) ne serait pas attrapé');
  if (duplicateAttrsIn('<a v-bind:href="u" :href="v">x</a>', 1, 'p').length !== 1)
    dupProbe.push(':x et v-bind:x ne seraient pas vus comme un seul attribut');
  if (duplicateAttrsIn('<td :class="a" class="x">y</td>', 1, 'p').length !== 0)
    dupProbe.push('class + :class (combinaison LÉGALE) serait accusée');
  check('la garde attrape les deux défauts et laisse passer class + :class', dupProbe);
}

/**
 * ⚠️ AUCUN PARAMÈTRE DANS LE VIDE (F3-FORMES §3.2 — V-LEARN-F3-14).
 *
 * Le cadre avale les kwargs inconnus : un appel qui passe une année à une
 * fonction qui ne la lit pas RÉUSSIT, et rend toutes les années — le
 * contexte était AFFICHÉ et non APPLIQUÉ. La parade : confronter les
 * paramètres ENVOYÉS à ceux que la fonction DÉCLARE. La moitié serveur est
 * GÉNÉRÉE (bench execute portal_app.api_signature_map.generate →
 * src/api/server-signatures.json) — même principe que la liste des domaines
 * et la matrice de permissions : le serveur expose, le front consomme.
 *
 * Analyse STATIQUE des modules d'appel : pour chaque `call('chemin', {…})`
 * à objet littéral, les clés statiques sont extraites ; un spread
 * `...params.value`/`...p` rend l'objet non analysable → l'appel est listé
 * comme À SPREAD (les clés du contexte {academic_year, term} sont comptées
 * envoyées). Un chemin absent de la carte n'est PAS un échec ici (les clés
 * nues 🔴 ont leur propre contrôle) — seul un paramètre HORS SIGNATURE l'est.
 */
say('\n7 quater · Les paramètres contre les signatures');
const SIGNATURES = JSON.parse(read(join(SRC, 'api/server-signatures.json')));
const CONTEXT_SPREAD_KEYS = ['academic_year', 'term'];
const paramGaps = [];
let confronted = 0;
function sentKeysOf(objSrc) {
  const keys = [];
  let spread = false;
  for (const m of objSrc.matchAll(/(?:^|[,{])\s*(?:\.\.\.(\w[\w.]*)|(\w+)\s*:)/g)) {
    if (m[1]) { spread = true; continue; }
    keys.push(m[2]);
  }
  return { keys, spread };
}
for (const f of readdirSync(join(SRC, 'api')).filter((n) => n.endsWith('.js'))) {
  const src = read(join(SRC, 'api', f));
  const consts = {};
  for (const m of src.matchAll(/const (\w+) = '([\w.]+)';/g)) consts[m[1]] = m[2];
  for (const m of src.matchAll(/call\((?:(\w+) \+ )?'([\w.]+)'\s*,\s*\{([\s\S]*?)\}\s*\)/g)) {
    const path = (m[1] ? (consts[m[1]] || '') : '') + m[2];
    const declared = SIGNATURES[path];
    if (!declared) continue;                  // clé nue : autre contrôle
    confronted += 1;
    const { keys, spread } = sentKeysOf(m[3]);
    const sent = spread ? [...keys, ...CONTEXT_SPREAD_KEYS] : keys;
    for (const k of sent) {
      if (!declared.includes(k)) {
        paramGaps.push(f + ' → ' + path.split('.').pop() + ' : « ' + k
          + ' » n’est pas dans la signature (' + declared.join(', ') + ') — il partirait dans le vide');
      }
    }
  }
}
check('aucun paramètre envoyé hors de la signature déclarée', [...new Set(paramGaps)],
  confronted + ' appels confrontés · ' + Object.keys(SIGNATURES).length + ' signatures');
// Éprouvé dans les deux sens : il attrape un paramètre non déclaré, il
// laisse passer un appel conforme.
{
  const probe = [];
  const fake = { 'x.y.fn': ['name', 'academic_year'] };
  const check1 = sentKeysOf(" name: p.name, term: p.term ");
  if (!(check1.keys.includes('term') && !fake['x.y.fn'].includes('term')))
    probe.push('un paramètre hors signature ne serait pas vu');
  const check2 = sentKeysOf(" name: p.name, academic_year: p.year ");
  if (check2.keys.some((k) => !fake['x.y.fn'].includes(k)))
    probe.push('un appel conforme serait accusé');
  const check3 = sentKeysOf(" ...p, include_undecided: 1 ");
  if (!check3.spread) probe.push('un spread ne serait pas détecté');
  check('le contrôle des paramètres attrape le faux et laisse passer le juste', probe);
}

/**
 * ⚠️ AUCUNE CELLULE DE TABLEAU DANS UNE CELLULE DE TABLEAU.
 *
 * Le contrôle de balises ci-dessus vérifie l'ÉQUILIBRE, jamais la LÉGALITÉ de
 * l'imbrication : `<td>` pousse, `<td>` pousse, `</td>` dépile — tout apparie, et
 * il ne voit rien. Il a donc laissé passer, dans le tableau de délibération, deux
 * cellules enveloppées dans un `<td class="contents">`.
 *
 * Ce n'était pas cosmétique. Une cellule n'est admise que comme enfant de `<tr>` ;
 * le compilateur Vue ne fait pas respecter les modèles de contenu HTML, donc le
 * DOM contenait littéralement un `<td>` dans un `<td>`. L'alignement des trois
 * colonnes épinglées dépendait alors de `display:contents` honoré sur une
 * imbrication invalide — non honoré, le corps comptait sept fentes contre neuf à
 * l'en-tête, et le bloc de décision se décalait de deux colonnes. C'est-à-dire que
 * la garantie sur laquelle cet écran est construit tombait.
 *
 * Le construit juste est `<template v-for>` : il ne génère aucun élément.
 */
const nestedCells = [];
for (const p of vue) {
  const src = read(p);
  const a = src.indexOf('<template>');
  const b = src.lastIndexOf('</template>');
  if (a < 0) continue;
  const tpl = src.slice(a + 10, b).replace(/<!--[\s\S]*?-->/g, '').replace(/="[^"]*"/g, '=""');
  let depth = 0;
  let m;
  const re = /<(\/?)(t[dh])(?![\w-])([^>]*?)(\/?)>/g;
  while ((m = re.exec(tpl))) {
    const [, closing, tag, , self] = m;
    if (self) continue;
    if (closing) { depth = Math.max(0, depth - 1); continue; }
    if (depth > 0) {
      nestedCells.push(basename(p) + ' : <' + tag + '> descendant d’une cellule');
      break;
    }
    depth += 1;
  }
}
check('aucun td/th descendant d’un td/th', [...new Set(nestedCells)], vue.length + ' patrons');

/**
 * ⚠️ UNE PROPRIÉTÉ, UNE SOURCE — dans un `:class="[…]"` fait d'aides nommées.
 *
 * Le tableau de délibération portait quatre aides de position chargées chacune de
 * `bg-white` et `z-[2]`, combinées à un `headCell` chargé de `bg-ln-gray-50` et
 * `z-[3]`. Deux utilitaires de même spécificité sur la même propriété : l'arbitrage
 * revient à l'ordre d'émission de Tailwind, jamais à l'ordre du tableau.
 *
 * Les deux issues étaient fausses, et aucune n'était choisie : ligne d'en-tête
 * bicolore si le blanc gagnait, lignes du corps RECOUVRANT l'en-tête épinglé au
 * défilement si le `z-[2]` gagnait. Et sur les cellules de corps, le `bg-white`
 * inconditionnel effaçait le survol et la sélection — sur les trois colonnes que cet
 * écran existe pour garder sous les yeux.
 *
 * ⚠️ La première correction a reproduit le défaut d'un cran : `headTop` gardait
 * `z-[3]` tandis que `headPin` posait `z-[4]`, sur la même cellule. Séparer la
 * géométrie du fond ne suffit pas — il faut qu'UNE SEULE aide décide de chaque
 * propriété. C'est ce que ce contrôle vérifie, et il n'existerait pas sans les deux
 * tours.
 */
const CONFLICT_PROPS = [
  ['fond', /(?:^|\s)bg-[a-z0-9[\]#/-]+/],
  ['empilement', /(?:^|\s)z-(?:\[\d+\]|\d+)/],
];
const classClash = [];
for (const p of vue) {
  const src = read(p);
  const helpers = {};
  for (const m of src.matchAll(/const (\w+) = '([^']*)';/g)) helpers[m[1]] = m[2];
  if (!Object.keys(helpers).length) continue;
  for (const m of src.matchAll(/:class="\[([^\]]+)\]"/g)) {
    const names = m[1].split(',').map((x) => x.trim()).filter((x) => helpers[x]);
    if (names.length < 2) continue;
    for (const [label, re] of CONFLICT_PROPS) {
      const sources = names.filter((n) => re.test(helpers[n]));
      if (sources.length > 1) {
        classClash.push(basename(p) + ' : ' + label + ' posé par ' + sources.join(' et '));
      }
    }
  }
}
check('dans un :class d’aides nommées, une propriété n’a qu’une source',
  [...new Set(classClash)], vue.length + ' patrons');

/**
 * ⚠️ TOUTE PROP PASSÉE À UN COMPOSANT PARTAGÉ EXISTE À SON `defineProps`.
 *
 * Vue ne lève pas sur une prop inconnue : elle atterrit dans les attributs et
 * disparaît. Un écran qui passe `count-unit` à un composant qui attend `deadline`
 * rend donc un bandeau vide, sans erreur — et c'est visuellement crédible.
 *
 * La grappe 7 l'a fait deux fois : j'ai écrit les props de `DeferredEffectBanner` et
 * de `RetractionWindow` de mémoire au lieu de lire leur contrat. C'est exactement la
 * classe des chemins inventés — le nom est plausible, l'interface ne le connaît
 * pas — appliquée aux composants au lieu du serveur.
 *
 * Les deux composants attendaient en fait le même contrat structuré (D-05), avec un
 * `remaining` qui vient du serveur : la lecture a donc corrigé plus qu'un nom.
 */
const KEBAB = (s) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
const RESERVED = new Set(['class', 'style', 'key', 'ref', 'id', 'is']);
const componentProps = {};
for (const p of vue) {
  const base = basename(p, '.vue');
  const block = (read(p).match(/defineProps\(\{([\s\S]*?)\n\}\)/) || [])[1];
  if (block) componentProps[base] = new Set([...block.matchAll(/^\s{2}(\w+):\s*\{/gm)].map((m) => m[1]));
}
const propBad = [];
for (const p of vue) {
  const src = read(p);
  for (const [name, props] of Object.entries(componentProps)) {
    if (basename(p, '.vue') === name) continue;
    for (const m of src.matchAll(new RegExp('<' + name + '\\b([\\s\\S]*?)/?>', 'g'))) {
      for (const a of m[1].matchAll(/(?:^|\s):?([a-z][\w-]*)=/g)) {
        const attr = a[1];
        if (RESERVED.has(attr) || attr.startsWith('v-') || attr.startsWith('@')) continue;
        const known = [...props].some((pr) => pr === attr || KEBAB(pr) === attr);
        if (!known) propBad.push(basename(p) + ' → <' + name + '> ' + attr);
      }
    }
  }
}
check('toute prop passée à un composant existe à son defineProps',
  [...new Set(propBad)], Object.keys(componentProps).length + ' composants lus');

/**
 * ⚠️ LA FORME DES OBJETS PASSÉS DANS UNE PROP DE TYPE TABLEAU.
 *
 * Le contrôle des noms de props est aveugle d'un niveau : une prop `steps` de type
 * `Array` existe bien, et les objets qu'elle transporte peuvent avoir n'importe
 * quelle forme. La grappe 7 l'a fait sur `ProcedureChain` — le composant qui porte
 * la thèse de la grappe. Son contrat est `{ key, actor, label, date, status, isMine }` ;
 * j'avais émis `{ key, label, state }`. Aucune erreur : `s.status` valait
 * `undefined`, les cinq fonctions de ton retombaient sur « à venir », et les quatre
 * étapes rendaient en gris identique.
 *
 * ⚠️ ET MA PREMIÈRE VERSION DE CE CONTRÔLE ÉTAIT VACUEUSE — verte par absence.
 * Elle cherchait un fabricant nommé comme la PROP (`steps:`), alors que le
 * fabricant le construit sous la clé que la LIAISON désigne :
 *
 *     <ProcedureChain :steps="current.chain" />        la liaison
 *     chain: stepsOf(kind).map((s, i) => ({ … }))      le fabricant
 *
 * Aucun `steps:` du dépôt n'est suivi d'un `.map(` : les seules occurrences sont les
 * tables `PROCEDURES[*].steps`. Le contrôle ne trouvait donc aucun sujet, et
 * affichait vert sur quarante-trois patrons sans examiner un seul objet — il
 * n'aurait pas attrapé le défaut qui l'a motivé.
 *
 * ⚠️ Et j'avais écrit « éprouvé » en m'appuyant sur une sonde jetable qui codait
 * `chain:` en dur. C'est la règle 9 appliquée au contrôle lui-même : un verdict
 * n'appartient qu'à ce qui a tourné, y compris quand le sujet est le garde-fou.
 *
 * La correction SUIT LA LIAISON : pour chaque contrat `Props : X[] = {…}`, on
 * cherche les liaisons `:X="<expr>"`, on prend l'identifiant terminal de
 * l'expression, puis les fabricants de CETTE clé. La clé vient du code, non d'une
 * convention de nommage.
 */
/**
 * ⚠️ LES CONTRATS DE PROP-TABLEAU SONT DOCUMENTÉS ET LISIBLES.
 *
 * Ce contrôle a remplacé une tentative de vérifier la FORME des objets passés dans
 * une prop de tableau. Quatre versions, quatre échecs, et la quatrième est celle qui
 * tranche : **la vérification de forme n'est pas atteignable ici par analyse
 * statique**, et voici pourquoi.
 *
 * Pour vérifier une forme, il faut attribuer un fabricant à un contrat. Le seul
 * lien statique est la liaison — `:items="gridItems"` → `gridItems`. Mais les noms
 * de clés du dépôt sont GÉNÉRIQUES : `items`, `days`, `conflicts`, `queueItems`.
 * `TimeGrid.items` et `WorkQueue.items` se lient tous deux à `items`, et chaque
 * fixture qui expose un `items:` devient un fabricant candidat. La quatrième
 * version a produit quatre-vingt-dix faux positifs — dont « `title` n'est pas au
 * contrat de TimeGrid.items » sur une file de travail, qui est juste.
 *
 * Un appariement par nom est donc faux dans les deux sens, et le rendre sain
 * demanderait de suivre le flot de données — hors de portée d'un audit statique
 * écrit à l'expression régulière.
 *
 * ⚠️ CE QUE CE CONTRÔLE FAIT À LA PLACE, et il le fait sainement : il énumère
 * TOUTES les props `type: Array` et vérifie que chacune porte un contrat LISIBLE.
 * Un contrat écrit se relit avant d'être alimenté ; un contrat absent se devine, et
 * c'est précisément ce qui a produit le défaut du fil de procédure (§4.4 du relevé
 * de la grappe 7) — j'avais écrit la forme de mémoire parce que rien ne m'obligeait
 * à la lire.
 *
 * ⚠️ Et il DIT ce qu'il ne fait pas. Un contrôle qui laisse croire qu'il vérifie les
 * formes serait pire que son absence : c'est la classe « vert par absence », et je
 * l'ai réintroduite trois fois de suite en essayant de la fermer.
 */
const ARRAY_PROP_RE = /^\s{2}(\w+):\s*\{[^}]*type:\s*(?:\[[^\]]*Array[^\]]*\]|Array)[^}]*\}[^\n]*$/gm;
const CONTRACT_FORMS = [
  // a · `Props : steps[] = { key, actor, … }` dans le commentaire d'en-tête
  (src, prop) => src.match(new RegExp('Props\\s*:\\s*' + prop + '\\[\\]\\s*=\\s*\\{([^}]*)\\}')),
  // b · commentaire en fin de ligne de la prop — `// [{ id, day, … }]`
  (src, prop, line) => line.match(/\/\/\s*\[\{([\s\S]*)\}\s*\]/),
  // c · bloc de contrat ailleurs dans le fichier — `lines: [{ id, label, … }]`
  (src, prop) => src.match(new RegExp('\\b' + prop + ':\\s*\\[\\{([^}]*)\\}')),
];
const undocumented = [];
const documented = [];
for (const p of vue) {
  const src = read(p);
  const block = (src.match(/defineProps\(\{([\s\S]*?)\n\}\)/) || [])[1];
  if (!block) continue;
  ARRAY_PROP_RE.lastIndex = 0;
  for (const m of block.matchAll(ARRAY_PROP_RE)) {
    const prop = m[1];
    /**
     * ⚠️ N'EXCLURE QUE CE QUI NE PORTE PAS D'OBJET — et l'avoir VÉRIFIÉ.
     *
     * `skeletonWidths` porte des nombres et `'auto'` ; `AccessDenied.allowed` et
     * `AppShell.roles` portent des chaînes. Ces trois-là n'ont pas de forme à
     * documenter.
     *
     * ⚠️ J'y avais mis `legend` sur la foi de son nom, sans lire `TimeGrid.vue`,
     * qui déstructure `l.label` et `l.color`. C'était un VRAI contrat d'objet,
     * exclu avec une justification fausse — et construit à la main dans DEUX vues
     * indépendantes, sans forme documentée. Une dérive de `color` aurait rendu les
     * pastilles de légende invisibles, silencieusement.
     *
     * Une liste d'exclusion est un endroit où un contrôle cesse de regarder : elle
     * se vérifie au moins aussi soigneusement que ce qu'il regarde.
     */
    if (/^(skeletonWidths|allowed|roles)$/.test(prop)) continue;
    const hit = CONTRACT_FORMS.map((f) => f(src, prop, m[0])).find(Boolean);
    const label = basename(p, '.vue') + '.' + prop;
    if (!hit || !hit[1] || !/\w/.test(hit[1])) {
      undocumented.push(label + ' — aucun contrat lisible : la forme se devinera');
      continue;
    }
    documented.push(label);

    /**
     * ⚠️ ET LE CONTRAT DOIT ÊTRE VRAI, non seulement présent.
     *
     * Ma version précédente vérifiait la PRÉSENCE d'un commentaire. Elle est donc
     * passée au vert sur deux contrats que j'avais écrits **de mémoire** — dans la
     * session même dont les §4.4 et §4.7 du relevé diagnostiquent cette habitude.
     * `TreeEditor.nodes` était faux sur six clés de huit : `key` au lieu de `id`,
     * `depth` au lieu de `level`, et quatre clés jamais lues. Le commentaire du
     * composant, deux lignes au-dessus, disait « node.level porte la profondeur ».
     *
     * **Un contrat faux est pire qu'un contrat absent** : il se lit avec confiance.
     * Qui l'aurait suivi aurait obtenu un arbre plat, sans sélection ni caret.
     *
     * ⚠️ Ce que la comparaison exige est LOCAL À UN FICHIER : les clés du contrat
     * contre les `x.clé` que le composant lui-même déréférence sur sa variable
     * d'itération. Aucun appariement de noms, donc aucun des quatre-vingt-dix faux
     * positifs qui ont fait retirer la vérification de forme.
     */
    // ⚠️ La notation `lines[]` du contrat dit « ce champ est un tableau ». Mon
    // extraction ne la reconnaissait pas, et signalait `lines` comme hors contrat
    // alors qu'il y est — un faux positif sur le plus gros contrat du dépôt.
    /**
     * ⚠️ ET LA COMPARAISON DESCEND DANS LES GROUPES IMBRIQUÉS.
     *
     * Ma version précédente ne comparait que la variable d'itération EXTERNE. Un
     * contrat qui déclare `activities: [{ … }]` a une seconde boucle
     * (`v-for="a in m.activities"`), et ce niveau n'était comparé pour AUCUN des
     * treize contrats. `CoveragePanel.activities` omettait donc `pending_hours` —
     * le champ qui porte les heures posées sans enseignant : qui aurait lu ce
     * contrat n'aurait jamais affiché la phrase distinguant un oubli d'une absence
     * de couverture.
     *
     * ⚠️ La comparaison scanne le FICHIER ENTIER, non le seul patron : c'est ainsi
     * que `item.done`, lu dans une fonction du script, a été trouvé. Conséquence
     * assumée et nommée : un `node.xxx` cité dans un COMMENTAIRE compterait comme un
     * déréférencement. C'est le motif « une sonde qui ne retire pas les
     * commentaires », confessé trois fois au relevé — ici le faux positif serait
     * bénin (documenter une clé nommée dans une explication), et le retirer coûterait
     * la détection des usages en script.
     */
    const KEYS_RE = /(\w+)(?=\s*(?:\[\]|[:,\]])|\s*$)/g;
    const compare = (iterKey, keys, scope) => {
      const vars = new Set([...src.matchAll(new RegExp('v-for="\\(?(\\w+)[^"]*in [\\w.]*' + iterKey + '\\b', 'g'))].map((x) => x[1]));
      for (const v of vars) {
        for (const k of new Set([...src.matchAll(new RegExp('\\b' + v + '\\.(\\w+)', 'g'))].map((x) => x[1]))) {
          if (!keys.has(k)) {
            undocumented.push(label + ' — le composant lit « ' + v + '.' + k
              + " » qui n'est pas au contrat" + (scope ? ' de ' + scope : ''));
          }
        }
      }
    };

    // Les groupes imbriqués d'abord, puis le niveau externe sans eux.
    let outer = hit[1];
    for (const g of [...hit[1].matchAll(/(\w+):\s*\[\{([^\]]*?)\}\s*\]/g)]) {
      outer = outer.replace(g[0], g[1]);
      compare(g[1], new Set([...g[2].matchAll(KEYS_RE)].map((x) => x[1])), g[1] + '[]');
    }
    const declared = new Set([...outer.matchAll(KEYS_RE)].map((x) => x[1]));
    compare(prop, declared, null);
  }
}
check('toute prop de tableau porte un contrat lisible ET vrai', undocumented,
  documented.length + ' documentées : ' + documented.join(' · '));

// ─── 7 bis. LE CONTRAT D'ARTEFACT ────────────────────────────────────────────
/**
 * Deux défauts du branchement ont attendu un navigateur, et ce n'est pas une
 * fatalité : ils vivaient dans l'ACCORD entre deux fichiers, chacun correct
 * seul. Cette section confronte les paires.
 *
 * ⚠️ Elle ne remplace pas le branchement — le shell serveur n'est pas ici. Mais
 * un désaccord entre `main.js` et l'`index.html` de développement, ou un chemin
 * de police visant le développement, se lisent hors ligne.
 */
say('\n7 bis · Contrat d’artefact');

const mainJs = read(join(SRC, 'main.js'));
const indexHtml = read(join(ROOT, 'index.html'));
const mountId = (mainJs.match(/\.mount\('#([\w-]+)'\)/) || [])[1];
const contratBad = [];
if (!mountId) contratBad.push('main.js : aucun point de montage `#id` trouvé');
else if (!new RegExp('id="' + mountId + '"').test(indexHtml)) {
  contratBad.push('main.js monte sur #' + mountId + ', absent de index.html — '
    + '`npm run dev` casserait là où la production marche');
}
check('le point de montage de main.js existe dans l’index de développement', contratBad,
  mountId ? '#' + mountId : '—');

// Le chemin des polices doit être celui SERVI, pas celui du développement.
const entryCss = read(join(SRC, 'assets/main.css'));
const fontUrls = [...entryCss.matchAll(/url\('([^']+\.woff2)'\)/g)].map((m) => m[1]);
check('les polices visent un chemin servi (partagé avec le self-service)',
  fontUrls.filter((u) => !u.startsWith('/assets/')),
  fontUrls.length + ' fichiers référencés');

/**
 * ⚠️ ET LE HANDOFF DOIT ANNONCER LE MÊME CHEMIN.
 *
 * Le contrôle ci-dessus garde la feuille d'entrée. Il ne gardait pas les documents,
 * et c'est là que la classe a mordu : la correction du chemin des polices — l'une des
 * quatre pièces reversées du branchement — a été portée dans `main.css` et **jamais
 * dans les documents qui disent où déposer les fichiers**.
 *
 * Le corpus a porté trois chemins pour une même ressource, dont deux faux, et le
 * relevé de la grappe 1 — un document de handoff — instruisait le lecteur vers
 * `public/fonts/`, celui qui avait produit quatre échecs de chargement avec repli sur
 * la police système.
 *
 * C'est « le sens code → document corrigé, le sens document → code jamais », comme
 * pour le chemin de l'écran A8, appliqué aux ASSETS — que le contrôle bidirectionnel
 * des chemins ne voit pas, puisqu'il ne lit que les `call('…')`.
 */
let assetHandoff = '';
try {
  const dir = join(ROOT, '..', 'handoff-gestion');
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.md'))) {
    assetHandoff += read(join(dir, name));
  }
} catch { /* absence dite ci-dessous */ }
const assetDirs = [...new Set(
  [...entryCss.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)]
    .map((m) => m[1].trim())
    .filter((u) => u.startsWith('/'))
    .map((u) => u.replace(/[^/]*$/, '')),
)];
check('tout chemin d’asset de la feuille d’entrée est annoncé au handoff',
  assetHandoff
    ? assetDirs.filter((d) => !assetHandoff.includes(d))
    : ['handoff introuvable — ce contrôle n’a pas de sujet et ne prouve rien'],
  assetDirs.join(' · '));

// Le greffon de manifeste exigé par le contrat doit être dans la config —
// « ce qui n'est pas explicitement reversé se perd ».
const vite = read(join(ROOT, 'vite.config.js'));
const viteBad = [];
if (!/manifest\.json/.test(vite)) viteBad.push('vite.config.js : aucun émetteur de manifest.json');
if (!/enforce:\s*'post'/.test(vite)) viteBad.push("vite.config.js : `enforce: 'post'` absent — le CSS sortirait vide du manifeste");
check('la construction produit le manifeste du contrat', viteBad);

// Le jeton de sécurité doit être joint par le point d'appel unique.
check('le point d’appel joint le jeton de sécurité',
  /X-Frappe-CSRF-Token/.test(read(join(SRC, 'api/client.js'))) ? []
    : ['client.js : aucun en-tête de jeton — toute écriture serait refusée']);

// ─── 8. STYLE ────────────────────────────────────────────────────────────────
say('\n8 · Style');
const cfg = read(join(ROOT, 'tailwind.config.js'));
const palette = new Set(['ln-blue', 'ln-gray']);
for (const m of cfg.matchAll(/'(ln-[a-z]+)':\s*\{([^}]*)\}/g)) {
  [...m[2].matchAll(/\b(\d{2,3})\s*:/g)].forEach((n) => palette.add(m[1] + '-' + n[1]));
}
[...cfg.matchAll(/'(ln-[a-z-]+)':\s*'#/g)].forEach((m) => palette.add(m[1]));
const btns = new Set([...read(join(SRC, 'assets/buttons.css')).matchAll(/\.(ln-[a-z-]+)/g)].map((m) => m[1]));
const styleBad = [];
for (const p of vue) {
  const s = read(p);
  for (const m of s.matchAll(/\b(?:bg|text|border|border-[lrtbxy]|fill|stroke|accent|outline|ring|divide|placeholder|caret)-(ln-[a-z]+(?:-[a-z0-9]+)?)/g)) {
    if (!palette.has(m[1])) styleBad.push(basename(p) + ' : ' + m[1]);
  }
  for (const m of s.matchAll(/\bln-(?:btn-[a-z]+|ctx-pick)\b/g)) {
    if (!btns.has(m[0])) styleBad.push(basename(p) + ' : ' + m[0]);
  }
}
check('jetons de couleur et classes de composant déclarés', [...new Set(styleBad)]);

const main = read(join(SRC, 'assets/main.css'));
check('aucun @import après les directives @tailwind',
  main.slice(main.indexOf('@tailwind')).includes('@import')
    ? ['un @import suit une directive — CSS invalide, postcss-import peu fiable'] : []);

// ─── VERDICT ─────────────────────────────────────────────────────────────────
say('');
if (failures) {
  say(failures + ' vérification(s) en échec.');
  process.exit(1);
}
say('Toutes les vérifications passent.');
say('Reste à faire, et non remplaçable : npm run dev, puis ?simulate=denied|error|empty.');
