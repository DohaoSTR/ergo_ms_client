<script setup>
import { Bell, Shield, Trash2, UserRoundPlus } from 'lucide-vue-next'
import { ref } from 'vue'

const props = defineProps({
  userStatus: { type: String, required: true, default: 'online' },
})

const emits = defineEmits(['toggleMessengerMyInfo', 'choiceStatus'])

// Статус под аватаркой
const statusNameUnderAvatar = ref('В сети')
const statusColorUnderAvatar = ref('success')

// Установка статуса под аватаркой
switch (props.userStatus) {
  case 'away':
    statusNameUnderAvatar.value = 'Нет на месте'
    statusColorUnderAvatar.value = 'warning'
    break
  case 'busy':
    statusNameUnderAvatar.value = 'Не беспокоить'
    statusColorUnderAvatar.value = 'danger'
    break
  case 'offline':
    statusNameUnderAvatar.value = 'Не в сети'
    statusColorUnderAvatar.value = 'secondary'
    break
  default:
    statusNameUnderAvatar.value = 'В сети'
    statusColorUnderAvatar.value = 'success'
}

// Изменение статуса под аватаркой
const choiceStatus = (statusStatus, statusName, statusColor) => {
  emits('choiceStatus', statusStatus)
  statusNameUnderAvatar.value = statusName
  statusColorUnderAvatar.value = statusColor
}

// ==================================================

// Информация о пользователе
const user = ref({
  image: '/src/assets/avatars/avatar-1.png',
  name: 'Иван Иванов',
  status: 'в сети',
  about: 'Администратор. Главный управляющий.',
})

// Статусы активности
const statuses = ref([
  { id: 'statusOnline', status: 'online', name: 'В сети', color: 'success' },
  { id: 'statusAway', status: 'away', name: 'Нет на месте', color: 'warning' },
  { id: 'statusBusy', status: 'busy', name: 'Не беспокоить', color: 'danger' },
  { id: 'statusOffline', status: 'offline', name: 'Не в сети', color: 'secondary' },
])

// Настройки пользователя
const settings = ref([
  { icon: Shield, name: 'Доп. защита', showSwitch: true },
  { icon: Bell, name: 'Уведомления', showSwitch: true },
  { icon: UserRoundPlus, name: 'Добавить друзей', showSwitch: false },
  { icon: Trash2, name: 'Удалить аккаунт', showSwitch: false },
])
</script>

<template>
  <div class="mb-3 text-end w-100">
    <button type="button" class="btn btn-close" @click="$emit('toggleMessengerMyInfo')"></button>
  </div>

  <div class="d-flex flex-column align-items-center">
    <img :src="user.image" :alt="user.name" class="rounded-circle" width="100" height="100" />
    <h5 class="mt-2 mb-1">{{ user.name }}</h5>
    <div :class="`text-${statusColorUnderAvatar}`">{{ statusNameUnderAvatar }}</div>
  </div>

  <div class="py-3">
    <h6 class="mb-1">Описание</h6>
    <p class="text-muted mb-0 lh-sm" style="font-size: 0.9375rem">{{ user.about }}</p>
  </div>

  <div class="pb-3">
    <h6 class="mb-1">Видимость в сети</h6>
    <div v-for="status in statuses" :key="status.id" class="hover-section rounded p-2">
      <div class="form-check">
        <input
          class="form-check-input shadow-none"
          type="radio"
          name="userStatus"
          :id="status.id"
          @change="choiceStatus(status.status, status.name, status.color)"
          :checked="userStatus === status.status"
        />
        <label class="form-check-label w-100" :for="status.id">{{ status.name }}</label>
      </div>
    </div>
  </div>

  <div class="pb-3">
    <h6 class="mb-1">Настройки</h6>
    <ul class="list-unstyled mb-0">
      <li v-for="(setting, index) in settings" :key="index" class="hover-section rounded p-2">
        <div class="d-flex align-items-center justify-content-between">
          <div class="d-inline-flex align-items-center gap-2">
            <component :is="setting.icon" :size="21" />
            <span class="lh-sm">{{ setting.name }}</span>
          </div>
          <div v-if="setting.showSwitch">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" role="switch" id="switch" checked />
            </div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.form-check label {
  cursor: pointer;
}

input[id='statusOnline']:checked {
  background-color: var(--bs-success);
  box-shadow: 0 0.125rem 0.25rem 0 rgba(var(--bs-success-rgb), 0.4);
}

input[id='statusAway']:checked {
  background-color: var(--bs-warning);
  box-shadow: 0 0.125rem 0.25rem 0 rgba(var(--bs-warning-rgb), 0.4);
}

input[id='busy']:checked {
  background-color: var(--bs-danger);
  box-shadow: 0 0.125rem 0.25rem 0 rgba(var(--bs-danger-rgb), 0.4);
}

input[id='statusOffline']:checked {
  background-color: var(--bs-secondary);
  box-shadow: 0 0.125rem 0.25rem 0 rgba(var(--bs-secondary-rgb), 0.4);
}
</style>
