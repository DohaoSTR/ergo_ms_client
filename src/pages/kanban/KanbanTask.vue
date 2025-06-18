<script setup>
import { MessageSquareText, Paperclip, Settings2, Check, Calendar } from 'lucide-vue-next' // Добавлен Calendar
import { computed } from 'vue'
import { useKanbanStore } from '@/js/api/services/tasksService'
const kanbanStore = useKanbanStore()

const props = defineProps({
  task: { type: Object, required: true, default: () => {} },
})

const emit = defineEmits(['task-updated'])

const priorityLabel = computed(() => {
  switch (props.task.priority) {
    case 1: return 'критическая'
    case 2: return 'важная'
    case 3: return 'срочная'
    case 4: return 'рутинная'
    default: return 'Другое'
  }
})

const priorityBackground = computed(() => {
  switch (props.task.priority) {
    case 1: return 'danger'
    case 2: return 'warning'
    case 3: return 'info'
    case 4: return 'secondary'
    default: return 'secondary'
  }
})

const handleTaskClick = () => {
  kanbanStore.setSelectedTask(props.task)
}

const toggleTaskStatus = async () => {
  try {
    const { success } = await kanbanStore.toggleTask(props.task.id);
    if (success) {
      emit('task-updated');
    }
  } catch (error) {
    console.error('Ошибка при изменении статуса задачи:', error);
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' }
  return new Date(dateString).toLocaleDateString('ru-RU', options)
}

// Добавляем вычисляемое свойство для цвета дедлайна
const deadlineColor = computed(() => {
  if (!props.task.deadline) return 'text-muted'
  const now = new Date()
  const deadline = new Date(props.task.deadline)
  const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'text-danger' // Просрочено
  if (diffDays <= 3) return 'text-warning' // Скоро срок
  return 'text-success' // Еще есть время
})
</script>

<template>
  <div 
    class="task-container"
    @click="handleTaskClick"
    style="cursor: pointer;"
  >
    <div class="d-flex align-items-center justify-content-between mb-2">
      <div class="d-flex align-items-center gap-2">
        <!-- Чекбокс -->
        <div 
          class="status-checkbox"
          @click.stop="toggleTaskStatus"
          :class="{ 'checked': task.isdone }"
        >
          <Check v-if="task.isdone" :size="14" class="check-icon" />
        </div>
        
        <span
          class="small px-2 py-1 rounded"
          :class="`bg-${priorityBackground}-subtle text-${priorityBackground}`"
        >
          {{ priorityLabel }}
        </span>
      </div>

      <div
        class="hover-section text-secondary-emphasis p-1 rounded"
        @click.stop="kanbanStore.setSelectedTask(props.task)"
      >
        <Settings2 :size="20" />
      </div>
    </div>
    
    <h6 class="mb-2" :class="{ 'text-decoration-line-through text-muted': task.isdone }">
      {{ props.task.title }}
    </h6>

    <!-- Блок с дедлайном - улучшенное отображение -->
    <div class="d-flex align-items-center gap-1 mb-2" v-if="task.deadline">
      <Calendar :size="14" class="text-muted" />
      <span :class="deadlineColor">
        {{ formatDate(task.deadline) }}
      </span>
    </div>
    <div v-else class="d-flex align-items-center gap-1 mb-2">
      <Calendar :size="14" class="text-muted" />
      <span class="text-muted">Нет срока</span>
    </div>

    <div v-if="props.task.image" class="mb-2">
      <img :src="props.task.image" :alt="props.task.title" class="img-fluid rounded" />
    </div>

    <div v-if="props.task.attachments || props.task.comments" class="d-flex gap-2">
      <div class="d-inline-flex align-items-center gap-1">
        <Paperclip :size="16" />
        <span>{{ props.task.attachments || 0 }}</span>
      </div>
      <div class="d-inline-flex align-items-center gap-1">
        <MessageSquareText :size="16" />
        <span>{{ props.task.comments || 0 }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-container {
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: white;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  position: relative;
}

.task-container:hover {
  background-color: #f8f9fa;
}

.hover-section:hover {
  background-color: #e9ecef;
}

.status-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #dee2e6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: 8px;
}

.status-checkbox:hover {
  border-color: #adb5bd;
}

.status-checkbox.checked {
  background-color: #cb2c20;
  border-color: #cb2c20;
}

.check-icon {
  color: white;
  stroke-width: 3px;
}
</style>