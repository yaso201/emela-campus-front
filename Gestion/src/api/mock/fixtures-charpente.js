/**
 * Simulacre des étapes 1 et 2 (MANDAT-10, E3', maquette) — calendrier académique et catalogue des filières.
 *
 * Les formes sont celles que la maquette PROPOSE au serveur (`api/charpente.js`) ; les valeurs reprennent le banc
 * `campus-dev` (filières LIS, LRC, PRE, programmes de catalogue Bachelor et double diplôme ; années 2025-2026 à
 * 2027-2028) pour que les captures parlent à la scolarité. Non stateful : le simulacre fait tourner l'écran, il ne
 * persiste rien — une création renvoie l'écho de ce qu'elle aurait créé.
 */

// K1 (VERDICT-MANDAT-10-PC1B) : un férié appartient à l'année dont les dates le contiennent — le 1ᵉʳ et le
// 15 août 2026 sont des fériés de 2025-2026 (qui finit le 31 août), pas de 2026-2027.
const fer = (holiday_date, description) => ({ holiday_date, description });

const HOLIDAYS_2025 = [
  fer('2026-05-01', 'Fête du travail'),
  fer('2026-08-01', 'Fête de l’Indépendance'),
  fer('2026-08-15', 'Assomption'),
  fer('2026-08-26', 'Maouloud'),
];

const HOLIDAYS_2026 = [
  fer('2026-11-01', 'Toussaint'),
  fer('2026-12-25', 'Noël'),
  fer('2027-01-01', 'Jour de l’an'),
  fer('2027-01-10', 'Fête des religions endogènes'),
  fer('2027-03-10', 'Fin du Ramadan'),
  fer('2027-03-29', 'Lundi de Pâques'),
  fer('2027-05-01', 'Fête du travail'),
  fer('2027-05-06', 'Ascension'),
  fer('2027-05-16', 'Tabaski'),
  fer('2027-05-17', 'Lundi de Pentecôte'),
  fer('2027-08-01', 'Fête de l’Indépendance'),
  fer('2027-08-15', 'Assomption'),
];

const HOLIDAYS_2027 = [
  fer('2027-11-01', 'Toussaint'),
  fer('2027-12-25', 'Noël'),
  fer('2028-01-01', 'Jour de l’an'),
  fer('2028-01-10', 'Fête des religions endogènes'),
  fer('2028-05-01', 'Fête du travail'),
  fer('2028-08-01', 'Fête de l’Indépendance'),
];

const term = (year, term_name, start, end, working_days) => ({
  name: `${year} (${term_name})`, academic_year: year, term_name,
  term_start_date: start, term_end_date: end,
  parity: /S(\d+)/.test(term_name) ? (Number(term_name.match(/S(\d+)/)[1]) % 2 ? 'impair' : 'pair') : null,
  working_days,
});

const YEARS = [
  {
    name: '2027-2028', year_start_date: '2027-09-01', year_end_date: '2028-08-31',
    is_current: false, closed: false, holiday_list: 'FERIES-2027-2028',
    terms: [term('2027-2028', 'S1', '2027-09-01', '2028-01-31', 103)],
    holidays: HOLIDAYS_2027,
  },
  {
    name: '2026-2027', year_start_date: '2026-09-01', year_end_date: '2027-08-31',
    is_current: true, closed: false, holiday_list: 'FERIES-2026-2027',
    terms: [
      term('2026-2027', 'S1', '2026-09-01', '2027-01-31', 104),
      term('2026-2027', 'S2', '2027-02-01', '2027-07-31', 120),
      term('2026-2027', 'LIS-S5-COM', '2026-09-01', '2027-01-31', 104),
      term('2026-2027', 'LIS-S6-STAGE', '2027-01-01', '2027-07-31', 140),
      term('2026-2027', 'PG-S4', '2027-02-01', '2027-07-31', 120),
      term('2026-2027', 'Rattrapage', '2027-07-01', '2027-07-31', 21),
    ],
    holidays: HOLIDAYS_2026,
  },
  {
    name: '2025-2026', year_start_date: '2025-09-01', year_end_date: '2026-08-31',
    is_current: false, closed: true, holiday_list: 'FERIES-2025-2026',
    terms: [
      term('2025-2026', 'S1', '2025-09-01', '2026-01-31', 103),
      term('2025-2026', 'S2', '2026-02-01', '2026-07-31', 121),
    ],
    holidays: HOLIDAYS_2025,
  },
];

