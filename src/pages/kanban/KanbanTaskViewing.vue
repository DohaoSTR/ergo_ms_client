<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useKanbanStore } from '@/js/api/services/tasksService'
import { fetchProjectUsers } from '@/js/api/services/projectsService'
import Cookies from 'js-cookie'
import { useToast } from 'vue-toastification'

const kanbanStore = useKanbanStore()
const toast = useToast()
const currentTask = computed(() => kanbanStore.editableTask)
const newSubtaskText = ref('')
const isLoading = ref(false)
const projectWorkers = ref([])
const currentAssignee = ref(null)

const props = defineProps({
  task: Object,
  project_id: {
    type: [Number, String],
    required: true
  }
})

// Загрузка данных задачи
const loadTaskData = async () => {
  try {
    if (!props.project_id || !currentTask.value?.id) return

    isLoading.value = true
    
    // Параллельная загрузка участников и исполнителя
    const [users, assignee] = await Promise.all([
      fetchProjectUsers(props.project_id),
      kanbanStore.fetchTaskAssignee(currentTask.value.id)
    ])
    
    // Фильтруем участников, исключая текущего исполнителя
    projectWorkers.value = users
      .filter(user => !assignee || user.id.toString() !== assignee.id.toString())
      .map(user => ({
        id: user.id.toString(),
        name: `${user.firstName} ${user.lastName}`,
        isNew: user.isNew
      }))
    
    // Установка текущего исполнителя
    if (assignee) {
      currentAssignee.value = {
        id: assignee.id.toString(),
        firstName: assignee.firstName,
        lastName: assignee.lastName
      }
      if (!currentTask.value.assignee_id) {
        currentTask.value.assignee_id = parseInt(assignee.id)
      }
    }
    
  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
    toast.error('Не удалось загрузить данные задачи')
    projectWorkers.value = []
    currentAssignee.value = null
  } finally {
    isLoading.value = false
  }
}

// Инициализация
onMounted(loadTaskData)
watch(() => [props.project_id, currentTask.value?.id], loadTaskData, { immediate: true })

// Computed свойства
const isChecked = computed({
  get: () => currentTask.value?.is_completed || false,
  set: (value) => currentTask.value && (currentTask.value.is_completed = value)
})

const taskTitle = computed({
  get: () => currentTask.value?.title || '',
  set: (value) => currentTask.value && (currentTask.value.title = value)
})

const taskDescription = computed({
  get: () => currentTask.value?.description || '',
  set: (value) => currentTask.value && (currentTask.value.description = value)
})

const selectedPriority = computed({
  get: () => currentTask.value?.priority?.toString() || '',
  set: (value) => currentTask.value && (currentTask.value.priority = parseInt(value))
})

const selectedWorker = computed({
  get: () => currentTask.value?.assignee_id?.toString() || '',
  set: (value) => {
    if (currentTask.value) {
      currentTask.value.assignee_id = value ? parseInt(value) : null
      // Обновляем текущего исполнителя
      if (value) {
        const selectedUser = projectWorkers.value.find(user => user.id === value) || 
                           (currentAssignee.value?.id === value ? currentAssignee.value : null)
        if (selectedUser) {
          currentAssignee.value = {
            id: selectedUser.id,
            firstName: selectedUser.name.split(' ')[0],
            lastName: selectedUser.name.split(' ')[1]
          }
        }
      } else {
        currentAssignee.value = null
      }
    }
  }
})

const deadline = computed({
  get: () => currentTask.value?.deadline ? 
              new Date(currentTask.value.deadline).toISOString().split('T')[0] : '',
  set: (value) => currentTask.value && (currentTask.value.deadline = value)
})

const subtasks = computed({
  get: () => currentTask.value?.subtasks || [],
  set: (value) => currentTask.value && (currentTask.value.subtasks = value)
})

// Методы задач
// Методы задач
const updateTask = async (updatedData) => {
  console.log('Updating task with data:', updatedData); // Логирование для отладки
  
  const backendData = {
    title: updatedData.title,
    text: updatedData.title,
    description: updatedData.description,
    isdone: updatedData.is_completed,
    deadline: updatedData.deadline,
    priority: updatedData.priority,
    assignee_id: updatedData.assignee_id !== null ? updatedData.assignee_id : null // Явное преобразование
  }
  
  // Удаляем undefined значения, но оставляем null (для assignee_id)
  Object.keys(backendData).forEach(key => {
    if (backendData[key] === undefined) {
      delete backendData[key]
    }
  })
  
  console.log('Prepared backend data:', backendData); // Логирование для отладки
  
  try {
    const response = await kanbanStore.updatesTask(currentTask.value.id, backendData)
    //response.updatedTask.assignee_id = response.updatedTask.user

    console.log('Update response:', response); // Логирование для отладки
    return { success: true, updatedTask: response.updatedTask }
  } catch (error) {
    console.error('Update task error:', error);
    toast.error('Не удалось обновить задачу');
    return { success: false };
  }
}

