<template>
    <div class="page-body">
        <div class="body-header border-elements elements-color">
            <div class="header-label-icon">
                <ChartPie />
                <div style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
                    <h4 class="header-label" style="margin-bottom: 3px;">{{ chartName }}</h4>
                </div>
                <button class="btn btn-sm fw-bold btn-chart-action" style="padding: 0; margin: 0; display: flex;"
                    hidden>
                    <Ellipsis size="20" />
                </button>
            </div>
            <div class="header-label-buttons">
                <button class="btn btn-sm fw-bold" :class="{ active: isFullScreen }"
                    style="display: flex; gap: 5px; justify-content: center; align-items: center;"
                    @click="toggleFullScreen">
                    <Maximize />На весь экран
                </button>
                <button class="btn btn-sm btn-primary" :disabled="!chartRequiredFieldsFilled || !isChartDirty"
                    @click="isSaveModalVisible = true">{{ isEditMode ? 'Сохранить изменения' : 'Создать чарт'
                    }}</button>
            </div>
        </div>
        <div :class="['body-grid', { 'no-fields': !selectedChartType, fullscreen: isFullScreen }]">
            <div class="datasets sectors border-elements elements-color">
                <h5 class="m-0 me-2">Датасет</h5>
                <button ref="buttonRef" v-if="!selectedDataset" class="btn btn-sm fw-bold" @click="openDatasetTooltip"
                    style="display: flex; gap: 5px; justify-content: center; align-items: center; width: 100%;">
                    <Plus size="16" />Выбрать датасет
                </button>
                <button ref="buttonRef" v-else class="btn btn-sm fw-bold dataset-selected" @click="openDatasetTooltip"
                    style="display: flex; gap: 5px; align-items: center; width: 100%; border: 1.5px solid #198754;">
                    <Database size="16" />{{ selectedDataset?.name || 'Без имени' }}
                </button>
            </div>
            <div class="diagramtype sectors border-elements elements-color">
                <h5 class="m-0 me-2">Тип диаграммы</h5>
                <select class="form-select form-select-sm" id="smallSelect" style="cursor: pointer;"
                    :disabled="!selectedDataset" v-model="selectedChartType">
                    <option value="" disabled hidden>Выберите тип диаграммы</option>
                    <option value="line">Линейная диаграмма</option>
                    <option value="bar">Столбчатая диаграмма</option>
                    <option value="pie">Круговая диаграмма</option>
                    <option value="doughnut">Кольцевая диаграмма</option>
                    <option value="scatter">Точечная диаграмма</option>
                    <option value="radar">Радарная диаграмма</option>
                    <option value="heatmap">Тепловая карта</option>
                </select>
            </div>
            <div class="fields sectors body-settings border-elements elements-color"
                v-if="!isFullScreen && selectedChartType">
                <div v-for="setting in settingTypes" :key="setting.key" class="setting">
                    <div class="setting-header">
                        <div class="setting-header-left">
                            <component :is="setting.icon" size="18" />
                            <h6 class="m-0 me-1">{{ setting.label }}</h6>
                        </div>
                        <div class="setting-header-right">
                            <button class="btn btn-sm fw-bold" style="padding: 0; margin: 0; display: flex;"
                                @click="openFieldsModal($event, setting.key)">
                                <Plus size="16" />
                            </button>
                        </div>
                    </div>
                    <div v-for="f in selectedFields[setting.key]" :key="f.id" class="selected-field">
                        <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
                            <span class="field-icon" :class="f.source">
                                <component :is="typeIcon[f.type] || Type" size="16" />
                            </span>
                            {{ f.name }}
                        </div>
                        <button class="remove-btn" @click="removeField(f, setting.key)" title="Удалить">
                            <X size="18" />
                        </button>
                    </div>
                </div>
            </div>
            <div class="indicators sectors border-elements elements-color">
                <h5 class="m-0 me-2">Показатели</h5>
                <div class="sectors-body">
                    <DatasetIndicators :dataset="selectedDataset" :fields="indicators" />
                </div>
            </div>
            <div class="measures sectors border-elements elements-color">
                <h5 class="m-0 me-2">Измерения</h5>
                <div class="sectors-body">
                    <DatasetMeasures :dataset="selectedDataset" />
                </div>
            </div>
            <div class="parameters settings sectors border-elements elements-color">
                <h5 class="m-0 me-2">Параметры</h5>
                <div class="sectors-body">
                    <DatasetSettings :dataset="selectedDataset" />
                </div>
            </div>
            <div class="body-chart border-elements elements-color" :class="{ fullscreen: isFullScreen }">
                <ChartArea :dataset="datasetRows" :chart-type="selectedChartType" :fields="selectedFields"
                    :key="selectedChartType" :settings="settingTypes" @engineChange="selectedEngine = $event" />
            </div>
        </div>
    </div>


    <transition name="fade-slide" appear>
        <div v-if="isDatasetTooltipVisible" class="tooltip-panel" :style="{ left: tooltipPosition.x + 'px', top: tooltipPosition.y + 'px', position: 'fixed', zIndex: 1000 }" ref="tooltipRef">
            <DatasetTooltip v-if="isDatasetTooltipVisible" :selectedDataset="selectedDataset" :datasets="datasets" :isLoading="datasetsLoading" @select="handleSelectDataset" ref="tooltipRef"/>
        </div>
    </transition>
    <transition name="fade-slide" appear>
        <div v-if="isFieldsModalVisible" class="tooltip-panel-fields"
            :style="{ left: fieldsModalPosition.x + 'px', top: fieldsModalPosition.y + 'px', position: 'fixed', zIndex: 1000 }"
            ref="fieldsModalRef">
            <ChartFields :fields="indicators" :selected="selectedForModal" :allowed-types="currentAllowedTypes" @select="handleFieldSelect" />
        </div>
    </transition>
    <ChartNameDialog v-if="isSaveModalVisible" :visible="isSaveModalVisible" v-model="chartName" @update:visible="isSaveModalVisible = $event" @saved="onChartNameSaved" />
