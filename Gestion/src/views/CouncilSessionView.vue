<template>
  <div>
    <header class="mb-4">
      <p class="mb-2 text-caption text-ln-gray-500">
        Conseil pédagogique · <b class="font-semibold text-ln-gray-900">Séance du {{ dateLabel }}</b>
      </p>
      <h1 class="text-h1 tracking-tight text-ln-gray-900">Séance du {{ dateLabel }}</h1>
      <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
    </header>

    <!-- ⚠️ LE SEUL DISPOSITIF DU SYSTÈME QUI INTERVIENT PENDANT QU'ON PEUT ENCORE
         AGIR — tout le reste constate. L'écran reste un procès-verbal. -->
    <StateBanner variant="error" lead="Le conseil ne prononce aucune décision.">
      Ni progression, ni redoublement, ni exclusion : il constate, il alerte, il préconise. Les
      décisions appartiennent au jury de fin d'année, à qui <b class="font-semibold">toutes</b> les
      préconisations de cette séance seront transmises —
      <router-link :to="{ name: 'council-preconisations' }" class="font-semibold">par affichage permanent</router-link>,
      non par un envoi qui les figerait.
    </StateBanner>

    <BlockState v-if="state !== 'ready'" :state="state === 'denied' ? 'loading' : state"
                title="Aucune séance"
                message="Aucune séance n’est préparée pour ce semestre. La préparation se fait depuis la liste des candidats."
                :rows="5" :row-height="56" :skeleton-widths="[180, 240, 120]"
                @retry="reload" />

    <div v-else class="grid items-start gap-5 xl:grid-cols-[392px_1fr]">
      <div>
        <!-- MANDAT-12 (S-17) : l'ordre du jour est CELUI DU SERVEUR ; il n'y a pas d'heure d'examen
             (aucun champ ne la porte) : la séance se tient en une fois, à la clôture (Q5 de la PC1). -->
        <WorkQueue title="Ordre du jour" :items="agendaItems" :selected-id="selectedId"
                   :total="data.agenda.length" state="ready" @select="select" />
        <p class="mt-3 rounded-md-ln border border-ln-gray-200 bg-ln-gray-50 px-4 py-3 text-caption leading-relaxed text-ln-gray-600">
          Une <b class="font-semibold text-ln-gray-900">absence non justifiée</b> à la convocation est
          portée au jury de fin d'année — c'est le seul effet automatique de la séance. La convocation
          est notifiée dans l'espace de l'étudiant : il la voit et peut justifier son absence.
        </p>
      </div>

      <div class="flex flex-col gap-4">
        <!-- L'état de la séance et l'acte qui la fait avancer : convoquer (EM), tenir (DE). -->
        <section class="overflow-hidden rounded-md-ln border border-ln-gray-200">
          <header class="flex flex-wrap items-center gap-3 border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
            <div class="mr-auto">
              <h3 class="text-[14px] font-semibold text-ln-gray-900">{{ STEP[data.status].title }}</h3>
              <p class="mt-0.5 text-caption text-ln-gray-500">{{ STEP[data.status].text }}</p>
            </div>
            <StatusPill :status="STEP[data.status].tone" :label="data.status" />
          </header>

          <div v-if="data.status === 'Brouillon'" class="px-4 py-3">
            <button v-if="data.can_convoke" type="button" class="ln-btn-primary" :disabled="busy" @click="convoke">
              Convoquer les {{ data.agenda.length }} étudiants
            </button>
            <p v-else class="text-caption text-ln-gray-500">{{ data.convoke_blocked_reason }}</p>
          </div>

          <div v-else-if="data.status === 'Convoquée'" class="px-4 py-3">
            <template v-if="data.can_close">
              <p class="mb-2 text-caption leading-relaxed text-ln-gray-600">
                Tenir la séance constate, pour chaque convoqué, sa présence — et pour un absent, si son absence
                est <b class="font-semibold">non justifiée</b> (portée au jury). Une observation peut accompagner chaque ligne.
              </p>
              <table class="w-full table-fixed border-collapse text-body-sm">
                <thead>
                  <tr>
                    <th :class="headTh" class="!text-left">Étudiant</th>
                    <th :class="headTh" class="!text-left">Présence constatée</th>
                    <th :class="headTh" class="!text-left">Observation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="a in data.agenda" :key="a.student">
                    <td :class="bodyTd" class="!text-left">{{ a.student_name }}</td>
                    <td :class="bodyTd" class="!text-left">
                      <select v-model="attendance[a.student].presence" :aria-label="'Présence de ' + a.student_name"
                              class="h-9 w-full rounded-sm-ln border border-ln-gray-300 bg-white px-2 text-caption">
                        <option value="" disabled>—</option>
                        <option value="present">Présent</option>
                        <option value="absent_justifie">Absent, justifié</option>
                        <option value="absent_non_justifie">Absent, non justifié</option>
                      </select>
                    </td>
                    <td :class="bodyTd" class="!text-left">
                      <input v-model="attendance[a.student].notes" type="text" :aria-label="'Observation sur ' + a.student_name"
                             class="h-9 w-full rounded-sm-ln border border-ln-gray-300 px-2 text-caption" placeholder="Facultatif" />
                    </td>
                  </tr>
                </tbody>
              </table>
              <div class="mt-3 flex items-center gap-3">
                <p class="mr-auto text-caption text-ln-gray-500">
                  {{ unset ? unset + ' présence(s) à constater avant de tenir la séance.' : 'Une séance tenue ne se modifie plus : elle est la source que lit le jury.' }}
                </p>
                <button type="button" class="ln-btn-primary" :disabled="!!unset || busy" @click="hold">Tenir la séance</button>
              </div>
            </template>
            <p v-else class="text-caption leading-relaxed text-ln-gray-500">
              <b class="font-semibold text-ln-gray-700">Tenir la séance est indisponible :</b> {{ data.close_blocked_reason }}
            </p>
          </div>

          <div v-else class="px-4 py-3 text-caption leading-relaxed text-ln-gray-600">
            Tenue le {{ frDate(data.held_on) }} par <b class="font-semibold text-ln-gray-900">{{ data.chair?.label }}</b>.
            {{ absentCount }} absence(s) non justifiée(s) portée(s) au jury.
          </div>
        </section>

        <ObjectPanel v-if="subject" :title="subject.student_name" :subtitle="subject.student" :state="'ready'">
          <template #header-right>
            <StatusPill :status="PRESENCE[subject.presence || 'none'].tone" :label="PRESENCE[subject.presence || 'none'].label" />
          </template>
          <h4 class="mb-2 text-micro font-bold uppercase tracking-wider text-ln-gray-500">
            Pourquoi il est convoqué
            <span class="normal-case tracking-normal text-ln-warning">— instantané figé à la préparation, non délibéré</span>
          </h4>
          <p class="rounded-md-ln border border-ln-gray-200 bg-ln-gray-50 px-4 py-3 text-body-sm text-ln-gray-900">{{ subject.criteria_snapshot }}</p>
          <p class="mt-2 text-caption text-ln-gray-500">
            Les critères sont ceux du jour de la préparation (Art. 32.2) ; le calcul du jour de séance peut différer — l'instantané fait foi.
          </p>
          <h4 class="mb-2 mt-5 text-micro font-bold uppercase tracking-wider text-ln-gray-500">Préconisations rendues pour cette séance</h4>
          <ul v-if="subject.preconisation_list.length" class="rounded-md-ln border border-ln-gray-200 px-4 py-2">
            <li v-for="p in subject.preconisation_list" :key="p.name" class="flex items-center gap-3 py-1.5 text-caption">
              <span class="font-mono text-[11px] text-ln-gray-500">{{ p.name }}</span>
              <span class="text-ln-gray-900">{{ p.kind }}</span>
              <StatusPill class="ml-auto" status="propose" :label="p.status" />
            </li>
          </ul>
          <p v-else class="rounded-md-ln border border-dashed border-ln-gray-300 px-4 py-3 text-caption text-ln-gray-500">
            Aucune préconisation pour cet étudiant. Examiner sans préconiser est un résultat valable — et c'est le cas majoritaire.
          </p>
          <p class="mt-2 text-caption">
            <router-link :to="{ name: 'council-preconisations' }" class="font-semibold text-ln-blue-600">Ajouter ou suivre une préconisation</router-link>
            <span class="text-ln-gray-500"> — dans la liste de l'année, rattachée à cette séance.</span>
          </p>
        </ObjectPanel>
      </div>
    </div>

    <StateBanner v-if="actError" variant="error" lead="L'acte a échoué." :text="actError" class="mt-4" />
  </div>
