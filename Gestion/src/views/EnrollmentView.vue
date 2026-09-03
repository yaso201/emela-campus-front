<template>
  <div>
    <header class="mb-4 flex flex-wrap items-start justify-between gap-5">
      <div>
        <p class="mb-2 text-caption text-ln-gray-500">Groupes · <b class="font-semibold text-ln-gray-900">Inscriptions</b></p>
        <h1 class="text-h1 tracking-tight text-ln-gray-900">Inscriptions administratives</h1>
        <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
      </div>
      <router-link :to="{ name: 'groups' }" class="ln-btn-secondary">Groupes</router-link>
    </header>

    <StateBanner v-if="pending" variant="warning" lead="Acte non disponible." :text="pending" />

    <div class="mb-4 flex flex-wrap items-center gap-2">
      <button v-for="t in tabs" :key="t.key" type="button"
              class="inline-flex h-[30px] items-center gap-1.5 rounded-sm-ln border px-3 text-caption font-medium"
              :class="t.key === tab ? 'border-ln-blue-900 bg-ln-blue-900 font-semibold text-white' : 'border-ln-gray-300 text-ln-gray-700'"
              @click="tab = t.key">{{ t.label }}<span v-if="t.count" class="tabular opacity-70">{{ t.count }}</span></button>
    </div>

    <!-- ══ Une inscription et son rapport ligne à ligne ══════════════════ -->
    <template v-if="tab === 'report'">
      <StateBanner variant="info" lead="Une inscription est une cascade, pas un acte.">
        Étudiant, inscription au programme, inscription pédagogique, compte utilisateur, rattachement
        aux groupes. Chaque étape réussit ou échoue seule — le <b class="font-semibold">succès partiel
        est courant ici</b>, pas exceptionnel. Le rapport dit ce qui est passé et ce qui ne l'est pas.
      </StateBanner>

      <!-- ⚠️ Les cinq états, ici comme partout. Sans cette branche, un vide, une
           erreur ou un refus laissaient la zone blanche — ET LE SIGNALEMENT DU
           BADGE AVEC, qui est la raison d'être de cet onglet. -->
      <BlockState v-if="reportShownState !== 'ready'"
                  :state="reportShownState === 'denied' ? 'loading' : reportShownState"
                  title="Aucune inscription à afficher"
                  :message="shownLog
                    ? 'Ce journal d’inscription n’a pas pu être lu.'
                    : 'Aucune inscription récente pour cette année — la file des reprises est vide. Cet onglet s’ouvre sur le dernier journal qu’elle désigne.'"
                  :rows="5" :skeleton-widths="[24, 240, 200]" :row-height="40"
                  @retry="loadReport">
        <template #action>
          <button type="button" class="ln-btn-secondary" @click="tab = 'replay'">Voir les reprises</button>
        </template>
      </BlockState>

      <BatchReport v-else-if="report" :title="'Inscription de ' + report.student_name"
                   :report="reportContract" :retryable="false"
                   ok-label="étapes passées" ko-label="non abouties"
                   :footnote="report.partial_message + ' La reprise se fait depuis l’onglet dédié.'" />

      <!-- ⚠️ T2 — L'INSCRIPTION NE CRÉE PAS LE BADGE D'ACCÈS.
           Sans cette phrase, le gestionnaire croit l'étudiant opérationnel : il
           est inscrit, il a un compte, et il reste à la porte. -->
      <div v-if="report && report.badge && !report.badge.created"
           class="mt-4 flex items-start gap-3 rounded-md-ln border border-[#F3D9A6] bg-ln-warning-bg p-4 text-body-sm leading-relaxed text-[#6B4415]">
        <svg class="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-ln-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M7 10h4M7 14h7" /></svg>
        <p>
          <b class="font-semibold">L'inscription ne crée pas le badge d'accès.</b>
          {{ report.student_name }} est inscrite et dispose de ses cours, mais elle
          <b class="font-semibold">ne franchira aucun portique</b> tant que le badge n'a pas été émis
          par le service compétent. Ce n'est pas un défaut de cette cascade : le badge n'en fait pas
          partie. C'est écrit ici parce que rien d'autre ne le dirait, et qu'un étudiant qu'on croit
          opérationnel se présente au cours.
        </p>
      </div>

      <div v-if="report" class="mt-4 flex flex-wrap gap-2">
        <button type="button" class="ln-btn-secondary" @click="tab = 'replay'">Voir les reprises</button>
        <button type="button" class="ln-btn-secondary" @click="notBuilt('Émission du badge')">Signaler au service des badges</button>
      </div>

      <!-- Le refus disciplinaire : expliqué, pas affiché comme une erreur. -->
      <section v-if="refusedLog" class="mt-6">
        <h4 class="mb-2 text-micro font-bold uppercase tracking-wider text-ln-gray-500">
          Une inscription refusée, et pourquoi
        </h4>
        <BatchReport v-if="refusedState === 'ready' && refused"
                     :title="'Inscription de ' + refused.student_name"
                     :report="refusedContract" :retryable="false"
                     ok-label="étapes passées" ko-label="non abouties"
                     :footnote="refused.partial_message" />
        <p v-else class="rounded-md-ln border border-dashed border-ln-gray-300 bg-ln-gray-50 p-4 text-caption text-ln-gray-500">
          Chargement du journal rejeté.
        </p>
        <p class="mt-3 max-w-3xl text-caption leading-relaxed text-ln-gray-500">
          Un étudiant sous <b class="font-semibold text-ln-gray-900">période disciplinaire active</b> ne
          reçoit aucune inscription. L'écran l'explique — l'acte, la catégorie, les dates — et ne
          présente pas un message d'erreur : il n'y a pas de défaut à corriger, il y a une règle qui
          s'applique. Le motif de la sanction, lui, reste dans son dossier.
        </p>
      </section>
    </template>

    <!-- ══ Les reprises ═══════════════════════════════════════════════════ -->
    <template v-else-if="tab === 'replay'">
      <StateBanner variant="warning" lead="La reprise réutilise ce qui existe déjà.">
        Rejouer une inscription partielle ne recrée ni l'étudiant, ni son inscription au programme :
        elle reprend la cascade là où elle s'est arrêtée. <b class="font-semibold">Aucune
        duplication</b> — c'est écrit dans la fonction serveur.
      </StateBanner>

      <div class="flex items-start gap-3 rounded-md-ln border border-dashed border-ln-error bg-ln-error-bg p-4 text-body-sm leading-relaxed text-[#7A2020]">
        <span class="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ln-error"></span>
        <p>
          <b class="font-semibold">Cet écran n'est pas branché, et je ne l'ai pas contourné.</b>
          La fonction de reprise <b class="font-mono text-[12px]">replay_enrollment_from_log</b> existe
          côté serveur — je l'ai lue — mais elle ne porte pas de décoration d'exposition : sa garde de
          rôle vit chez un autre applicatif. Je n'invente pas de chemin pour l'atteindre. Il faut soit
          l'exposer avec sa garde, soit me donner le chemin de l'appelant qui la porte déjà.
        </p>
      </div>

      <DenseTable class="mt-4" :state="replayState === 'denied' ? 'loading' : replayState" :row-height="44"
                  :skeleton-widths="[150, 260, 140, 130]" max-height="none"
                  state-title="Aucune inscription à reprendre"
                  state-message="Toutes les inscriptions de cette année ont abouti. Ce n'est pas un écran vide : c'est une liste vide."
                  @retry="loadReplays">
        <template #head>
          <tr>
            <th :class="headTh" class="!text-left">Journal</th>
            <th :class="headTh" class="!text-left">Étudiant et cause</th>
            <th :class="headTh" class="!text-left">État du journal</th>
            <th :class="headTh" class="!text-left">Reprise</th>
          </tr>
        </template>
        <template #body>
          <tr v-for="r in replays" :key="r.id" class="hover:bg-ln-gray-50">
            <td :class="bodyTd" class="!text-left">
              <button type="button" class="font-mono text-[11.5px] text-ln-blue-600"
                      @click="pickedLog = r.id; tab = 'report'">{{ r.id }}</button>
            </td>
            <td :class="bodyTd" class="!text-left">
              <b class="font-semibold">{{ r.title }}</b>
              <span class="ml-1.5 text-caption text-ln-gray-500">{{ r.subtitle }}</span>
            </td>
            <td :class="bodyTd" class="!text-left"><StatusPill :status="r.status" :label="r.log_status" /></td>
            <td :class="bodyTd" class="!text-left">
              <button type="button"
                      class="inline-flex h-[26px] items-center rounded-sm-ln border border-ln-gray-300 px-2.5 text-caption font-semibold text-ln-gray-700"
                      @click="runReplay(r.id)">Rejouer…</button>
            </td>
          </tr>
        </template>
        <template #legend>
          <span>Un journal <b class="font-semibold text-ln-gray-900">rejeté</b> a été arrêté avant toute
            écriture : rien n'est à défaire. Un journal <b class="font-semibold text-ln-gray-900">partiel</b>
            a créé l'étudiant — c'est celui-là que la reprise complète.</span>
        </template>
      </DenseTable>
    </template>

    <!-- ══ Les orphelins ══════════════════════════════════════════════════ -->
    <template v-else>
      <StateBanner variant="info" lead="Deux natures, une seule liste.">
        Un étudiant sans groupe n'apparaît à aucune feuille de présence. Un groupe sans enseignant n'a
        aucun titulaire de présence. Ni l'un ni l'autre n'est une erreur — les deux sont des trous que
        personne ne voit sans cette liste.
      </StateBanner>

      <BlockState v-if="orphansState !== 'ready'" :state="orphansState === 'denied' ? 'loading' : orphansState"
                  title="Aucun orphelin"
                  message="Chaque étudiant inscrit porte un groupe, chaque groupe porte un enseignant."
                  :rows="4" :skeleton-widths="[210, 260, 140]" :row-height="42"
                  @retry="loadOrphans">
        <template #action>
          <router-link :to="{ name: 'groups' }" class="ln-btn-secondary">Retour aux groupes</router-link>
        </template>
      </BlockState>

      <section v-for="fam in orphanFamilies" v-else :key="fam.key"
               class="mb-4 overflow-hidden rounded-md-ln border border-ln-gray-200 last:mb-0">
        <header class="flex items-center gap-3 border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
          <span class="text-[14px] font-semibold text-ln-gray-900">{{ fam.title }}</span>
          <span class="min-w-0 flex-1 text-caption leading-snug text-ln-gray-500">{{ fam.description }}</span>
          <span class="tabular flex-shrink-0 rounded-full bg-ln-gray-100 px-2.5 py-0.5 text-caption font-bold text-ln-gray-700">
            {{ (fam.items || []).length }}
          </span>
        </header>
        <p v-if="!(fam.items || []).length" class="px-4 py-4 text-caption text-ln-gray-500">
          Aucun cas de cette nature.
        </p>
        <div v-for="o in fam.items" :key="o.id"
             class="flex min-h-[42px] flex-wrap items-center gap-3 border-b border-ln-gray-100 px-4 py-2 text-body-sm last:border-0">
          <span class="font-semibold text-ln-gray-900">{{ o.subject }}</span>
          <span class="min-w-0 flex-1 text-caption text-ln-gray-500">{{ o.detail }}</span>
          <span class="flex flex-shrink-0 items-center gap-3">
            <StatusPill :status="o.status" :label="o.status_label" />
            <router-link :to="{ name: 'groups' }"
                         class="inline-flex h-[26px] items-center rounded-sm-ln border border-ln-gray-300 px-2.5 text-caption font-semibold text-ln-gray-700">
              Ouvrir les groupes
            </router-link>
          </span>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
