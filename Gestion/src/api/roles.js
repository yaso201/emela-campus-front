/**
 * Écran 7 · Attribution des rôles — trou T5.
 *
 * 🟢 LES LECTURES SONT APPARIÉES (stabilisation §4) : la surface T5 EXISTE
 * (identity/role_administration — list_role_holders, list_anomalies,
 * get_assignment_journal). Les ACTES restent MARQUÉS ROUGES par bloc, nommés au handoff.
 * L'avertissement d'origine (« aucun n'existe ») est levé pour les lectures. Ce module est écrit
 * contre la spécification transmise (handoff-gestion/T5-points-d-entree.md) :
 * il compile, il ne répond pas. Chaque fonction porte le nom exact de la
 * spécification, pour que le branchement soit mécanique.
 *
 * ⚠️ LE MARQUEUR ROUGE EST PORTÉ ICI DEPUIS LA GRAPPE 11. Il manquait : le module
 * disait « aucun n'existe » en prose, et le contrôle qui confronte `src/api/` au
 * marquage du handoff ne lit pas la prose. Deux documents qui se contredisent sur
 * le statut d'un chemin valent moins qu'un seul — et c'est depuis `src/api/` que
 * le back-end câble.
 */
import { call } from './client.js';

/*
 * Décision : l'attribution relève de l'ADMINISTRATION TECHNIQUE. Le risque
 * administrateur n'est pas traitable au niveau applicatif — celui qui détient
 * les accès système contournerait toute garde. Le journal reste comme TRACE,
 * jamais comme garde.
 */

/**
 * ⚠️ FORMES (F3-FORMES) — trois lectures RÉELLES jointes au point d'appel :
 * les porteurs (liste NUE serveur), les gabarits (list_role_profiles) et les
 * anomalies (pour des puces de filtre VRAIES). Le `filter` ne part plus au
 * serveur (il partait dans le vide) : il s'applique ICI, en présentation.
 * Vocabulaire de portée mappé (origin serveur → kind écran) ; `email` est
 * l'identifiant User ; la colonne Profil a été RETIRÉE (arbitrage 3 :
 * le gabarit appartient au geste, pas à l'état — le journal porte l'historique).
 */
const SCOPE_KIND = { 'par nature': 'nature', 'par liaison': 'liaison',
  'annulée par un cumul': 'annulee', 'nulle': 'nulle' };
export const listRoleGrants = async (p) => {
  const [holders, profiles, anomalies] = await Promise.all([
    call('portal_app.api.identity.role_administration.list_role_holders'),
    call('portal_app.api.identity.role_administration.list_role_profiles').catch(() => []),
    call('portal_app.api.identity.role_administration.list_anomalies').catch(() => null),
  ]);
  const anomalous = new Set(
    ((anomalies && anomalies.holders_with_anomalies) || []).map((h) => h.user));
  let items = (holders || []).map((h) => ({
    person: h.user, name: h.full_name || h.user, email: h.user,
    roles: h.roles || [], enabled: h.enabled,
    decision_bearer_roles: h.decision_bearer_roles || [],
    scope: {
      kind: SCOPE_KIND[(h.scope_report || {}).origin] || (h.scope_report || {}).origin,
      program: (((h.scope_report || {}).programs) || []).join(', ') || null,
      // La LISTE (pas la chaîne jointe) — le panneau de dotation en a besoin
      // pour proposer les portées à retirer.
      programsList: ((h.scope_report || {}).programs) || [],
      reason: (h.scope_report || {}).note,
    },
    granted_on: h.granted_on, granted_by: h.granted_by,
    status: anomalous.has(h.user) ? 'anomalie' : null,
    warnings: [],
  }));
  if (p && p.filter === 'anomalies') items = items.filter((r) => r.status === 'anomalie');
  // FORMES (M2-AN-05) : `list_role_profiles` rend un OBJET serveur
  // `{sod_rule, profiles:[{profile,roles}]}` (le simulacre rendait un tableau) —
  // extraire `.profiles`. Sans cela, `.map` sur l'objet levait et `listRoleGrants`
  // rejetait ENTIÈREMENT : la table des personnes restait vide en branché.
  const profileList = Array.isArray(profiles) ? profiles : ((profiles && profiles.profiles) || []);
  return { count: items.length, items,
           profiles: profileList.map((x) => x.profile || x) };
};
/* ── Traduits RF-G-01 (B1) — la surface T5 EXISTE : `role_administration`, garde SM.
 * Adaptations de forme : `person` → `target_user` ; catalogue et profils sous d'autres
 * noms ; la simulation est UN changement par appel (arbitrage A5 : l'écran enchaîne N
 * simulations, agrège les avertissements, et n'écrit qu'avec TOUS les accusés).
 * Cliqués C1 : simulate/add_role/remove_role/add_scope 200, journal RAL-*. */
