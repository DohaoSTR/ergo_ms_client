<template>
  <div>
    <div
      v-for="cat in categories"
      :key="cat.id"
      class="cat-item mb-2 p-0"
      :class="{ active: selectedPath && selectedPath[selectedPath.length - 1]?.id === cat.id }"
    >
      <button
        class="cat-btn btn btn-light w-100 text-start py-3 px-4 d-flex align-items-center"
        @click="$emit('select', { category: cat, path: [...parentPath] })"
      >
        <span class="flex-grow-1">
          <div class="cat-title">{{ cat.name }}</div>
          <div class="cat-slug text-muted small">/{{ cat.slug }}/</div>
        </span>
        <span v-if="cat.children && cat.children.length" class="cat-arrow ms-2">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 4l4 4-4 4"
              stroke="#9aaec9"
              stroke-width="2"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      </button>
      <div v-if="cat.children && cat.children.length" class="ms-3 mt-1">
        <CategoryTree
          :categories="cat.children"
          :selected-path="selectedPath"
          :parent-path="[...parentPath, { name: cat.name, slug: cat.slug, id: cat.id }]"
          @select="$emit('select', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  categories: Array,
  selectedPath: Array,
  parentPath: { type: Array, default: () => [] },
})
defineEmits(['select'])
</script>

<style scoped>
.cat-item {
  background: none;
  border-radius: 1rem;
  transition: background 0.2s;
}
.cat-item.active {
  background: #e4f0fb;
  box-shadow: 0 0 0 2px #6ec2ff33;
}
.cat-btn {
  border: none;
  background: transparent;
  font-size: 1.13rem;
  padding-left: 0.2rem;
  transition: background 0.18s, color 0.18s;
}
.cat-btn:hover,
.cat-item.active .cat-btn {
  background: #f2faff;
  color: #1976d2;
}
.cat-title {
  font-weight: 600;
  font-size: 1.11rem;
}
.cat-slug {
  font-size: 1.01rem;
  opacity: 0.78;
}
.cat-arrow {
  font-size: 1.2em;
  color: #9aaec9;
}
</style>
