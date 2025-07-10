<script setup>
import { ref, shallowRef, onMounted, onUnmounted, onBeforeUnmount, computed } from 'vue';
import { Maximize2, Minimize2, CircleAlert } from 'lucide-vue-next';
import {
  YandexMap,
  YandexMapControls,
  YandexMapControlButton,
  YandexMapEntity,
  YandexMapDefaultSchemeLayer,
  YandexMapMarker,
  YandexMapDefaultFeaturesLayer,
  YandexMapFeature,
  YandexMapGeolocationControl,
  YandexMapZoomControl,
  YandexMapHint,
  getBoundsFromCoords,
  getLocationFromBounds
} from 'vue-yandex-maps';
import { getSites } from '@/js/api/services/bio-index';
import { handleApiError, getZoneTypeTranslation } from '@/pages/bio/js/bio-helpers';
import { useToast } from 'vue-toastification';
import { useRouter, useRoute } from 'vue-router';

// Инициализируем сервисы и утилиты
const toast = useToast();
const router = useRouter();
const route = useRoute();

// Ссылка на объект карты
const map = shallowRef(null);

// Настройки карты (Москва)
const mapCenter = ref([46, 53]);
const mapZoom = ref(3);

// Объект локации для управления перемещением карты
const mapLocation = ref({
  center: mapCenter.value,
  zoom: mapZoom.value,
  duration: 1000 // длительность анимации перемещения в миллисекундах
});

// Состояния компонента
const isFullscreen = ref(false);
const isLoading = ref(true);
const error = ref(null);
const markers = ref([]);

// Переключение полноэкранного режима
const toggleFullscreen = () => {
  if (isFullscreen.value) {
    document.exitFullscreen();
  }
  else {
    map.value.container.requestFullscreen();
  }
};

// Получение цвета для зоны
const getZoneColor = (zoneType) => {
  return zoneType === 'forest' ? 'rgba(25, 135, 84, 0.9)' : 'rgba(255, 193, 7, 0.9)';
};

// Получение цвета зоны с дополнительной прозрачностью для списка площадок
const getZoneColorWithOpacity = (zoneType) => {
  return zoneType === 'forest' ? 'rgba(25, 135, 84, 0.7)' : 'rgba(255, 193, 7, 0.7)';
};

// Обработчик клика по маркеру - переход на страницу просмотра площадки
const handleClick = (marker) => {
  router.push({
    name: 'SiteView',
    params: { 
      siteNumber: marker.site_number,
      zoneType: marker.zone_type 
    },
  });
};

// Центрирование карты на выбранном маркере с анимацией
const centerOnMarker = (marker) => {
  // Обновляем объект локации с новыми координатами и анимацией
  mapLocation.value = {
    center: marker.coordinates,
    zoom: 15, // Увеличиваем зум для более детального просмотра
    duration: 1000 // длительность анимации в миллисекундах
  };
};

// Проверка параметров URL и центрирование карты на указанной площадке при наличии параметров
const checkQueryParams = () => {
  const { siteNumber, zoneType, lat, lng } = route.query;
  
  if (siteNumber && zoneType) {
    // Найти маркер с соответствующими параметрами
    const siteMarker = markers.value.find(m => 
      m.site_number == siteNumber && 
      m.zone_type == zoneType
    );
    
    if (siteMarker) {
      // Если маркер найден, центрируем на нем
      setTimeout(() => {
        centerOnMarker(siteMarker);
      }, 300);
      return;
    }
    
    // Если маркер не найден по номеру и типу зоны, но есть координаты, центрируем по ним
    if (lat && lng) {
      const coordinates = [Number(lng), Number(lat)];
      mapLocation.value = {
        center: coordinates,
        zoom: 15,
        duration: 1000
      };
      return;
    }
  } else if (lat && lng) {
    // Если параметры номера и типа зоны не переданы, но есть координаты, центрируем на них
    const coordinates = [Number(lng), Number(lat)];
    mapLocation.value = {
      center: coordinates,
      zoom: 15,
      duration: 1000
    };
  }
};

