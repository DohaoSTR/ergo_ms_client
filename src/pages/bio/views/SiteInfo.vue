<script setup>
import { computed } from 'vue'
import { formatDate, getZoneTypeTranslation } from '@/pages/bio/js/bio-helpers'
import { MapPin } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

// Инициализация роутера для перехода на карту
const router = useRouter()

// Props
const props = defineProps({
  site: { type: Object, required: true },
})

// Открытие площадки на карте
const openOnMap = () => {
  if (props.site.latitude && props.site.longitude) {
    router.push({
      name: 'SitesMap',
      query: {
        siteNumber: props.site.site_number,
        zoneType: props.site.zone_type
      }
    });
  }
};

// Formatted site data for display
const formattedSite = computed(() => {
  if (!props.site) return {}

  return {
    id: props.site.site_number,
    zoneType: getZoneTypeTranslation(props.site.zone_type),
    size: props.site.size ? `${props.site.size} м²` : '-',
    date: formatDate(props.site.date),
    coordinates:
      props.site.latitude && props.site.longitude
        ? `${props.site.latitude}, ${props.site.longitude}`
        : '-',
    district: props.site.district || '-',
    mappedPoint: props.site.mapped_point || '-',
    mappedPointDistance: props.site.mapped_point_distance
      ? `${props.site.mapped_point_distance} м`
      : '-',
    mappedPointAzimuth: props.site.mapped_point_azimuth
      ? `${props.site.mapped_point_azimuth}°`
      : '-',
    forestryName: props.site.forestry_name || '-',
    centerDistance: props.site.center_distance ? `${props.site.center_distance} м` : '-',
    centerAzimuth: props.site.center_azimuth ? `${props.site.center_azimuth}°` : '-',
    mesoreliefShape: props.site.mesorelief_shape || '-',
    exposition: props.site.exposition || '-',
    steepness: props.site.steepness ? `${props.site.steepness}°` : '-',
    positionRelief: props.site.position_relief || '-',
    microreliefShape: props.site.microrelief_shape || '-',
    humidificationType: props.site.humidification_type || '-',
    groundwaterLevel: props.site.groundwater_level || '-',
    brushwoodCompos: props.site.brushwood_compos || '-',
    brushwoodDiameter: props.site.brushwood_diameter ? `${props.site.brushwood_diameter} см` : '-',
    brushwoodQuantity: props.site.brushwood_quantity || '-',
    decompositionDegree: props.site.decomposition_degree || '-',
  }
})

// Проверка наличия координат
const hasCoordinates = computed(() => {
  return props.site && props.site.latitude && props.site.longitude;
})

// Table column data
const siteInfoColumns = [
  { field: 'id', header: 'Номер площадки' },
  { field: 'zoneType', header: 'Тип местности' },
  { field: 'size', header: 'Площадь' },
  { field: 'date', header: 'Дата' },
  { field: 'coordinates', header: 'Координаты' },
  { field: 'district', header: 'Район' },
]

const siteLocationColumns = [
  { field: 'mappedPoint', header: 'Привязка' },
  { field: 'mappedPointDistance', header: 'Расстояние от привязки' },
  { field: 'mappedPointAzimuth', header: 'Азимут от привязки' },
  { field: 'forestryName', header: 'Лесничество' },
  { field: 'centerDistance', header: 'Расстояние от центра' },
  { field: 'centerAzimuth', header: 'Азимут от центра' },
]

const siteReliefColumns = [
  { field: 'mesoreliefShape', header: 'Форма мезорельефа' },
  { field: 'exposition', header: 'Экспозиция' },
  { field: 'steepness', header: 'Крутизна' },
  { field: 'positionRelief', header: 'Положение в рельефе' },
  { field: 'microreliefShape', header: 'Форма микрорельефа' },
]

const siteConditionsColumns = [
  { field: 'humidificationType', header: 'Тип увлажнения' },
  { field: 'groundwaterLevel', header: 'Уровень грунтовых вод' },
  { field: 'brushwoodCompos', header: 'Состав валежа' },
  { field: 'brushwoodDiameter', header: 'Диаметр валежа' },
  { field: 'brushwoodQuantity', header: 'Количество валежа' },
  { field: 'decompositionDegree', header: 'Степень разложения' },
]
</script>

