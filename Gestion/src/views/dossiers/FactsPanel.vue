<template>
  <!-- MANDAT-12 (M6, S-18) — CE QUE DIT LE DOSSIER : les champs de son doctype, rendus par le
       serveur, procédure par procédure. À côté de la valeur, le NOM de la personne ou le LIBELLÉ du
       statut que le serveur rend (C3, `detail_labels`). Un champ vide n'est pas inventé : il est
       nommé « non renseigné ». -->
  <section class="mb-4 overflow-hidden rounded-md-ln border border-ln-gray-200">
    <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
      <h3 class="text-[14px] font-semibold text-ln-gray-900">Ce que dit le dossier</h3>
      <p class="mt-0.5 text-caption text-ln-gray-500">Les faits enregistrés — rien n'est déduit à l'écran.</p>
    </header>
    <dl class="px-4 py-2">
      <div v-for="row in filled" :key="row.key" class="flex items-baseline gap-3 border-b border-ln-gray-100 py-2 last:border-b-0">
        <dt class="w-[190px] flex-shrink-0 text-caption text-ln-gray-500">{{ row.label }}</dt>
        <dd class="min-w-0 text-body-sm leading-snug text-ln-gray-900">
          <template v-if="Array.isArray(row.value)">
            <span v-for="(item, i) in row.value" :key="i" class="block">{{ item }}</span>
          </template>
          <template v-else>
            {{ row.shown }}
            <span v-if="row.shown !== row.value" class="ml-1 font-mono text-[11px] text-ln-gray-500">{{ row.value }}</span>
          </template>
        </dd>
      </div>
    </dl>
    <p v-if="empty.length" class="border-t border-ln-gray-100 px-4 py-2 text-caption text-ln-gray-500">
      Non renseignés : {{ empty.join(' · ') }}.
    </p>
  </section>
</template>

<script setup>
import { computed } from 'vue';

/**
 * Props :
 *   detail — {champ: valeur} : les champs du doctype de la procédure (S-18), `null` pour un champ vide ;
 *            `commission_members` [{member_role, user, user_label}], `council_members`
 *            [{seat, member_user, member_user_label, is_representative}], `recognized_credits`
 *            [{source_label, credits_recognized, basis}], `commission_missing_roles` [rôle].
 *   labels — {champ: libellé} : le nom d'une personne (`*_by`) ou le libellé d'un statut (C3).
 */
const props = defineProps({
  detail: { type: Object, required: true },
  labels: { type: Object, default: () => ({}) },
});