/**
 * Grappe 4 · Inscriptions administratives — trois onglets : le rapport d'une
 * inscription, les reprises, les orphelins.
 *
 * ⚠️ T2 — L'INSCRIPTION NE CRÉE PAS LE BADGE D'ACCÈS. C'est la contrainte
 * centrale de cet écran : sans la dire, le gestionnaire croit l'étudiant
 * opérationnel, et l'étudiant se présente au portique. Elle est portée par un
 * encart ambre attaché au rapport, pas par une note de bas de page.
 *
 * ⚠️ Un étudiant sous période disciplinaire active NE REÇOIT AUCUNE INSCRIPTION.
 * L'écran EXPLIQUE le refus — acte, catégorie, dates — au lieu d'afficher une
 * erreur : il n'y a pas de défaut à corriger, il y a une règle qui s'applique.
 * Le motif de la sanction reste dans son dossier.
 *
 * ⚠️ La reprise n'est PAS branchée, et l'écran le dit à la place de contourner :
 * `replay_enrollment_from_log` existe côté serveur mais n'est pas exposée. Un
 * manque nommé vaut mieux qu'un nom inventé.
 */
import { computed, onMounted, ref, watch } from 'vue';
import { DenseTable, StatusPill, StateBanner, BatchReport, headTh, bodyTd } from '../components/index.js';
import BlockState from '../components/internal/BlockState.vue';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { useResource } from '../composables/useResource.js';
import {
  getEnrollmentLog, listIncompleteEnrollments, listMoodleOrphans, replayEnrollment,
} from '../api/groups.js';

