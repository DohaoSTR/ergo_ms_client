<script setup>
import { ref, onMounted, computed, watch, shallowRef, triggerRef, onUnmounted, onBeforeUnmount } from 'vue'
import { X, ArrowRight, Check, MapPinPlusInside, Maximize2, Minimize2 } from 'lucide-vue-next'
import ModalCenter from '@/pages/bio/components/modals/ModalCenter.vue'
import { zoneTypeOptions } from '@/pages/bio/js/bio-constants'
import {
  YandexMap,
  YandexMapDefaultFeaturesLayer,
  YandexMapDefaultMarker,
  YandexMapDefaultSchemeLayer,
  YandexMapControls,
  YandexMapZoomControl,
  YandexMapGeolocationControl,
  YandexMapControlButton,
} from 'vue-yandex-maps'

import { useToast } from 'vue-toastification'

const toast = useToast()

// Состояние видимости модального окна
const isModalVisible = ref(false)

const props = defineProps({
  modalId: { type: String, required: true, default: 'createSiteModal' },
  initialData: { type: Object, default: () => null }, // Данные площадки для редактирования
  isEdit: { type: Boolean, default: false }, // Режим редактирования или создания
})

const emits = defineEmits(['createSite', 'updateSite'])

// Error handling
const error = ref(null)

// Get current date in YYYY-MM-DD format for default date
const today = new Date().toISOString().split('T')[0]

// Form for new site with defaults
const newSite = ref({
  site_number: '',
  zone_type: 'forest',
  size: '',
  date: today,
  latitude: '',
  longitude: '',
  district: '',
  mapped_point: '',
  mapped_point_distance: '',
  mapped_point_azimuth: '',
  forestry_name: '',
  center_distance: '',
  center_azimuth: '',
  mesorelief_shape: '',
  exposition: '',
  steepness: '',
  position_relief: '',
  microrelief_shape: '',
  humidification_type: '',
  groundwater_level: '',
  brushwood_compos: '',
  brushwood_diameter: '',
  brushwood_quantity: '',
  decomposition_degree: '',
})

// Заголовок модального окна в зависимости от режима
const modalTitle = computed(() => {
  return props.isEdit
    ? `Редактирование площадки №${newSite.value.site_number}`
    : 'Создание новой площадки'
})

// Текст кнопки подтверждения
const submitButtonText = computed(() => {
  return props.isEdit ? 'Сохранить' : 'Создать'
})

// Form state
const activeTab = ref('basic')

// Check if basic info is filled
const isBasicInfoFilled = computed(() => {
  return newSite.value.site_number && newSite.value.zone_type
})

// Form tabs for better organization
const formTabs = [
  { id: 'basic', name: 'Основное' },
  { id: 'location', name: 'Местоположение' },
  { id: 'map', name: 'Карта' },
  { id: 'relief', name: 'Рельеф' },
  { id: 'additional', name: 'Условия' },
]

// Переменные для карты
const map = shallowRef(null)
const defaultMarker = shallowRef(null)
const mapCenter = ref([34.3044, 53.30455])
const mapZoom = ref(10)
const mapLocation = ref({
  center: mapCenter.value,
  zoom: mapZoom.value,
})
const currentTheme = ref('light')
const isFullscreen = ref(false);

// Начальные координаты маркера - вычисляемое свойство для корректной инициализации
const initialMarkerCoordinates = computed(() => {
  // Если есть координаты в форме, используем их
  const lat = parseFloat(newSite.value.latitude)
  const lng = parseFloat(newSite.value.longitude)
  
  if (!isNaN(lat) && !isNaN(lng)) {
    return [lng, lat]
  }
  
  // Иначе используем центр карты
  return mapCenter.value
})

// Переменная для отслеживания первой загрузки карты
const mapWasLoaded = ref(false)

// Обработка перемещения маркера
const onDragMove = () => {
  // Триггерим реактивность для обновления title маркера
  triggerRef(defaultMarker)
}

// Применение координат маркера в форму
const applyCoordinates = () => {
  if (defaultMarker.value && defaultMarker.value.coordinates) {
    const coords = defaultMarker.value.coordinates
    newSite.value.longitude = coords[0].toFixed(5)
    newSite.value.latitude = coords[1].toFixed(5)
    toast.success('Координаты применены')
  }
}