</template>

<script setup>
import { ChartPie, Maximize, Type, Plus, Ellipsis, Database, Hash, Calendar, CheckCircle, X, MapPin, Globe } from 'lucide-vue-next'
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'

import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

import DatasetTooltip from '@/pages/bi/components/ChartComponents/DatasetsTooltip.vue'
import DatasetIndicators from '@/pages/bi/components/ChartComponents/DatasetIndicators.vue'
import DatasetMeasures from '@/pages/bi/components/ChartComponents/DatasetMeasures.vue'
import DatasetSettings from '@/pages/bi/components/ChartComponents/DatasetSettings.vue'
import ChartFields from '@/pages/bi/components/ChartComponents/ChartFields.vue'
import ChartArea from '@/pages/bi/components/ChartComponents/ChartArea.vue'
import ChartNameDialog from '@/pages/bi/components/ChartNameDialog.vue'

import { useRouter, useRoute } from 'vue-router'
import { chartSettingsConfig } from '@/js/api/services/bi/chartSettingsConfig.js'
import chartService from '@/js/api/services/bi/chartService.js'

const isFullScreen = ref(false)

const isDatasetTooltipVisible = ref(false)
const tooltipPosition = ref({ x: 0, y: 0 })
const tooltipRef = ref(null)
const buttonRef = ref(null)

const isFieldsModalVisible = ref(false)
const fieldsModalPosition = ref({ x: 0, y: 0 })
const fieldsModalRef = ref(null)

const selectedDataset = ref(null)
const selectedChartType = ref('')

const indicators = ref([])
const currentSetting = ref('')

const datasetRows = ref([])

const currentAllowedTypes = ref(null)
const selectedEngine = ref('chartjs')
const originalChart = ref({})

const router = useRouter()
const route = useRoute()
const chartId = computed(() => route.params.id)
const loading = ref(false)
const isSaveModalVisible = ref(false)
const isEditMode = computed(() => !!route.params.id)
const chartData = ref({})
const chartName = ref('Новая диаграмма')

