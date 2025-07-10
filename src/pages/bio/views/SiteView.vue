<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  getSiteDetails, 
  updateSite,
  getDescriptions,
  getSiteMeans,
  getSiteDistribution,
  getSiteClassification
} from '@/js/api/services/bio-index'
import {
  ArrowLeft,
  CircleAlert,
  PenLine,
  Info,
  FileText,
  BarChart2,
} from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { handleApiError } from '@/pages/bio/js/bio-helpers'
import SiteFormModal from '@/pages/bio/components/modals/SiteFormModal.vue'

import SiteInfo from './SiteInfo.vue'
import SiteSpecies from './SiteSpecies.vue'
import SiteAnalytics from './SiteAnalytics.vue'

// Импортируем константы для шкал и спектров (используются в аналитике)
import { SCALES_TYPES, SPECTRUM_TYPES } from '@/pages/bio/js/bio-constants'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Site data
const site = ref(null)
const isLoading = ref(true)
const error = ref(null)
const siteToEdit = ref(null)
const editModalId = 'editSiteModal'

const activeTab = ref('info')

// Централизованное состояние для данных вкладок
const descriptions = ref([])
const isLoadingDescriptions = ref(false)
const analyticsData = ref({
  scales: {},
  spectra: {},
  classification: { data: [], isLoading: true, error: null }
})
const isLoadingAnalytics = ref(false)
const analyticsDataLoaded = ref(false)

// Добавляем флаг для отслеживания проверки наличия описаний
const descriptionsChecked = ref(false)

// Функция переключения вкладок с обновлением URL
const switchTab = (tab) => {
  activeTab.value = tab
  
  // Если переключаемся на вкладку аналитики, проверяем необходимость загрузки
  if (tab === 'analytics') {
    // Инициализируем состояние загрузки только если данные еще не загружены
    if (!analyticsDataLoaded.value) {
      initAnalyticsLoadingState()
    }
    loadAnalyticsIfNeeded()
  }
  
  // Обновляем URL с новым параметром вкладки
  router.replace({
    query: { ...route.query, tab: tab }
  })
}

// Extract params from route
const siteNumber = computed(() => route.params.siteNumber)
const zoneType = computed(() => route.params.zoneType)

// Основная функция загрузки данных площадки
const fetchSiteDetails = async () => {
  isLoading.value = true
  error.value = null

  try {
    const response = await getSiteDetails(siteNumber.value, zoneType.value)
    if (response.success) {
      site.value = response.data
    } else {
      error.value = handleApiError(response, 'Ошибка загрузки данных площадки', toast)
    }
  } catch (err) {
    error.value = handleApiError(err, 'Ошибка загрузки данных площадки', toast)
  } finally {
    isLoading.value = false
  }
}

// Функция для централизованной загрузки описаний растительности
const fetchSiteDescriptions = async () => {
  if (descriptions.value.length > 0 || isLoadingDescriptions.value || descriptionsChecked.value) return // Пропускаем, если уже загружено или проверено
  
  isLoadingDescriptions.value = true
  error.value = null

  try {
    const response = await getDescriptions(siteNumber.value, zoneType.value)
    if (response.success) {
      descriptions.value = response.data
    } else {
      if (response.status === 404) {
        descriptions.value = []
      } else {
        error.value = handleApiError(response, 'Ошибка загрузки описания растительности', toast)
      }
    }
  } catch (err) {
    if (err.response && err.response.status === 404) {
      descriptions.value = []
    } else {
      error.value = handleApiError(err, 'Ошибка загрузки описания растительности', toast)
    }
  } finally {
    isLoadingDescriptions.value = false
    descriptionsChecked.value = true // Отмечаем, что проверка выполнена
  }
}