</template>

<script setup>
/**
 * Grappe 8 · écran N9 du lot 7 — la séance, sur le contrat S-17 (MANDAT-12, maquette M5 validée PC1B).
 *
 * Ce que l'écran ne fait plus : afficher une heure d'ouverture, une heure d'examen, une filière ou un
 * président que rien ne porte (Q4 de la PC1 — ils sont déclarés `unavailable` par le serveur, jamais
 * inventés) ; offrir « Enregistrer et passer au suivant » ou « Examiner sans préconisation », qui
 * n'avaient aucun verbe serveur (Q5 — la séance se TIENT en une fois, présences de tout l'ordre du jour).
 * Ce qu'il fait : convoquer (EM, Q6 — l'acte révélé), tenir (DE), et dire pourquoi un acte est
 * indisponible avec la phrase du SERVEUR (`close_blocked_reason`, `convoke_blocked_reason`) — y compris
 * avant la date de la séance (C7 de la PC1B).
 */
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ObjectPanel, StateBanner, StatusPill, WorkQueue, headTh, bodyTd } from '../components/index.js';
import BlockState from '../components/internal/BlockState.vue';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { useResource } from '../composables/useResource.js';
import { getCouncilSession, convokeCouncilSession, closeCouncilSession } from '../api/council.js';

