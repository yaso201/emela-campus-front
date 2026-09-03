<template>
  <!-- ⚠️ Portée verrouillée : un LIBELLÉ, jamais un sélecteur grisé. Le serveur
       refuse déjà hors périmètre en fail-closed ; offrir des choix qui échoueront
       est la règle 3 prise à l'envers. -->
  <p v-if="locked" class="inline-flex h-[30px] items-center gap-2 rounded-sm-ln border border-ln-gray-200 bg-ln-gray-50 px-3 text-caption text-ln-gray-700">
    <span class="text-ln-gray-500">Filière</span>
    <b class="font-semibold text-ln-gray-900">{{ label }}</b>
    <span class="text-ln-gray-400" title="Votre périmètre est fixé par votre rôle.">votre périmètre</span>
  </p>

  <label v-else class="inline-flex h-[30px] items-center gap-2 rounded-sm-ln border border-ln-gray-300 px-3 text-caption">
    <span class="text-ln-gray-500">Filière</span>
    <select class="bg-transparent font-semibold text-ln-gray-900 outline-none" :value="program"
            @change="pick($event.target.value)">
      <option v-for="p in options" :key="p.name" :value="p.name">{{ p.program_name }}</option>
    </select>
  </label>
</template>

<script setup>
/**
 * Le sélecteur de filière — deux formes, une par source.
 *
 * Il remplace le bouchon des grappes 4 et 5 : un nom de filière écrit en dur,
 * envoyé à un vrai point d'entrée. La source existe, et elle est double — la
 * portée du lecteur quand elle est fixée, les options de structure sinon.
 */
import { useProgramScope } from '../../composables/useProgramScope.js';

const { program, label, options, locked, pick } = useProgramScope();
</script>