// Функция для централизованной загрузки данных аналитики
const fetchAnalyticsData = async () => {
  if (analyticsDataLoaded.value) return // Пропускаем, если уже загружено
  
  isLoadingAnalytics.value = true
  
  try {
    // Используем существующую функцию для инициализации состояния загрузки
    initAnalyticsLoadingState()
    
    // Запускаем все запросы параллельно
    const fetchPromises = []
    
    // Запрос для классификации
    const classificationPromise = getSiteClassification(siteNumber.value, zoneType.value)
      .then(response => {
        if (response.success) {
          analyticsData.value.classification = {
            data: response.data.data || [],
            isLoading: false,
            error: null
          }
        } else {
          analyticsData.value.classification = {
            data: [],
            isLoading: false,
            error: handleApiError(response, 'Ошибка загрузки данных классификации')
          }
        }
      })
      .catch(err => {
        analyticsData.value.classification = {
          data: [],
          isLoading: false,
          error: handleApiError(err, 'Ошибка загрузки данных классификации')
        }
      })
    
    fetchPromises.push(classificationPromise)
    
    // Запросы для шкал
    SCALES_TYPES.forEach(scale => {
      const scalePromise = getSiteMeans(siteNumber.value, zoneType.value, scale.value)
        .then(response => {
          if (response.success) {
            analyticsData.value.scales[scale.value] = {
              data: response.data,
              isLoading: false,
              error: null
            }
          } else {
            analyticsData.value.scales[scale.value] = {
              data: null,
              isLoading: false,
              error: handleApiError(response, `Ошибка загрузки данных шкалы ${scale.value}`)
            }
          }
        })
        .catch(err => {
          analyticsData.value.scales[scale.value] = {
            data: null,
            isLoading: false,
            error: handleApiError(err, `Ошибка загрузки данных шкалы ${scale.value}`)
          }
        })
      
      fetchPromises.push(scalePromise)
    })
    
    // Запросы для спектров
    SPECTRUM_TYPES.forEach(spectrum => {
      const spectrumPromise = getSiteDistribution(siteNumber.value, zoneType.value, spectrum.value)
        .then(response => {
          if (response.success) {
            analyticsData.value.spectra[spectrum.value] = {
              data: response.data,
              isLoading: false,
              error: null
            }
          } else {
            analyticsData.value.spectra[spectrum.value] = {
              data: null,
              isLoading: false,
              error: handleApiError(response, `Ошибка загрузки данных спектра ${spectrum.value}`)
            }
          }
        })
        .catch(err => {
          analyticsData.value.spectra[spectrum.value] = {
            data: null,
            isLoading: false,
            error: handleApiError(err, `Ошибка загрузки данных спектра ${spectrum.value}`)
          }
        })
      
      fetchPromises.push(spectrumPromise)
    })
    
    // Ждем завершения всех запросов
    await Promise.all(fetchPromises)
    analyticsDataLoaded.value = true
    
  } catch (err) {
    error.value = handleApiError(err, 'Ошибка загрузки данных для графиков', toast)
  } finally {
    isLoadingAnalytics.value = false
  }
}

// Инициализация состояния загрузки аналитики
const initAnalyticsLoadingState = () => {
  // Инициализируем состояние загрузки для классификации
  analyticsData.value.classification = {
    data: [],
    isLoading: true,
    error: null
  }
  
  // Инициализируем состояние загрузки для всех шкал
  SCALES_TYPES.forEach(scale => {
    analyticsData.value.scales[scale.value] = {
      data: null,
      isLoading: true,
      error: null
    }
  })
  
  // Инициализируем состояние загрузки для всех спектров
  SPECTRUM_TYPES.forEach(spectrum => {
    analyticsData.value.spectra[spectrum.value] = {
      data: null,
      isLoading: true,
      error: null
    }
  })
}

// Функция отложенной загрузки данных аналитики
const loadAnalyticsIfNeeded = () => {
  // Загружаем данные только если:
  // 1. Активная вкладка - аналитика
  // 2. Есть данные о видах
  // 3. Данные аналитики еще не загружены
  // 4. Уже проверено наличие описаний
  if (
    activeTab.value === 'analytics' && 
    descriptionsChecked.value &&
    descriptions.value.length > 0 && 
    !analyticsDataLoaded.value &&
    !isLoadingAnalytics.value
  ) {
    fetchAnalyticsData()
  }
}

