<script setup>
import { EllipsisVertical, MessagesSquare, Trash, ArrowLeftToLine } from 'lucide-vue-next'
import { computed } from 'vue'
import { useToast } from 'vue-toastification'
import { deleteProject,leaveProject  } from '@/js/api/services/projectsService'
import Cookies from 'js-cookie'

import AvatarGroup from '@/components/AvatarGroup.vue'
import DropDown from '@/components/DropDown.vue'

const toast = useToast()

const props = defineProps({
  icon: { type: Function, default: null },
  iconBackground: { type: String, default: 'bg-gray' },
  title: { type: String, required: true },
  budget: { type: Object, default: () => ({ current: 0, declared: 0 }) },
  caption: { type: String, default: 'Описание проекта отсутствует' },
  date: { type: Object, default: () => ({ start: 0, deadline: 0 }) },
  hours: { type: Number, default: 0 },
  tasks: { type: Object, default: () => ({ current: 0, all: 0 }) },
  project_id: { type: [Number, String], required: true },
  user_id: { type: [Number, String], required: true },

  isInvited: { type: Boolean, default: false } ,// Новый пропс
  isAll: { type: Boolean, default: false } // Новый пропс

})

const emit = defineEmits(['projectDeleted', 'viewTasks','projectLeaved'])

// Форматирование даты
const formatDate = (timestamp) => {
  if (!timestamp) return 'Не указана'
  
  const date = new Date(timestamp * 1000)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}.${month}.${year}`
}

// Получение оставшегося времени
const daysLeft = computed(() => {
  if (!props.date.deadline) return 0
  
  const now = Date.now()
  const targetDate = props.date.deadline * 1000
  const difference = targetDate - now
  return Math.ceil(difference / (1000 * 60 * 60 * 24))
})

// Вычисление процента выполнения
const progressPercent = computed(() => {
  if (!props.tasks.all || props.tasks.all === 0) return 0;
  return Math.round((props.tasks.current / props.tasks.all) * 100);
});

// Цвет для отображения дней
const daysLeftColor = computed(() => {
  if (daysLeft.value >= 60) return 'bg-success-subtle text-success'
  if (daysLeft.value >= 30) return 'bg-warning-subtle text-warning'
  return 'bg-danger-subtle text-danger'
})

// Обработчик удаления проекта
const handleDeleteProject = async () => {
  try {
    const response = await deleteProject(props.project_id);
    
    if (response.success) {
      toast.success(response.message || 'Проект успешно удалён');
      emit('projectDeleted', props.project_id);
    } else {
      toast.error(response.error || 'Не удалось удалить проект');
    }
  } catch (error) {
    console.error('Ошибка при удалении проекта:', error);
    toast.error('Произошла ошибка при удалении проекта');
  }
}

const handleLeaveProject = async () => {
  try {
    const response = await leaveProject(parseInt(Cookies.get('userId')),props.project_id);
    
    if (response.success) {
      toast.success(response.message || 'Вы успешно вышли из проекта');
      emit('projectLeaved', props.project_id);
    } else {
      toast.error(response.error || 'Не удалось удалить покинуть проект');
    }
  } catch (error) {
    console.error('Ошибка при выходе из проекта:', error);
    toast.error('Произошла ошибка при выходе из проекта');
  }
}
</script>

<template>
<div class="card">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <div class="d-flex align-items-center gap-2">
        <div class="rounded p-2 text-white icon-flex" :class="iconBackground">
          <component :is="icon" v-if="icon" :size="22" />
          <span v-else>{{ title.charAt(0) }}</span>
        </div>
        <h5 class="card-title mb-0">{{ title }}</h5>
      </div>
      <div class="d-block">
        <DropDown dropdownMenuClass="dropdown-menu-end">
          <template #main>
            <EllipsisVertical :size="20" />
          </template>
          <template #list>
            <!-- Скрываем кнопку удаления для приглашенных проектов -->
            <li 
              v-if="!isInvited && !isAll" 
              class="dropdown-item text-danger" 
              @click="handleDeleteProject"
            >
              <Trash :size="20" /> Удалить
            </li>
              <li 
              v-if="isInvited || isAll" 
              class="dropdown-item text-danger" 
              @click="handleLeaveProject"
            >
              <ArrowLeftToLine :size="20" /> Покинуть проект
            </li>
            <li class="dropdown-item" @click="$emit('viewTasks', project_id)">
              <MessagesSquare :size="20" /> Посмотреть задачи
            </li>
          </template>
        </DropDown>
      </div>
    </div>
    
    <!-- Остальной код шаблона остается без изменений -->
    <div class="d-flex align-items-center justify-content-between mb-3">
      <div class="d-flex flex-column py-2">
        <div class="d-flex gap-1 justify-content-end">
          <span class="fw-bold">Создан:</span>
          <span class="fw-normal">{{ formatDate(date.start) }}</span>
        </div>
        <div v-if="date.deadline" class="d-flex gap-1 justify-content-end">
          <span class="fw-bold">Дедлайн:</span>
          <span class="fw-normal">{{ formatDate(date.deadline) }}</span>
        </div>
      </div>
    </div>
    
    <div class="project-caption" style="line-height: 120%">{{ caption }}</div>
    <span class="border-top my-3"></span>
    
    <div class="d-flex align-items-center justify-content-between mb-3">
      <div class="d-flex gap-1">
        <span class="fw-bold">Часов:</span>
        <span class="fw-normal">{{ hours || 0 }}</span>
      </div>
      <div v-if="date.deadline" class="rounded px-2 py-1" :class="daysLeftColor">
        Осталось {{ daysLeft }} дней
      </div>
    </div>
    
<div class="d-flex align-items-center justify-content-between mb-1" style="font-size: 14px">
      <div class="fw-normal">
        Задачи: 
        <span class="text-success">{{ tasks.current }} ✓</span> / 
        <span class="text-danger">{{ tasks.active }} ✗</span> / 
        <span class="text-primary">{{ tasks.all }} ∑</span>
      </div>
      <div class="fw-normal">
        Выполнено: {{ progressPercent }}%
      </div>
    </div>
    
    <div class="progress mb-3" role="progressbar">
      <div
        class="progress-bar rounded"
        :style="{ width: progressPercent + '%' }"
      ></div>
    </div>
    
    <div class="d-flex align-items-center justify-content-between">
      <AvatarGroup />
    </div>
  </div>
</template>

<style scoped lang="scss">
.project-caption {
  @include truncate-text(2);
}

.hover-outline {
  transition: all $transition;
  &:hover {
    background-color: var(--color-secondary-background);
  }
}

.card {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.text-success {
  color: var(--bs-success);
}
.text-danger {
  color: var(--bs-danger);
}
.text-primary {
  color: var(--bs-primary);
}
</style>