<template>
  <div>
    <header class="mb-4">
      <p class="mb-2 text-caption text-ln-gray-500">
        Diplomation · <b class="font-semibold text-ln-gray-900">Dossiers</b>
      </p>
      <h1 class="text-h1 tracking-tight text-ln-gray-900">Dossiers de diplomation</h1>
      <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
    </header>

    <!-- ⚠️ LA THÈSE DU DOMAINE : la machine présente, le jury tranche. Un écran qui
         afficherait « non éligible » comme un refus ferait du jury un enregistreur,
         et lui retirerait l'indulgence que le règlement lui donne. -->
    <StateBanner variant="warning" lead="L’éligibilité est présentée, jamais décidée.">
      Les conditions de l'article 45 sont <b class="font-semibold">calculées et affichées</b> ; le
      jury reste souverain. Il peut attribuer le diplôme à un dossier non éligible — c'est une
      <b class="font-semibold">indulgence motivée</b>, et le motif devient alors obligatoire. « Non
      éligible » est une pièce au dossier, pas une conclusion.
    </StateBanner>

    <BlockState v-if="state !== 'ready'" :state="state === 'denied' ? 'loading' : state"
                title="Aucun dossier de diplomation"
                message="Aucun dossier n’a été instruit sur cette année. L’instruction appartient à l’Education Manager et au gestionnaire académique."
                :rows="4" :row-height="56" :skeleton-widths="[180, 240, 120]"
                @retry="reload" />

    <div v-else class="grid items-start gap-5 xl:grid-cols-[392px_1fr]">
      <div class="flex flex-col gap-5">
        <WorkQueue title="Dossiers" :items="queueItems" :selected-id="selectedId"
                   :total="data.count" state="ready" @select="select" />

        <!-- Le jury est une COMPOSITION (Art. 46), pas un bouton. Le quorum est
             vérifié au serveur : le recompter ici dupliquerait la règle. -->
        <section class="overflow-hidden rounded-md-ln border border-ln-gray-200">
          <header class="flex items-center gap-3 border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
            <div>
              <h3 class="text-[14px] font-semibold text-ln-gray-900">Jury d'attribution</h3>
              <p class="mt-0.5 text-caption text-ln-gray-500">
                Ouvert le {{ data.jury.opened_on }}
              </p>
            </div>
            <span class="ml-auto">
              <StatusPill v-if="data.jury.complete" status="valide" label="Composition conforme" />
              <StatusPill v-else status="anomalie" label="Composition incomplète" />
            </span>
          </header>
          <ul class="px-4 py-3">
            <li v-for="(m, i) in data.jury.members" :key="i"
                class="mb-2 flex items-baseline gap-3 last:mb-0">
              <span class="w-[150px] flex-shrink-0 text-caption text-ln-gray-500">{{ m.role }}</span>
              <span class="text-body-sm text-ln-gray-900">{{ m.person }}</span>
            </li>
          </ul>
          <p class="border-t border-ln-gray-200 bg-ln-gray-50 px-4 py-3 text-caption leading-relaxed text-ln-gray-600">
            Article 46 — {{ data.jury.rule }} La conformité est vérifiée au serveur : cet écran la
            lit, il ne la recompte pas.
          </p>
        </section>
      </div>

      <div>
        <ObjectPanel v-if="dossier" :title="dossier.student_name" :subtitle="panelSubtitle"
                     state="ready">
          <template #header-right>
            <StatusPill :status="dossier.status" :label="dossier.status_label" />
          </template>

          <h4 class="mb-2 text-micro font-bold uppercase tracking-wider text-ln-gray-500">
            Conditions de l'article 45 — présentées
          </h4>
          <ul class="overflow-hidden rounded-md-ln border border-ln-gray-200">
            <li v-for="c in dossier.conditions" :key="c.label"
                class="flex flex-wrap items-start gap-x-4 gap-y-1 border-b border-ln-gray-100 px-4 py-2.5 last:border-b-0">
              <span class="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-micro font-bold"
                    :class="c.met ? 'bg-ln-success-bg text-ln-success' : 'bg-ln-error-bg text-ln-error'"
                    aria-hidden="true">{{ c.met ? '✓' : '×' }}</span>
              <span class="min-w-[240px] flex-1">
                <b class="text-body-sm font-semibold text-ln-gray-900">{{ c.label }}</b>
                <span v-if="c.note" class="block text-caption leading-relaxed text-ln-gray-600">{{ c.note }}</span>
              </span>
              <span class="ml-auto text-body-sm" :class="c.met ? 'text-ln-gray-700' : 'text-ln-error'">
                {{ c.value }}
              </span>
            </li>
          </ul>

          <!-- ⚠️ LA MENTION EST UN DÉRIVÉ IMPOSÉ (Art. 49) : bornes exactes, aucun
               arrondi, absente sous 10,00. Elle s'affiche, elle ne se saisit
               jamais — d'où l'absence de tout champ ici. -->
          <div class="mt-5 flex flex-wrap gap-8 rounded-md-ln border border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
            <div>
              <p class="text-caption text-ln-gray-500">Moyenne du cursus</p>
              <p class="text-h2 tabular text-ln-gray-900">{{ decimal(dossier.average) }}</p>
            </div>
            <div>
              <p class="text-caption text-ln-gray-500">Mention — dérivée, jamais saisie</p>
              <p class="text-h2 text-ln-gray-900">{{ dossier.mention || 'Aucune' }}</p>
            </div>
            <div>
              <p class="text-caption text-ln-gray-500">Constat d'éligibilité</p>
              <p class="text-h2" :class="dossier.eligible ? 'text-ln-success' : 'text-ln-error'">
                {{ dossier.eligible ? 'Éligible' : 'Non éligible' }}
              </p>
            </div>
            <p class="max-w-[300px] self-center text-caption leading-relaxed text-ln-gray-500">
              Bornes exactes de l'article 49, aucun arrondi, mention absente sous 10,00. Le constat
              est <b class="font-semibold text-ln-gray-700">recalculé au moment de l'acte</b> : celui
              affiché ici n'engage pas la décision de demain.
            </p>
          </div>

          <div v-if="dossier.decision" class="mt-5 rounded-md-ln border border-ln-gray-200 px-4 py-3">
            <h4 class="text-[14px] font-semibold text-ln-gray-900">
              Décision du jury — {{ dossier.decision }}
            </h4>
            <p class="mt-1 text-caption text-ln-gray-500">
              Prononcée le {{ dossier.decided_on }} par {{ dossier.decided_by }}.
            </p>
            <p v-if="dossier.decision_reason" class="mt-2 text-body-sm leading-relaxed text-ln-gray-700">
              {{ dossier.decision_reason }}
            </p>
            <p v-if="dossier.felicitations" class="mt-2 rounded-sm-ln bg-ln-success-bg px-3 py-2 text-caption leading-relaxed text-ln-success">
              <b class="font-semibold">Félicitations du jury.</b> {{ dossier.felicitations_note }}
            </p>
          </div>

          <!-- ⚠️ AUCUN PDF. Le rendu des parchemins est différé : l'acte au registre
               et le NUMÉRO font foi. Promettre un téléchargement serait promettre ce
               qui n'existe pas. -->
          <div class="mt-5 overflow-hidden rounded-md-ln border border-ln-gray-200">
            <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-2.5">
              <h4 class="text-[14px] font-semibold text-ln-gray-900">Émission</h4>
              <p class="mt-0.5 text-caption text-ln-gray-500">
                Attestation sous 15 jours, puis diplôme sous 3 mois.
              </p>
            </header>
            <ul v-if="dossier.documents.length">
              <li v-for="d in dossier.documents" :key="d.kind"
                  class="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-ln-gray-100 px-4 py-2.5 last:border-b-0">
                <span class="min-w-[180px] flex-1 text-body-sm font-semibold text-ln-gray-900">
                  {{ d.kind }}
                  <span class="block text-caption font-normal text-ln-gray-500">Délai : {{ d.due }}</span>
                </span>
                <span v-if="d.registry" class="text-caption text-ln-gray-700">
                  Registre <b class="font-mono text-[11.5px] font-semibold text-ln-gray-900">{{ d.registry }}</b>
                  · code <b class="font-mono text-[11.5px] font-semibold text-ln-gray-900">{{ d.code }}</b>
                  <span class="block text-ln-gray-500">Émis le {{ d.issued_on }}</span>
                </span>
                <span v-else class="text-caption text-ln-gray-500">Non émis</span>
              </li>
            </ul>
            <p v-else class="px-4 py-4 text-caption leading-relaxed text-ln-gray-500">
              Rien à émettre tant que le jury n'a pas décidé.
            </p>
            <p class="border-t border-ln-gray-200 bg-ln-gray-50 px-4 py-3 text-caption leading-relaxed text-ln-gray-600">
              Le rendu des parchemins est différé : <b class="font-semibold text-ln-gray-900">l'acte
              au registre et le numéro font foi</b>. Cet écran montre le numéro et le code de
              vérification — pas un document téléchargeable. Un numéro de registre n'est jamais
              réattribué.
            </p>
          </div>

          <template #actions>
            <ActionBar :actions="actions"
                       attribution="Décision <b>souveraine</b> de la Direction. L'instruction appartient à l'Education Manager."
                       :hint="hint" @act="act" />
          </template>
        </ObjectPanel>

        <ObjectPanel v-else title="" state="empty"
                     state-title="Aucun dossier sélectionné"
                     state-message="Choisissez un dossier pour voir ses conditions, sa mention dérivée et son émission." />
      </div>
    </div>

    <StateBanner v-if="pending" variant="warning" lead="Acte non disponible." :text="pending" class="mt-4" />
  </div>