// Обработчик обновления данных описаний из дочернего компонента
const handleUpdateDescriptions = async () => {
  descriptions.value = [] // Сбрасываем кеш
  descriptionsChecked.value = false // Сбрасываем флаг проверки, чтобы принудительно загрузить данные
  await fetchSiteDescriptions() // Перезагружаем данные
  
  // Если есть данные аналитики, сбрасываем их т.к. они могли измениться
  if (analyticsDataLoaded.value) {
    analyticsData.value = {
      scales: {},
      spectra: {},
      classification: { data: [], isLoading: true, error: null }
    }
    analyticsDataLoaded.value = false
    
    // Если активная вкладка - аналитика, загружаем данные заново
    if (activeTab.value === 'analytics') {
      fetchAnalyticsData()
    }
  }
}

// Отслеживаем изменение активной вкладки для загрузки данных
watch(activeTab, async (newTab) => {
  // Загружаем описания для вкладок species и analytics только если они еще не загружены
  if ((newTab === 'species' || newTab === 'analytics') && !descriptionsChecked.value) {
    await fetchSiteDescriptions()
  }
})

// Отслеживаем изменение descriptions чтобы определить возможность загрузки аналитики
watch(descriptions, () => {
  loadAnalyticsIfNeeded()
})

const goBack = () => {
  router.push({ name: 'Sites' })
}

const editSite = () => {
  siteToEdit.value = { ...site.value }
}

const closeModal = (modalId) => {
  const dismissBtn = document.querySelector(`#${modalId} [data-bs-dismiss="modal"]`)
  if (dismissBtn) {
    dismissBtn.click()
  }

  // Сброс данных при закрытии
  if (modalId === editModalId) {
    siteToEdit.value = null
  }
}

const handleUpdateSite = async (siteData, callback) => {
  try {
    const response = await updateSite(siteData.site_number, siteData.zone_type, siteData)
    if (response.success) {
      await fetchSiteDetails()
      closeModal(editModalId)
      toast.success(`Площадка №${siteData.site_number} успешно обновлена`)
      callback && callback(null)
    } else {
      const errorMessage = handleApiError(response, 'Ошибка обновления площадки', toast)
      callback && callback(errorMessage)
    }
  } catch (err) {
    const errorMessage = handleApiError(err, 'Ошибка обновления площадки', toast)
    callback && callback(errorMessage)
  }
}

// Load data when component mounts
onMounted(() => {
  if (!siteNumber.value || !zoneType.value) {
    toast.error('Некорректные параметры площадки')
    goBack()
    return
  }

  // Проверяем query параметр 'tab' и устанавливаем активную вкладку
  const tabFromUrl = route.query.tab
  if (tabFromUrl && ['info', 'species', 'analytics'].includes(tabFromUrl)) {
    activeTab.value = tabFromUrl
    
    // Если изначально активная вкладка - аналитика, инициализируем состояние загрузки
    if (activeTab.value === 'analytics') {
      initAnalyticsLoadingState()
    }
  } else {
    // Если параметр tab отсутствует, добавляем его в URL
    router.replace({
      query: { ...route.query, tab: activeTab.value }
    })
  }

  // Загружаем основные данные площадки
  fetchSiteDetails()
  
  // Загружаем описания для вкладок species и analytics
  if ((activeTab.value === 'species' || activeTab.value === 'analytics') && !descriptionsChecked.value) {
    fetchSiteDescriptions()
  }
  
  // Если вкладка analytics активна, проверяем необходимость загрузки аналитики
  if (activeTab.value === 'analytics') {
    loadAnalyticsIfNeeded()
  }
})
</script>

