/**
 * Grappe 6 · la lecture qui manque au tableau de délibération.
 *
 * ⚠️ CE MODULE NE CONTIENT QU'UN MANQUE, et il existe pour que le manque soit
 * VISIBLE plutôt que contourné en silence.
 *
 * `get_deliberation_dashboard` itère `doc.decisions` : il ne rend que les
 * décisions DÉJÀ INSTRUITES. Un jury de quatre-vingt-seize étudiants dont onze
 * sont décidés en reçoit onze. L'écran du jury deviendrait donc la liste de ce qui
 * est fait — l'inverse de son usage, qui est de décider ce qui reste.
 *
 * Deux façons de s'en sortir, et j'ai choisi la seconde :
 *
 *   — composer la liste au front, depuis les inscriptions au programme et les
 *     résultats de semestre. C'est la règle 6 par la porte de derrière : une
 *     seconde liste du même ensemble, qui divergerait du jury dès la première
 *     décision instruite ;
 *
 *   — nommer le manque, poser un point d'entrée unique pour lui, et le dire à
 *     l'écran. Le jour où le dashboard rendra tous les étudiants du jury, ce
 *     fichier disparaît et l'écran ne change pas — parce que les deux rendent la
 *     MÊME forme de ligne.
 */
import { call } from './client.js';

/**
 * 🟢 COMBLÉ (stabilisation §3.2) — les étudiants d'un jury, décidés ou non.
 *
 * Forme attendue, identique à `rows` du dashboard, plus deux compteurs :
 *
 *     { count, instructed, items: [ <même forme que dashboard.rows> ] }
 *
 * Ce qu'il faut : la liste des étudiants relevant de ce jury — inscrits au
 * programme, au niveau et à l'année de la délibération — avec pour chacun son
 * résultat de semestre, ses résultats d'unité, sa moyenne annuelle indicative,
 * ses compteurs d'assiduité et son historique de conseil. C'est-à-dire
 * exactement ce que `get_deliberation_dashboard` construit déjà, mais pour tous
 * plutôt que pour les seuls instruits.
 *
 * ⚠️ La forme la plus simple serait un drapeau sur le point d'entrée existant —
 * `get_deliberation_dashboard(name, include_pending=1)` — plutôt qu'un second
 * point d'entrée. Un drapeau garde une seule construction de ligne au serveur ;
 * deux points d'entrée en auraient deux, et elles divergeraient.
 */
/**
 * 🟢 LE MANQUE EST COMBLÉ — par le drapeau que ce module réclamait (stabilisation
 * §3.2, le front suit) : la vague serveur a livré
 * `get_deliberation_dashboard(name, include_undecided=1)`, une seule
 * construction de ligne pour décidés ET non-décidés. Trois couches alignées
 * ici, dans le module d'appel, jamais dans l'écran :
 *   — le DRAPEAU s'appelle `include_undecided` (pas `include_pending`) ;
 *   — l'identifiant s'appelle `name` (pas `deliberation`) ;
 *   — la forme rendue est `{ …, rows }` : `count` et `instructed` s'en
 *     DÉRIVENT (les compter ailleurs = une seconde vérité).
 * La forme PAR LIGNE est celle du manifeste (student_name, les deux semestres
 * avec moyenne, ue_label/ects_possible) — rendue par le serveur, pas recomposée.
 */
/**
 * F3-PROV : `list_deliberations` — IDENTIFICATION seulement (aucun résultat,
 * aucun étudiant), scopée SERVEUR. Le sujet du tableau voyage dans l'ADRESSE :
 * l'écran choisit ici, il ne code plus d'identifiant en dur (le 404 de donnée
 * DELIB-2027-L2GL est mort avec lui).
 */
export const listDeliberations = async (p) => {
  const d = await call('portal_app.api.academic.deliberation_mgmt.list_deliberations', {
    academic_year: p && p.academic_year,
    academic_level: p && p.academic_level,
    status: p && p.status,
  });
  // enveloppe serveur { deliberations, truncated } — la troncature se DIT
  return { items: (d && d.deliberations) || [], truncated: !!(d && d.truncated) };
};

export const listDeliberationRoster = async (p) => {
  const d = await call('portal_app.api.academic.deliberation_mgmt.get_deliberation_dashboard',
    { name: (p && (p.deliberation || p.name)), include_undecided: 1 });
  const items = (d && d.rows) || [];
  return { count: items.length,
           instructed: items.filter((r) => r.decision).length,
           items };
};