const datasets = ref([])
const datasetsLoading = ref(false)

const settingTypes = computed(() =>
    chartSettingsConfig[selectedChartType.value] || []
)

const selectedFields = ref({})

watch(chartData, d => { chartName.value = d?.name || 'Новая диаграмма' }, { immediate: true })

const typeIcon = {
  string: Type,
  integer: Hash,
  float: Hash,
  date: Calendar,
  'date&time': Calendar,
  bool: CheckCircle,
  boolean: CheckCircle,
  geopoint: MapPin,
  geopolygon: Globe,
}

const chartRequiredFieldsFilled = computed(() => {
    if (!selectedDataset.value) {
        return false
    }
    if (!selectedChartType.value) {
        return false
    }

    const required = []
    if (selectedChartType.value === 'line' || selectedChartType.value === 'bar') required.push('x', 'y')
    if (selectedChartType.value === 'pie' || selectedChartType.value === 'donut') required.push('category', 'indicators')
    if (selectedChartType.value === 'scatter') required.push('x', 'y')
    if (selectedChartType.value === 'radar') required.push('category', 'indicators')
    if (selectedChartType.value === 'heatmap') required.push('x', 'y', 'value')

    for (const key of required) {
        if (!selectedFields.value[key] || !selectedFields.value[key].length) {
            return false
        }
    }

    if (!selectedEngine.value) {
        return false
    }

    return true
})

async function onChartNameSaved({ name, description }) {
    chartName.value = name
    const payload = {
        name,
        description,
        dataset: selectedDataset.value.id,
        chart_type: selectedChartType.value,
        engine: selectedEngine.value,
        params: selectedFields.value,
        options: {}
    }
    try {
        if (isEditMode.value) {
            // Редактирование
            const { data: updated } = await chartService.updateChart(chartId.value, payload)
            chartData.value = updated
            // Можно показать уведомление
        } else {
            // Создание
            const { data } = await chartService.createChart(payload)
            // Переход на страницу созданного чарта
            if (data && data.id) {
                router.push({ name: 'ChartPage', params: { id: data.id } })
            }
        }
    } catch (err) {
    }
    isSaveModalVisible.value = false
}

async function fetchChartIfEditing() {
    if (!chartId.value) return
    loading.value = true
    try {
        const { data } = await chartService.getChart(chartId.value)
        chartData.value = data
        let dsObj
        if (typeof data.dataset === 'object' && data.dataset !== null) {
            dsObj = data.dataset
        } else if (data.dataset) {
            const { data: ds } = await chartService.getDataset(data.dataset)
            dsObj = ds
        }
        selectedDataset.value = dsObj

        selectedChartType.value = String(data.chart_type ?? '')
        selectedEngine.value = data.engine ?? ''
        selectedFields.value = { ...(data.params ?? {}) }

        if (dsObj?.id) {
            const { data: columnsResp } = await chartService.getColumns(dsObj.id)
            indicators.value = columnsResp.columns || []
        }

        if (chartId.value) { 
            const { data: rows } = await chartService.getDatasetRowsAgg(dsObj.id, selectedFields.value)
            datasetRows.value = rows
        }
        originalChart.value = {
            name: data.name,
            datasetId: typeof data.dataset === 'object' && data.dataset !== null ? data.dataset.id : data.dataset,
            chart_type: data.chart_type,
            engine: data.engine,
            params: JSON.parse(JSON.stringify(data.params ?? {})),
        }
    } finally {
        loading.value = false
    }
}

const selectedForModal = computed(() => selectedFields.value[currentSetting.value] || [])

function toggleFullScreen() {
    isFullScreen.value = !isFullScreen.value
}

function openFieldsModal(event, settingKey) {
    const rect = event.currentTarget.getBoundingClientRect()
    fieldsModalPosition.value = {
        x: rect.left,
        y: rect.bottom + 6,
    }
    isFieldsModalVisible.value = true
    currentSetting.value = settingKey

    const setting = settingTypes.value.find(s => s.key === settingKey)
    currentAllowedTypes.value = setting?.allowedTypes || null
}

