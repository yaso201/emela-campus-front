import { createRouter, createWebHashHistory } from 'vue-router';
import { NAV_ITEMS } from './nav.js';
import WorkQueueView from './views/WorkQueueView.vue';
import AtelierView from './views/AtelierView.vue';
import StructureView from './views/StructureView.vue';
import RepartitionView from './views/RepartitionView.vue';
import PlanningView from './views/PlanningView.vue';
import DeliberationView from './views/DeliberationView.vue';
import DossiersView from './views/DossiersView.vue';
import AwaitingDeciderView from './views/AwaitingDeciderView.vue';
import GradeControlView from './views/GradeControlView.vue';
import ExamView from './views/ExamView.vue';
import RepartitionValidationView from './views/RepartitionValidationView.vue';
import TeacherLoadView from './views/TeacherLoadView.vue';
import ServiceSignalsView from './views/ServiceSignalsView.vue';
import ServiceProgressView from './views/ServiceProgressView.vue';
import GroupsView from './views/GroupsView.vue';
import EnrollmentView from './views/EnrollmentView.vue';
import PendingView from './views/PendingView.vue';
import CouncilCandidatesView from './views/CouncilCandidatesView.vue';
import CouncilSessionView from './views/CouncilSessionView.vue';
import CouncilRecommendationsView from './views/CouncilRecommendationsView.vue';
import CouncilAbsenceView from './views/CouncilAbsenceView.vue';
import DocumentsView from './views/DocumentsView.vue';
import ClosureView from './views/ClosureView.vue';
import GraduationView from './views/GraduationView.vue';
import RolesView from './views/RolesView.vue';

/**
 * Le routeur DÉRIVE de la navigation déclarée : ajouter un écran, c'est ajouter
 * une entrée dans nav.js, jamais une route dans une vue.
 *
 * Historique à dièse : l'application est servie en même origine, sans que la
 * desserte ait à réécrire les URL profondes. L'agent de développement passera à
 * createWebHistory quand la réécriture sera en place.
 */
const VIEWS = {
  WorkQueueView, AtelierView, StructureView,
  RepartitionView, RepartitionValidationView, TeacherLoadView,
  ServiceSignalsView, ServiceProgressView,
  GroupsView, EnrollmentView,
  PlanningView,
  DeliberationView, GradeControlView, ExamView,
  DossiersView, AwaitingDeciderView,
  CouncilCandidatesView, CouncilSessionView, CouncilRecommendationsView, CouncilAbsenceView,
  DocumentsView, ClosureView, GraduationView, RolesView,
};

const routes = NAV_ITEMS.map((item) => {
  const component = VIEWS[item.view] || PendingView;
  return {
    path: item.path,
    name: item.key,
    component,
    // Les props ne vont qu'à PendingView, seule vue qui les déclare. Les passer
    // à une vue sans defineProps les ferait retomber en ATTRIBUTS sur sa racine
    // — dont un title, qui devient une infobulle native sur toute la page.
    ...(component === PendingView
      ? { props: { navKey: item.key, title: item.label, grappe: item.grappe } }
      : {}),
    meta: { need: item.need || null, grappe: item.grappe },
  };
});

routes.push({ path: '/', redirect: '/a-traiter' });
routes.push({ path: '/:pathMatch(.*)*', redirect: '/a-traiter' });

export const router = createRouter({ history: createWebHashHistory(), routes });
