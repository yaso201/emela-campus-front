/**
 * Contexte académique — année et semestre, permanents, hérités par toute vue.
 * Persistés dans l'URL (partageable, et survit au rechargement) ; les vues les
 * lisent, elles ne les stockent pas.
 *
 * La filière n'est PAS un contexte : c'est un filtre d'écran (lot 1 §1).
 */
import { computed, readonly, ref, shallowRef } from 'vue';
import { academicContext } from '../api/session.js';
import { isDenied } from '../api/client.js';
import { denial } from './useResource.js';

const years = shallowRef([]);
const terms = shallowRef([]);
const note = ref('');
const yearId = ref(null);
const termId = ref(null);
const ready = ref(false);

let started = null;

function fromUrl() {
  const q = new URLSearchParams(location.search);
  return { year: q.get('year'), term: q.get('term') };
}
function toUrl() {
  const url = new URL(location.href);
  if (yearId.value) url.searchParams.set('year', yearId.value);
  if (termId.value) url.searchParams.set('term', termId.value);
  history.replaceState(null, '', url);
}

async function load() {
  if (started) return started;
  started = (async () => {
    /**
     * ⚠️ RÈGLE 5, AUSSI POUR LE CONTEXTE (stabilisation §6). Un refus GLOBAL
     * refusait aussi cet appel : la promesse rejetait sans être captée, les
     * écrans dont le chargement attend `params` (/planning, /groupes) ne
     * partaient jamais — squelette perpétuel, qui laisse croire que ça charge.
     * Le refus alimente `denial` : la coquille rend le refus EXPLIQUÉ à la
     * place de la page, comme pour toute ressource (useResource).
     */
    let ctx;
    try {
      ctx = await academicContext();
    } catch (err) {
      started = null;
      if (isDenied(err)) { err.globalDenial = true; denial.value = err; return; }
      throw err;
    }
    years.value = ctx.years || [];
    terms.value = ctx.terms || [];
    note.value = ctx.note || '';
    const url = fromUrl();
    yearId.value = url.year || ctx.current?.year || years.value[0]?.id || null;
    termId.value = url.term || ctx.current?.term || terms.value[0]?.id || null;
    toUrl();
    ready.value = true;
  })();
  return started;
}

const year = computed(() => years.value.find((y) => y.id === yearId.value) || null);
const term = computed(() => terms.value.find((t) => t.id === termId.value) || null);

function setYear(id) { yearId.value = id; toUrl(); }
function setTerm(id) { termId.value = id; toUrl(); }

/** Le couple transmis à chaque appel : une vue ne fabrique pas ces clés. */
const params = computed(() => ({ academic_year: yearId.value, term: termId.value }));

export function useAcademicContext() {
  return {
    years: readonly(years), terms: readonly(terms),
    year, term, note: readonly(note), params,
    ready: readonly(ready),
    load, setYear, setTerm,
  };
}