function openDatasetTooltip(event) {
  const rect = buttonRef.value.getBoundingClientRect()
  let x = rect.left
  let y = rect.bottom + 6
  const maxX = window.innerWidth - 380 // ~ширина тултипа + отступ
  const maxY = window.innerHeight - 240 // ~высота тултипа + отступ
  if (x > maxX) x = maxX
  if (y > maxY) y = maxY
  tooltipPosition.value = { x, y }
  isDatasetTooltipVisible.value = true
  fetchDatasetsOnce()
}

function closeDatasetTooltip() {
    isDatasetTooltipVisible.value = false
}

async function handleSelectDataset(ds) {
    selectedFields.value = { y: [], x: [], color: [], sort: [], labels: [], filters: [] }
    selectedDataset.value = ds
    closeDatasetTooltip()
    if (ds?.id) {
        // 1. Получаем список колонок (объекты с name/type)
        const { data: columnsResp } = await chartService.getColumns(ds.id)
        // 2. Кладём в indicators (именно сюда смотрит твой UI)
        indicators.value = columnsResp.columns || []
        // 3. Загружаем агрегированные строки
        const { data } = await chartService.getDatasetRowsAgg(ds.id, selectedFields.value)
        datasetRows.value = data
    }
}

function onClickOutside(event) {
    const datasetModalEl = tooltipRef.value
    const fieldsModalEl = fieldsModalRef.value
    if (
        isDatasetTooltipVisible.value &&
        datasetModalEl &&
        !datasetModalEl.contains(event.target)
    ) {
        isDatasetTooltipVisible.value = false
    }
    if (
        isFieldsModalVisible.value &&
        fieldsModalEl &&
        !fieldsModalEl.contains(event.target)
    ) {
        isFieldsModalVisible.value = false
    }
}

function handleFieldSelect(field) {
    const key = currentSetting.value
    if (!Array.isArray(selectedFields.value[key])) {
        selectedFields.value[key] = []
    }
    if (!selectedFields.value[key].some(f => f.id === field.id)) {
        selectedFields.value[key].push(field)
    }
    isFieldsModalVisible.value = false
}

function removeField(field, type) {
    selectedFields.value[type] = selectedFields.value[type].filter(f => f.id !== field.id)
}

watch(
  () => selectedChartType.value,
  (newVal, oldVal) => {
    if (oldVal && newVal !== oldVal) selectedFields.value = {}
  }
)

watch(
  selectedFields,
  async v => {
    if (selectedDataset.value?.id) {
      const { data } = await chartService.getDatasetRowsAgg(
        selectedDataset.value.id, v
      )
      datasetRows.value = data
    }
  },
  { deep: true }
)

async function fetchDatasetsOnce() {
  if (datasets.value.length || datasetsLoading.value) return
  datasetsLoading.value = true
  try {
    const { data } = await apiClient.get(endpoints.bi.DatasetsList)
    datasets.value = Array.isArray(data) ? data : (data.results || [])
  } catch (err) {
    console.error('Ошибка загрузки датасетов:', err)
  } finally {
    datasetsLoading.value = false
  }
}

const isChartDirty = computed(() => {
    if (!isEditMode.value) return true

    if (chartName.value !== (originalChart.value.name ?? '')) return true
    if ((selectedDataset.value?.id || null) !== (originalChart.value.datasetId || null)) return true
    if (selectedChartType.value !== (originalChart.value.chart_type ?? '')) return true
    if (selectedEngine.value !== (originalChart.value.engine ?? '')) return true

    if (JSON.stringify(selectedFields.value) !== JSON.stringify(originalChart.value.params || {})) return true

    return false
})

onMounted(() => {
    document.addEventListener('mousedown', onClickOutside)
})

onMounted(fetchChartIfEditing)

onBeforeUnmount(() => {
    document.removeEventListener('mousedown', onClickOutside)
})
</script>

<style scoped lang="scss">
.page-body {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    gap: 30px;
    margin-bottom: 20px;
}