const { params } = useAcademicContext();
const pending = ref('');
const tab = ref('report');

/**
 * ⚠️ L'écran LIT un journal ; il ne rejoue pas la cascade.
 *
 * La première version affichait le rapport en appelant
 * `create_student_from_applicant` — l'acte qui CRÉE l'étudiant, son inscription,
 * son compte, ses rattachements — au chargement de la page, avec des identifiants
 * de candidat de mon invention. Ouvrir cet écran aurait tenté de créer deux
 * étudiants au branchement.
 *
 * Un écran qui montre le résultat d'un acte doit lire cet acte. La règle valait
 * pour les noms de points d'entrée ; elle vaut pour les verbes.
 */
const reportRes = useResource(getEnrollmentLog, { isEmpty: (d) => !d });
const replayRes = useResource(listIncompleteEnrollments);
const orphansRes = useResource(listMoodleOrphans, { isEmpty: (d) => !d?.families?.some((f) => f.items?.length) });

const reportState = reportRes.state;

const replayState = replayRes.state;
const orphansState = orphansRes.state;

const report = computed(() => reportRes.data.value || null);
const replays = computed(() => replayRes.data.value?.items || []);

/** Le journal montré : celui qu'on sélectionne, sinon le premier de la file. */
const pickedLog = ref(null);
const shownLog = computed(() => pickedLog.value || replays.value[0]?.id || null);