const { params } = useAcademicContext();
const res = useResource(getCouncilSession, { isEmpty: (d) => !d?.agenda?.length });
const state = res.state;
const selectedId = ref(null);
const busy = ref(false);
const actError = ref('');
const attendance = reactive({});

const data = computed(() => res.data.value || { agenda: [], status: 'Brouillon' });
const subject = computed(() => data.value.subject || null);

const STEP = {
  Brouillon: { title: 'Séance en préparation', text: 'L’ordre du jour s’ajuste tant que la séance n’est pas convoquée.', tone: 'brouillon' },
  Convoquée: { title: 'Séance convoquée', text: 'Les étudiants ont été notifiés ; la date ne se modifie plus.', tone: 'propose' },
  Tenue: { title: 'Séance tenue', text: 'Un fait : le jury lit cette source.', tone: 'valide' },
};
const PRESENCE = {
  present: { label: 'Présent', tone: 'valide' },
  absent_justifie: { label: 'Absent, justifié', tone: 'brouillon' },
  absent_non_justifie: { label: 'Absent, non justifié', tone: 'suspendue' },
  none: { label: 'Présence non constatée', tone: 'brouillon' },
};

/** Une date ISO (2026-09-10) à la française (10/09/2026) — affichage seul. */
function frDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : (iso || '…');
}
const dateLabel = computed(() => frDate(data.value.date));
const agendaItems = computed(() => data.value.agenda.map((a) => ({
  id: a.student,
  title: a.student_name,
  subtitle: (a.convoked_on ? 'Convoqué le ' + frDate(a.convoked_on) : 'Non convoqué') + ' · ' + PRESENCE[a.presence || 'none'].label
    + (a.preconisations ? ' · ' + a.preconisations + ' préconisation' : ''),
  status: PRESENCE[a.presence || 'none'].tone,
  statusLabel: PRESENCE[a.presence || 'none'].label,
})));
const subtitle = computed(() => {
  if (state.value !== 'ready') return 'Chargement de la séance';
  const d = data.value;
  return [
    d.convoked ? d.convoked + ' étudiants convoqués' : d.agenda.length + ' étudiants à convoquer',
    d.status === 'Tenue' ? d.examined_count + ' examinés' : null,
    d.chair ? 'tenue par ' + d.chair.label : 'présidée par le directeur des études qui tient la séance',
  ].filter(Boolean).join(' · ');
});
const unset = computed(() => data.value.agenda.filter((a) => !attendance[a.student]?.presence).length);
const absentCount = computed(() => data.value.agenda.filter((a) => a.presence === 'absent_non_justifie').length);

// Revue de code MANDAT-12 (bas 10) : les présences saisies appartiennent à UNE séance — un changement de séance (autre
// semestre, autre nom) les efface, sinon une présence constatée en S1 se reporterait sur le même étudiant en S2.
const attendanceFor = ref(null);
watch(() => [data.value.name, data.value.agenda], ([name, rows]) => {
  if (name !== attendanceFor.value) { for (const k of Object.keys(attendance)) delete attendance[k]; attendanceFor.value = name; }
  for (const a of rows) if (!attendance[a.student]) attendance[a.student] = { presence: a.presence || '', notes: '' };
}, { immediate: true });

function select(student) { selectedId.value = student; res.load({ ...params.value, name: data.value.name, student }); }
async function act(fn) {
  actError.value = '';
  try { busy.value = true; await fn(); reload(); }
  catch (e) { actError.value = e.message || 'Acte refusé.'; }
  finally { busy.value = false; }
}
function convoke() { act(() => convokeCouncilSession({ name: data.value.name })); }
function hold() {
  act(() => closeCouncilSession({
    name: data.value.name,
    attendance: data.value.agenda.map((a) => ({
      student: a.student,
      present: attendance[a.student].presence === 'present' ? 1 : 0,
      unjustified_absence: attendance[a.student].presence === 'absent_non_justifie' ? 1 : 0,
      notes: attendance[a.student].notes || undefined,
    })),
  }));
}
function reload() { res.load({ ...params.value, name: data.value.name || undefined, student: selectedId.value || undefined }); }
// Revue adversariale MANDAT-12 (M8) : un CHANGEMENT DE CONTEXTE relit la séance du nouveau semestre — sans le nom
// de la séance affichée (qui appartient à l'ancien), et sans sujet choisi.
function loadForContext() { selectedId.value = null; res.load({ ...params.value }); }
onMounted(() => { if (params.value.term) loadForContext(); });
watch(params, loadForContext);
</script>