</template>

<script setup>
/**
 * Grappe 10 · la diplomation — écran de référence du lot 5.
 *
 * ⚠️ QUATRE RÈGLES DU DOMAINE, ET L'ÉCRAN EST BÂTI POUR N'EN TRAHIR AUCUNE :
 *
 *   — L'ÉLIGIBILITÉ EST PRÉSENTÉE, JAMAIS DÉCIDÉE (Art. 45). Le bouton « Diplômé »
 *     reste donc offert sur un dossier NON éligible — c'est l'indulgence que le
 *     règlement donne au jury — mais le motif devient obligatoire. Retirer le
 *     bouton aurait retiré l'indulgence ;
 *   — LA MENTION EST UN DÉRIVÉ IMPOSÉ (Art. 49). Aucun champ ne la saisit : elle
 *     est calculée au simulacre, à côté de la moyenne dont elle dépend ;
 *   — L'ATTESTATION D'EXAMENS NATIONAUX EST UN INPUT TRACÉ. Elle ne se déduit
 *     d'aucune note : la condition dit qui l'a attestée et quand, ou dit qu'elle
 *     manque ;
 *   — LE CONSTAT EST RECALCULÉ AU MOMENT DE L'ACTE, et l'écran le dit : le constat
 *     affiché n'engage pas la décision du lendemain.
 *
 * ⚠️ ET AUCUN PDF. Le rendu des parchemins est différé (`D-TEMPLATE-DIPLOME-01`) :
 * l'acte au registre et le numéro font foi. Un bouton « télécharger le diplôme »
 * aurait promis ce qui n'existe pas.
 *
 * 🟡 Les onze points d'entrée sont annoncés existants (carte P-06) ; leur chemin
 * d'exposition est inconnu. Voir `api/graduation.js`.
 */
