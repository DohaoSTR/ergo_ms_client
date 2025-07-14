<script setup>
import { ref } from 'vue'
import { Mail, OctagonAlert, SendHorizontal, SquarePen, Star, Trash } from 'lucide-vue-next'

defineProps({
  activeCategory: { type: String, required: true },
})

defineEmits(['changeEmailCategory'])

// Категории
const emailCategories = ref([
  { id: 'inbox', icon: Mail, name: 'Входящие', unread: 21, color: 'blue' },
  { id: 'sent', icon: SendHorizontal, name: 'Отправленные', unread: 0, color: 'success' },
  { id: 'drafts', icon: SquarePen, name: 'Черновики', unread: 2, color: 'indigo' },
  { id: 'marked', icon: Star, name: 'Избранные', unread: 0, color: 'warning' },
  { id: 'spam', icon: OctagonAlert, name: 'Спам', unread: 4, color: 'danger' },
  { id: 'trash', icon: Trash, name: 'Корзина', unread: 0, color: 'dark' },
])
</script>

<template>
  <div class="mb-1">
    <button class="btn btn-primary w-100" data-bs-toggle="modal" data-bs-target="#sendEmail">
      Написать
    </button>
  </div>

  <div class="pt-4">
    <ul class="list-unstyled d-flex flex-column gap-1">
      <li
        v-for="(category, index) in emailCategories"
        :key="index"
        class="hover-section d-flex align-items-center justify-content-between px-2 py-1 rounded"
        :class="
          activeCategory === category.id ? `bg-${category.color}-subtle text-${category.color}` : ''
        "
        @click="$emit('changeEmailCategory', category.id)"
        style="cursor: pointer"
      >
        <div class="d-flex align-items-center gap-2">
          <component v-if="category.icon" :is="category.icon" :size="19" />
          <span>{{ category.name }}</span>
        </div>
        <div v-if="category.unread > 0" class="d-block">
          <small
            class="rounded px-2"
            :class="`bg-${category.color}-subtle text-${category.color} shadow-sm`"
          >
            {{ category.unread }}
          </small>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss"></style>
