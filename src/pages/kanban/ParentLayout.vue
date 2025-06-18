<script setup>
import { EllipsisVertical, GripVertical, Plus } from 'lucide-vue-next'
import { DragHandle, SlickItem, SlickList } from 'vue-slicksort'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { ref } from 'vue'

import DropDown from '@/components/DropDown.vue'
import KanbanTask from '@/pages/kanban/KanbanTask.vue'
import KanbanEdit from '@/pages/kanban/KanbanEdit.vue'
import { useKanbanStore } from '@/stores/kanbanStore.js'

// Хранилище данных
const kanbanStore = useKanbanStore()

// Флаг для возможности копировать текст на карточках
const isCopyingText = ref(true)
</script>

<template>
  <PerfectScrollbar class="kanban-container">
    <SlickList axis="x" v-model:list="kanbanStore.columns" class="d-flex" useDragHandle>
      <SlickItem
        v-for="(column, i) in kanbanStore.columns"
        :key="column"
        :index="i"
        class="kanban-column mx-2 flex-shrink-0"
        style="width: 18rem"
      >
        <div class="d-flex align-items-center justify-content-between mb-3">
          <div class="d-inline-flex gap-1 text-truncate">
            <DragHandle style="cursor: move"><GripVertical :size="18" /></DragHandle>
            <h5
              class="mb-0 text-truncate user-select-none"
              contenteditable="true"
              style="outline: none"
            >
              {{ column.title }}
            </h5>
            <h5 class="mb-0 user-select-none">({{ column.cards.length }})</h5>
          </div>
          <DropDown dropdownMenuClass="hover-section dropdown-menu-end bg-light-subtle">
            <template #main>
              <EllipsisVertical :size="19" />
            </template>
            <template #list>
              <li class="dropdown-item" @click="kanbanStore.addTask(i)">Добавить задачу</li>
              <li class="dropdown-item">Изменить название</li>
              <li class="dropdown-item" @click="kanbanStore.deleteColumn(i)">Удалить блок</li>
            </template>
          </DropDown>
        </div>

        <SlickList
          axis="y"
          v-model:list="kanbanStore.columns[i].cards"
          group="tasks"
          helper-class="selected-card-task"
          :distance="10"
          @sort-start="isCopyingText = false"
          @sort-end="isCopyingText = true"
          @sort-cancel="isCopyingText = true"
        >
          <SlickItem
            v-for="(task, j) in kanbanStore.columns[i].cards"
            :key="task"
            :index="j"
            class="my-2"
          >
            <div
              class="kanban-card-task card"
              :class="{ 'user-select-none': !isCopyingText }"
              style="cursor: grab"
            >
              <KanbanTask :task="task" />
            </div>
          </SlickItem>
        </SlickList>
      </SlickItem>
      <div
        class="add-column d-inline-flex justify-content-center gap-1 p-2"
        @click="kanbanStore.addColumn()"
      >
        <Plus :size="24" />
        <h5 class="mb-0 text-nowrap">Добавить блок</h5>
      </div>
    </SlickList>
  </PerfectScrollbar>

  <KanbanEdit></KanbanEdit>
</template>

<style scoped lang="scss">
.kanban-container {
  height: 85dvh;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
}

// Стили при перетаскивании
.selected-card-task .kanban-card-task {
  transform: rotate(5deg);
}

// Кнопка добавления колонки
.add-column {
  color: var(--bs-secondary-text-emphasis);
  height: fit-content;
  cursor: pointer;

  transition: color $transition;

  &:hover {
    color: var(--bs-card-title-color);
  }
}
</style>
=======
<script setup>
import { EllipsisVertical, GripVertical, Plus, Bell, Calendar, Flag, Filter } from 'lucide-vue-next'
import { DragHandle, SlickItem, SlickList } from 'vue-slicksort'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { ref, onMounted, watch, computed } from 'vue'
import Cookies from 'js-cookie'
import { useToast } from 'vue-toastification'
import DropDown from '@/components/DropDown.vue'
import KanbanTask from '@/pages/kanban/KanbanTask.vue'
import KanbanTaskViewing from '@/pages/kanban/KanbanTaskViewing.vue'
import { useKanbanStore } from '@/js/api/services/tasksService'
import { useRoute } from 'vue-router'

const props = defineProps({
  project_id: {
    type: [Number, String],
    required: true
  },
    project_name: {
    type: String,
    default: 'Проект'
  }
})

