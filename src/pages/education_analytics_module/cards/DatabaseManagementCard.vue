<template>
  <div class="database-management card rounded-3 p-4 mb-4">
    <div class="container px-0">
      <!-- Заголовок и кнопки управления -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h3 class="mb-0 text-primary d-flex align-items-center">
          <Database :size="22" class="me-2"/>
          Управление данными
        </h3>
        <div class="d-flex gap-2">
          <button
            @click="$emit('download')"
            :disabled="isDownloading || isUploading || isClearing"
            class="btn btn-primary d-flex align-items-center action-btn">
            <template v-if="isDownloading">
              <span class="spinner-border spinner-border-sm me-2" role="status"></span>
              Выгрузка...
            </template>
            <template v-else>
              <ArrowDownToLine :size="18" class="me-2"/>
              <span>Экспорт данных</span>
            </template>
          </button>
          <button
            @click="loadSampleData"
            :disabled="isDownloading || isUploading || isClearing"
            class="btn btn-primary d-flex align-items-center action-btn">
            <template v-if="isUploading">
              <span class="spinner-border spinner-border-sm me-2" role="status"></span>
              Загрузка...
            </template>
            <template v-else>
              <ArrowUpFromLine :size="18" class="me-2"/>
              <span>Загрузить примеры</span>
            </template>
          </button>
          <button
            @click="$emit('clear')"
            :disabled="isDownloading || isUploading || isClearing"
            class="btn btn-primary d-flex align-items-center action-btn">
            <template v-if="isClearing">
              <span class="spinner-border spinner-border-sm me-2" role="status"></span>
              Очистка...
            </template>
            <template v-else>
              <AlertTriangle :size="18" class="me-2"/>
              <span>Очистить БД</span>
            </template>
          </button>
        </div>
      </div>

      <div class="alert alert-info" role="alert">
        <Info :size="18" class="me-2 text-primary"/>
        <span>Используйте эти инструменты для управления данными в базе данных</span>
      </div>
    </div>
    <ToastNotification ref="toastRef" />
  </div>
</template>

<script setup>
import { Database, ArrowDownToLine, ArrowUpFromLine, Info, AlertTriangle } from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import { ref } from 'vue'
import ToastNotification from './ToastNotification.vue'

const toastRef = ref(null)

defineProps({
  isDownloading: Boolean,
  isUploading: Boolean,
  isClearing: Boolean
})

const emit = defineEmits(['download', 'clear', 'update:isUploading', 'reload'])

// Вспомогательная функция для обработки ответов API
const processApiResponse = (response, entityName) => {
  // Проверка на наличие данных и маркера успеха
  if (response.data && (response.success !== false)) {
    const message = response.data?.message || `Загрузка ${entityName} успешно завершена`;
    const addedCount = response.data?.added?.length ||
                      response.data?.created?.length ||
                      (typeof response.data?.added === 'number' ? response.data.added : 0);
    const skippedCount = response.data?.skipped?.length ||
                         (typeof response.data?.skipped === 'number' ? response.data.skipped : 0);

    return {
      success: true,
      message: `${message} (добавлено: ${addedCount}, пропущено: ${skippedCount})`
    };
  } else {
    const errorMsg = response.errors?.detail ||
                   response.errors?.error ||
                   response.errors?.message ||
                   `Ошибка при загрузке ${entityName}`;
    return { success: false, message: errorMsg };
  }
};