.body-grid {
    display: grid;
    grid-template-columns: 17.5rem repeat(3, 1fr);
    grid-template-rows: 6rem 6rem auto;
    grid-template-areas:
        "datasets   indicators measures parameters"
        "diagramtype indicators measures parameters"
        "fields     chart      chart    chart";
    gap: 30px;
}

.body-grid.fullscreen {
    grid-template-areas:
        "chart chart chart chart"
        "chart chart chart chart"
        "chart chart chart chart";

    .body-chart {
        grid-column: 1 / -1;
        grid-row: 1 / -1;
    }

    .datasets,
    .diagramtype,
    .fields,
    .indicators,
    .measures,
    .parameters {
        display: none;
    }
}

.body-grid .body-chart {
    grid-column: 2 / 5;
}

.body-grid.no-fields .body-chart {
    grid-column: 1 / -1;
}

.datasets {
    grid-area: datasets;
}

.diagramtype {
    grid-area: diagramtype;
}

.fields {
    grid-area: fields;
}

.indicators {
    grid-area: indicators;
}

.measures {
    grid-area: measures;
}

.parameters {
    grid-area: parameters;
}

.body-chart {
    grid-area: chart;
}

.body-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px 20px;
    flex-shrink: 0;
}

.header-label-icon {
    display: flex;
    justify-content: center;
    gap: 15px;
    align-items: center;
}

.header-label-buttons {
    display: flex;
    gap: 15px;
}

.sectors {
    padding: 15px;
    width: 100%;
}

.sectors-body {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.dataset-selected:hover {
    background-color: var(--color-hover-background);
}

.diagramtype,
.settings,
.indicators,
.measures {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.body-settings {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 20px;
    padding: 15px;
    min-height: 5rem;
    flex-shrink: 0;
    width: 17.5rem;
}

.setting {
    background-color: var(--color-secondary-background);
    width: 100%;
    border-radius: 8px;
    padding: 10px;
    display: flex;
    flex-direction: column;
}

.setting-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.setting-header-left {
    display: flex;
    align-items: center;
    gap: 5px;
}

.setting-header-right {
    display: flex;
    justify-content: flex-start;
}

.border-elements {
    border-radius: 8px;
}

.elements-color {
    background-color: var(--color-primary-background);
}

.body-chart {
    flex: 1 1 0%;
    min-height: 360px;
    width: 100%;
    padding: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.datasets {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
}

.tooltip-panel {
    position: fixed;
    display: flex;
    flex-direction: column;
    top: 300px;
    left: 385px;
    width: min(360px, 90vw);
    min-width: 220px;
    max-width: 98vw;
    min-height: 160px;
    max-height: min(436px, 80vh);
    background-color: var(--color-primary-background);
    border-radius: 12px;
    box-shadow: 0 0 16px 0 #000a;
    z-index: 100;
    padding: 1rem;
    overflow-y: auto;
    overflow-x: hidden;
    color: var(--color-primary-text);
    transition: box-shadow 0.18s, width 0.2s, max-height 0.2s;
}

.tooltip-panel-fields {
    position: fixed;
    display: flex;
    flex-direction: column;
    width: 216px;
    max-height: 300px;
    background-color: var(--color-primary-background);
    border-radius: 8px;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.6);
    z-index: 100;
    padding: 1rem;
    overflow: hidden;
    color: var(--color-primary-text);
}

.selected-field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--color-primary-background);
    border-radius: 6px;
    padding: 4px 10px 4px 6px;
    font-size: 14px;
    margin-top: 7px;
    color: var(--color-primary-text, #222);
    transition: background 0.2s;
}

.selected-field:hover {
    background: var(--color-hover-background);
}

.selected-field .remove-btn {
    margin-left: 8px;
    color: var(--color-secondary-text);
    cursor: pointer;
    background: none;
    border: none;
    padding: 2px;
    border-radius: 4px;
    transition: background 0.15s;
}

.selected-field .remove-btn:hover {
    color: var(--color-accent);
}

.field-icon {
    color: var(--color-accent);
}
</style>