const saveTask = async () => {
  if (!currentTask.value) return
  
  isLoading.value = true
  try {
    console.log('Current assignee_id before save:', currentTask.value.assignee_id); // Логирование
    
    const updates = {
      title: taskTitle.value,
      description: taskDescription.value,
      is_completed: isChecked.value,
      priority: selectedPriority.value ? parseInt(selectedPriority.value) : null,
      assignee_id: selectedWorker.value ? parseInt(selectedWorker.value) : null, // Явное преобразование
      deadline: deadline.value
    }
    
    console.log('Prepared updates:', updates); // Логирование
    
    const { success } = await updateTask(updates)
    if (success) {
      toast.success('Задача успешно обновлена');
      closeModal()
    }
  } catch (error) {
    console.error('Save task error:', error);
    toast.error('Ошибка при сохранении задачи');
  } finally {
    isLoading.value = false
  }
}

// Методы подзадач
const toggleSubtask = async (subtaskId) => {
  try {
    const { success } = await kanbanStore.toggleTask(subtaskId)
    if (success) {
      subtasks.value = subtasks.value.map(subtask => 
        subtask.id === subtaskId 
          ? { ...subtask, is_completed: !subtask.is_completed } 
          : subtask
      )
    }
  } catch (error) {
    console.error('Ошибка изменения подзадачи:', error)
    toast.error('Не удалось изменить статус подзадачи')
  }
}

const deleteSubtask = async (subtaskId) => {
  if (!subtaskId) return;
  try {
    const confirmed = confirm('Удалить подзадачу?');
    if (!confirmed) return;
    
    const { success } = await kanbanStore.deleteTask(subtaskId);
    if (success) {
      subtasks.value = subtasks.value.filter(s => s.id !== subtaskId);
      toast.success('Подзадача удалена');
    }
  } catch (error) {
    console.error('Ошибка удаления:', error);
    toast.error(error.message || 'Ошибка удаления');
  }
};

const addSubtask = async () => {
  if (!newSubtaskText.value.trim()) {
    toast.error('Введите текст подзадачи');
    return;
  }

  if (!currentTask.value?.id) {
    toast.error('Родительская задача не определена');
    return;
  }

  isLoading.value = true;
  try {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];

    const subtaskData = {
      text: newSubtaskText.value.trim(),
      section_id: currentTask.value.section_id,
      parenttask_id: currentTask.value.id,
      user_id: parseInt(Cookies.get('userId')) || null,
      priority: currentTask.value.priority || 0,
      description: '',
      isdone: false,
      deadline: formattedDate,
      dateofcreation: formattedDate
    };

    const createdSubtask = await kanbanStore.createSubtask(subtaskData);
    subtasks.value = [...subtasks.value, {
      id: createdSubtask.id,
      title: createdSubtask.text,
      is_completed: createdSubtask.isdone
    }];

    newSubtaskText.value = '';
    toast.success('Подзадача добавлена');
  } catch (error) {
    console.error('Ошибка создания:', error);
    toast.error(error.message || 'Ошибка создания');
  } finally {
    isLoading.value = false;
  }
};

const deleteTask = async () => {
  if (!currentTask.value?.id) return;
  try {
    const confirmed = confirm('Удалить задачу и все подзадачи?');
    if (!confirmed) return;
    
    const { success } = await kanbanStore.deleteTask(currentTask.value.id);
    if (success) {
      toast.success('Задача удалена');
      closeModal();
    }
  } catch (error) {
    toast.error(error.message || 'Ошибка удаления');
  }
};

const closeModal = () => {
  kanbanStore.cleanSelectedTask()
}
</script>