// Проверка совпадения координат маркера с координатами формы
const areCoordinatesEqual = computed(() => {
  if (!defaultMarker.value || !defaultMarker.value.coordinates) return true
  
  const markerLng = Number(defaultMarker.value.coordinates[0].toFixed(5))
  const markerLat = Number(defaultMarker.value.coordinates[1].toFixed(5))
  
  const formLng = parseFloat(newSite.value.longitude)
  const formLat = parseFloat(newSite.value.latitude)
  
  return !isNaN(formLng) && !isNaN(formLat) && 
         markerLng === Number(formLng.toFixed(5)) && 
         markerLat === Number(formLat.toFixed(5))
})

// Обновление центра карты при изменении полей координат
const updateMapCenter = () => {
  const lat = parseFloat(newSite.value.latitude)
  const lng = parseFloat(newSite.value.longitude)
  
  if (!isNaN(lat) && !isNaN(lng)) {
    mapCenter.value = [lng, lat]
    mapLocation.value = {
      center: mapCenter.value,
      zoom: 10,
    }
  }
}

// Переключение полноэкранного режима
const toggleFullscreen = () => {
  if (isFullscreen.value) {
    document.exitFullscreen();
  }
  else {
    map.value.container.requestFullscreen();
  }
};

// Наблюдаем за изменением полей координат (только при ручном вводе)
watch([() => newSite.value.latitude, () => newSite.value.longitude], () => {
  // Обновляем только если активна вкладка карты
  if (activeTab.value === 'map') {
    updateMapCenter()
  }
})

// Наблюдаем за изменением activeTab для обновления карты при переходе на вкладку карты
watch(() => activeTab.value, (newTab) => {
  if (newTab === 'map') {
    // При переходе на вкладку карты обновляем центр карты, если есть координаты
    updateMapCenter()
    
    // Отмечаем, что карта была загружена хотя бы раз
    if (isModalVisible.value) {
      mapWasLoaded.value = true
    }
  }
})

// Наблюдаем за изменением initialData
watch(
  () => props.initialData,
  (newVal) => {
    if (newVal) {
      // Заполняем форму данными
      Object.keys(newSite.value).forEach((key) => {
        if (key in newVal) {
          newSite.value[key] = newVal[key] || ''
        }
      })
      
      // Если активна вкладка карты, обновляем центр
      if (activeTab.value === 'map') {
        updateMapCenter()
      }
    }
  },
  { immediate: true },
)

const resetForm = () => {
  error.value = null

  if (props.isEdit && props.initialData) {
    // В режиме редактирования сбрасываем к начальным данным
    Object.keys(newSite.value).forEach((key) => {
      if (key in props.initialData) {
        newSite.value[key] = props.initialData[key] || ''
      } else {
        newSite.value[key] = ''
      }
    })
  } else {
    // В режиме создания сбрасываем на пустые значения
    newSite.value = {
      site_number: '',
      zone_type: 'forest',
      size: '',
      date: today,
      latitude: '',
      longitude: '',
      district: '',
      mapped_point: '',
      mapped_point_distance: '',
      mapped_point_azimuth: '',
      forestry_name: '',
      center_distance: '',
      center_azimuth: '',
      mesorelief_shape: '',
      exposition: '',
      steepness: '',
      position_relief: '',
      microrelief_shape: '',
      humidification_type: '',
      groundwater_level: '',
      brushwood_compos: '',
      brushwood_diameter: '',
      brushwood_quantity: '',
      decomposition_degree: '',
    }
  }

  activeTab.value = 'basic'
}

// Handle form submission
const handleSubmit = () => {
  error.value = null

  if (!isBasicInfoFilled.value) {
    error.value = "Заполните обязательные поля на вкладке 'Основное'"
    activeTab.value = 'basic'
    return
  }

  // Clean up empty values to avoid sending empty strings
  const siteData = { ...newSite.value }
  Object.keys(siteData).forEach((key) => {
    if (siteData[key] === '') {
      siteData[key] = null
    }
  })

  if (props.isEdit) {
    // Если режим редактирования, вызываем другое событие
    emits('updateSite', siteData, (errorMessage) => {
      if (errorMessage) {
        error.value = errorMessage
      } else {
        resetForm()
      }
    })
  } else {
    // Emit the createSite event with the site data
    emits('createSite', siteData, (errorMessage) => {
      if (errorMessage) {
        error.value = errorMessage
      } else {
        resetForm()
      }
    })
  }
}