<template>
  <!-- Site Info Cards -->
  <div class="site-data-container">
    <div class="row g-3">
      <!-- Basic Info Section -->
      <div class="col-12 col-lg-6">
        <div class="data-section h-100 section-primary">
          <div class="section-header">Основная информация</div>
          <div class="data-content">
            <div class="data-grid data-grid-info">
              <div v-for="col in siteInfoColumns" :key="col.field" class="data-row">
                <div class="data-label">{{ col.header }}:</div>
                <div class="data-value">
                  <div v-if="col.field === 'coordinates' && hasCoordinates" class="d-flex align-items-center justify-content-between gap-1">
                    <span class="coord-text">{{ formattedSite[col.field] }}</span>
                    <button
                      class="btn btn-icon btn-sm text-primary"
                      @click="openOnMap"
                      v-tooltip
                      title="Посмотреть на карте"
                    >
                      <MapPin :size="14" />
                    </button>
                  </div>
                  <span v-else>{{ formattedSite[col.field] }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Location Info Section -->
      <div class="col-12 col-lg-6">
        <div class="data-section h-100 section-location">
          <div class="section-header">Местоположение</div>
          <div class="data-content">
            <div class="data-grid data-grid-location">
              <div v-for="col in siteLocationColumns" :key="col.field" class="data-row">
                <div class="data-label">{{ col.header }}:</div>
                <div class="data-value">{{ formattedSite[col.field] }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Relief Info Section -->
      <div class="col-12 col-lg-6">
        <div class="data-section h-100 section-relief">
          <div class="section-header">Рельеф</div>
          <div class="data-content">
            <div class="data-grid data-grid-relief">
              <div v-for="col in siteReliefColumns" :key="col.field" class="data-row">
                <div class="data-label">{{ col.header }}:</div>
                <div class="data-value">{{ formattedSite[col.field] }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Conditions Info Section -->
      <div class="col-12 col-lg-6">
        <div class="data-section h-100 section-conditions">
          <div class="section-header">Условия площадки</div>
          <div class="data-content">
            <div class="data-grid data-grid-conditions">
              <div v-for="col in siteConditionsColumns" :key="col.field" class="data-row">
                <div class="data-label">{{ col.header }}:</div>
                <div class="data-value">{{ formattedSite[col.field] }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.site-data-container {
  font-family: var(--bs-font-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif);
}

.data-section {
  background-color: var(--color-primary-background, #ffffff);
  border-radius: var(--bs-border-radius, 0.375rem);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// Тема для разделов
.section-primary {
  border-left: 3px solid var(--bs-primary, #0d6efd);
  .section-header {
    color: var(--bs-primary-text-emphasis, #052c65);
    background-color: rgba(var(--bs-primary-rgb, 13, 110, 253), 0.05);
    border-bottom: 1px solid rgba(var(--bs-primary-rgb, 13, 110, 253), 0.15);
  }
}

.section-location {
  border-left: 3px solid var(--bs-success, #198754);
  .section-header {
    color: var(--bs-success-text-emphasis, #0a3622);
    background-color: rgba(var(--bs-success-rgb, 25, 135, 84), 0.05);
    border-bottom: 1px solid rgba(var(--bs-success-rgb, 25, 135, 84), 0.15);
  }
}

.section-relief {
  border-left: 3px solid var(--bs-info, #0dcaf0);
  .section-header {
    color: var(--bs-info-text-emphasis, #055160);
    background-color: rgba(var(--bs-info-rgb, 13, 202, 240), 0.05);
    border-bottom: 1px solid rgba(var(--bs-info-rgb, 13, 202, 240), 0.15);
  }
}

.section-conditions {
  border-left: 3px solid var(--bs-warning, #ffc107);
  .section-header {
    color: var(--bs-warning-text-emphasis, #664d03);
    background-color: rgba(var(--bs-warning-rgb, 255, 193, 7), 0.05);
    border-bottom: 1px solid rgba(var(--bs-warning-rgb, 255, 193, 7), 0.15);
  }
}

.section-header {
  padding: 0.7rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.data-content {
  padding: 0;
  overflow: hidden;
}

.data-grid {
  display: table;
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}

.data-row {
  display: table-row;
  border-bottom: 1px solid var(--bs-border-color, rgba(0, 0, 0, 0.05));
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: var(--bs-tertiary-bg, #f8f9fa);
  }
}

.data-label {
  display: table-cell;
  width: 30%; // Фиксированная ширина для всех заголовков в одной сетке
  padding: 0.55rem 1rem 0.55rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--bs-secondary-color, #6c757d);
  white-space: nowrap;
  vertical-align: top;
}

.data-value {
  display: table-cell;
  padding: 0.55rem 1rem 0.55rem 0;
  font-size: 0.9rem;
  font-weight: 400;
  color: var(--bs-body-color, #212529);
  word-break: break-word;
  overflow-wrap: break-word;
  vertical-align: top;
}

.coord-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-icon {
  padding: 0.25rem;
  line-height: 1;

  &:hover {
    background-color: var(--bs-tertiary-bg);
    border-radius: 0.25rem;
  }

  &:focus {
    box-shadow: none;
  }
}

// Медиа-запросы для адаптивного отображения
@media (max-width: 767.98px) {
  .data-label, .data-value {
    padding: 0.5rem 0.75rem 0.5rem 0.75rem;
    font-size: 0.85rem;
  }
  
  .data-value {
    padding-right: 0.75rem;
  }
}
</style>