const route = useRoute()
const projectId = ref(null)
const projectTitle = ref(route.query.project_name || props.project_name) // Используем переданное название проекта
const selectedPriorityFilter = ref('all')

const kanbanStore = useKanbanStore()
const toast = useToast()
const isCopyingText = ref(true)
const newSectionName = ref('')
const isAddingSection = ref(false)
const isAddingTask = ref(-1)
const newTaskData = ref({
  title: '',
  description: '',
  dueDate: null,
  priority: 0,
  reminders: []
})
const showDatePicker = ref(false)
const showReminderPicker = ref(false)
const reminderDate = ref(null)

const editingSectionId = ref(null)
const editingSectionName = ref('')

// Функция для начала редактирования раздела
const startEditingSection = (section) => {
  editingSectionId.value = section.id
  editingSectionName.value = section.title
}

// Функция для сохранения изменений
const saveSectionName = async () => {
  if (!editingSectionName.value.trim()) {
    toast.error('Название раздела не может быть пустым')
    return
  }

  try {
    const { success } = await kanbanStore.updatesSection(editingSectionId.value, {
      name: editingSectionName.value.trim()
    })
    
    if (success) {
      // Обновляем локальное состояние без повторного запроса к серверу
      const updatedColumns = kanbanStore.columns.map(column => {
        if (column.id === editingSectionId.value) {
          return {
            ...column,
            title: editingSectionName.value.trim()
          }
        }
        return column
      })
      
      kanbanStore.columns = updatedColumns
      
      editingSectionId.value = null
      editingSectionName.value = ''
      toast.success('Название раздела успешно обновлено')
    }
  } catch (error) {
    console.error('Ошибка при обновлении раздела:', error)
    toast.error('Не удалось обновить название раздела')
  }
}
const priorityOptions = [
  { value: 'all', label: 'Все приоритеты' },
  { value: 1, label: 'критическая', color: 'danger' },
  { value: 2, label: 'важная', color: 'warning' },
  { value: 3, label: 'срочная', color: 'info' },
  { value: 4, label: 'рутинная', color: 'secondary' }
]

const filteredColumns = computed(() => {
  if (selectedPriorityFilter.value === 'all') {
    return kanbanStore.columns
  }
  
  return kanbanStore.columns.map(column => ({
    ...column,
    cards: column.cards.filter(task => task.priority === Number(selectedPriorityFilter.value))
  }))
})

watch(() => props.project_id, (newVal) => {
  if (newVal) {
    kanbanStore.fetchColumns(newVal)
  }
}, { immediate: true })

watch(() => kanbanStore.columns, () => {
  // Можно добавить дополнительную логику при изменении колонок
}, { deep: true })

onMounted(() => {
  projectId.value = route.query.project_id;
  if (projectId.value) {
    kanbanStore.fetchColumns(projectId.value)
  }
})

const startAddingSection = () => {
  isAddingSection.value = true
  newSectionName.value = ''
}

const submitNewSection = async () => {
  if (!newSectionName.value.trim()) {
    toast.error('Введите название раздела')
    return
  }
  
  try {
    await kanbanStore.addSection({
      section_name: newSectionName.value.trim(),
      project_id: projectId.value 
    })
    isAddingSection.value = false
    newSectionName.value = ''
    await kanbanStore.fetchColumns(props.project_id)
  } catch (error) {
    console.error('Ошибка при создании раздела:', error)
    toast.error('Ошибка при создании раздела')
  }
}

const startAddingTask = (columnIndex) => {
  isAddingTask.value = columnIndex
  newTaskData.value = {
    title: '',
    description: '',
    dueDate: null,
    priority: 0,
    reminders: []
  }
}

const submitNewTask = async (columnIndex) => {
  if (!newTaskData.value.title?.trim()) {
    toast.error('Введите название задачи')
    return
  }

  const taskData = {
    text: newTaskData.value.title.trim(),
    section_id: kanbanStore.columns[columnIndex]?.id,
    description: newTaskData.value.description?.trim() || '',
    deadline: newTaskData.value.dueDate ? formatDateTimeForAPI(newTaskData.value.dueDate) : null,
    priority: newTaskData.value.priority || 1,
    user_id: parseInt(Cookies.get('userId')) || null,
    isdone: false,
    dateofcreation: new Date().toISOString()
  }

  try {
    await kanbanStore.createTask(taskData)
    await kanbanStore.fetchColumns(route.query.project_id)
    isAddingTask.value = -1
    newTaskData.value = {
      title: '',
      description: '',
      dueDate: null,
      priority: 0,
      reminders: []
    }
    toast.success(`Задача создана!`)
  } catch (error) {
    console.error('Ошибка создания задачи:', error)
    toast.error(error.message || 'Ошибка при создании задачи')
  }
}