// Центрирование карты по всем маркерам
const centerMapOnAllMarkers = async () => {
  if (markers.value.length === 0 || !map.value) return;

  try {
    // Если есть только один маркер, центрируем карту на него
    if (markers.value.length === 1) {
      mapLocation.value = {
        center: markers.value[0].coordinates,
        zoom: 15, // фиксированный зум для одного маркера
        duration: 1000
      };
      return;
    }

    // Извлекаем все координаты маркеров
    const coordinates = markers.value.map(marker => marker.coordinates);

    // Устанавливаем границы карты для отображения всех маркеров
    const newLocation = await getLocationFromBounds({
      bounds: getBoundsFromCoords(coordinates),
      map: map.value,
      roundZoom: true,
      comfortZoomLevel: true,
    });

    mapLocation.value = {
      ...newLocation,
      duration: 1000
    };
  } catch (err) {
    console.error('Ошибка при центрировании карты:', err);
  }
};

// Загрузка данных площадок с сервера
const fetchSites = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const response = await getSites();
    if (response.success) {
      const data = response.data.results || response.data;
      
      // Обрабатываем данные и создаем маркеры
      markers.value = data
      // Сначала сортируем по created_at (новые сначала)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      // Затем преобразуем в маркеры
      .map((site) => {
        // Проверяем наличие координат
        if (!site.latitude || !site.longitude) {
          return null;
        }

        const zoneType = site.zone_type;
        const coordinates = [site.longitude, site.latitude]; // долгота, затем широта
        
        return {
          id: `site-${site.site_number}`,
          site_number: site.site_number,
          zone_type: zoneType,
          coordinates: coordinates,
          properties: {
            hint: `
              <div class="hint-content" style="background-color: ${getZoneColor(zoneType)}; padding: 8px 12px; border-radius: 4px;">
                <div class="hint-header">
                  <div class="hint-title">Площадка №${site.site_number}</div>
                  <div class="hint-separator-vertical"></div>
                  <div class="hint-zone-type">${getZoneTypeTranslation(zoneType)}</div>
                </div>
                <div class="hint-divider"></div>
                <div class="hint-coordinates">
                  ${site.latitude}, ${site.longitude}
                </div>
              </div>
            `,
          },
          district: site.district,
          status: site.status,
        };
      }).filter(marker => marker !== null); // Фильтруем площадки без координат
      
      // Проверяем параметры URL для центрирования на указанной площадке
      if ((route.query.siteNumber && route.query.zoneType) || (route.query.lat && route.query.lng)) {
        checkQueryParams();
      } else if (markers.value.length > 0) {
        // Если нет параметров и есть маркеры, центрируем карту с учетом всех маркеров
        setTimeout(() => {
          centerMapOnAllMarkers();
        }, 100);
      }
    } else {
      error.value = handleApiError(response, 'Ошибка загрузки площадок', toast);
    }
  } catch (err) {
    error.value = handleApiError(err, 'Ошибка загрузки площадок', toast);
  } finally {
    isLoading.value = false;
  }
};

const currentTheme = ref('light');
let observer;

onMounted(() => {
  // Загружаем реальные данные о площадках
  fetchSites();
  
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

  const handleFullscreenChange = async () => {
    isFullscreen.value = !!document.fullscreenElement;
  };

  document.addEventListener('fullscreenchange', handleFullscreenChange);

  onBeforeUnmount(() => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
  });
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});
</script>

