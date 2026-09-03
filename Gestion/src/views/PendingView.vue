<template>
  <div class="mx-auto max-w-3xl py-6">
    <p class="mb-2 text-caption text-ln-gray-500">{{ title }}</p>
    <h1 class="text-h1 tracking-tight text-ln-gray-900">{{ title }} — écran non encore produit</h1>
    <p class="mt-3 text-body-sm leading-relaxed text-ln-gray-700">
      Cet écran appartient à la <b>grappe {{ grappe }}</b> et sera livré avec elle. La navigation le
      déclare déjà parce que le châssis doit être complet pour être jugé : une navigation amputée
      ne dit pas ce que l'application sera.
    </p>
    <p class="mt-3 text-body-sm leading-relaxed text-ln-gray-500">
      Une page qui n'existe pas le dit. Ce n'est ni une erreur, ni un refus de droit, ni un écran
      vide : ce sont trois choses différentes, et les confondre est la faute la plus fréquente de
      cette conversion.
    </p>
    <p class="mt-5 text-caption text-ln-gray-500">
      Maquette de référence : lots 1 à 8, sur le canvas de conception.
    </p>
  </div>
</template>

<script setup>
/** Écran déclaré, non encore produit. Il dit exactement cela. */
defineProps({
  title: { type: String, default: 'Écran' },
  grappe: { type: Number, default: 0 },
  navKey: { type: String, default: '' },
});
</script>