import { computed, onMounted, ref } from 'vue';
import { ActionBar, ObjectPanel, StateBanner, StatusPill, WorkQueue } from '../components/index.js';
import BlockState from '../components/internal/BlockState.vue';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { useResource } from '../composables/useResource.js';
import { listGraduationDossiers } from '../api/graduation.js';

const { params } = useAcademicContext();
const res = useResource(listGraduationDossiers, { isEmpty: (d) => !d?.items?.length });
const state = res.state;
const pending = ref('');
const selectedId = ref(null);

const data = computed(() => res.data.value || { jury: { members: [] } });
const queueItems = computed(() => (data.value.items || []).map((r) => ({
  id: r.name,
  title: r.student_name,
  subtitle: r.program_label + ' · moyenne ' + decimal(r.average)
    + (r.mention ? ' · ' + r.mention : ' · sans mention'),
  status: r.status,
  statusLabel: r.status_label,
  done: !!r.decision,
})));

const dossier = computed(() =>
  (data.value.items || []).find((r) => r.name === selectedId.value) || null);

const subtitle = computed(() => {
  if (state.value !== 'ready') return 'Chargement des dossiers';
  return [
    data.value.count + ' dossiers instruits',
    data.value.eligible + ' présentés éligibles',
    data.value.decided + ' décidés par le jury',
  ].join(' · ');
});