// Обработка перехода на следующую вкладку
const goToNextTab = () => {
  const currentIndex = formTabs.findIndex((tab) => tab.id === activeTab.value)
  if (currentIndex < formTabs.length - 1) {
    const nextTab = formTabs[currentIndex + 1].id
    activeTab.value = nextTab
  }
}

// Обработка перехода на предыдущую вкладку
const goToPrevTab = () => {
  const currentIndex = formTabs.findIndex((tab) => tab.id === activeTab.value)
  if (currentIndex > 0) {
    activeTab.value = formTabs[currentIndex - 1].id
  }
}

// Handle tab change
const changeTab = (tabId) => {
  activeTab.value = tabId
}

let observer;

// Reset form when modal is hidden
onMounted(() => {
  // Слежка за изменениями атрибута data-bs-theme
  observer = new MutationObserver(() => {
    currentTheme.value = document.documentElement.getAttribute('data-bs-theme') || 'light';
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-bs-theme'],
  });

  // Установка текущее значение
  currentTheme.value = document.documentElement.getAttribute('data-bs-theme') || 'light';

  // Функции для обработки событий модального окна
  const handleModalShown = () => {
    isModalVisible.value = true
  }
  
  const handleModalHidden = () => {
    isModalVisible.value = false
    resetForm()
  }

  const modalEl = document.getElementById(props.modalId)
  if (modalEl) {
    modalEl.addEventListener('shown.bs.modal', handleModalShown)
    modalEl.addEventListener('hidden.bs.modal', handleModalHidden)
  }

  const handleFullscreenChange = async () => {
    isFullscreen.value = !!document.fullscreenElement;
  };

  document.addEventListener('fullscreenchange', handleFullscreenChange);

  onBeforeUnmount(() => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    
    const modalEl = document.getElementById(props.modalId)
    if (modalEl) {
      modalEl.removeEventListener('shown.bs.modal', handleModalShown)
      modalEl.removeEventListener('hidden.bs.modal', handleModalHidden)
    }
  });
})

onUnmounted(() => {
  if (observer) observer.disconnect();
});
</script>

