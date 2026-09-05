/**
 * VOCABULAIRE-PERMISSIONS-02 — campus/DEC-CAMPUS §29 amendé.
 *
 * La liste canonique des clés, et rien d'autre : ni titulaires, ni portées.
 *
 * ⚠️ CE SONT LES GARDES SERVEUR QUI FONT FOI. La version 01 dérivait d'une
 * lecture de la matrice des rôles et portait cinq écarts — dont une clé,
 * `arbitrate:dossiers`, qui couvrait deux actes aux acteurs distincts et violait
 * donc le principe qu'elle servait. Les gardes sont éprouvées ; la matrice ne
 * l'était pas.
 *
 * ⚠️ Une permission dit CE QU'ON PEUT FAIRE, jamais SUR QUOI : la portée est un
 * objet distinct, déjà résolu par la session. Un responsable de formation porte
 * `read:structure` comme le staff à qui la garde l'ouvre — c'est la portée qui le
 * limite à sa filière, pas la permission.
 *
 * ⚠️ Une permission n'est PAS une garde : elle rend une action visible ou
 * absente (règle 3). Le refus qui fait autorité reste au serveur, à l'acte. Et
 * une permission plus large qu'une garde produit un bouton mort — pire qu'un
 * bouton absent.
 *
 * Ce fichier existe pour qu'aucun écran n'invente une clé. L'audit refuse toute
 * clé absente de cette liste : c'est le filet matrice↔gardes, côté interface.
 */
export const PERMISSIONS = [
  // Structure, charpente et calendrier.
  // La charpente — années, semestres, filières — n'est PAS la maquette : elle a
  // sa clé, portée par le gestionnaire académique.
  'read:structure', 'write:structure', 'validate:structure',
  'write:charpente', 'write:calendar',

  // Groupes et inscriptions
  'read:groups', 'write:groups',

  // Répartition de service — écrire et valider sont deux droits : un responsable
  // de formation répartit sans valider, le directeur des études valide sans
  // répartir.
  'read:service', 'write:service', 'validate:service',

  // Planning et examens. Planifier et publier restent deux clés bien que
  // l'acteur soit le même aujourd'hui : publier vaut CONVOCATION, l'acte a des
  // effets externes. Déroger change d'acteur au milieu du geste.
  'read:planning', 'write:planning', 'publish:planning', 'derogate:planning',
  'write:exams',

  // Notes et délibération
  'control:grades', 'deliberate', 'close:deliberation',

  // Dossiers. `arbitrate:leave` et `decide:appeal` étaient une seule clé jusqu'à
  // la version 02 : l'arbitrage d'un congé appartient au Director, la décision
  // d'appel disciplinaire à la Direction. Deux actes, deux acteurs, deux clés.
  'read:dossiers', 'instruct:dossiers', 'decide:dossiers',
  // AN-06 (M1) : clé DÉDIÉE de la file « sans décideur » — porteurs matrice :
  // DE, Direction, Director (STALLED_DOSSIERS_BEARERS, permission_matrix.py).
  'read:stalled_dossiers',
  'arbitrate:leave', 'decide:appeal',

  // Conseil pédagogique — préparer n'est pas tenir.
  'read:council', 'prepare:council', 'hold:council',

  // Documents
  'emit:documents',

  // Diplomation — présenter une éligibilité n'est pas la décider.
  'read:graduation', 'present:graduation', 'decide:graduation',

  // Clôture et administration. `close:year` appartient au **Director**, non à la
  // Direction : deux rôles de nom voisin, confondus dans la version 01.
  'close:year', 'grant_role',
];

/** Pour une recherche en temps constant, dans l'audit comme à l'exécution. */
export const PERMISSION_SET = new Set(PERMISSIONS);

/**
 * Vrai si la clé appartient au vocabulaire. Aucun écran n'appelle ceci — c'est
 * l'audit qui s'en sert. Un écran pose une question à la session (`can()`), il
 * ne valide pas son propre vocabulaire.
 */
export const isKnownPermission = (key) => PERMISSION_SET.has(key);