const RA = 'portal_app.api.identity.role_administration.';
/** 🟢 `get_user_roles_detail(target_user)` — détail d'un porteur (+ liaisons dormantes). */
export const getRoleGrant = (person) => call(RA + 'get_user_roles_detail', { target_user: person });
/** 🟢 `list_role_profiles()` — {sod_rule, profiles[{profile, roles[]}]}. */
export const listRoleProfiles = () => call(RA + 'list_role_profiles');
/** 🟢 `list_roles_catalog()` — {roles[{role, opens, decision_bearer, scoped, bypass}],
 *  forbidden[{role, why}]} : l'interdit est rendu AVEC sa raison (expliqué, pas masqué). */
export const listAssignableRoles = () => call(RA + 'list_roles_catalog');

/** Le point d'entrée qui décide de tous les autres : sans lui, l'écran
 *  réimplémente la matrice de rôles dans un navigateur. */
/** 🟢 `simulate_assignment(target_user, kind, value)` — kind ∈ {profil_applique,
 *  role_ajoute, role_retire, portee_armee, portee_retiree}. Rend {before, after, opens[]
 *  (phrases SERVEUR), warnings[{code W-*, message}], acknowledgement_contract}. */
export const previewGrantEffect = (p) => call(RA + 'simulate_assignment', p);

/** 🟢 `apply_profile(target_user, profile, acknowledged_warnings)` — accusés EXACTS exigés. */
export const assignRoleProfile = (p) => call(RA + 'apply_profile', p);
/** 🟢 `add_role(target_user, role, acknowledged_warnings)`. */
export const addRole = (p) => call(RA + 'add_role', p);
/** 🟢 `remove_role(target_user, role, reason, acknowledged_warnings)` — motif OBLIGATOIRE
 *  (throw serveur si vide ; libre tant que la MOA n'impose pas de catalogue — VOCAB §2). */
export const removeRole = (p) => call(RA + 'remove_role', p);
/** 🟢 `add_scope(target_user, program, acknowledged_warnings)` — armer une portée.
 *  Les 4 `scope.kind` de T5 sont RENDUS en lecture (scope_report.origin) ; l'écriture
 *  est par programme. */
export const setRoleScope = (p) => call(RA + 'add_scope', p);
/** 🟢 `remove_scope(target_user, program, reason, acknowledged_warnings)` — motivé. */
export const clearRoleScope = (p) => call(RA + 'remove_scope', p);
/**
 * ⚠️ FORMES — la forme serveur est GROUPÉE PAR PORTEUR ({count,
 * holders_with_anomalies[].anomalies[]}) : aplatie ici ; les libellés de
 * type sont de l'AFFICHAGE (dictionnaire au point d'appel, types comptés
 * localement — un comptage de présentation, pas une seconde vérité).
 */
const ANOMALY_LABELS = {
  portee_nulle: { label: 'Portée nulle',
    note: 'Rôle cloisonnable sans liaison : la personne ne voit rien.' },
  cumul_sans_accuse: { label: 'Cumul sans accusé',
    note: 'Attribué avant cet écran : l’avertissement n’a jamais été acquitté.' },
  maker_checker_sans_accuse: { label: 'Maker-checker sans accusé',
    note: 'Proposition et validation réunies sans accusé enregistré.' },
};
export const listGrantAnomalies = async () => {
  const d = await call('portal_app.api.identity.role_administration.list_anomalies');
  const items = ((d && d.holders_with_anomalies) || []).flatMap((h) =>
    (h.anomalies || []).map((a) => ({
      person: h.user, name: h.full_name || h.user,
      kind: a.type, detail: a.message,
    })));
  const types = Object.keys(ANOMALY_LABELS).map((k) => ({
    key: k, ...ANOMALY_LABELS[k],
    count: items.filter((i) => i.kind === k).length,
  })).filter((t) => t.count);
  return { items, types, count: (d && d.count) || items.length, note: d && d.note };
};
/**
 * ⚠️ FORMES — liste NUE serveur, lexique mappé (acted_on/acted_by/
 * target_user/warnings_acknowledged) ; avant/après = QUATRE listes serveur,
 * concaténées ICI pour l'affichage (jamais reconstruites).
 */
export const listGrantJournal = async (p) => {
  const rows = await call('portal_app.api.identity.role_administration.get_assignment_journal',
    { limit: (p && p.limit) || 100 });
  const join = (roles, scopes) => [
    ...(roles || []),
    ...((scopes || []).map((x) => 'liaison ' + x)),
  ].join(' · ') || '—';
  return { immutable: true, items: (rows || []).map((r) => ({
    at: r.acted_on, author: r.acted_by, target: r.target_user,
    action: r.action, accuses: r.warnings_acknowledged || [],
    before: join(r.roles_before, r.scopes_before),
    after: join(r.roles_after, r.scopes_after),
    reason: r.reason,
  })) };
};