/**
 * Le refus montré à côté du rapport ordinaire — et JAMAIS le même journal.
 *
 * Sans cette exclusion, cliquer la ligne du journal rejeté le montrait deux fois
 * sur le même écran, l'un sous l'autre, et le paragraphe explicatif décrivait
 * aussi celui du haut : la distinction que cet écran revendique — « montré à côté
 * du rapport, pas à sa place » — s'effondrait.
 *
 * Quand le rapport montré EST le refus, la section du bas disparaît : elle n'a
 * plus rien à mettre en regard, et le rapport du haut porte déjà son motif.
 */
const refusedLog = computed(() => {
  const rejected = replays.value.find((r) => r.log_status === 'Rejeté');
  if (!rejected || rejected.id === shownLog.value) return null;
  return rejected.id;
});

/**
 * ⚠️ L'ÉTAT AFFICHÉ N'EST PAS L'ÉTAT DE LA RESSOURCE.
 *
 * `loadReport()` sort par avance quand aucun journal n'est désigné — et l'état
 * d'une ressource jamais chargée reste « chargement », son initial. Rendre
 * `reportState` tel quel laissait donc l'onglet en SQUELETTE PERPÉTUEL sur
 * `?simulate=empty` : la file vide, donc aucun sujet, donc aucun appel, donc
 * aucun changement d'état. Et le signalement du badge — la raison d'être de cet
 * onglet — n'apparaissait jamais.
 *
 * « Pas encore de sujet » n'est pas « en cours de chargement ». L'état affiché se
 * dérive donc : sans sujet, il suit la FILE, qui est ce qui nomme les sujets.
 *
 * ⚠️ Règle générale : un `load()` à sortie anticipée ne doit jamais voir son état
 * rendu sans garde. Les autres écrans y échappent parce que leurs zones sont
 * gardées par `v-if` sur le sujet ; cet onglet ne l'était pas.
 */
const reportShownState = computed(() => {
  if (shownLog.value) return reportState.value;
  return replayState.value === 'loading' ? 'loading' : 'empty';
});
const orphanFamilies = computed(() => orphansRes.data.value?.families || []);

/**
 * Le CONTRAT DE RAPPORT (D-06) attendu par le composant :
 *   { total, ok, ko, lines: [{ id, label, detail, status, reason, retry_action }] }
 *
 * ⚠️ Les comptes sont DÉRIVÉS des lignes, jamais écrits — c'est la règle 4, et
 * c'est ce que le composant affiche en tête.
 *
 * ⚠️ Une étape en échec porte `reason`, pas `detail` : le composant lit l'un ou
 * l'autre selon le statut. Passer le motif dans `detail` le ferait disparaître.
 *
 * ⚠️ Aucune ligne ne porte `retry_action` : la reprise n'est pas exposée (voir
 * l'onglet des reprises). Un bouton qui ne peut rien faire ne se rend pas.
 */
function toContract(lines) {
  const rows = (lines || []).map((l, i) => ({
    id: 'L' + (i + 1),
    label: l.step || l.label,
    status: l.status,
    detail: l.status === 'ko' ? '' : l.detail,
    reason: l.status === 'ko' ? l.detail : '',
  }));
  return {
    total: rows.length,
    ok: rows.filter((r) => r.status !== 'ko').length,
    ko: rows.filter((r) => r.status === 'ko').length,
    lines: rows,
  };
}
const reportContract = computed(() => toContract(report.value?.lines));

