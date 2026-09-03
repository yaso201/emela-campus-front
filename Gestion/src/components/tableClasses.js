/**
 * Classes des cellules ancrées du tableau dense (composant 4).
 * Sorties du SFC parce qu'un <script setup> ne peut rien exporter.
 * La colonne ancrée porte l'IDENTITÉ de la ligne — l'étudiant, l'unité — sans
 * quoi le défilement horizontal fait perdre le sujet.
 */
export const stuckTh =
  'sticky left-0 top-0 z-[4] min-w-[186px] max-w-[186px] bg-ln-gray-50 text-left shadow-[1px_0_0_var(--ln-gray-200)]';

export const stuckTd =
  'sticky left-0 z-[2] min-w-[186px] max-w-[186px] bg-white text-left shadow-[1px_0_0_var(--ln-gray-200)]';

export const headTh =
  'sticky top-0 z-[3] h-8 whitespace-nowrap border-b border-ln-gray-300 bg-ln-gray-50 px-3 py-2 text-center text-micro font-semibold uppercase tracking-wide text-ln-gray-500';

export const bodyTd =
  'tabular h-9 whitespace-nowrap border-b border-ln-gray-100 px-3 text-center text-ln-gray-900';

/** Hauteurs de ligne — une seule par tableau, jamais de mélange. */
export const rowHeights = { compact: 36, default: 44, comfort: 52 };