const panelSubtitle = computed(() => {
  const d = dossier.value;
  if (!d) return '';
  return [d.name, d.student, d.program_label].join(' · ');
});

function decimal(v) { return v == null ? '—' : String(v.toFixed(2)).replace('.', ','); }

/**
 * ⚠️ LES TROIS ISSUES SONT TOUJOURS OFFERTES, y compris « Diplômé » sur un dossier
 * non éligible. C'est le règlement : le jury est souverain, et l'indulgence est
 * motivée. Un écran qui masquerait l'issue lui retirerait ce pouvoir.
 *
 * Les félicitations sont un ACTE distinct (49.1) — jamais une conséquence de la
 * moyenne.
 */
const actions = computed(() => {
  const d = dossier.value;
  if (!d) return [];
  if (d.decision === 'Ajourné') {
    return [{ key: 'reopen', label: 'Nouvelle présentation…', kind: 'primary' }];
  }
  if (d.decision) {
    return [{ key: 'emettre', label: 'Émettre le document suivant…', kind: 'primary' },
      { key: 'felicitations', label: 'Attribuer les félicitations…', kind: 'secondary',
        visible: !d.felicitations }];
  }
  return (data.value.outcomes || []).map((o, i) => ({
    key: o.key, label: o.label + (o.needs_reason ? '…' : (d.eligible ? '' : '…')),
    kind: i === 0 ? 'primary' : 'secondary',
  }));
});

const hint = computed(() => {
  const d = dossier.value;
  if (!d) return '';
  if (d.decision) {
    return 'Décision prononcée. L’émission suit son propre calendrier : attestation sous 15 jours, '
      + 'puis diplôme sous 3 mois. Les félicitations restent un acte séparé.';
  }
  if (!d.eligible) {
    return 'Ce dossier n’est pas éligible. « Diplômé » reste offert — le jury est souverain — mais '
      + 'la décision devient une indulgence, et le motif est alors obligatoire.';
  }
  return 'Le constat est recalculé au moment de l’acte : ce qui est affiché ici n’engage pas la '
    + 'décision. « Ajourné » et « Non attribué » exigent un motif.';
});

function select(id) { selectedId.value = id; }

function act(key) {
  const verbs = {
    diplome: '`decide_graduation`', ajourne: '`decide_graduation`',
    non_attribue: '`decide_graduation`', reopen: '`reopen_after_adjournment`',
    emettre: '`issue_graduation_document`', felicitations: '`award_felicitations`',
  };
  pending.value = 'Cet acte appelle ' + verbs[key] + ' — la fonction est annoncée existante, mais '
    + 'son chemin d’exposition m’est inconnu, et le vocabulaire de motif n’a aucune source lue. '
    + 'Rien n’a été enregistré.';
}

function reload() { res.load({ ...params.value }); }
onMounted(() => {
  reload();
  selectedId.value = 'DIP-2027-0044';
});
</script>
