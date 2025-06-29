<template>
  <div class="import-program">
    <div class="container-fluid">
      <!-- Заголовок страницы -->
      <div class="row mb-4">
        <div class="col-12">
          <h1 class="h3 mb-3">Импорт программы развития</h1>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><router-link to="/">Главная</router-link></li>
              <li class="breadcrumb-item"><router-link to="/crm">CRM</router-link></li>
              <li class="breadcrumb-item">
                <router-link to="/crm/strategic-projects">Стратегические проекты</router-link>
              </li>
              <li class="breadcrumb-item active">Импорт программы</li>
            </ol>
          </nav>
        </div>
      </div>

      <div class="row">
        <div class="col-lg-8">
          <!-- Форма импорта -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0">Загрузка файла программы развития</h5>
            </div>
            <div class="card-body">
              <form @submit.prevent="importProgram">
                <div class="form-group">
                  <label>Название программы <span class="text-danger">*</span></label>
                  <input
                    v-model="form.name"
                    type="text"
                    class="form-control"
                    placeholder="Например: Программа развития на 2025 год"
                    required
                  />
                </div>

                <div class="form-group">
                  <label>Год программы <span class="text-danger">*</span></label>
                  <input
                    v-model="form.year"
                    type="number"
                    class="form-control"
                    :min="new Date().getFullYear()"
                    :max="new Date().getFullYear() + 10"
                    required
                  />
                </div>

                <div class="form-group">
                  <label>CSV файл <span class="text-danger">*</span></label>
                  <div class="custom-file">
                    <input
                      type="file"
                      class="custom-file-input"
                      id="csvFile"
                      accept=".csv"
                      @change="handleFileSelect"
                      required
                    />
                    <label class="custom-file-label" for="csvFile">
                      {{ form.file ? form.file.name : 'Выберите файл' }}
                    </label>
                  </div>
                  <small class="form-text text-muted">
                    Файл должен быть в формате CSV с кодировкой UTF-8
                  </small>
                </div>

                <div v-if="error" class="alert alert-danger">
                  {{ error }}
                </div>

                <div v-if="success" class="alert alert-success">
                  {{ success }}
                </div>

                <div class="form-group">
                  <button
                    type="submit"
                    class="btn btn-primary"
                    :disabled="importing"
                  >
                    <span v-if="importing" class="spinner-border spinner-border-sm mr-2"></span>
                    <i v-else class="fas fa-upload mr-2"></i>
                    Импортировать
                  </button>
                  <router-link to="/crm/strategic-projects" class="btn btn-secondary ml-2">
                    Отмена
                  </router-link>
                </div>
              </form>
            </div>
          </div>

          <!-- Последние загрузки -->
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Последние загруженные программы</h5>
            </div>
            <div class="card-body">
              <div v-if="loadingPrograms" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="sr-only">Загрузка...</span>
                </div>
              </div>

              <div v-else-if="programs.length === 0" class="text-center py-4 text-muted">
                Программы развития еще не загружались
              </div>

              <div v-else class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Название</th>
                      <th>Год</th>
                      <th>Количество тем</th>
                      <th>Дата загрузки</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="program in programs" :key="program.id">
                      <td>{{ program.name }}</td>
                      <td>{{ program.year }}</td>
                      <td>
                        <span class="badge badge-primary">{{ program.topics_count }}</span>
                      </td>
                      <td>{{ formatDate(program.created_at) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <!-- Инструкция -->
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Инструкция по импорту</h5>
            </div>
            <div class="card-body">
              <h6>Формат CSV файла:</h6>
              <p>Файл должен содержать следующие колонки:</p>
              <ul class="mb-3">
                <li><code>direction_code</code> - Код направления</li>
                <li><code>topic_number</code> - Номер темы</li>
                <li><code>name</code> - Наименование темы</li>
                <li><code>description</code> - Описание (опционально)</li>
                <li><code>start_date</code> - Дата начала (YYYY-MM-DD)</li>
                <li><code>end_date</code> - Дата окончания (YYYY-MM-DD)</li>
                <li><code>expected_results</code> - Ожидаемые результаты (через точку с запятой)</li>
              </ul>

              <h6>Пример содержимого:</h6>
              <pre class="bg-light p-2 rounded">direction_code,topic_number,name,description,start_date,end_date,expected_results
IT,001,Разработка системы учета,Создание системы для учета ресурсов,2025-01-01,2025-12-31,Система учета;Документация;Обучение
IT,002,Модернизация инфраструктуры,Обновление серверной инфраструктуры,2025-02-01,2025-10-31,Новые сервера;Миграция данных</pre>

              <div class="alert alert-warning mt-3">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                <strong>Важно!</strong> При импорте новой программы все существующие свободные темы будут обновлены.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { apiClient } from '@/js/api/manager'

export default {
  name: 'ImportProgram',
  
  setup() {
    const router = useRouter()
    
    const form = ref({
      name: '',
      year: new Date().getFullYear(),
      file: null
    })
    
    const programs = ref([])
    const loadingPrograms = ref(false)
    const importing = ref(false)
    const error = ref('')
    const success = ref('')
    
    // Загрузка списка программ
    const loadPrograms = async () => {
      loadingPrograms.value = true
      try {
        const response = await apiClient.get('/crm/strategic-projects/development-programs/')
        programs.value = response.data
      } catch (error) {
        console.error('Ошибка загрузки программ:', error)
      } finally {
        loadingPrograms.value = false
      }
    }
    
    // Обработка выбора файла
    const handleFileSelect = (event) => {
      const file = event.target.files[0]
      if (file && file.type === 'text/csv') {
        form.value.file = file
        error.value = ''
      } else {
        form.value.file = null
        error.value = 'Пожалуйста, выберите файл в формате CSV'
      }
    }
    
    // Импорт программы
    const importProgram = async () => {
      if (!form.value.file) {
        error.value = 'Пожалуйста, выберите файл для импорта'
        return
      }
      
      importing.value = true
      error.value = ''
      success.value = ''
      
      const formData = new FormData()
      formData.append('file', form.value.file)
      formData.append('name', form.value.name)
      formData.append('year', form.value.year)
      
      try {
        const response = await apiClient.post(
          '/crm/strategic-projects/development-programs/import_program/',
          formData
        )
        
        success.value = response.data.message
        
        // Очистка формы
        form.value = {
          name: '',
          year: new Date().getFullYear(),
          file: null
        }
        
        // Обновление файлового input
        document.getElementById('csvFile').value = ''
        
        // Обновление списка программ
        loadPrograms()
        
        // Перенаправление через 2 секунды
        setTimeout(() => {
          router.push('/crm/strategic-projects/program-topics')
        }, 2000)
        
      } catch (error) {
        console.error('Ошибка импорта:', error)
        error.value = error.response?.data?.error || 'Ошибка при импорте программы'
      } finally {
        importing.value = false
      }
    }
    
    // Форматирование даты
    const formatDate = (dateString) => {
      if (!dateString) return '-'
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: ru })
    }
    
    // Загрузка данных при монтировании
    onMounted(() => {
      loadPrograms()
    })
    
    return {
      form,
      programs,
      loadingPrograms,
      importing,
      error,
      success,
      handleFileSelect,
      importProgram,
      formatDate
    }
  }
}
</script>

<style scoped>
.import-program {
  padding: 20px 0;
}

.custom-file-label::after {
  content: "Обзор";
}

pre {
  font-size: 0.875rem;
  overflow-x: auto;
}

code {
  background-color: #f8f9fa;
  padding: 2px 4px;
  border-radius: 3px;
  color: #e83e8c;
}
</style> 