/**
 * Grappe 2 · structure — CHEMINS CORRIGÉS, FORMES ALIGNÉES (F3-FORMES).
 *
 * ⚠️ Cette grappe appelait des noms NUS — `list_programs`, `get_ue`,
 * `propose_maquette` — sans le module qui les porte. Tous sont lus dans
 * `portal_app/api/academic/structure.py` — surface mince, gardes en première
 * ligne du service : « charpente (Year/Term/Program) : GA · modules : GA+EM ».
 *
 * F3-FORMES : le serveur rend SA forme (les `return` réels de `structure.py`
 * et `unit_usage.py`, que le simulacre reproduit désormais) ; CE MODULE
 * reconstruit la forme que les ÉCRANS consomment — l'arbre APLATI, le panneau
 * d'unité, l'usage aval. Chaque adaptation porte son motif
 * (« FORMES : <clé> serveur → <clé> écran »).
 */
import { call } from './client.js';

const ST = 'portal_app.api.academic.structure.';

/** FORMES : validation_status serveur (Brouillon/Proposé/Validé) → clé de pastille écran. */
const UE_STATUS = { Brouillon: 'brouillon', 'Proposé': 'propose', 'Validé': 'valide' };

/* ─── Charpente · lecture ────────────────────────────────────────────────── */

export const listAcademicYears = () => call(ST + 'list_academic_years');
export const listAcademicTerms = (academic_year) =>
  call(ST + 'list_academic_terms', { academic_year });
export const listPrograms = (p) => call(ST + 'list_programs', p);
export const getProgram = (program) => call(ST + 'get_program', { program });

/**
 * ⚠️ FORME CONFRONTÉE (stabilisation §4) : le vrai `list_structure_options`
 * rend des VOCABULAIRES (natures, types…) — PAS `programs`. La liste des
 * filières vit dans `list_programs`. L'adaptateur JOINT les deux lectures
 * réelles pour la forme qu'attendaient les consommateurs ({ programs, … }).
 */
export const listStructureOptions = async () => {
  const [opts, programs] = await Promise.all([
    call(ST + 'list_structure_options'),
    call(ST + 'list_programs'),
  ]);
  const rows = (programs && programs.items) || programs || [];
  return { ...(opts || {}), programs: rows };
};

/* ─── Maquette · lecture ─────────────────────────────────────────────────── */

/**
 * ⚠️ Le vrai arbre est PAR FILIÈRE (`program` positionnel) — l'écran de la
 * grappe 2 n'a pas de sélecteur. En attendant qu'il en gagne un (signalé au
 * reversement), l'adaptateur résout la PREMIÈRE filière — un choix, pas un
 * défaut universel, et l'écran devra le dire.
 *
 * 🟢 get_structure_tree(program, academic_year) — la forme serveur est
 * {program, levels, terms[.ues[.modules]], ects_cap} ; l'arbre APLATI
 * {id, parent, level} que l'écran consomme est reconstruit ici.
 */
export const getStructureTree = async (p) => {
  let program = p && p.program;
  if (!program) {
    const programs = await call(ST + 'list_programs');
    const rows = (programs && programs.items) || programs || [];
    program = rows[0] && (rows[0].name || rows[0].id);
  }
  // F3-FORMES : la SIGNATURE fait foi — (program, academic_year) seuls ;
  // `term` ne part plus (l'arbre montre tous les semestres).
  const d = await call(ST + 'get_structure_tree',
    { program: program, academic_year: p && p.academic_year });
  return adaptTree(d);
};

function adaptTree(d) {
  if (!d) return d;
  const nodes = [];
  const statuses = new Set();
  // FORMES : les TRACES du maker-checker sont PAR NŒUD au serveur (null = non
  // tracé) — l'écran veut UN cartouche : première trace non nulle rencontrée,
  // et null rendu null (l'écran affichera vide, jamais une valeur inventée).
  let proposed_by = null; let proposed_on = null; let validated_on = null;
  let ects = 0;
  for (const term of d.terms || []) {
    // FORMES : le semestre serveur n'a que son nom — id, label et niveau 1.
    nodes.push({ id: term.name, level: 1, label: term.name });
    for (const ue of term.ues || []) {
      const status = UE_STATUS[ue.validation_status] || 'brouillon';
      statuses.add(status);
      proposed_by = proposed_by || ue.proposed_by;
      proposed_on = proposed_on || ue.proposed_on;
      validated_on = validated_on || ue.validated_on;
      nodes.push({
        id: ue.name,
        level: 2,
        parent: term.name,
        // FORMES : name + ue_name serveur → libellé court d'affichage (« UE-3.1 » → « UE 3.1 … »).
        label: ue.name.replace('-', ' ') + (ue.ue_name ? ' ' + ue.ue_name : ''),
        metric: String(ue.ects_credits ?? ''),     // FORMES : ects_credits serveur → metric d'arbre
        status,
      });
      for (const m of ue.modules || []) {
        nodes.push({
          id: m.course,                            // FORMES : course serveur → id de nœud
          level: 3,
          parent: ue.name,
          code: m.custom_module_code,              // FORMES : custom_module_code → code
          label: m.course_name,                    // FORMES : course_name → label
        });
      }
    }
    ects += term.total_ects || 0;                  // FORMES : Σ terms[].total_ects → crédits DÉCLARÉS
  }
  // FORMES : l'état GLOBAL de maquette est DÉRIVÉ des états par nœud — un seul
  // état s'il est unanime, « mixte » sinon (l'écran ne doit pas affirmer
  // « validée » quand une unité est en brouillon).
  const state = statuses.size === 0 ? 'brouillon'
    : statuses.size === 1 ? [...statuses].values().next().value : 'mixte';
  return {
    nodes,
    program_label: (d.program || {}).program_name, // FORMES : program.program_name serveur → program_label écran
    ects,
    ects_cap: d.ects_cap,                          // FORMES : la constante de la GARDE, rendue par le serveur (V-LEARN-F3-13)
    maquette: { state, proposed_by, proposed_on, validated_on },
  };
}