<template>
  <div class="container-fluid">
    <div class="card p-0">
      <div class="card-body p-0">
        <div class="row">
          <div class="col-12">
            <!-- Error Display -->
            <div v-if="error" class="alert alert-danger m-3">
              <div class="d-flex align-items-center gap-3">
                <CircleAlert :size="24" />
                <div>{{ error }}</div>
              </div>
            </div>

            <div class="ymap-container rounded overflow-hidden">
              <yandex-map
                v-model="map"
                width="100%"
                :height="isFullscreen ? '100dvh' : '75vh'"
                real-settings-location
                :settings="{
                  location: mapLocation,
                  theme: currentTheme,
                  showScaleInCopyrights: true,
                }"
              >
                <yandex-map-default-scheme-layer />
                <yandex-map-default-features-layer />

                <yandex-map-marker
                  v-for="(marker, index) in markers"
                  :key="index"
                  :settings="marker"
                >
                  <div @click="handleClick(marker)" class="custom-marker" :style="{ backgroundColor: getZoneColor(marker.zone_type) }">
                    <span class="marker-number">{{ marker.site_number }}</span>
                  </div>
                </yandex-map-marker>

                <yandex-map-controls :settings="{ position: 'top left' }">
                  <yandex-map-entity >
                    <div class="site-list-container">
                        <template v-if="markers.length > 0">
                            <div 
                                v-for="marker in markers" 
                                :key="marker.id" 
                                class="site-list-item" 
                                :style="{ backgroundColor: getZoneColorWithOpacity(marker.zone_type) }" 
                                @click="centerOnMarker(marker)"
                            >
                                Площадка №{{ marker.site_number }}
                            </div>
                        </template>
                        <div v-else class="empty-sites-message">
                            Площадок с геопривязкой не найдено
                        </div>
                    </div>
                  </yandex-map-entity>
                </yandex-map-controls>

                <yandex-map-controls :settings="{ position: 'right' }">
                  <yandex-map-zoom-control />
                  <yandex-map-geolocation-control />
                </yandex-map-controls>

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

                <yandex-map-hint hint-property="hint">
                  <template #default="{ content }">
                    <div
                      class="hint-window"
                      v-html="content"
                    />
                  </template>
                </yandex-map-hint>

              </yandex-map>

              <div v-if="isLoading" class="loading-overlay d-flex align-items-center justify-content-center">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Загрузка...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ymap-container {
  width: 100%;
  height: 75vh;
  position: relative;
}

.custom-marker {
  position: relative;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.marker-number {
  color: white;
  font-weight: 700;
  font-size: 11px;
  line-height: 1;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
}

.site-list-container {
  max-height: 25vh;
  overflow-y: auto;
  background-color: rgba(255, 255, 255, 0);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  margin-top: 10px;
  margin-left: 10px;
  width: 180px;
  pointer-events: all;
  scrollbar-width: thin;
  scrollbar-color: var(--color-hover-background) transparent;
  direction: rtl;
}

[data-bs-theme="dark"] .site-list-container {
  background-color: rgba(33, 37, 41, 0);
}

.site-list-item {
  padding: 8px 12px;
  cursor: pointer;
  color: white;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  text-align: left;
}

.site-list-item:last-child {
  border-bottom: none;
}

.site-list-item:hover {
  filter: brightness(110%);
}

.fullscreen {
  width: 24px;
  height: 24px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 1000;
}

[data-bs-theme="dark"] .loading-overlay {
  background-color: rgba(0, 0, 0, 0.5);
}

:deep(.hint-window) {
  background-color: transparent;
  padding: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  max-width: 300px;
}

:deep(.hint-content) {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

:deep(.hint-header) {
  display: flex;
  align-items: center;
}

:deep(.hint-title) {
  font-weight: bold;
  font-size: 14px;
  color: white;
}

:deep(.hint-separator-vertical) {
  width: 1px;
  height: 20px;
  background-color: rgba(255, 255, 255, 0.5);
  margin: 0 8px;
}

:deep(.hint-zone-type) {
  font-weight: 500;
  font-size: 14px;
  color: white;
}

:deep(.hint-divider) {
  width: 100%;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.5);
  margin: 6px 0;
}

:deep(.hint-coordinates) {
  color: white;
  font-size: 13px;
  margin-top: 2px;
}

.empty-sites-message {
  padding: 12px;
  text-align: center;
  color: #6c757d;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}

[data-bs-theme="dark"] .empty-sites-message {
  background-color: rgba(33, 37, 41, 0.8);
  color: #adb5bd;
}
</style> 