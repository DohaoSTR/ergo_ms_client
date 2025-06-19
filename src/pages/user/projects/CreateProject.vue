<script setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import { createNewProject} from '@/js/api/services/projectsService'

const router = useRouter()
const toast = useToast()

const editingProject = ref({
  name: '',
  description: '',
  deadline: ''
})

const isLoading = ref(false)
const error = ref(null)

const closeModal = () => {
  router.go(-1)
}

const addParticipants = () => {
}


const saveProject = async () => {
  if (!editingProject.value.name?.trim()) {
    error.value = 'Введите название проекта'
    toast.error('Введите название проекта')
    return
  }
  
  error.value = null
  isLoading.value = true
  
  try {
    const projectData = {
      name: editingProject.value.name.trim(),
      description: editingProject.value.description?.trim() || '',
      deadline: editingProject.value.deadline || ''
    }

    // 1. Создаем проект
    const projectResponse = await createNewProject(projectData)
    
    if (!projectResponse.success) {
      throw new Error(projectResponse.error || 'Ошибка при создании проекта')
    }

    // 2. Добавляем создателя в проект

  

    toast.success('Проект успешно создан')
    closeModal()
    
  } catch (err) {
    console.error('Ошибка сохранения проекта:', err)
    error.value = err.message.includes('Название проекта обязательно') 
      ? 'Введите название проекта' 
      : err.message
    toast.error(error.value)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="modal-overlay">
    <div class="viewing-task-window">
      <button @click="closeModal" class="close-button">×</button>
      
      <div class="window-container">
        <div v-if="error" class="error-message">{{ error }}</div>
        
        <div class="task-grid">
          <!-- Первая строка - название проекта -->
          <div class="grid-row">
            <div class="grid-cell icon-cell">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="icon">
                <path fill="currentColor" d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
              </svg>
            </div>
            <div class="grid-cell input-cell">
              <div class="text-field">
                <input 
                  v-model="editingProject.name" 
                  type="text" 
                  placeholder="Название проекта" 
                  class="task-input"
                  :disabled="isLoading"
                >
              </div>
            </div>
          </div>
  
          <!-- Вторая строка - описание проекта -->
          <div class="grid-row">
            <div class="grid-cell icon-cell">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="icon">
                <path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-2 8c1.1 0 2 .9 2 2s-.9 2-2 2s-2-.9-2-2s.9-2 2-2zm4 8H8v-.57c0-.81.48-1.53 1.22-1.85a6.95 6.95 0 0 1 5.56 0A2.01 2.01 0 0 1 16 17.43V18z"/>
              </svg>
            </div>
            <div class="grid-cell input-cell">
              <div class="text-field">
                <textarea 
                  v-model="editingProject.description" 
                  placeholder="Описание проекта" 
                  class="description-input" 
                  rows="3"
                  :disabled="isLoading"
                ></textarea>
              </div>
            </div>
          </div>
  
          <!-- Третья строка - дедлайн -->
          <div class="grid-row">
            <div class="grid-cell icon-cell">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="icon">
                <path fill="currentColor" d="M19 19H5V8h14m-3-7v2H8V1H6v2H5c-1.11 0-2 .89-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-1V1m-1 11h-5v5h5v-5z"/>
              </svg>
            </div>
            <div class="grid-cell input-cell">
              <input 
                type="date" 
                v-model="editingProject.deadline" 
                class="date-picker"
                :disabled="isLoading"
              >
            </div>
          </div>
  
          <!-- Четвертая строка - кнопка добавления участников -->
          <div class="grid-row">
            <div class="grid-cell icon-cell">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="icon">
                <path fill="currentColor" d="M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4z"/>
              </svg>
            </div>
            <div class="grid-cell input-cell">
              <button 
                @click="addParticipants" 
                class="add-participant-button"
                :disabled="isLoading"
              >
                Добавить участника
              </button>
            </div>
          </div>
  
          <!-- Пятая строка - кнопки -->
          <div class="grid-row button-row">
            <div class="grid-cell icon-cell"></div>
            <div class="grid-cell button-cell">
              <button 
                @click="closeModal" 
                class="action-button cancel-button"
                :disabled="isLoading"
              >
                Отмена
              </button>
              <button 
                @click="saveProject" 
                class="action-button save-button"
                :disabled="!editingProject.name.trim() || isLoading"
              >
                {{ isLoading ? 'Создание...' : 'Создать проект' }}
              </button>
            </div>
          </div>
        </div>
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

.viewing-task-window {
  background-color: white;
  border-radius: 8px;
  width: 500px;
  position: relative;
}

.close-button {
  position: absolute;
  right: 10px;
  top: 10px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.window-container {
  padding: 20px;
}

.task-grid {
  display: table;
  width: 100%;
}

.grid-row {
  display: table-row;
}

.grid-cell {
  display: table-cell;
  padding: 8px 0;
  vertical-align: top;
}

.icon-cell {
  width: 40px;
  padding-right: 10px;
}

.input-cell {
  width: 100%;
}

.icon {
  color: #666;
}

.task-input {
  width: 100%;
  border: none;
  font-size: 18px;
  padding: 5px;
}

.description-input {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  font-size: 14px;
}

.date-picker {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.add-participant-button {
  width: 100%;
  padding: 8px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  text-align: left;
  color: #666;
}

.add-participant-button:hover {
  background-color: #e9e9e9;
}

.button-row {
  margin-top: 20px;
}

.button-cell {
  text-align: right;
}

.action-button {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
}

.save-button {
  background-color: #cb2c20;
  color: white;
  border: none;
}

.cancel-button {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
}
</style>