<template>
  <div v-if="currentTask" class="modal-overlay" @click.self="closeModal">
    <div class="task-modal">
      <button class="close-btn" @click="closeModal">×</button>
      <h2 class="modal-title">Редактирование</h2>

      <div class="form-group">
        <label class="form-label">Название задачи</label>
        <input v-model="taskTitle" placeholder="Введите название" class="input-field" />
      </div>

      <div class="form-group">
        <label class="form-label">Описание</label>
        <input v-model="taskDescription" placeholder="Добавьте описание" class="input-field" />
      </div>

      <div class="form-row">
        <div class="form-group half">
          <label class="form-label">Срок выполнения</label>
          <input 
            type="date" 
            v-model="deadline" 
            class="input-field date-field"
            :min="new Date().toISOString().split('T')[0]" 
          />
        </div>
        <div class="form-group">
          <label class="form-label">Приоритет</label>
          <select v-model="selectedPriority" class="select-field">
            <option disabled value="">Выберите приоритет</option>
            <option value="1">критическая</option>
            <option value="2">важная</option>
            <option value="3">срочная</option>
            <option value="4">рутинная</option>
          </select>
        </div>
      </div>

      <div class="form-group half">
        <label class="form-label">Исполнитель</label>
        <select 
          v-model="selectedWorker" 
          class="select-field full-width-select"
          :disabled="isLoading"
        >
          <option disabled value="">Выберите исполнителя</option>
          <option v-if="isLoading" disabled>Загрузка...</option>
          <template v-else>
            <option 
              v-if="currentAssignee" 
              :value="currentAssignee.id"
            >
              {{ currentAssignee.firstName }} {{ currentAssignee.lastName }} (текущий)
            </option>
            <option 
              v-for="worker in projectWorkers" 
              :key="worker.id" 
              :value="worker.id"
            >
              {{ worker.name }} {{ worker.isNew ? '(новый)' : '' }}
            </option>
          </template>
          <option v-if="!isLoading && projectWorkers.length === 0 && !currentAssignee" disabled>
            Нет участников проекта
          </option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Подзадачи</label>
        <div class="subtasks-list">
          <div v-for="subtask in subtasks" :key="subtask.id" class="subtask-item">
            <input 
              type="checkbox" 
              :checked="subtask.is_completed" 
              @change="toggleSubtask(subtask.id)" 
            />
            <span :class="{ completed: subtask.is_completed }">{{ subtask.title }}</span>
            <button class="delete-subtask" @click="deleteSubtask(subtask.id)">✕</button>
          </div>
          <div class="add-subtask">
            <input
              v-model="newSubtaskText"
              placeholder="Добавить подзадачу"
              @keyup.enter="addSubtask"
              class="input-field"
            />
            <button class="btn-icon" @click="addSubtask">+</button>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-secondary" @click="deleteTask" :disabled="!currentTask?.id">
          Удалить
        </button>
        <button class="btn btn-primary" @click="saveTask" :disabled="isLoading">
          {{ isLoading ? 'Сохранение...' : 'Сохранить' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.task-modal {
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  width: 500px;
  max-width: 90%;
  position: relative;
  animation: fadeInUp 0.3s ease-in-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  transition: color 0.3s;
}

.close-btn:hover { color: #333; }

.modal-title {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.form-group { margin-bottom: 1rem; }
.form-row { display: flex; gap: 1rem; }
.half { flex: 1; }

.form-label {
  display: block;
  font-size: 0.9rem;
  margin-bottom: 0.4rem;
  color: #555;
}

.input-field,
.select-field {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s;
}

.full-width-select {
  width: 100%;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.8rem center;
  background-size: 1rem;
}

.input-field:focus,
.select-field:focus {
  border-color: #cb2c20;
  box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.1);
}

.date-field { padding: 0.6rem 0.8rem; }

.subtasks-list {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 0.6rem;
  min-height: 100px;
  max-height: 200px;
  overflow-y: auto;
}

.subtask-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  margin-bottom: 0.3rem;
  background: #f9f9f9;
  border-radius: 6px;
}

.subtask-item:last-child { margin-bottom: 0; }

.completed {
  text-decoration: line-through;
  color: #aaa;
}

.delete-subtask {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  color: #cb2c20;
  cursor: pointer;
  margin-left: auto;
}

.add-subtask {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.btn-icon {
  background: #cb2c20;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  font-size: 1.2rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
  flex-shrink: 0;
}

.btn-icon:hover { background: #cb2c20; }

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  width: 120px;
  text-align: center;
}

.btn-primary {
  background-color: #cb2c20;
  color: white;
  border: none;
}

.btn-primary:hover { background-color: #cb2c20; }

.btn-secondary {
  background-color: #e0e0e0;
  color: #333;
  border: none;
}

.btn-secondary:hover { background-color: #ccc; }
</style>