<template>
  <div>
    <header class="mb-4 flex flex-wrap items-start gap-4">
      <div>
        <p class="mb-2 text-caption text-ln-gray-500">
          Conseil pédagogique · <b class="font-semibold text-ln-gray-900">Seuils d'absence</b>
        </p>
        <h1 class="text-h1 tracking-tight text-ln-gray-900">Signaux de seuils d'absence</h1>
        <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
      </div>
      <div class="ml-auto">
        <button type="button" class="ln-btn-secondary" @click="exportList">Exporter</button>
      </div>
    </header>

    <StateBanner variant="info" lead="Rien ne se déclenche seul.">
      Franchir un seuil ne produit ni avertissement, ni convocation, ni inscription au dossier. Le
      système compte et affiche ; <b class="font-semibold">l'acte appartient à quelqu'un</b>, et tant
      qu'il n'est pas posé la ligne reste ici.
    </StateBanner>

    <BlockState v-if="state !== 'ready'" :state="state === 'denied' ? 'loading' : state"
                title="Aucun seuil franchi"
                message="Aucun étudiant n’atteint le premier seuil sur ce semestre. C’est l’état normal d’un semestre sans décrochage."
                :rows="5" :row-height="56" :skeleton-widths="[180, 'auto', 220]"
                @retry="reload" />

    <template v-else>
      <section v-for="block in blocks" :key="block.key"
               class="mb-5 overflow-hidden rounded-md-ln border last:mb-0"
               :class="block.level === 2 ? 'border-ln-error' : 'border-ln-warning'">
        <header class="flex items-start gap-3 border-b px-4 py-3"
                :class="block.level === 2 ? 'border-ln-error-bg bg-ln-error-bg' : 'border-ln-warning-bg bg-ln-warning-bg'">
          <div>
            <h2 class="text-[15px] font-semibold text-ln-gray-900">{{ block.title }}</h2>
            <p class="mt-0.5 text-body-sm font-semibold"
               :class="block.level === 2 ? 'text-ln-error' : 'text-ln-warning'">{{ block.verb }}</p>
            <p class="mt-1 max-w-3xl text-caption leading-relaxed text-ln-gray-700">{{ block.note }}</p>
          </div>
          <span class="ml-auto text-h2 tabular text-ln-gray-900">{{ block.count }}</span>
        </header>

        <ul>
          <li v-for="row in block.items" :key="row.student"
              class="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-ln-gray-100 px-4 py-3 last:border-b-0">
            <span class="w-[180px] flex-shrink-0">
              <b class="text-body-sm font-semibold text-ln-gray-900">{{ row.student_name }}</b>
              <span class="block font-mono text-[11.5px] text-ln-gray-500">{{ row.student }}</span>
            </span>
            <span class="min-w-[280px] flex-1 text-caption leading-relaxed text-ln-gray-600">
              {{ row.program_label }} · <b class="font-semibold text-ln-gray-900">{{ row.sessions }} séances</b>
              / {{ row.modules }} modules · dernière absence le {{ row.last_absence }}
              <!-- ⚠️ LE FAIT QUI JUSTIFIE DEUX ACTES PLUTÔT QU'UN. Il est écrit en
                   clair : sans lui, on croirait à un doublon d'interface. -->
              <b v-if="!row.first_pronounced && row.level === 2" class="block font-semibold text-ln-error">
                Aucun avertissement prononcé — les deux seuils sont franchis, et le premier reste dû.
              </b>
              <span v-else-if="row.first_pronounced_on" class="block text-ln-gray-500">
                Avertissement du premier seuil prononcé le {{ row.first_pronounced_on }}
              </span>
            </span>
            <span class="ml-auto flex flex-wrap items-center gap-2">
              <StatusPill :status="row.status" :label="row.status_label" />
              <!-- Les actes sont DÉRIVÉS de la ligne au simulacre, jamais énumérés
                   ici : c'est ce qui garantit que les deux restent proposés. -->
              <button v-for="a in row.acts" :key="a" type="button"
                      class="inline-flex h-[26px] items-center rounded-sm-ln border border-ln-gray-300 bg-white px-2.5 text-caption font-semibold text-ln-gray-700"
                      @click="doAct(row, a)">{{ ACTS[a] }}</button>
            </span>
          </li>
        </ul>
      </section>

      <p class="mt-4 rounded-md-ln border border-ln-gray-200 bg-ln-gray-50 px-4 py-3 text-caption leading-relaxed text-ln-gray-600">
        Le décompte porte les <b class="font-semibold text-ln-gray-900">absences non justifiées</b>,
        <b class="font-semibold text-ln-gray-900">toutes séances confondues</b>, sur le semestre —
        arrêté au {{ data.computed_at }}. Un justificatif accepté retire la séance du compte et peut
        faire repasser un étudiant sous le seuil. Un avertissement déjà prononcé, lui,
        <b class="font-semibold text-ln-gray-900">subsiste</b> : il se retire par un acte motivé du
        directeur des études, jamais tout seul. Le nombre de modules concernés est affiché pour la
        lecture ; il n'entre dans aucun seuil.
      </p>
    </template>

    <StateBanner v-if="pending" variant="warning" lead="Acte non disponible." :text="pending" class="mt-4" />
  </div>