/** `list_academic_calendar()` — forme proposée au serveur. */
export function academicCalendar(params = {}) {
  if (params.__empty) return { current_academic_year: null, holiday_list_in_force: null, years: [] };
  return {
    current_academic_year: '2026-2027',
    // La liste que le décompte des jours ouvrés lit AUJOURD'HUI (clé de site `academic_holiday_list`, RUN-01).
    holiday_list_in_force: 'FERIES-2026-2027',
    years: YEARS,
  };
}

/* ─── Catalogue ─────────────────────────────────────────────────────────── */

const prog = (name, program_name, acronym, type, years, ects, extra = {}) => ({
  name, program_name, program_abbreviation: acronym, custom_filiere_acronym: acronym,
  custom_program_type: type, custom_nb_annees: years, custom_total_ects_required: ects,
  custom_is_active: 1, custom_catalogue_only: 0, custom_responsable_programme: null, ...extra,
});

export const CATALOGUE = [
  prog('LIS', 'Licence Informatique et Systèmes', 'LIS', 'Licence', 3, 180,
    { custom_responsable_programme: 'ENS-00001', responsable_name: 'Rachidatou Boni' }),
  prog('LRC', 'Licence Réseaux et Cloud', 'LRC', 'Licence', 3, 180,
    { custom_responsable_programme: 'ENS-00002', responsable_name: 'Sylvain Tohoun' }),
  prog('PRE', 'Cycle préparatoire', 'PRE', 'Cycle Préparatoire', 2, 120),
  prog('LMI', 'Licence Mathématiques-Informatique', 'LMI', 'Licence', 3, 180, { custom_is_active: 0 }),
  prog('Bachelor Développeur Web et Mobile', 'Bachelor Développeur Web et Mobile', 'DWM', 'Bachelor', 3, 180,
    { custom_catalogue_only: 1, custom_partner_name: 'École partenaire' }),
  prog('DD-IS-DWM', 'Double diplôme Informatique et Systèmes — Développeur Web et Mobile', 'DD-IS-DWM',
    'Double-Diplomation', 3, 180, { custom_catalogue_only: 1, custom_dd_enabled: 1,
      custom_dd_component_1: 'LIS', custom_dd_component_2: 'Bachelor Développeur Web et Mobile' }),
];

/**
 * `list_programs(include_inactive=1)` — forme EXISTANTE (`PROGRAM_LIST_FIELDS`), plus les champs que la maquette
 * propose d'y ajouter (`custom_catalogue_only`, `custom_nb_annees`, `custom_total_ects_required`) et deux comptes.
 */
export function programCatalogue(params = {}) {
  if (params.__empty) return [];
  return CATALOGUE.map((p) => ({
    ...p,
    levels_count: (LEVELS[p.name] || []).length,
    parcours_count: (PARCOURS[p.name] || []).length,
  }));
}