<template>
  <ModalCenter :modalId="modalId" :title="modalTitle" size="xl" :showFooter="true">
    <!-- Error alert -->
    <div v-if="error" class="alert alert-danger mb-3">
      {{ error }}
    </div>

    <!-- Tabs navigation -->
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item" v-for="tab in formTabs" :key="tab.id">
        <a
          class="nav-link"
          :class="{
            active: activeTab === tab.id,
            'required-empty': tab.id === 'basic' && !isBasicInfoFilled,
          }"
          href="#"
          @click.prevent="changeTab(tab.id)"
        >
          {{ tab.name }}
          <span
            v-if="tab.id === 'basic' && !isBasicInfoFilled"
            class="ms-1 text-danger"
            v-tooltip
            title="Заполните обязательные поля"
            >*</span
          >
        </a>
      </li>
    </ul>

    <form @submit.prevent="handleSubmit">
      <!-- Basic Info Tab -->
      <div v-show="activeTab === 'basic'">
        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="site_number" class="form-label">Номер площадки *</label>
            <input
              type="number"
              class="form-control"
              id="site_number"
              v-model="newSite.site_number"
              required
              :disabled="isEdit"
            />
          </div>
          <div class="col-md-6 mb-3">
            <label for="zone_type" class="form-label">Тип местности *</label>
            <select
              class="form-select"
              id="zone_type"
              v-model="newSite.zone_type"
              required
              :disabled="isEdit"
            >
              <option v-for="option in zoneTypeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>
        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="size" class="form-label">Площадь (м²)</label>
            <input
              type="number"
              step="0.01"
              class="form-control"
              id="size"
              v-model="newSite.size"
            />
          </div>
          <div class="col-md-6 mb-3">
            <label for="date" class="form-label">Дата</label>
            <input type="date" class="form-control" id="date" v-model="newSite.date" />
          </div>
        </div>
      </div>

      <!-- Location Tab -->
      <div v-show="activeTab === 'location'">
        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="district" class="form-label">Район</label>
            <input type="text" class="form-control" id="district" v-model="newSite.district" />
          </div>
          <div class="col-md-6 mb-3">
            <label for="forestry_name" class="form-label">Название лесничества</label>
            <input
              type="text"
              class="form-control"
              id="forestry_name"
              v-model="newSite.forestry_name"
            />
          </div>
        </div>
        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="latitude" class="form-label">Широта</label>
            <input
              type="number"
              step="0.00001"
              class="form-control"
              id="latitude"
              v-model="newSite.latitude"
            />
          </div>
          <div class="col-md-6 mb-3">
            <label for="longitude" class="form-label">Долгота</label>
            <input
              type="number"
              step="0.00001"
              class="form-control"
              id="longitude"
              v-model="newSite.longitude"
            />
          </div>
        </div>
        <div class="row">
          <div class="col-md-4 mb-3">
            <label for="mapped_point" class="form-label">Привязка</label>
            <input
              type="text"
              class="form-control"
              id="mapped_point"
              v-model="newSite.mapped_point"
            />
          </div>
          <div class="col-md-4 mb-3">
            <label for="mapped_point_distance" class="form-label">Расстояние от привязки (м)</label>
            <input
              type="number"
              step="0.01"
              class="form-control"
              id="mapped_point_distance"
              v-model="newSite.mapped_point_distance"
            />
          </div>
          <div class="col-md-4 mb-3">
            <label for="mapped_point_azimuth" class="form-label">Азимут от привязки (°)</label>
            <input
              type="number"
              step="0.01"
              class="form-control"
              id="mapped_point_azimuth"
              v-model="newSite.mapped_point_azimuth"
            />
          </div>
        </div>
        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="center_distance" class="form-label">Расстояние от центра (м)</label>
            <input
              type="number"
              step="0.01"
              class="form-control"
              id="center_distance"
              v-model="newSite.center_distance"
            />
          </div>
          <div class="col-md-6 mb-3">
            <label for="center_azimuth" class="form-label">Азимут от центра (°)</label>
            <input
              type="number"
              step="0.01"
              class="form-control"
              id="center_azimuth"
              v-model="newSite.center_azimuth"
            />
          </div>
        </div>
      </div>

      <!-- Map Tab -->
      <div v-show="activeTab === 'map'">
        <div class="mb-3">
          <div class="d-flex justify-content-between align-items-center">
            <p class="text-muted small mb-0">
              Перетащите маркер на карте, чтобы установить координаты площадки
            </p>
            <button 
              type="button" 
              class="btn btn-primary btn-sm btn-apply-coordinates"
              @click="applyCoordinates"
              :disabled="areCoordinatesEqual"
              v-tooltip :title="areCoordinatesEqual ? 'Координаты маркера уже применены' : ''"
            >
              <MapPinPlusInside :size="16" class="me-1" />
              Применить координаты
            </button>
          </div>
        </div>
        
        <div class="rounded overflow-hidden">
          <yandex-map
            v-if="isModalVisible && activeTab === 'map'"
            v-model="map"
            :height="isFullscreen ? '100dvh' : '60vh'"
            width="100%"
            :settings="{
              location: mapLocation,
              theme: currentTheme,
              showScaleInCopyrights: true,
            }"
          >
            <yandex-map-default-scheme-layer />
            <yandex-map-default-features-layer />
            
            <yandex-map-default-marker
              v-model="defaultMarker"
              :settings="{
                coordinates: initialMarkerCoordinates,
                title: defaultMarker?.coordinates ? 
                  `Широта: ${defaultMarker.coordinates[1].toFixed(5)}<br>Долгота: ${defaultMarker.coordinates[0].toFixed(5)}` : 
                  `Широта: ${initialMarkerCoordinates[1].toFixed(5)}<br>Долгота: ${initialMarkerCoordinates[0].toFixed(5)}`,
                draggable: true,
                mapFollowsOnDrag: true,
                onDragMove,
              }"
            />

            <yandex-map-controls :settings="{ position: 'top right', orientation: 'vertical' }">
              <yandex-map-control-button :settings="{ onClick: toggleFullscreen }">
                <div
                  class="fullscreen d-flex align-items-center justify-content-center"
                >
                  <Maximize2 :size="18" v-if="!isFullscreen" />
                  <Minimize2 :size="18" v-else />
                </div>
              </yandex-map-control-button>
            </yandex-map-controls>

            <yandex-map-controls :settings="{ position: 'right' }">
              <yandex-map-zoom-control />
              <yandex-map-geolocation-control />
            </yandex-map-controls>
          </yandex-map>
        </div>
      </div>

      <!-- Relief Tab -->
      <div v-show="activeTab === 'relief'">
        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="mesorelief_shape" class="form-label">Форма мезорельефа</label>
            <input
              type="text"
              class="form-control"
              id="mesorelief_shape"
              v-model="newSite.mesorelief_shape"
            />
          </div>
          <div class="col-md-6 mb-3">
            <label for="microrelief_shape" class="form-label">Характер микрорельефа</label>
            <input
              type="text"
              class="form-control"
              id="microrelief_shape"
              v-model="newSite.microrelief_shape"
            />
          </div>
        </div>
        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="exposition" class="form-label">Экспозиция</label>
            <input type="text" class="form-control" id="exposition" v-model="newSite.exposition" />
          </div>
          <div class="col-md-6 mb-3">
            <label for="steepness" class="form-label">Крутизна (°)</label>
            <input
              type="number"
              step="0.01"
              class="form-control"
              id="steepness"
              v-model="newSite.steepness"
            />
          </div>
        </div>
        <div class="mb-3">
          <label for="position_relief" class="form-label">Положение в рельефе</label>
          <input
            type="text"
            class="form-control"
            id="position_relief"
            v-model="newSite.position_relief"
          />
        </div>
      </div>

      <!-- Additional Tab -->
      <div v-show="activeTab === 'additional'">
        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="humidification_type" class="form-label">Тип увлажнения</label>
            <input
              type="text"
              class="form-control"
              id="humidification_type"
              v-model="newSite.humidification_type"
            />
          </div>
          <div class="col-md-6 mb-3">
            <label for="groundwater_level" class="form-label">Уровень грунтовых вод</label>
            <input
              type="text"
              class="form-control"
              id="groundwater_level"
              v-model="newSite.groundwater_level"
            />
          </div>
        </div>
        <div class="row">
          <div class="col-md-4 mb-3">
            <label for="brushwood_compos" class="form-label">Состав валежа</label>
            <input
              type="text"
              class="form-control"
              id="brushwood_compos"
              v-model="newSite.brushwood_compos"
            />
          </div>
          <div class="col-md-4 mb-3">
            <label for="brushwood_diameter" class="form-label">Диаметр валежа (см)</label>
            <input
              type="number"
              step="0.01"
              class="form-control"
              id="brushwood_diameter"
              v-model="newSite.brushwood_diameter"
            />
          </div>
          <div class="col-md-4 mb-3">
            <label for="brushwood_quantity" class="form-label">Кол-во валежа (шт/га)</label>
            <input
              type="number"
              step="0.01"
              class="form-control"
              id="brushwood_quantity"
              v-model="newSite.brushwood_quantity"
            />
          </div>
        </div>
        <div class="mb-3">
          <label for="decomposition_degree" class="form-label">Степень разложения</label>
          <input
            type="text"
            class="form-control"
            id="decomposition_degree"
            v-model="newSite.decomposition_degree"
          />
        </div>
      </div>  
    </form>

    <!-- Кастомный футер с кнопками -->
    <template #footer>
      <div class="d-flex justify-content-between w-100">
        <button
          v-if="activeTab !== 'basic'"
          type="button"
          class="btn btn-outline-secondary"
          @click="goToPrevTab"
          v-tooltip
          title="Вернуться к предыдущей вкладке"
        >
          Назад
        </button>
        <div v-else></div>

        <div class="d-flex">
          <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">
            <X :size="16" class="me-1" /> Отмена
          </button>

          <button
            type="button"
            class="btn btn-success me-2"
            @click="handleSubmit"
            :disabled="!isBasicInfoFilled"
            v-tooltip
            :title="isEdit ? 'Сохранить изменения' : 'Создать площадку с текущими данными'"
          >
            <Check :size="16" class="me-1" /> {{ submitButtonText }}
          </button>

          <button
            v-if="activeTab !== formTabs[formTabs.length - 1].id"
            type="button"
            class="btn btn-primary"
            @click="goToNextTab"
          >
            Далее <ArrowRight :size="16" class="ms-1" />
          </button>
        </div>
      </div>
    </template>
  </ModalCenter>
</template>

<style lang="scss" scoped>
.nav-tabs {
  .nav-link {
    color: var(--bs-body-color);

    &.active {
      font-weight: 500;
      color: var(--bs-primary);
      border-color: var(--bs-border-color) var(--bs-border-color) transparent;
    }

    &.required-empty {
      color: var(--bs-danger);
    }

    &:hover:not(.active) {
      border-color: transparent;
      color: var(--bs-primary);
    }
  }
}

.fullscreen {
  width: 24px;
  height: 24px;
}

.btn-apply-coordinates{
  pointer-events: all;
}
</style>