// Les libellés des CHAMPS ; un champ absent de cette table s'affiche sous son nom technique — jamais caché.
const LABELS = {
  from_date: 'Du', to_date: 'Au', event_date: 'Événement', reason: 'Motif de la demande',
  force_majeure_reason: 'Force majeure', current_academic_status: 'Statut à la demande',
  target_academic_status: 'Statut visé', previous_academic_status: 'Statut avant le congé',
  student_academic_status: 'Statut actuel de l’étudiant', is_second_leave: 'Second congé',
  instructed_by: 'Instruit par', instructed_on: 'Instruit le', decision_by: 'Décidé par', decision_on: 'Décidé le',
  decision_reason: 'Motif de la décision', arbitrated_by: 'Arbitré par', arbitrated_on: 'Arbitré le',
  arbitration_reason: 'Motif de l’arbitrage', leave_request: 'Congé concerné', resume_date: 'Reprise le',
  message: 'Message de l’étudiant', financial_block_seen: 'Blocage financier constaté',
  financial_block_note: 'Note sur le blocage', case: 'Cas', origin_program: 'Filière d’origine',
  target_program: 'Filière visée', motivation: 'Motivation', notification_event_date: 'Événement notifié le',
  mutualization_rate: 'Mutualisation constatée (%)', mutualization_term: 'Semestre de mutualisation',
  mutualization_detail: 'Détail de la mutualisation', target_academic_year: 'Année visée',
  target_academic_term: 'Semestre visé', target_level: 'Niveau visé', decided_by: 'Décidé par',
  decided_on: 'Décidé le', notified_on: 'Notifié le', enrollment_created: 'Inscription créée',
  commission_members: 'Commission', commission_required_roles: 'Sièges requis',
  commission_missing_roles: 'Sièges à pourvoir', recognized_credits: 'Acquis reconnus',
  deposit_channel: 'Canal de dépôt', deposited_on: 'Déposée le', info_given_on: 'Information remise le',
  info_channel: 'Moyen de l’information', reflection_clear_from: 'Fin du délai de réflexion',
  registered_by: 'Enregistrée par', registered_on: 'Enregistrée le', effective_due_on: 'Effet prévu le',
  retracted_on: 'Rétractée le', effective_on: 'Effective le', term_blocked_reason: 'Effet bloqué',
  refusal_reason: 'Motif du refus', refused_by: 'Refusée par', refused_on: 'Refusée le',
  academic_term: 'Semestre', initiated_by: 'Constat initié par', initiated_on: 'Initié le',
  ground_category: 'Motif', ground_details: 'Exposé des faits', snapshot_attendance: 'Présences figées',
  snapshot_evaluations: 'Évaluations figées', response_deadline: 'Réponse attendue avant le',
  response_received_on: 'Réponse reçue le', response_text: 'Réponse', pronounced_by: 'Prononcé par',
  pronounced_on: 'Prononcé le', pronounce_reason: 'Motif du prononcé', dismissed_by: 'Classé par',
  dismissed_on: 'Classé le', dismiss_reason: 'Motif du classement', convocation_date: 'Convocation le',
  council_date: 'Conseil le', council_members: 'Conseil', duration_weeks: 'Durée (semaines)',
  is_suspended_sentence: 'Avec sursis', period_start: 'Période du', period_end: 'Période au',
  appeal_deadline: 'Appel possible jusqu’au', appealed_on: 'Appel déposé le', appeal_grounds: 'Moyens de l’appel',
  appeal_decision: 'Décision d’appel', appeal_reason: 'Motif de la décision d’appel',
  appeal_decided_by: 'Appel jugé par', appeal_decided_on: 'Appel jugé le',
  days_served_at_appeal: 'Jours purgés à l’appel', resume_start: 'Reprise le',
  resume_days_remaining: 'Jours restants', resume_end: 'Fin de la reprise', lifted_by: 'Levée par',
  lifted_on: 'Levée le', lift_reason: 'Motif de la levée', closure_reason: 'Motif du classement',
};
const BOOLEAN = new Set(['is_second_leave', 'financial_block_seen', 'is_suspended_sentence']);
const show = (key, v) => {
  if (key === 'commission_members') return v.map((m) => m.member_role + ' — ' + (m.user_label || m.user));
  if (key === 'council_members') return v.map((m) => m.seat + ' — ' + (m.member_user_label || m.member_user));
  if (key === 'recognized_credits') return v.map((c) => c.source_label + ' · ' + c.credits_recognized + ' ECTS · ' + c.basis);
  if (Array.isArray(v)) return v;
  if (BOOLEAN.has(key)) return v ? 'Oui' : 'Non';
  return frDate(v);
};
/** Une date (ou date-heure) ISO rendue par le serveur s'écrit à la française ; le reste passe tel quel. */
function frDate(v) {
  const m = typeof v === 'string' && /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/.exec(v);
  if (!m) return v;
  return m[3] + '/' + m[2] + '/' + m[1] + (m[4] ? ' à ' + m[4] + ' h ' + m[5] : '');
}
const isEmpty = (v) => v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length);
const filled = computed(() => Object.entries(props.detail)
  .filter(([, v]) => !isEmpty(v))
  .map(([key, v]) => {
    const value = show(key, v);
    return { key, label: LABELS[key] || key, value, shown: props.labels[key] || value };
  }));
const empty = computed(() => Object.entries(props.detail)
  .filter(([, v]) => isEmpty(v)).map(([key]) => (LABELS[key] || key).toLowerCase()));
</script>