</template>

<script setup>
/**
 * Grappe 8 · écran N11 du lot 7 — les deux seuils d'absence.
 *
 * ⚠️ FRANCHIR LE SECOND SEUIL N'EFFACE PAS LE PREMIER, et c'est la décision de
 * conception de cet écran.
 *
 * Deux seuils, deux verbes : au-delà de dix séances un avertissement À PRONONCER,
 * au-delà de quinze une convocation À ENVISAGER. Un étudiant qui franchit le second
 * sans que le premier ait été prononcé doit voir les DEUX actes proposés — sinon
 * l'avertissement reste dû indéfiniment, et personne ne le sait.
 *
 * ⚠️ Les actes proposés sont DÉRIVÉS de l'état de la ligne au simulacre (`acts`),
 * jamais énumérés dans la vue. Une cascade de conditions dans le patron aurait été
 * la même règle écrite deux fois, et elle aurait divergé au premier amendement.
 *
 * ⚠️ Et l'écran ne présente jamais l'acte comme fait : tant que personne ne l'a
 * prononcé, la ligne reste dans la liste.
 *
 * 🔴 `list_absence_thresholds` n'est pas tranché : voir `api/council.js`.
 */
import { computed, onMounted, ref, watch } from 'vue';
import { StateBanner, StatusPill } from '../components/index.js';
import BlockState from '../components/internal/BlockState.vue';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { useResource } from '../composables/useResource.js';
import { listAbsenceThresholds } from '../api/council.js';

/** Le libellé de chaque acte dérivé. Une seule table, ici. */
const ACTS = {
  avertissement: 'Prononcer l’avertissement…',
  convocation: 'Retenir pour la séance',
  seance: 'Ouvrir la séance',
  preconisation: 'Voir la préconisation',
};

const { params } = useAcademicContext();
const res = useResource(listAbsenceThresholds, {
  isEmpty: (d) => !(d?.blocks || []).some((b) => b.items.length),
});
const state = res.state;
const pending = ref('');

const data = computed(() => res.data.value || {});
const blocks = computed(() => data.value.blocks || []);

const subtitle = computed(() => {
  if (state.value !== 'ready') return 'Chargement des signaux';
  const first = blocks.value.find((b) => b.level === 1);
  const second = blocks.value.find((b) => b.level === 2);
  const due = (second?.items || []).filter((r) => !r.first_pronounced).length;
  return [
    (first?.count || 0) + ' étudiants au premier seuil',
    (second?.count || 0) + ' au second',
    due ? due + ' dont l’avertissement du premier reste dû' : null,
    'sur ' + data.value.programs + ' filières',
  ].filter(Boolean).join(' · ');
});

function doAct(row, key) {
  if (key === 'seance' || key === 'preconisation') {
    pending.value = ACTS[key] + ' pour ' + row.student_name + ' mène à un écran de la grappe 8 '
      + 'dont la lecture n’est pas tranchée. Rien n’a été modifié.';
    return;
  }
  pending.value = 'Cet acte appelle `pronounce_absence_warning`, dont le point d’entrée n’est pas '
    + 'tranché. La ligne reste dans la liste — c’est exactement ce qu’elle doit faire tant que '
    + 'personne n’a prononcé.';
}

function exportList() {
  pending.value = 'L’export n’est pas branché : le décompte est arrêté à une date, et un fichier '
    + 'sans cette date se lirait comme un état courant.';
}

function reload() { res.load({ ...params.value }); }
// Le contexte arrive APRÈS le mount en mode serveur (stabilisation §5) :
// même patron que le planning — on ne part pas sans le semestre, et on
// recharge quand il arrive. (Les signatures serveur du conseil sont
// positionnelles : un appel sans terme fait 500, pas un vide.)
onMounted(() => { if (params.value.term) reload(); });
watch(params, reload);
</script>
