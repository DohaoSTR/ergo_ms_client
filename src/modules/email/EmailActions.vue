<script setup>
import {
  Ban,
  CircleCheck,
  CircleOff,
  Folder,
  MailOpen,
  RefreshCcw,
  Tag,
  Trash,
} from 'lucide-vue-next'
import { computed, ref } from 'vue'

const props = defineProps({
  selectedEmails: { type: Set, required: true },
  emails: { type: Array, required: true },
  activeCategory: { type: String, required: true },
})

// Вычисление, выделены ли все элементы
const isAllSelected = computed(() => {
  if (props.selectedEmails.size === 0) return false
  return props.selectedEmails.size === props.emails.length
})

// Проверка, если частично выделены элементы
const isIndeterminate = computed(() => {
  return props.selectedEmails.size > 0 && props.selectedEmails.size < props.emails.length
})

// Список действий
const actions = ref([
  { id: 'recover', icon: CircleCheck, tooltip: 'Восстановить', event: 'recoverEmail' },
  { id: 'trash', icon: Trash, tooltip: 'Удалить', event: 'deleteEmail' },
  { id: 'spam', icon: Ban, tooltip: 'Это спам', event: 'spamEmail' },
  { id: 'nospam', icon: CircleOff, tooltip: 'Это не спам', event: 'noSpamEmail' },
  { id: 'read', icon: MailOpen, tooltip: 'Прочитать', event: null },
  { id: 'move', icon: Folder, tooltip: 'Переместить в', event: null },
  { id: 'mark', icon: Tag, tooltip: 'Отметить как', event: null },
])

// Фильтрация действий
const actionsFiltered = computed(() => {
  const hideActions = new Set()

  hideActions.add(props.activeCategory === 'trash' ? 'trash' : 'recover')
  hideActions.add(props.activeCategory === 'spam' ? 'spam' : 'nospam')

  return actions.value.filter((action) => !hideActions.has(action.id))
})
</script>

<template>
  <div class="d-flex align-items-center justify-content-between ps-3 mb-1">
    <div class="d-flex align-items-center gap-1">
      <div class="form-check m-0">
        <input
          class="form-check-input"
          type="checkbox"
          value=""
          id="flexCheckIndeterminate"
          :checked="isAllSelected"
          :indeterminate="isIndeterminate"
          @click="$emit('toggle-select-all-email')"
        />
      </div>
      <ul class="list-unstyled d-flex mb-0">
        <li
          v-for="action in actionsFiltered"
          :key="action.id"
          class="hover-section d-inline-flex rounded p-2"
          v-tooltip
          :title="action.tooltip"
          @click="$emit(action?.event)"
        >
          <component :is="action.icon" :size="19" color="var(--bs-secondary-text-emphasis)" />
        </li>
      </ul>
    </div>
    <div class="d-flex align-items-center">
      <div class="hover-section rounded p-2" v-tooltip title="Обновить">
        <RefreshCcw :size="19" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
