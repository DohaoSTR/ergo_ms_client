<script setup>
import { Menu, Search } from 'lucide-vue-next'
</script>

<template>
  <div class="card p-0 shadow-none pb-3">
    <div class="d-flex align-items-center gap-2">
      <div class="email-burger" @click="$emit('toggle-email-menu', true)">
        <Menu />
      </div>
      <div class="d-flex form-control align-items-center gap-2 w-100">
        <Search :size="20" color="var(--bs-secondary-text-emphasis)" />
        <input
          type="text"
          placeholder="Поиск..."
          class="border-0 bg-transparent w-100"
          style="outline: none"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.email-burger {
  padding: 7px 8px;
  border-radius: 100%;
  cursor: pointer;
  transition: background-color $transition;

  &:hover {
    background-color: var(--color-secondary-background);
  }
}

@media (width >= 992px) {
  .email-burger {
    display: none;
  }
}
</style>