function formatDateTimeForAPI(date) {
  return new Date(date).toISOString()
}

const deleteSection = async (sectionId) => {
  if (!sectionId) return;
  
  try {
    const confirmed = confirm('Вы уверены, что хотите удалить этот раздел?');
    if (!confirmed) return;
    
    await kanbanStore.deleteSection(sectionId);
    await kanbanStore.fetchColumns(projectId.value);
    toast.success('Раздел успешно удален');
  } catch (error) {
    console.error('Ошибка при удалении раздела:', error);
    toast.error(error.message || 'Произошла ошибка при удалении раздела');
  }
};

const handleTaskUpdated = async () => {
  try {
        await kanbanStore.fetchColumns(route.query.project_id)
  } catch (error) {
    console.error('Ошибка при обновлении задач:', error);
    toast.error('Не удалось обновить список задач');
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="kanban-wrapper">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="d-flex align-items-center gap-2">
        <h2 class="mb-0">{{ projectTitle }}</h2> <!-- Используем projectTitle вместо "Канбан-доска" -->
      </div>
      <div class="d-flex align-items-center">
        <Filter class="me-2" />
        <select 
          v-model="selectedPriorityFilter" 
          class="form-select form-select-sm"
          style="width: auto;"
        >
          <option 
            v-for="option in priorityOptions" 
            :key="option.value" 
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>
    </div>

     <PerfectScrollbar class="kanban-container">
      <SlickList axis="x" v-model:list="kanbanStore.columns" class="d-flex" useDragHandle>
        <SlickItem
          v-for="(column, i) in filteredColumns"
          :key="column.section_id"
          :index="sectionId"
          class="kanban-column mx-2 flex-shrink-0"
          style="width: 18rem"
        >
          <!-- Заменяем статичный заголовок на редактируемый -->
          <div class="d-flex align-items-center justify-content-between mb-3">
            <div v-if="editingSectionId !== column.id" class="d-inline-flex gap-1 text-truncate">
              <DragHandle style="cursor: move"><GripVertical :size="18" /></DragHandle>
              <h5 class="mb-0 text-truncate user-select-none">
                {{ column.title }}
              </h5>
              <h5 class="mb-0 user-select-none">({{ column.cards.length }})</h5>
            </div>
            
            <!-- Форма редактирования (показывается только для текущего редактируемого раздела) -->
            <div v-else class="d-flex align-items-center gap-2 w-100">
              <input
                v-model="editingSectionName"
                type="text"
                class="form-control form-control-sm"
                @keyup.enter="saveSectionName"
                @blur="saveSectionName"
                autofocus
              />
              <button class="btn btn-sm btn-primary" @click="saveSectionName">
                OK
              </button>
            </div>
            
            <DropDown dropdownMenuClass="hover-section dropdown-menu-end bg-light-subtle">
              <template #main>
                <EllipsisVertical :size="19" />
              </template>
              <template #list>
                <li class="dropdown-item" @click="startEditingSection(column)">Изменить</li>
                <li class="dropdown-item" @click="deleteSection(column.id)">Удалить</li>
              </template>
            </DropDown>
          </div>
          <SlickList
            axis="y"
            v-model:list="kanbanStore.columns[i].cards"
            group="tasks"
            helper-class="selected-card-task"
            :distance="10"
            @sort-start="isCopyingText = false"
            @sort-end="isCopyingText = true"
            @sort-cancel="isCopyingText = true"
          >
            <SlickItem
              v-for="(task, j) in column.cards"
              :key="task.id"
              :index="j"
              class="my-2"
            >
              <div
                class="kanban-card-task card"
                :class="{ 'user-select-none': !isCopyingText }"
                style="cursor: grab"
              >
                <KanbanTask 
                  :task="task" 
                  @task-updated="handleTaskUpdated"
                />
              </div>
            </SlickItem>
          </SlickList>

          <!-- блок добавления подзадач -->
         <div v-if="isAddingTask === i" class="card p-3 mb-3">
  <input
    v-model="newTaskData.title"
    type="text"
    class="form-control mb-3"
    placeholder="Название задачи"
    autofocus
  />
  <textarea
    v-model="newTaskData.description"
    class="form-control mb-3"
    placeholder="Описание"
    rows="2"
  ></textarea>
  
  <!-- Date and Priority Row -->
<div class="d-flex justify-content-between mb-3">
  <div class="d-flex align-items-center gap-2">
    <input
      v-model="newTaskData.dueDate"
      type="date"
      class="form-control form-control-sm"
      style="width: 120px"
    />
  </div>
  
  <div class="dropdown">
    <button 
      class="form-control form-control-sm d-flex align-items-center justify-content-between gap-1 dropdown-toggle"
      type="button"
      data-bs-toggle="dropdown"
      style="width: 120px; background-color: var(--bs-body-bg); text-align: left; cursor: pointer; appearance: none"
    >
      <span class="d-flex align-items-center gap-1 text-dark">
        <Flag :size="16" :color="priorityOptions.find(p => p.value === newTaskData.priority)?.color" />
        {{ priorityOptions.find(p => p.value === newTaskData.priority)?.label || 'Приоритет' }}
      </span>
    </button>
    <ul class="dropdown-menu dropdown-menu-end">
      <li v-for="option in priorityOptions.filter(o => o.value !== 'all')" :key="option.value">
        <a class="dropdown-item" href="#" @click.prevent="newTaskData.priority = option.value">
          <Flag :size="14" :color="option.color" class="me-2" />
          {{ option.label }}
        </a>
      </li>
    </ul>
  </div>
</div>
  
  <!-- Bottom Section -->
  <div class="d-flex justify-content-end align-items-center">
    <div class="d-flex gap-2">
      <button class="btn btn-sm btn-outline-secondary" @click="isAddingTask = -1">
        Отмена
      </button>
      <button class="btn btn-sm btn-primary" @click="submitNewTask(i)">
        Добавить
      </button>
    </div>
  </div>
</div>

<div v-else class="add-task d-flex align-items-center gap-2 p-2" @click="startAddingTask(i)">
  <Plus :size="16" />
  <span class="text-nowrap">Добавить задачу</span>
</div>  
        </SlickItem>
        <!-- Окончание блока с добавлением подзадач -->
        <!-- Section Addition Block -->
        <div v-if="!isAddingSection" class="add-column d-inline-flex justify-content-center gap-1 p-2" @click="startAddingSection">
          <Plus :size="24" />
          <h5 class="mb-0 text-nowrap">Добавить раздел</h5>
        </div>

        <div v-else class="kanban-column mx-2 flex-shrink-0" style="width: 18rem">
          <div class="card p-3">
            <input
              v-model="newSectionName"
              type="text"
              class="form-control mb-2"
              placeholder="Название раздела"
              @keyup.enter="submitNewSection"
              autofocus
            />
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-primary" @click="submitNewSection">
                Добавить
              </button>
              <button class="btn btn-sm btn-outline-secondary" @click="isAddingSection = false">
                Отмена
              </button>
            </div>
          </div>
        </div>
      </SlickList>
    </PerfectScrollbar>

    <KanbanEdit></KanbanEdit>
<KanbanTaskViewing 
  v-if="kanbanStore.editableTask" 
  :task="kanbanStore.editableTask"
  :project_id="projectId"
/>  
</div>
</template>

<style scoped lang="scss">

.btn{
  width: 80px;
}

.kanban-wrapper {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.kanban-container {
  flex-grow: 1;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
}

.selected-card-task .kanban-card-task {
  transform: rotate(5deg);
}

.add-column {
  color: var(--bs-secondary-text-emphasis);
  height: fit-content;
  cursor: pointer;
  transition: color $transition;

  &:hover {
    color: var(--bs-card-title-color);
  }
}

.add-task {
  color: var(--bs-secondary-text-emphasis);
  cursor: pointer;
  transition: color $transition;
  border-radius: var(--bs-border-radius);
  margin-top: 0.5rem;

  &:hover {
    color: var(--bs-card-title-color);
    background-color: var(--bs-tertiary-bg);
  }
}

.reminders-list {
  max-height: 100px;
  overflow-y: auto;
  padding: 0.25rem;
  background-color: var(--bs-tertiary-bg);
  border-radius: var(--bs-border-radius);
}

.dropdown-toggle::after {
  margin-left: 0.25em;
}

.list-group-item {
  &.active {
    .flag-icon {
      color: white;
    }
  }
}

.kanban-column input.form-control {
  padding: 0.25rem 0.5rem;
  font-size: 1rem;
  height: auto;
}

</style>
