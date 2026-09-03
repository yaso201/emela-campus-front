<template>
  <div>
    <header class="mb-4 flex flex-wrap items-start justify-between gap-5">
      <div>
        <p class="mb-2 text-caption text-ln-gray-500">
          Notes · <b class="font-semibold text-ln-gray-900">Délibération annuelle</b>
        </p>
        <h1 class="text-h1 tracking-tight text-ln-gray-900">Jury de fin d'année — {{ dash.program || '…' }}</h1>
        <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <!-- ⚠️ La synthèse est le DÉFAUT, pas une option. Le lot 2 l'a tranché
             comme une mesure : quatorze colonnes ne tiennent pas dans 1280 px
             avec le bloc de décision épinglé. -->
        <span class="inline-flex h-[30px] overflow-hidden rounded-sm-ln border border-ln-gray-300 text-caption">
          <button v-for="t in TABS" :key="t.key" type="button"
                  class="px-3 font-medium"
                  :class="t.key === tab ? 'bg-ln-blue-900 font-semibold text-white' : 'text-ln-gray-700'"
                  @click="tab = t.key">{{ t.label }}</button>
        </span>
        <button type="button" class="ln-btn-secondary" @click="notBuilt('Export du procès-verbal')">Exporter</button>
        <button v-if="can('close:deliberation')" type="button" class="ln-btn-primary" @click="closeOpen = true">
          Clore la délibération…
        </button>
      </div>
    </header>

    <!-- F3-PROV : LE SUJET VOYAGE DANS L'ADRESSE (?deliberation=…) — plus
         d'identifiant codé en dur. Et SANS sujet, l'écran LE DIT : il ne
         montre aucune délibération arbitraire (un lien qui ressemble à un
         succès est pire qu'un lien mort — la leçon du bilan de charge). -->
    <template v-if="!subject">
      <StateBanner variant="info" lead="Aucune délibération sélectionnée.">
        Cet écran s'ouvre sur UNE délibération, désignée dans l'adresse.
        Choisissez un jury ci-dessous — la liste ne porte que l'identification
        (année, filière, statut) ; les résultats vivent dans le tableau.
      </StateBanner>
      <section class="overflow-hidden rounded-md-ln border border-ln-gray-200" aria-label="Choisir une délibération">
        <BlockState v-if="listState !== 'ready'" :state="listState" title="Aucune délibération"
                    message="Aucun jury n'existe pour ce contexte. Les délibérations se créent à l'instruction, par l'Education Manager."
                    :rows="4" :row-height="40" @retry="loadList" />
        <table v-else class="w-full text-body-sm">
          <thead>
            <tr class="border-b border-ln-gray-200 bg-ln-gray-50 text-left text-caption text-ln-gray-500">
              <th class="px-4 py-2 font-medium">Jury</th>
              <th class="px-4 py-2 font-medium">Filière</th>
              <th class="px-4 py-2 font-medium">Semestre</th>
              <th class="px-4 py-2 font-medium">Statut</th>
              <th class="px-4 py-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in deliberations" :key="d.name"
                class="cursor-pointer border-b border-ln-gray-100 last:border-0 hover:bg-ln-gray-50"
                @click="openDeliberation(d.name)">
              <td class="px-4 py-2.5 font-mono text-[12px] text-ln-blue-700">{{ d.name }}</td>
              <td class="px-4 py-2.5">{{ d.program }}</td>
              <td class="px-4 py-2.5">{{ d.academic_term }}</td>
              <td class="px-4 py-2.5">{{ d.status }}</td>
              <td class="px-4 py-2.5">{{ d.deliberation_date }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="listTruncated" class="border-t border-ln-gray-200 bg-ln-gray-50 px-4 py-2 text-caption text-ln-gray-500">
          Liste tronquée aux 200 plus récentes — affinez par l'année ou le statut.
        </p>
      </section>
    </template>

    <template v-else>
    <StateBanner v-if="pending" variant="warning" lead="Acte non disponible." :text="pending" />

    <StateBanner variant="info" lead="Colonne « Conseil pédagogique ».">
      Elle porte ce que janvier a produit pour chaque étudiant : les préconisations rendues, le constat
      du contrat de remédiation, et l'absence non justifiée à la convocation. Elle est
      <b class="font-semibold">lue en permanence</b>, non transmise — une préconisation rendue après la
      séance y figure aussi. Et elle ne décide rien : elle éclaire la décision du jury.
    </StateBanner>

    <BlockState v-if="tableState !== 'ready'" :state="tableState === 'denied' ? 'loading' : tableState"
                title="Aucun étudiant à délibérer"
                message="Ce jury n'a pas encore d'étudiant instruit. La liste se construit à l'instruction, par l'Education Manager."
                :rows="8" :row-height="44" class="mb-4" @retry="reload" />

    <template v-else>
      <!-- ⚠️ Un seul bloc défilant, et DEUX blocs épinglés : l'identité à gauche,
           conseil · proposition · décision à droite. Ce qui éclaire la décision ne
           quitte jamais le champ en même temps qu'elle. -->
      <div class="overflow-auto rounded-md-ln border border-ln-gray-200" style="max-height:560px">
        <table class="w-full border-collapse text-body-sm">
          <thead>
            <tr>
              <th :class="[stickyStu, headCell, headTop, headPin]" class="!text-left" :rowspan="tab === 'synth' ? 2 : 1">Étudiant</th>
              <template v-if="tab === 'synth'">
                <th :class="[headCell, headTop, headBg]" colspan="2" class="border-l border-ln-gray-200">Semestre 1</th>
                <th :class="[headCell, headTop, headBg]" colspan="2" class="border-l border-ln-gray-200">Semestre 2</th>
                <th :class="[headCell, headTop, headBg]" rowspan="2" class="border-l border-ln-gray-200">Année</th>
              </template>
              <template v-else>
                <th v-for="u in shownUes" :key="u" :class="[headCell, headTop, headBg]" class="!min-w-[62px] !max-w-[62px]">{{ u }}</th>
                <th :class="[headCell, headTop, headBg]" class="border-l border-ln-gray-200">Moy.</th>
                <th :class="[headCell, headTop, headBg]">Crédits</th>
              </template>
              <th :class="[stickyCps, headCell, headTop, headPin]" class="!text-left" :rowspan="tab === 'synth' ? 2 : 1">Conseil pédagogique</th>
              <th :class="[stickyProp, headCell, headTop, headPin]" class="!text-left" :rowspan="tab === 'synth' ? 2 : 1">Proposition</th>
              <th :class="[stickyDec, headCell, headTop, headPin]" class="!text-left" :rowspan="tab === 'synth' ? 2 : 1">Décision</th>
            </tr>
            <!-- ⚠️ SECONDE LIGNE D'EN-TÊTE, sur la synthèse seule. Sans elle, le
                 jury voyait sous « Semestre 1 » deux colonnes SANS NOM : l'une
                 portant « 10.85 / 33-36 », l'autre « UE 3.1 UE 3.2 ». Seule la
                 légende sous le tableau les nommait. Sur le tableau le plus dense
                 du système, une colonne de codes d'unité sans intitulé se lit mal
                 — et c'est justement l'information que « le jury voit lesquelles,
                 pas combien » doit rendre lisible.

                 Les cellules à `rowspan=2` restent collées en haut ; celles-ci se
                 collent SOUS elles, d'où le décalage explicite. -->
            <tr v-if="tab === 'synth'">
              <template v-for="n in 2" :key="'sub' + n">
                <th :class="[headCell, headSub, headBg]" class="!min-w-[92px] !max-w-[92px] border-l border-ln-gray-200">Moyenne · crédits</th>
                <th :class="[headCell, headSub, headBg]" class="!min-w-[104px] !max-w-[104px] !whitespace-normal !leading-tight">Unités non acquises</th>
              </template>
            </tr>
          </thead>
          <tbody>
            <!-- `group` : c'est ce qui fait franchir le survol jusque dans les
                 colonnes épinglées, qui peignent leur propre fond et n'héritent
                 donc pas de celui de la ligne. -->
            <tr v-for="r in rows" :key="r.student" class="group"
                :class="r.student === selectedId ? 'bg-ln-blue-50' : 'hover:bg-ln-gray-50'">
              <td :class="[stickyStu, bodyCell, bodyPin(r)]" class="!text-left">
                <span class="block font-semibold text-ln-gray-900">{{ r.student_name }}</span>
                <span class="block font-mono text-[11px] text-ln-gray-500">{{ r.student }}</span>
              </td>

              <template v-if="tab === 'synth'">
                <!-- ⚠️ `<template v-for>`, PAS un `<td>` enveloppant. Une cellule
                     de tableau n'est admise que comme enfant de `<tr>` : la
                     première version enveloppait les deux cellules d'un semestre
                     dans un `<td class="contents">`, ce que le compilateur Vue
                     accepte et que le DOM rend littéralement — un `<td>` dans un
                     `<td>`.

                     La conséquence n'était pas cosmétique : l'alignement des trois
                     colonnes épinglées dépendait alors de `display:contents`
                     honoré sur une imbrication invalide. Non honoré, le corps
                     comptait sept fentes contre neuf à l'en-tête, et
                     `conseil · proposition · décision` se décalait de deux
                     colonnes — c'est-à-dire que la garantie sur laquelle cet écran
                     est construit tombait. Plus un modèle d'accessibilité rompu :
                     une cellule contenant des cellules, sans position.

                     `<template>` ne génère aucun élément. Le patron était déjà
                     employé deux lignes plus haut ; il n'avait pas été appliqué
                     ici. -->
                <template v-for="sem in [r.previous_semester_result, r.semester_result]" :key="sem.name">
                  <td :class="bodyCell" class="!min-w-[92px] !max-w-[92px] border-l border-ln-gray-200 font-semibold">
                    {{ fmt(sem.semester_average) }}
                    <span class="block text-[11px] font-medium text-ln-gray-500">
                      {{ sem.total_ects_earned }} / {{ sem.total_ects_possible }}
                    </span>
                  </td>
                  <!-- ⚠️ Les unités non acquises sont NOMMÉES, pas comptées : le
                       jury voit lesquelles. Un clic ouvre le panneau latéral. -->
                  <td :class="bodyCell" class="!min-w-[104px] !max-w-[104px] !whitespace-normal !leading-tight">
                    <template v-if="sem.unacquired.length">
                      <button v-for="u in sem.unacquired" :key="u" type="button"
                              class="mr-1 font-semibold text-ln-error underline decoration-dotted"
                              @click="openUe(r, u)">{{ u }}</button>
                    </template>
                    <span v-else class="text-ln-gray-400">—</span>
                  </td>
                </template>
                <td :class="bodyCell" class="!min-w-[92px] !max-w-[92px] border-l border-ln-gray-200 font-semibold">
                  {{ fmt(r.annual_average) }}
                  <span class="block text-[11px] font-medium text-ln-gray-500">indicative</span>
                </td>
              </template>

              <template v-else>
                <td v-for="u in shownUes" :key="u" :class="[bodyCell, ueTone(r, u)]"
                    class="!min-w-[62px] !max-w-[62px] font-semibold">
                  {{ ueValue(r, u) }}
                </td>
                <td :class="bodyCell" class="border-l border-ln-gray-200 font-semibold">{{ fmt(termAvg(r)) }}</td>
                <td :class="bodyCell">{{ termCredits(r) }}</td>
              </template>

              <!-- ⚠️ Trois informations lisibles d'un coup d'œil, et un lien pour
                   le reste. Le tableau est déjà le plus dense du système. -->
              <td :class="[stickyCps, bodyCell, bodyPin(r)]" class="!text-left !whitespace-normal !leading-snug">
                <template v-if="hasCouncil(r)">
                  <StatusPill v-for="(p, i) in r.cps_history.preconisations" :key="'p' + i"
                              class="mr-1 mb-0.5" :status="cpsTone(p)" :label="cpsLabel(p)" />
                  <!-- ⚠️ `renvoyee` est la clé du ton ROUGE au vocabulaire de
                       StatusPill. J'avais écrit `refuse`, qui n'existe pas : le
                       repli rend une pastille GRISE. Le signal le plus grave de
                       cette colonne — l'absence non justifiée à la convocation,
                       « le seul effet automatique de la séance » — s'affichait donc
                       à côté du gris « Aucune préconisation », indistinguable d'un
                       brouillon. Le libellé est surchargé, donc « Renvoyée » ne
                       s'affiche jamais. -->
                  <StatusPill v-for="(a, i) in r.cps_history.unjustified_cps_absences" :key="'a' + i"
                              class="mr-1 mb-0.5" status="renvoyee" label="Absent non justifié" />
                  <button type="button" class="text-[11.5px] font-semibold text-ln-blue-600 underline"
                          @click="openCouncil(r)">détail</button>
                </template>
                <span v-else class="text-ln-gray-400">Aucune préconisation</span>
              </td>

              <td :class="[stickyProp, bodyCell, bodyPin(r)]" class="!text-left">
                <span v-if="r.decision" class="text-ln-gray-900">{{ r.decision }}</span>
                <span v-else class="text-ln-gray-400">à instruire</span>
              </td>

              <td :class="[stickyDec, bodyCell, bodyPin(r)]" class="!text-left">
                <span v-if="r.new_academic_status" class="inline-flex items-center gap-1.5 text-caption font-semibold text-ln-success">
                  <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 13 4.5 4.5L19 7" /></svg>
                  {{ r.new_academic_status }}
                </span>
                <span v-else class="flex gap-1.5">
                  <button type="button" class="inline-flex h-[26px] items-center rounded-sm-ln border border-ln-gray-300 px-2 text-caption font-semibold text-ln-gray-700"
                          @click="notBuilt('Instruction d’une décision')">Suivre</button>
                  <button type="button" class="inline-flex h-[26px] items-center rounded-sm-ln border border-ln-gray-300 px-2 text-caption font-semibold text-ln-gray-700"
                          @click="notBuilt('Instruction d’une décision')">Autre…</button>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1.5 text-caption text-ln-gray-500">
        <span><b class="font-semibold text-ln-gray-900">Synthèse par défaut</b> — deux blocs de semestre, pas quatorze colonnes. Les onglets ouvrent le détail unité par unité.</span>
        <span><b class="font-semibold text-ln-gray-900">Unités non acquises</b> — nommées par leur code ; un clic ouvre le panneau. Pas de survol : sur un tableau de cette densité, il déclencherait sans intention.</span>
        <span><b class="font-semibold text-ln-gray-900">Moyenne annuelle</b> — indicative, jamais bloquante.</span>
      </div>

      <!-- ⚠️ Ce que le point d'entrée ne rend pas, dit à l'écran. -->
      <p v-if="missingRoster" class="mt-4 flex items-start gap-3 rounded-md-ln border border-dashed border-ln-warning bg-ln-warning-bg p-4 text-caption leading-relaxed text-[#6B4415]">
        <svg class="mt-0.5 h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4 2.5 20h19z" /><path d="M12 10v4.5M12 17.4v.2" /></svg>
        <span>
          <b class="font-semibold">{{ instructed }} décisions instruites sur {{ total }} étudiants.</b>
          Le tableau du jury est alimenté par les décisions <b class="font-semibold">déjà instruites</b> :
          les {{ total - instructed }} autres étudiants n'y figureraient pas. Ils sont affichés ici depuis
          une lecture <b class="font-semibold">qui n'existe pas encore côté serveur</b> — sans elle, cet écran
          liste ce qui est fait au lieu de ce qui reste à décider, ce qui est l'inverse de son usage.
        </span>
      </p>
    </template>

    <!-- Le panneau latéral : préconisations, ou détail d'une unité -->
    <aside v-if="panel" class="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-auto border-l border-ln-gray-300 bg-white shadow-elevated">
      <header class="flex items-start gap-3 border-b border-ln-gray-200 px-5 py-4">
        <div>
          <p class="text-caption text-ln-gray-500">{{ panel.kind === 'ue' ? 'Unité' : 'Conseil pédagogique' }}</p>
          <h3 class="mt-0.5 text-h3 text-ln-gray-900">{{ panel.title }}</h3>
          <p class="mt-0.5 text-caption text-ln-gray-500">{{ panel.student_name }}</p>
        </div>
        <button type="button" class="ml-auto text-ln-gray-500" aria-label="Fermer" @click="panel = null">✕</button>
      </header>

      <div v-if="panel.kind === 'ue'" class="px-5 py-4">
        <dl class="flex flex-col gap-2.5">
          <div v-for="row in panel.rows" :key="row.k" class="flex items-baseline gap-3 border-b border-ln-gray-100 pb-2 last:border-b-0">
            <dt class="w-[132px] flex-shrink-0 text-caption text-ln-gray-500">{{ row.k }}</dt>
            <dd class="text-body-sm text-ln-gray-900">{{ row.v }}</dd>
          </div>
        </dl>
        <p v-if="panel.floorNote" class="mt-4 rounded-sm-ln bg-ln-error-bg p-3 text-caption leading-snug text-[#7A2020]">
          {{ panel.floorNote }}
        </p>
      </div>

      <div v-else class="px-5 py-4">
        <p class="mb-3 text-caption leading-relaxed text-ln-gray-600">
          Ces informations sont <b class="font-semibold text-ln-gray-900">présentées au jury</b>, elles ne
          sont pas des décisions. Le conseil pédagogique ne prononce rien.
        </p>
        <article v-for="(p, i) in panel.preconisations" :key="i"
                 class="mb-3 rounded-md-ln border border-ln-gray-200 p-3.5 last:mb-0">
          <p class="flex flex-wrap items-center gap-2">
            <b class="text-body-sm font-semibold text-ln-gray-900">{{ p.kind }}</b>
            <StatusPill :status="cpsTone(p)" :label="p.status" />
            <span class="text-caption text-ln-gray-500">{{ termLabel(p.academic_term) }}</span>
          </p>
          <p class="mt-1.5 text-caption leading-relaxed text-ln-gray-700">{{ p.details }}</p>
          <p v-if="p.finding" class="mt-2 border-t border-ln-gray-100 pt-2 text-caption leading-relaxed text-ln-gray-700">
            <b class="font-semibold text-ln-gray-900">Constat :</b> {{ p.finding }}
            <span class="text-ln-gray-500">— posé le {{ p.closed_on }}</span>
          </p>
          <p v-else-if="p.kind.includes('Contrat')" class="mt-2 border-t border-ln-gray-100 pt-2 text-caption leading-relaxed text-[#6B4415]">
            <b class="font-semibold">Aucun constat n'a été posé.</b> Le contrat a été rendu ; son constat
            manque. Le jury le lit <b class="font-semibold">tel quel</b> — ce n'est pas un blocage, et le
            propriétaire du contrat peut encore le poser.
          </p>
        </article>
        <article v-for="(a, i) in panel.absences" :key="'a' + i"
                 class="rounded-md-ln border border-ln-error bg-ln-error-bg p-3.5">
          <b class="text-body-sm font-semibold text-[#7A2020]">Absence non justifiée à la convocation</b>
          <p class="mt-1.5 text-caption leading-relaxed text-[#7A2020]">
            Séance du {{ a.session_date }} ({{ termLabel(a.academic_term) }}). C'est le
            <b class="font-semibold">seul effet automatique</b> de la séance du conseil : l'absence est
            portée au jury, sans qu'aucune décision n'en découle.
          </p>
        </article>
      </div>
    </aside>

    <!-- La clôture, et son maker-checker -->
    <div v-if="closeOpen" class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
      <section class="w-full max-w-2xl overflow-hidden rounded-lg-ln border border-ln-gray-300 bg-white shadow-elevated"
               role="dialog" aria-modal="true" aria-label="Clore la délibération">
        <header class="border-b border-ln-gray-200 px-5 py-4">
          <h3 class="text-h3 text-ln-gray-900">Clore la délibération</h3>
          <p class="mt-1 text-body-sm leading-relaxed text-ln-gray-500">
            La clôture propage les résultats aux dossiers des étudiants et
            <b class="font-semibold">gèle le procès-verbal</b>. Elle n'est pas réversible depuis cette
            interface.
          </p>
        </header>
        <div class="px-5 py-4">
          <p class="mb-3 text-body-sm font-semibold text-ln-gray-900">Trois conditions, vérifiées au serveur</p>
          <ul class="flex flex-col gap-2">
            <li v-for="c in CLOSE_CONDITIONS" :key="c" class="flex items-start gap-2.5 text-caption leading-relaxed text-ln-gray-700">
              <span class="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ln-gray-400"></span>{{ c }}
            </li>
          </ul>
          <p class="mt-4 rounded-sm-ln bg-ln-gray-50 p-3 text-caption leading-relaxed text-ln-gray-600">
            La première condition — <b class="font-semibold text-ln-gray-900">ne pas être celui qui a
            instruit</b> — ne peut pas être vérifiée par cet écran. Si le serveur refuse, ce n'est pas une
            erreur : c'est le maker-checker qui fonctionne, et l'écran le dira dans ces mots.
          </p>
          <!-- ⚠️ La dérogation d'assiduité est exigée À LA CLÔTURE, pas à
               l'instruction — deux moments distincts. -->
          <div v-if="attendanceCases.length" class="mt-4 rounded-md-ln border border-ln-warning bg-ln-warning-bg p-4">
            <p class="text-body-sm font-semibold text-[#6B4415]">
              {{ plural(attendanceCases.length, 'passage') }} en dépassement d'absences
            </p>
            <p class="mt-1 text-caption leading-relaxed text-[#6B4415]">
              {{ attendanceCases.map((r) => r.student_name).join(', ') }} —
              un motif de dérogation est exigé à la clôture pour chacun. Le jury reste souverain
              (Art. 31.2) : le dépassement ne refuse pas le passage, il refuse un passage sans motif.
            </p>
            <div class="mt-3 min-h-[56px] rounded-sm-ln border border-ln-gray-300 bg-white p-2.5 text-body-sm text-ln-gray-400">
              Ce qui justifie le passage malgré le dépassement…
            </div>
          </div>
        </div>
        <footer class="flex items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-5 py-3">
          <span class="text-caption text-ln-gray-500">{{ instructed }} décisions seront propagées.</span>
          <span class="ml-auto flex gap-2">
            <button type="button" class="ln-btn-secondary" @click="closeOpen = false">Annuler</button>
            <button type="button" class="ln-btn-primary" @click="notBuilt('Clôture de la délibération')">Clore</button>
          </span>
        </footer>
      </section>
    </div>
    </template>
  </div>
</template>

<script setup>
/**
 * Grappe 6 · l'écran le plus difficile du système.
 *
 * ═══ CE QUI LE REND DIFFICILE, ET COMMENT IL S'EN SORT ═══
 *
 * 1. QUATORZE UNITÉS NE TIENNENT PAS. Le lot 2 l'a tranché comme une MESURE, pas
 *    un arbitrage : avec le bloc de décision épinglé, quatorze colonnes forcent un
 *    défilement horizontal sur quatre-vingt-seize lignes. La SYNTHÈSE est donc le
 *    défaut — deux blocs de semestre, moyenne, crédits, et les unités non acquises
 *    NOMMÉES — et le détail s'ouvre par onglet.
 *
 * 2. CE QUI ÉCLAIRE LA DÉCISION NE DOIT PAS QUITTER LE CHAMP EN MÊME TEMPS QU'ELLE.
 *    Deux blocs épinglés : l'identité à gauche, `conseil · proposition · décision`
 *    à droite. Les unités défilent entre les deux.
 *
 * 3. LA COLONNE DU CONSEIL EST L'AJOUT QUI DONNE SON SENS AU DISPOSITIF. Sans
 *    elle, le conseil pédagogique de janvier ne sert à rien. Elle porte trois
 *    choses lisibles d'un coup d'œil — types, constat, absence à la convocation —
 *    et un lien vers le panneau latéral pour le reste.
 *
 * 4. ELLE NE DÉCIDE RIEN. La docstring serveur le dit dans les mêmes termes que la
 *    maquette : « des INFORMATIONS présentées au jury, jamais des décisions ».
 *
 * ⚠️ ET LE POINT D'ENTRÉE NE REND QUE LES DÉCISIONS DÉJÀ INSTRUITES. L'écran le
 * dit en clair plutôt que de le masquer : sans la lecture qui manque, il liste ce
 * qui est fait au lieu de ce qui reste à décider.
 */
import { computed, onMounted, ref, watch } from 'vue';
import { StatusPill, StateBanner } from '../components/index.js';
import BlockState from '../components/internal/BlockState.vue';
import { useRoute, useRouter } from 'vue-router';
import { useSession } from '../composables/useSession.js';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { useResource } from '../composables/useResource.js';
import { getDeliberationDashboard } from '../api/grades.js';
import { listDeliberationRoster, listDeliberations } from '../api/deliberation.js';

const { can } = useSession();
const { params } = useAcademicContext();
// F3-PROV : le sujet vient de l'ADRESSE — jamais deviné, jamais codé en dur.
const route = useRoute();
const router = useRouter();
const subject = computed(() => route.query.deliberation || null);
const listRes = useResource(listDeliberations, { isEmpty: (d) => !d?.items?.length });
const listState = listRes.state;
const deliberations = computed(() => listRes.data.value?.items || []);
const listTruncated = computed(() => !!listRes.data.value?.truncated);
function loadList() { listRes.load({ academic_year: params.value?.academic_year }); }
function openDeliberation(name) {
  router.push({ path: route.path, query: { ...route.query, deliberation: name } });
}

const dashRes = useResource(getDeliberationDashboard, { isEmpty: (d) => !d });
/**
 * ⚠️ DEUX LECTURES, ET C'EST UN DÉFAUT ASSUMÉ. Le tableau devrait venir d'un seul
 * point d'entrée ; celui qui existe ne rend que les décisions instruites. La
 * seconde lecture est marquée 🔴 et l'écran annonce le manque. Elle disparaîtra
 * quand `get_deliberation_dashboard` rendra tous les étudiants du jury — et
 * l'écran ne changera pas, parce que les deux rendent la MÊME forme de ligne.
 */
const rosterRes = useResource(listDeliberationRoster, { isEmpty: (d) => !d?.items?.length });
const tableState = rosterRes.state;

const tab = ref('synth');
const selectedId = ref(null);
const panel = ref(null);
const closeOpen = ref(false);
const pending = ref('');

const TABS = [
  { key: 'synth', label: 'Synthèse annuelle' },
  { key: 'T-1', label: 'S1' },
  { key: 'T-2', label: 'S2' },
];

const CLOSE_CONDITIONS = [
  'Vous n’êtes pas la personne qui a instruit cette délibération.',
  'Vous portez le rôle de directeur des études ou de la direction.',
  'Le jury est enregistré, avec son président et ses membres.',
];

const dash = computed(() => dashRes.data.value || {});
const rows = computed(() => rosterRes.data.value?.items || []);
const total = computed(() => rosterRes.data.value?.count || 0);
const instructed = computed(() => rows.value.filter((r) => r.decision).length);
const missingRoster = computed(() => instructed.value < total.value);

const subtitle = computed(() => {
  if (tableState.value !== 'ready') return 'Chargement du jury';
  const jury = (dash.value.jury_members || []).length;
  return [plural(total.value, 'étudiant'),
    plural(instructed.value, 'décision') + ' instruite' + (instructed.value > 1 ? 's' : ''),
    jury ? 'jury de ' + plural(jury, 'membre') : null,
    'délibération annuelle — deux semestres'].filter(Boolean).join(' · ');
});

/** Les unités du semestre affiché, dérivées des lignes — jamais écrites. */
const shownUes = computed(() => {
  if (tab.value === 'synth') return [];
  const codes = new Set();
  for (const r of rows.value) {
    for (const u of r.ue_results) if (u.academic_term === tab.value) codes.add(u.course_ue);
  }
  return [...codes].sort();
});

const attendanceCases = computed(() =>
  rows.value.filter((r) => r.attendance_exceeded && r.decision === 'Passage'));

/* ─── Le bloc épinglé ───────────────────────────────────────────────── */
/**
 * ⚠️ UNE SEULE SOURCE DE FOND ET D'EMPILEMENT PAR CELLULE.
 *
 * Les quatre helpers de position portaient chacun `bg-white` et `z-[2]`. Sur une
 * cellule d'en-tête, cela entrait en collision avec le `bg-ln-gray-50 z-[3]` de
 * `headCell` — deux utilitaires de même spécificité sur la même propriété, dont
 * l'arbitrage revient à l'ordre d'émission de Tailwind et non à l'ordre du
 * tableau. Deux conséquences, aucune choisie :
 *
 *   — si `bg-white` gagnait, la ligne d'en-tête était BICOLORE : quatre cellules
 *     blanches contre trois en gris, sur l'onglet qui s'ouvre par défaut ;
 *   — si `z-[2]` gagnait, les cellules d'en-tête épinglées égalaient celles du
 *     corps, et à égalité le plus tard dans le DOM peint au-dessus — donc les
 *     lignes RECOUVRAIENT l'en-tête au défilement.
 *
 * Sur une cellule de corps, le `bg-white` inconditionnel écrasait le fond de la
 * ligne : le survol et la sélection étaient INVISIBLES sur les trois colonnes que
 * cet écran existe pour garder sous les yeux.
 *
 * Les helpers ne portent donc plus que la GÉOMÉTRIE. Le fond et l'empilement
 * viennent du contexte, et la maquette du lot 8 les fixe (`gestion/lot8.css`) :
 * en-tête épinglé `--g-50` à `z-index: 4`, corps épinglé blanc, et deux règles
 * dédiées pour `tr:hover` et `tr.sel`.
 */
const headCell = 'h-[30px] whitespace-nowrap border-b border-ln-gray-300 px-3 text-center text-[10.5px] font-semibold uppercase tracking-wide text-ln-gray-500';
/* Géométrie de collage seule. */
const headTop = 'sticky top-0';
const headSub = 'sticky top-[30px]';
/**
 * Fond et empilement d'une cellule d'en-tête : UNE seule des deux classes par
 * cellule, jamais les deux.
 *
 * ⚠️ Ma première correction posait encore `z-[3]` sur `headTop` ET `z-[4]` sur
 * `headPin` — deux utilitaires d'empilement sur la même cellule, c'est-à-dire
 * exactement le défaut que je venais de retirer des helpers de position. Séparer
 * la géométrie du fond ne suffit pas : il faut qu'une seule classe décide de
 * chaque propriété.
 */
const headBg = 'z-[3] bg-ln-gray-50';
/** Épinglée ET en en-tête : au-dessus de tout, comme la maquette l'exige. */
const headPin = 'z-[4] bg-ln-gray-50';
const bodyCell = 'h-11 whitespace-nowrap border-b border-ln-gray-100 px-3 text-center align-middle';

/* Géométrie seule : ni fond, ni empilement. */
const stickyStu = 'sticky left-0 !min-w-[172px] !max-w-[172px] shadow-[1px_0_0_var(--ln-gray-200)]';
const stickyCps = 'sticky right-[312px] !min-w-[190px] !max-w-[190px] shadow-[-1px_0_0_var(--ln-gray-200)]';
const stickyProp = 'sticky right-[172px] !min-w-[140px] !max-w-[140px]';
const stickyDec = 'sticky right-0 !min-w-[172px] !max-w-[172px]';

/**
 * Le fond d'une cellule de corps épinglée — UNE seule classe, jamais superposée.
 *
 * `group-hover` demande `group` sur le `<tr>` : c'est ce qui fait franchir le
 * survol de la ligne jusque dans les colonnes épinglées, qui ne l'héritent pas
 * puisqu'elles peignent leur propre fond.
 */
function bodyPin(r) {
  return r.student === selectedId.value
    ? 'z-[2] bg-ln-blue-50'
    : 'z-[2] bg-white group-hover:bg-ln-gray-50';
}

function fmt(v) { return v === null || v === undefined ? '—' : v.toFixed(2); }
function plural(n, w) { const v = Number(n) || 0; return v + ' ' + w + (v > 1 ? 's' : ''); }

const TERM_LABELS = { 'T-1': 'Semestre 1', 'T-2': 'Semestre 2' };
function termLabel(t) { return TERM_LABELS[t] || t; }

function ueOf(r, code) {
  return r.ue_results.find((u) => u.course_ue === code && u.academic_term === tab.value) || null;
}
function ueValue(r, code) {
  const u = ueOf(r, code);
  return u && u.ue_average !== null ? u.ue_average.toFixed(1) : '—';
}
/** Trois tons, trois sens — et « compensée » n'est pas « acquise ». */
function ueTone(r, code) {
  const u = ueOf(r, code);
  if (!u || u.ue_average === null) return 'text-ln-gray-400';
  if (u.has_floor_violation) return 'bg-ln-error-bg text-ln-error';
  if (u.is_validated) return 'text-ln-success';
  if (u.is_compensated) return 'bg-ln-warning-bg text-ln-warning';
  return 'text-ln-error';
}
function termAvg(r) {
  const sem = tab.value === 'T-1' ? r.previous_semester_result : r.semester_result;
  return sem ? sem.semester_average : null;
}
function termCredits(r) {
  const sem = tab.value === 'T-1' ? r.previous_semester_result : r.semester_result;
  return sem ? sem.total_ects_earned + ' / ' + sem.total_ects_possible : '—';
}

function hasCouncil(r) {
  const h = r.cps_history || {};
  return (h.preconisations || []).length || (h.unjustified_cps_absences || []).length;
}
/** Une préconisation SANS constat n'est pas en échec : elle est non constatée. */
function cpsTone(p) {
  if (p.finding) return 'valide';
  if (p.kind.includes('Contrat')) return 'suspendue';
  // `renvoyee` porte le ton rouge ; `refuse` n'est pas au vocabulaire.
  if (p.kind.includes('solennel') || p.kind.includes('Signalement')) return 'renvoyee';
  return 'brouillon';
}
function cpsLabel(p) {
  if (p.kind.includes('Contrat')) return p.finding ? 'Contrat · constaté' : 'Contrat · non constaté';
  return p.kind;
}

function openCouncil(r) {
  selectedId.value = r.student;
  panel.value = {
    kind: 'council', title: 'Préconisations de l’année', student_name: r.student_name,
    preconisations: r.cps_history.preconisations,
    absences: r.cps_history.unjustified_cps_absences,
  };
}

/**
 * Le panneau d'une unité. Il porte la RAISON du non-acquis, pas seulement la
 * note : c'est ce qui permet d'expliquer qu'un étudiant à onze de moyenne ne
 * valide pas son semestre.
 */
function openUe(r, code) {
  selectedId.value = r.student;
  const u = r.ue_results.find((x) => x.course_ue === code);
  if (!u) return;
  const rowsOut = [
    { k: 'Semestre', v: termLabel(u.academic_term) },
    { k: 'Moyenne', v: u.ue_average === null ? 'aucune note' : u.ue_average.toFixed(2) + ' / 20' },
    { k: 'Crédits', v: u.ects_earned + ' acquis sur ' + u.ects_possible },
    { k: 'État', v: u.is_validated ? 'Acquise' : u.is_compensated ? 'Compensée par le semestre' : 'Non acquise' },
    { k: 'Décision du jury', v: u.is_jury_validated ? 'Validée par le jury' : 'aucune' },
  ];
  panel.value = {
    kind: 'ue', title: code + (u.ue_label ? ' — ' + u.ue_label : ''),
    student_name: r.student_name, rows: rowsOut,
    floorNote: u.has_floor_violation
      ? 'La moyenne est sous le plancher de 6 / 20. Le plancher EMPÊCHE la compensation : cette '
        + 'unité ne peut pas être rattrapée par la moyenne du semestre, même si celle-ci atteint 10. '
        + 'C’est la règle qui fait qu’un étudiant au-dessus de la moyenne peut ne pas valider.'
      : null,
  };
}

function notBuilt(what) {
  pending.value = what + " — cet acte n'est pas encore branché au serveur. Rien n'a été enregistré.";
  closeOpen.value = false;
}

function reload() {
  // F3-PROV : sans sujet, RIEN ne charge — l'écran le dit et offre la liste.
  if (!subject.value) { loadList(); return; }
  dashRes.load({ name: subject.value });
  rosterRes.load({ ...params.value, deliberation: subject.value });
}

onMounted(reload);
watch(params, reload);
watch(subject, reload);
</script>