const loadSampleData = async () => {
  emit('update:isUploading', true)
  try {
    // Используем последовательную загрузку данных с ожиданием каждого запроса
    const steps = [
      // Базовые независимые данные
      { name: 'работодателей', endpoint: endpoints.learning_analytics.employers.loadSampleData },
      { delay: 800, message: 'Пауза после загрузки работодателей' },

      { name: 'специальностей', endpoint: endpoints.learning_analytics.specialities.loadSampleData },
      { delay: 800, message: 'Пауза после загрузки специальностей' },

      { name: 'технологий', endpoint: endpoints.learning_analytics.technologies.loadSampleData },
      { delay: 800, message: 'Пауза после загрузки технологий' },

      { name: 'компетенций', endpoint: endpoints.learning_analytics.competencies.loadSampleData },
      { delay: 800, message: 'Пауза после загрузки компетенций' },

      { name: 'базовых дисциплин', endpoint: endpoints.learning_analytics.baseDisciplines.loadSampleData },
      { delay: 800, message: 'Пауза после загрузки базовых дисциплин' },

      // Сначала учебные планы, потом зависимые от них дисциплины
      { name: 'учебных планов', endpoint: endpoints.learning_analytics.curriculums.loadSampleData },
      { delay: 1000, message: 'Пауза после загрузки учебных планов' },

      { name: 'дисциплин', endpoint: endpoints.learning_analytics.disciplines.loadSampleData },
      { delay: 1000, message: 'Пауза после загрузки дисциплин' },

      { name: 'вакансий', endpoint: endpoints.learning_analytics.vacancies.loadSampleData },
      { delay: 1000, message: 'Пауза после загрузки вакансий' },

      // Сложные данные с множественными зависимостями
      { name: 'матриц академических компетенций', endpoint: endpoints.learning_analytics.acms.loadSampleData },
      { delay: 1200, message: 'Пауза после загрузки ACM' },

      { name: 'профилей компетенций вакансий', endpoint: endpoints.learning_analytics.vcms.loadSampleData },
      { delay: 1200, message: 'Пауза после загрузки VCM' },

      { name: 'матриц компетенций пользователей', endpoint: endpoints.learning_analytics.ucms.loadSampleData }
    ]

    let successCount = 0;
    let errorCount = 0;

    for (const step of steps) {
      if (step.delay) {
        // Добавляем задержку между шагами, если указана
        await new Promise(resolve => setTimeout(resolve, step.delay))
        console.log(`Добавлена задержка ${step.delay}ms: ${step.message}`)
        continue
      }

      try {
        console.log(`Загрузка ${step.name}...`)
        const response = await apiClient.post(step.endpoint, {})
        const result = processApiResponse(response, step.name)

        if (result.success) {
          successCount++;
          console.log(`✓ ${result.message}`)
          // Показываем уведомление об успехе
          toastRef.value?.show(result.message, 'success')
        } else {
          errorCount++;
          console.error(`✗ Ошибка: ${result.message}`)
          // Показываем уведомление об ошибке
          toastRef.value?.show(result.message, 'warning')
        }

        // Небольшая пауза после каждого шага
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        errorCount++;
        const errorMsg = error.response?.data?.detail ||
                         error.response?.data?.error ||
                         error.message ||
                         `Ошибка при загрузке ${step.name}`;

        console.error(`✗ Ошибка при загрузке ${step.name}:`, errorMsg)
        // Показываем уведомление об ошибке
        toastRef.value?.show(`Ошибка при загрузке ${step.name}: ${errorMsg}`, 'warning')

        // Увеличенная пауза после ошибки
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    // Итоговое уведомление
    if (errorCount === 0 && successCount > 0) {
      toastRef.value?.show(`Все данные успешно загружены (${successCount} категорий)`, 'success')
    } else if (successCount > 0) {
      toastRef.value?.show(`Данные частично загружены (успешно: ${successCount}, с ошибками: ${errorCount})`, 'info')
    } else {
      toastRef.value?.show(`Не удалось загрузить данные. Проверьте консоль для деталей.`, 'error')
    }

    // Обновляем таблицы после загрузки
    emit('reload')
  } catch (error) {
    console.error('Общая ошибка при загрузке примерных данных:', error)
    toastRef.value?.show(`Произошла ошибка при загрузке данных: ${error.message || 'проверьте консоль для деталей'}`, 'error')
  } finally {
    emit('update:isUploading', false)
  }
}
</script>

<style scoped>
.database-management {
  background: rgba(--bs-body-bg, 0.8);
  border: 1px solid var(--bs-border-color);
  box-shadow: 0 4px 24px 0 rgba(60, 72, 88, 0.08), 0 1.5px 4px 0 rgba(60, 72, 88, 0.04);
  transition: box-shadow 0.2s;
}

.database-management:hover {
  box-shadow: 0 8px 32px 0 rgba(60, 72, 88, 0.16), 0 3px 8px 0 rgba(60, 72, 88, 0.08);
}

.action-btn {
  min-width: 170px;
  transition: all 0.18s cubic-bezier(.4,0,.2,1);
  font-weight: 500;
  letter-spacing: 0.01em;
  box-shadow: 0 1px 2px 0 rgba(60,72,88,0.04);
}

.action-btn:not(:disabled):hover {
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 4px 12px 0 rgba(60,72,88,0.10);
  z-index: 1;
}

.action-btn {
  background-color: var(--bs-primary);
  border-color: var(--bs-primary);
  color: var(--bs-white);
  font-weight: 600;
  box-shadow: 0 3px 8px rgba(var(--bs-primary-rgb), 0.25);
}

.action-btn:hover:not(:disabled) {
  background-color: var(--bs-primary);
  border-color: var(--bs-primary);
  filter: brightness(108%);
  box-shadow: 0 5px 15px rgba(var(--bs-primary-rgb), 0.35);
}

.action-btn:active:not(:disabled) {
  background-color: var(--bs-primary);
  border-color: var(--bs-primary);
  filter: brightness(95%);
}

.d-flex.gap-2 {
  gap: 1.1rem !important;
}

h3 {
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.alert {
  background-color: var(--bs-tertiary-bg);
  color: var(--bs-secondary-color);
  border: none;
  box-shadow: 0 1px 4px 0 rgba(60,72,88,0.04);
  display: flex;
  align-items: center;
  font-size: 1.05rem;
  font-weight: 500;
}

.spinner-border {
  animation: spinner-border 0.75s linear infinite;
}

@keyframes spinner-border {
  to { transform: rotate(360deg); }
}
</style>
