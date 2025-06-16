<template>
  <ul v-if="categories && categories.length" class="list-group border-0 bg-transparent">
    <li v-for="cat in categories" :key="cat.id"
        class="list-group-item border-0 rounded my-1 category-node"
        :class="{
          'bg-primary bg-opacity-10 border-primary': selectedId === cat.id,
          'bg-white': selectedId !== cat.id
        }"
        :style="{ marginLeft: (level * 16) + 'px', cursor: 'pointer', fontWeight: level === 0 ? 'bold' : 'normal' }"
        @click.stop="selectCategory(cat.id)"
    >
      <span class="me-2" style="color: #1965a0">
        <span v-if="level > 0">↳ </span>{{ cat.name }}
      </span>
      <span class="text-muted small ms-1" style="font-size: 11px;">
        {{ cat.slug ? '/' + cat.slug + '/' : '' }}
      </span>
      <CategoryTreeClick
        v-if="cat.children && cat.children.length"
        :categories="cat.children"
        :selected-id="selectedId"
        :level="level + 1"
        @select="selectCategory"
      />
    </li>
  </ul>
</template>

<script setup>
import CategoryTreeClick from './CategoryTreeClick.vue'

const props = defineProps({
  categories: { type: Array, required: true },
  selectedId: [Number, String],
  level: { type: Number, default: 0 }
})
const emit = defineEmits(['select'])

function selectCategory(id) {
  emit('select', id)
}
</script>

<style scoped>
.category-node:hover {
  background: #e6f0fb !important;
  transition: background 0.2s;
}
</style>
