// usePageTitle — le titre de la barre du haut posé par la page elle-même (MANDAT-14, P27 de VERDICT-MANDAT-14-PC1C).
// La barre lit `meta.label` de la route ; une page dont le titre vient des données (le nom d'un module) le pose ici,
// pour SON chemin : en quittant la page, le chemin change et la barre revient d'elle-même au libellé de la route.
import { reactive } from 'vue';

const etat = reactive({ path: null, title: null });

/** Pose le titre de la page servie à `path`. */
export function setPageTitle(path, title) {
  etat.path = path;
  etat.title = title || null;
}

/** Le titre posé pour `path`, ou null. */
export function pageTitleFor(path) {
  return etat.path === path ? etat.title : null;
}
