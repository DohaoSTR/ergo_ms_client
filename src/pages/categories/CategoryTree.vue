<template>
  <ul class="list-group">
    <li
      v-for="cat in categories"
      :key="cat.id"
      class="list-group-item"
      :style="{ marginLeft: `${level * 24}px` }"
    >
      <div class="d-flex align-items-center">
        <span class="me-2">
          <span v-if="level > 0">↳ </span>{{ cat.name }}
        </span>
        <button class="btn btn-sm btn-outline-success ms-1 white-text-on-hover" @click="$emit('add', cat.id)" :disabled="cat.disableAdd">Добавить подкатегорию</button>
        <button class="btn btn-sm btn-outline-primary ms-1 white-text-on-hover" @click="$emit('edit', cat)" :disabled="cat.disableEdit">Редактировать</button>
        <button class="btn btn-sm btn-outline-danger ms-1 white-text-on-hover" @click="$emit('delete', cat)" :disabled="cat.disableDelete">Удалить</button>
      </div>
      <CategoryTree
        v-if="cat.children && cat.children.length"
        :categories="cat.children"
        :level="level + 1"
        @add="$emit('add', $event)"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
      />
    </li>
  </ul>
</template>

<script setup>
defineProps({
  categories: { type: Array, required: true },
  level: { type: Number, default: 0 }
})
</script>

<style scoped>
.btn-outline-success.white-text-on-hover:hover,
.btn-outline-success.white-text-on-hover:active {
  color: #fff !important;
}
.btn-outline-primary.white-text-on-hover:hover,
.btn-outline-primary.white-text-on-hover:active {
  color: #fff !important;
}
.btn-outline-danger.white-text-on-hover:hover,
.btn-outline-danger.white-text-on-hover:active {
  color: #fff !important;
}

.white-text-on-hover {
  transition: color 0.15s;
}
.btn-outline-success:disabled,
.btn-outline-success.disabled,
.btn-outline-primary:disabled,
.btn-outline-primary.disabled,
.btn-outline-danger:disabled,
.btn-outline-danger.disabled {
  background-color: transparent !important;
  color: #bfbfbf !important;
  border-color: #dee2e6 !important;
  opacity: 1 !important;
  pointer-events: none;
}
</style>