/** 🟢 get_ue(ue) — UE_TREE_FIELDS + modules(volumes) + shared_programs. */
export const getUe = (ue) => call(ST + 'get_ue', { ue }).then((d) => d && ({
  code: d.ue_code,                                 // FORMES : ue_code serveur → code écran
  label: d.ue_name,                                // FORMES : ue_name serveur → label écran
  ects: d.ects_credits,
  status: UE_STATUS[d.validation_status] || 'brouillon',
  modules: (d.modules || []).map((m) => ({
    id: m.course,                                  // FORMES : course serveur → id écran
    code: m.custom_module_code,                    // FORMES : custom_module_code → code
    label: m.course_name,                          // FORMES : course_name → label
    volumes: m.volumes || {},                      // FORMES : volumes serveur (minuscules, types alloués seuls), tels quels
  })),
  partners: (d.shared_programs || []).map((sp) => ({
    id: sp.program,
    program: sp.program,
    active: !!sp.is_active,                        // FORMES : is_active serveur → active écran
    // FORMES : since_year et le responsable ne sont PAS rendus par get_ue
    // (champs non sélectionnés, structure.py:347) — clés absentes, l'écran dégrade.
  })),
}));

export const getModule = (course) => call(ST + 'get_module', { course });
export const getUeSharedPrograms = (ue) => call(ST + 'get_ue_shared_programs', { ue });

/* ─── Maquette · écriture ────────────────────────────────────────────────── */

export const createUe = (p) => call(ST + 'create_ue', p);
export const updateUe = (p) => call(ST + 'update_ue', p);
export const createModule = (p) => call(ST + 'create_module', p);
export const updateModule = (p) => call(ST + 'update_module', p);

/** 🟢 `structure.py:770` — `attach_module_to_ue(ue, course, coefficient)`. */
export const attachModuleToUe = (p) => call(ST + 'attach_module_to_ue', p);

/** 🟢 `structure.py:796` — `detach_module_from_ue(ue, course)`. */
export const detachModuleFromUe = (p) => call(ST + 'detach_module_from_ue', p);

/* ─── Cycle de vie de la maquette ────────────────────────────────────────── */

export const proposeMaquette = (p) => call(ST + 'propose_maquette', p);
export const validateMaquette = (p) => call(ST + 'validate_maquette', p);
export const returnMaquetteToDraft = (p) => call(ST + 'return_maquette_to_draft', p);
export const getMaquetteValidationStatus = (p) =>
  call(ST + 'get_maquette_validation_status', p);

/* ─── Usage aval ─────────────────────────────────────────────────────────── */

/**
 * Usage aval d'une unité — 🟢 LE MANQUE EST COMBLÉ (F3-COR S1) : le réel est
 * `portal_app.api.academic.chassis.get_unit_usage(ue)`. Il rend DEUX faits
 * DISTINCTS — `lock` (le VERROU par usage aval, DEC-290) et `validation`
 * (l'état du circuit de maquette) — jamais l'un lu dans l'autre.
 */
export const getUeDownstreamUsage = (ue) =>
  call('portal_app.api.academic.chassis.get_unit_usage', { ue }).then((d) => d && ({
    enrollments: (d.downstream || {}).enrollments, // FORMES : downstream.enrollments → enrollments écran
    // FORMES : « notes » à l'écran = soumissions de notes + résultats d'UE serveur.
    grades: ((d.downstream || {}).grade_submissions || 0) + ((d.downstream || {}).ue_results || 0),
    locked: !!(d.lock || {}).locked,               // FORMES : lock.locked → locked (le VERROU, pas la validation)
    locked_by: (d.lock || {}).origin,              // FORMES : lock.origin (le PREMIER usage aval) → locked_by
  }));
