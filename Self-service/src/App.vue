<script setup>
// App.vue — Catalogue de composants Phase 1 (temporaire)
// Remplace le wordmark Phase 0. Sera à son tour remplacé par l'AppShell en Phase 3.
import StatusBadge from '@/components/ui/StatusBadge.vue';
import MetricCard from '@/components/ui/MetricCard.vue';
import PlanningEntry from '@/components/ui/PlanningEntry.vue';
import NotificationItem from '@/components/ui/NotificationItem.vue';
import ServiceTile from '@/components/ui/ServiceTile.vue';
import AlertBlock from '@/components/ui/AlertBlock.vue';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import ProgressBar from '@/components/ui/viz/ProgressBar.vue';
import Sparkline from '@/components/ui/viz/Sparkline.vue';
import DonutGauge from '@/components/ui/viz/DonutGauge.vue';
import ThresholdGauge from '@/components/ui/viz/ThresholdGauge.vue';

const sparklineData = [20, 22, 28, 30, 38, 42, 48];
const sparklineDown = [48, 50, 46, 44, 42, 40, 38];

function handleAction() {
  // eslint-disable-next-line no-console
  console.log('Action clicked');
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 py-8 px-4">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-3xl font-bold tracking-tight text-neutral-950 mb-2">
        mela<span class="text-accent-500">.</span>
      </h1>
      <p class="text-sm text-neutral-600 mb-10">Catalogue des composants — Phase 1</p>

      <section class="mb-10">
        <div class="text-[11px] font-semibold text-neutral-600 tracking-wider uppercase mb-3">StatusBadge</div>
        <div class="flex flex-wrap gap-2">
          <StatusBadge variant="success" label="Actif" />
          <StatusBadge variant="warning" label="En attente" />
          <StatusBadge variant="error" label="Bloqué" />
          <StatusBadge variant="info" label="Info" />
          <StatusBadge variant="neutral" label="Neutre" />
        </div>
      </section>

      <section class="mb-10">
        <div class="text-[11px] font-semibold text-neutral-600 tracking-wider uppercase mb-3">MetricCard</div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MetricCard label="Effectif total" :value="847" :trend="3.2" trend-label="%" />
          <MetricCard label="Taux recouvrement" value="78%" :trend="-2.1" trend-label="%" />
          <MetricCard label="Admissions" :value="142" subtitle="ce semestre" />
        </div>
      </section>

      <section class="mb-10">
        <div class="text-[11px] font-semibold text-neutral-600 tracking-wider uppercase mb-3">PlanningEntry — 3 états</div>
        <div class="flex flex-col gap-2">
          <PlanningEntry course-title="Algorithmique avancée" schedule="Aujourd'hui · 14h00 · B12 · Prof. Mensah" state="upcoming" />
          <PlanningEntry course-title="Bases de données" schedule="Hier · 10h00 · A3 · Prof. Adjo" state="past" />
          <PlanningEntry course-title="Réseaux avancés" schedule="Demain · 8h00 · C7 · Prof. Koudjo" state="cancelled" />
        </div>
      </section>

      <section class="mb-10">
        <div class="text-[11px] font-semibold text-neutral-600 tracking-wider uppercase mb-3">NotificationItem</div>
        <div class="bg-white rounded-lg border border-subtle overflow-hidden">
          <NotificationItem title="Résultats S2 disponibles" timestamp="Il y a 1 jour" :read="false" />
          <NotificationItem title="Inscription pédagogique confirmée" timestamp="Il y a 3 jours" :read="true" />
        </div>
      </section>

      <section class="mb-10">
        <div class="text-[11px] font-semibold text-neutral-600 tracking-wider uppercase mb-3">ServiceTile</div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ServiceTile title="Planning" url="/mela/planning">
            <template #icon>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-brand-900">
                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.5" />
                <path d="M3 10h18" stroke="currentColor" stroke-width="1.5" />
              </svg>
            </template>
          </ServiceTile>
          <ServiceTile title="Moodle" url="https://moodle.example" external>
            <template #icon>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-brand-900">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" stroke-width="1.5" />
              </svg>
            </template>
          </ServiceTile>
          <ServiceTile title="Évals" url="/mela/evals">
            <template #icon>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-brand-900">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
              </svg>
            </template>
          </ServiceTile>
          <ServiceTile title="RH" disabled>
            <template #icon>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-neutral-400">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="1.5" />
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="1.5" />
              </svg>
            </template>
          </ServiceTile>
        </div>
      </section>

      <section class="mb-10">
        <div class="text-[11px] font-semibold text-neutral-600 tracking-wider uppercase mb-3">AlertBlock — 4 sévérités</div>
        <div class="flex flex-col gap-2">
          <AlertBlock severity="error" title="Évaluation requise" description="MI-S3-02 — Réseaux avancés" action-label="Répondre" :on-action="handleAction" />
          <AlertBlock severity="warning" title="Échéance de paiement dans 11 jours" />
          <AlertBlock severity="info" title="Nouveaux résultats publiés — Semestre 2" />
          <AlertBlock severity="success" title="Inscription confirmée" description="Votre dossier est complet" />
        </div>
      </section>

      <section class="mb-10">
        <div class="text-[11px] font-semibold text-neutral-600 tracking-wider uppercase mb-3">BlockSkeleton / BlockError</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <BlockSkeleton :lines="4" />
          <BlockError title="Impossible de charger ce bloc" message="Vérifiez votre connexion." :retry="handleAction" />
        </div>
      </section>

      <section class="mb-10">
        <div class="text-[11px] font-semibold text-neutral-600 tracking-wider uppercase mb-3">Micro-visualisations (viz/)</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MetricCard label="Paiement" value="62%" subtitle="248 000 / 398 000 XOF">
            <template #viz>
              <ProgressBar :value="62" color="brand" aria-label="Progression paiement 62%" />
            </template>
          </MetricCard>

          <MetricCard label="Paiements reçus" value="248 000" :trend="75" trend-label="000 ce mois">
            <template #viz>
              <Sparkline :data="sparklineData" color="brand" aria-label="Historique paiements 7 derniers mois" />
            </template>
          </MetricCard>

          <MetricCard label="Recouvrement" value="78%" :trend="-2.1" trend-label="%">
            <template #viz>
              <Sparkline :data="sparklineDown" color="error" aria-label="Évolution recouvrement 7 périodes" />
            </template>
          </MetricCard>

          <MetricCard label="Taux réponse eval" value="67%" subtitle="Cible : 80%">
            <template #viz>
              <ProgressBar :value="67" color="warning" aria-label="Taux de réponse évaluations 67%" />
            </template>
          </MetricCard>

          <div class="bg-white rounded-lg border border-subtle p-5 flex items-center gap-4">
            <DonutGauge :value="45" :total="50" color="success" aria-label="Présence 90%" />
            <div>
              <div class="text-sm font-semibold text-neutral-950">Présence</div>
              <div class="text-xs text-neutral-500 mt-0.5">45/50 séances</div>
            </div>
          </div>

          <div class="bg-white rounded-lg border border-subtle p-5">
            <div class="text-xs text-neutral-500 mb-3">Seuils d'alerte</div>
            <ThresholdGauge
              :value="30"
              :thresholds="[
                { at: 0,   label: '0%' },
                { at: 50,  label: '10%' },
                { at: 75,  label: '15%' },
                { at: 100, label: '20%' },
              ]"
              aria-label="Taux absences 6% — sous le seuil"
            />
            <div class="mt-3">
              <StatusBadge variant="success" label="6% — sous le seuil" />
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