/**
 * Le cas du refus disciplinaire est montré à côté du rapport, pas à sa place :
 * les deux se lisent, et un gestionnaire doit reconnaître la différence entre
 * « la cascade s'est arrêtée » et « la règle l'a interdit ».
 *
 * ⚠️ Il est CHARGÉ, pas recopié. La première version en portait une seconde
 * copie dans la vue, avec une formulation différente de celle de la fixture :
 * deux listes du même fait divergeraient, comme trois fois avant elles.
 */
const refusedRes = useResource(getEnrollmentLog, { isEmpty: (d) => !d });
const refusedState = refusedRes.state;
const refused = computed(() => refusedRes.data.value || null);
const refusedContract = computed(() => toContract(refused.value?.lines));

const tabs = computed(() => [
  { key: 'report', label: 'Rapport d’inscription' },
  { key: 'replay', label: 'À reprendre', count: replays.value.length },
  { key: 'orphans', label: 'Orphelins',
    count: orphanFamilies.value.reduce((n, f) => n + (f.items?.length || 0), 0) },
]);

const subtitle = computed(() => {
  if (tab.value === 'replay') return 'Journaux échoués ou partiels — la reprise ne duplique rien';
  if (tab.value === 'orphans') return 'Étudiants sans groupe, groupes sans enseignant';
  return report.value ? 'Journal ' + report.value.log_name + ' · cascade en ' + (report.value.lines || []).length + ' étapes'
    : 'Chargement du rapport';
});

function notBuilt(what) { pending.value = what + " — cet acte n'est pas encore branché au serveur. Rien n'a été enregistré."; }

/** Nommer le manque, jamais simuler l'acte. */
/**
 * LA REPRISE EST BRANCHÉE — l'appelant existait, et c'est lui qui porte la garde.
 *
 * ⚠️ ACTE D'ÉCRITURE : il rejoue la cascade. Il ne part donc QUE d'un clic, jamais
 * d'un cycle de vie — c'est le défaut le plus grave de cette grappe, et le
 * contrôle d'audit le surveille désormais.
 *
 * ⚠️ L'étudiant déjà créé pour ce candidat est RÉUTILISÉ — aucune duplication.
 * C'est la docstring serveur qui le dit ; l'écran le répète à l'utilisateur, parce
 * que « rejouer » inquiète à juste titre quand on ne sait pas ce qui sera recréé.
 */
async function runReplay(logName) {
  pending.value = '';
  try {
    const fresh = await replayEnrollment({ integration_log: logName });
    // Le journal rendu par l'acte fait foi : l'écran ne fabrique pas son rapport.
    reportRes.data.value = fresh;
    pickedLog.value = logName;
    loadReplays();
  } catch (err) {
    pending.value = 'Reprise de ' + logName + ' — ' + (err.message || 'l’acte a échoué')
      + ' Rien n’a été modifié.';
  }
}

/**
 * Le journal affiché est celui que la file des reprises désigne — le premier par
 * défaut, un autre sur sélection. Aucun identifiant n'est inventé par l'écran :
 * ils viennent d'une lecture de liste.
 */
function loadReport() { if (shownLog.value) reportRes.load({ log_name: shownLog.value }); }

/**
 * Le cas de refus est un journal comme un autre, lu par son nom. Il n'est PLUS
 * derrière un drapeau de mise au point : `__fail` partait dans le corps de la
 * requête au branchement, et ne correspondait à rien côté serveur.
 */
function loadRefused() { if (refusedLog.value) refusedRes.load({ log_name: refusedLog.value }); }
function loadReplays() { replayRes.load(params.value); }
function loadOrphans() { orphansRes.load(params.value); }

// La file d'abord : c'est elle qui nomme les journaux. Les deux lectures suivent.
onMounted(() => { loadReplays(); loadOrphans(); });

/**
 * ⚠️ LA SÉLECTION NE SURVIT PAS AU CHANGEMENT DE CONTEXTE.
 *
 * Sans cette remise à zéro, un journal choisi à la main restait affiché après un
 * changement d'année : `shownLog` gardait l'ancien identifiant, donc le
 * `computed` ne changeait pas de valeur, donc l'observateur ne se déclenchait
 * pas. Le rapport du haut, son sous-titre et l'encart du badge décrivaient un
 * journal de l'année précédente pendant que la file listait ceux de la nouvelle.
 *
 * Et au premier rechargement sur cet identifiant, la lecture aurait levé
 * « introuvable » : la classe « tout sujet liable doit être servable », par la
 * porte du contexte.
 */
watch(params, () => { pickedLog.value = null; loadReplays(); loadOrphans(); });
watch(shownLog, loadReport, { immediate: true });
watch(refusedLog, loadRefused, { immediate: true });
</script>