const LEVELS = {
  LIS: [
    { name: 'LIS-L1', level_code: 'LIS-L1', level_name: 'Licence 1', level_order: 1, max_semesters: 2, max_duration_years: 2 },
    { name: 'LIS-L2', level_code: 'LIS-L2', level_name: 'Licence 2', level_order: 2, max_semesters: 2, max_duration_years: 2 },
    { name: 'LIS-L3', level_code: 'LIS-L3', level_name: 'Licence 3', level_order: 3, max_semesters: 2, max_duration_years: 2 },
  ],
  LRC: [
    { name: 'LRC-L1', level_code: 'LRC-L1', level_name: 'Licence 1', level_order: 1, max_semesters: 2, max_duration_years: 2 },
    { name: 'LRC-L2', level_code: 'LRC-L2', level_name: 'Licence 2', level_order: 2, max_semesters: 2, max_duration_years: 2 },
    { name: 'LRC-L3', level_code: 'LRC-L3', level_name: 'Licence 3', level_order: 3, max_semesters: 2, max_duration_years: 2 },
  ],
  PRE: [
    { name: 'PRE-P1', level_code: 'PRE-P1', level_name: 'Prépa 1', level_order: 1, max_semesters: 2, max_duration_years: 2 },
    { name: 'PRE-P2', level_code: 'PRE-P2', level_name: 'Prépa 2', level_order: 2, max_semesters: 2, max_duration_years: 2 },
  ],
};

const PARCOURS = {
  LIS: [
    { name: 'PRC-LIS-M1', parcours_code: 'LIS-M1', parcours_name: 'Majeure Génie logiciel', parcours_type: 'Majeure',
      choice_count: 1, academic_term: '2026-2027 (LIS-S5-M1)', validation_status: 'Brouillon', total_ects: 18 },
    { name: 'PRC-LIS-M2', parcours_code: 'LIS-M2', parcours_name: 'Majeure Systèmes et données', parcours_type: 'Majeure',
      choice_count: 1, academic_term: '2026-2027 (LIS-S5-M2)', validation_status: 'Brouillon', total_ects: 18 },
    { name: 'PRC-LIS-S6', parcours_code: 'LIS-S6', parcours_name: 'Semestre 6 — incubation ou stage', parcours_type: 'Option',
      choice_count: 1, academic_term: '2026-2027 (LIS-S6-STAGE)', validation_status: 'Validé', total_ects: 30 },
  ],
  LRC: [],
};

/**
 * `get_program(program)` — forme EXISTANTE (identité, `levels`, `counters`), plus ce que la maquette propose d'y
 * ajouter : `parcours` (la liste) et `counters.students` (une filière utilisée ne se supprime pas, elle se désactive).
 */
export function programDetail(params = {}) {
  const p = CATALOGUE.find((x) => x.name === params.program) || CATALOGUE[0];
  const parcours = params.__empty ? [] : (PARCOURS[p.name] || []);
  return {
    ...p,
    levels: params.__empty ? [] : (LEVELS[p.name] || []),
    counters: { ues: p.name === 'LIS' ? 59 : p.name === 'LRC' ? 23 : 0, mhc_modules: 0,
      parcours: parcours.length, students: p.name === 'LIS' ? 3 : 0 },
    parcours,
  };
}

/* ─── Échos d'actes (non stateful) ─────────────────────────────────────── */

export const echo = {
  year: (p) => ({ name: (p && p.academic_year_name) || '' }),
  term: (p) => {
    const v = p || {};
    if (!/S\d+/.test(v.term_name || '')) {
      throw Object.assign(new Error('Le nom du semestre doit porter son numéro (S1, S2…) : la parité s’en déduit et ne se devine pas.'),
        { code: 'VALIDATION', status: 417 });
    }
    return { name: `${v.academic_year} (${v.term_name})`, term_name: v.term_name };
  },
  holiday: (p) => ({ academic_year: p && p.academic_year, holiday_date: p && p.holiday_date, description: p && p.description }),
  removed: (p) => ({ academic_year: p && p.academic_year, holiday_date: p && p.holiday_date, removed: true }),
  current: (p) => ({ current_academic_year: p && p.academic_year, previous: '2026-2027' }),
  program: (p) => ({ name: (p && (p.program_name || p.name)) || '' }),
  active: (p) => ({ name: p && p.program, custom_is_active: p && p.is_active ? 1 : 0 }),
  level: (p) => ({ name: ((p && p.values) || {}).level_code }),
  parcours: (p) => ({ name: 'PRC-MOCK-0001', validation_status: 'Brouillon' }),
};