<template>
  <div>
    <!-- Верхняя секция с заголовком и вкладками -->
    <div class="header-section d-flex align-items-center justify-content-between mb-4">
      <!-- Левая часть: кнопка "Назад", заголовок и кнопка редактирования -->
      <div class="d-flex align-items-center gap-3">
        <button
          @click="goBack"
          class="btn back-arrow-btn"
          v-tooltip
          title="К списку площадок"
        >
          <ArrowLeft :size="20" />
        </button>
        
        <div class="d-flex align-items-center">
          <h5 class="mb-0 me-3">
            <span v-if="site">Площадка №{{ site.site_number }}</span>
            <span v-else>Загрузка данных...</span>
          </h5>
          
          <!-- Кнопка редактирования рядом с заголовком -->
          <button
            v-if="site"
            class="btn btn-sm btn-outline-primary"
            @click="editSite"
            data-bs-toggle="modal"
            :data-bs-target="`#${editModalId}`"
          >
            <PenLine :size="16" class="me-1" /> Редактировать
          </button>
        </div>
      </div>
      
      <!-- Правая часть: вкладки -->
      <div v-if="site" class="tabs-section">
        <ul class="nav nav-tabs border-0">
          <li class="nav-item">
            <button 
              class="nav-link" 
              :class="{ 'active': activeTab === 'info' }"
              @click="switchTab('info')"
            >
              <Info :size="18" class="me-1" /> Информация
            </button>
          </li>
          <li class="nav-item">
            <button 
              class="nav-link" 
              :class="{ 'active': activeTab === 'species' }"
              @click="switchTab('species')"
            >
              <FileText :size="18" class="me-1" /> Описание растительности
            </button>
          </li>
          <li class="nav-item">
            <button 
              class="nav-link" 
              :class="{ 'active': activeTab === 'analytics' }"
              @click="switchTab('analytics')"
            >
              <BarChart2 :size="18" class="me-1" /> Аналитика
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="alert alert-danger mb-4">
      <div class="d-flex align-items-center gap-3">
        <CircleAlert :size="24" />
        <div>{{ error }}</div>
      </div>
    </div>

    <div v-if="isLoading" class="d-flex justify-content-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
    </div>

    <div v-else-if="site" class="site-view">
      <SiteInfo v-if="activeTab === 'info'" :site="site" />
      <SiteSpecies 
        v-if="activeTab === 'species'" 
        :descriptions="descriptions"
        :isLoading="isLoadingDescriptions"
        @update-descriptions="handleUpdateDescriptions" 
      />
      <SiteAnalytics 
        v-if="activeTab === 'analytics'" 
        :descriptions="descriptions"
        :isLoading="isLoadingAnalytics || isLoadingDescriptions"
        :analyticsData="analyticsData"
      />
    </div>

    <!-- Edit Site Modal -->
    <SiteFormModal
      :modalId="editModalId"
      :initialData="siteToEdit"
      :isEdit="true"
      @updateSite="handleUpdateSite"
    />
  </div>
</template>

<style lang="scss" scoped>
.back-arrow-btn {
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  color: var(--bs-heading-color);
  padding: 0;
  border: none;
  
  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &:active {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  [data-bs-theme="dark"] & {
    color: var(--bs-heading-color);
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.95);
    }
  }
}

.tabs-section {
  .nav-tabs {
    
    .nav-link {
      border-bottom: 2px solid var(--bs-border-color);
      border-top: none;
      border-left: none;
      border-right: none;
      padding: 0.6rem 1rem;
      color: var(--bs-body-color);
      
      &:hover {
        background-color: rgba(var(--bs-primary-rgb), 0.05);
        border-color: rgba(var(--bs-primary-rgb), 0.05);
        color: var(--bs-primary);
      }
      
      &.active {
        color: var(--bs-primary);
        font-weight: 500;
        background-color: transparent;
        border-color: var(--bs-primary)
      }
    }
  }
}

.header-section {
  h5 {
    font-weight: 600;
  }
}
</style>
