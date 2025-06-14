<template>
    <div class="page-body">
        <div class="body-header border-elements elements-color">
            <div class="header-label-icon">
                <ChartPie />
                <div style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
                    <h4 class="header-label" style="margin-bottom: 3px;">Новая диаграмма</h4>
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
                <button class="btn btn-sm btn-primary" disabled>Сохранить</button>
            </div>
        </div>
        <div class="body-sectors" v-if="!isFullScreen">
            <div style="display: flex; flex-direction: column; justify-content: space-between; gap: 30px; width: 100%;">
                <div class="datasets sectors border-elements elements-color" style="height: 50%;">
                    <h5 class="m-0 me-2">Датасет</h5>
                    <button ref="buttonRef" v-if="!selectedDataset" class="btn btn-sm fw-bold"
                        @click="openDatasetTooltip"
                        style="display: flex; gap: 5px; justify-content: center; align-items: center; width: 100%;">
                        <Plus size="16" />Выбрать датасет
                    </button>
                    <button ref="buttonRef" v-else class="btn btn-sm fw-bold" @click="openDatasetTooltip"
                        style="display: flex; gap: 5px; align-items: center; width: 100%; border: 1.5px solid #198754;">
                        <Database size="16" />{{ selectedDataset.name }}
                    </button>
                </div>
                <div class="diagramtype sectors border-elements elements-color" style="height: 50%;">
                    <h5 class="m-0 me-2">Тип диаграммы</h5>
                    <select class="form-select form-select-sm" id="smallSelect" :disabled="!selectedDataset"
                        v-model="selectedChartType">
                        <option v-if="!selectedChartType" disabled hidden value="">Выберите тип диаграммы</option>
                        <option value="1">Линейная диаграмма</option>
                        <option value="2">Столбчатая диаграмма</option>
                        <option value="3">Круговая диаграмма</option>
                        <option value="4">Кольцевая диаграмма</option>
                        <option value="5">Точечная диаграмма</option>
                        <option value="6">Радарная диаграмма</option>
                        <option value="7">Тепловая карта</option>
                    </select>
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
            <div class="settings sectors border-elements elements-color">
                <h5 class="m-0 me-2">Параметры</h5>
                <div class="sectors-body">
                    <DatasetSettings :dataset="selectedDataset" />
                </div>
            </div>
        </div>
        <div class="body-settings border-elements elements-color" style="min-height: 5rem;"
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
                        <span class="field-icon" :class="f.source"
                            :style="{ color: f.source === 'indicator' ? 'var(--color-accent)' : '#7496bb' }">
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
        <div class="body-chart border-elements elements-color" :class="{ fullscreen: isFullScreen }">
            <ChartArea :dataset="datasetRows" :chart-type="selectedChartType" :fields="selectedFields"/>
        </div>
    </div>
    <transition name="fade-slide" appear>
        <div v-if="isDatasetTooltipVisible" class="tooltip-panel"
            :style="{ left: tooltipPosition.x + 'px', top: tooltipPosition.y + 'px', position: 'fixed', zIndex: 1000 }"
            ref="tooltipRef">
            <DatasetTooltip v-if="isDatasetTooltipVisible" :selectedDataset="selectedDataset"
                @select="handleSelectDataset" ref="tooltipRef" />
        </div>
    </transition>
    <transition name="fade-slide" appear>
        <div v-if="isFieldsModalVisible" class="tooltip-panel-fields"
            :style="{ left: fieldsModalPosition.x + 'px', top: fieldsModalPosition.y + 'px', position: 'fixed', zIndex: 1000 }"
            ref="fieldsModalRef">
            <ChartFields :fields="indicators" :selected="selectedForModal" @select="handleFieldSelect"/>
        </div>
    </transition>
</template>

<script setup>
import { ChartPie, Maximize, MoveDown, MoveRight, PaintBucket, ArrowDownWideNarrow, Type, Plus, CircleAlert, Ellipsis, Filter, Database, Hash, Calendar, CheckCircle, X } from 'lucide-vue-next'
import { ref, nextTick, onMounted, onBeforeUnmount, watch, computed } from 'vue'

import DatasetTooltip from '@/pages/bi/components/ChartComponents/DatasetsTooltip.vue'
import DatasetIndicators from '@/pages/bi/components/ChartComponents/DatasetIndicators.vue'
import DatasetMeasures from '@/pages/bi/components/ChartComponents/DatasetMeasures.vue'
import DatasetSettings from '@/pages/bi/components/ChartComponents/DatasetSettings.vue'
import ChartFields from '@/pages/bi/components/ChartComponents/ChartFields.vue'
import ChartArea from '@/pages/bi/components/ChartComponents/ChartArea.vue'

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

const selectedFields = ref({
    y: [],
    x: [],
    color: [],
    sort: [],
    labels: [],
    filters: []
})

watch(selectedChartType, () => {
    selectedFields.value = {
        y: [],
        x: [],
        color: [],
        sort: [],
        labels: [],
        filters: []
    }
})

const settingTypes = [
    { key: 'y', label: 'Y', icon: MoveDown },
    { key: 'x', label: 'X', icon: MoveRight },
    { key: 'color', label: 'Цвета', icon: PaintBucket },
    { key: 'sort', label: 'Сортировка', icon: ArrowDownWideNarrow },
    { key: 'labels', label: 'Подписи', icon: Type },
    { key: 'filters', label: 'Фильтры', icon: Filter }
]

const typeIcon = {
    string: Type,
    number: Hash,
    date: Calendar,
    boolean: CheckCircle
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
}

function openDatasetTooltip(event) {
    const rect = buttonRef.value.getBoundingClientRect()
    tooltipPosition.value = {
        x: rect.left,
        y: rect.bottom + 6
    }
    isDatasetTooltipVisible.value = true
    nextTick(() => { })
}

function closeDatasetTooltip() {
    isDatasetTooltipVisible.value = false
}

async function handleSelectDataset(ds) {
  selectedDataset.value = ds
  closeDatasetTooltip()
  if (ds?.id) {
    const { data } = await chartService.getRows(ds.id)
    datasetRows.value = data 
  }
}

function onClickOutside(event) {
    const datasetModalEl = tooltipRef.value
    const fieldsModalEl = fieldsModalRef.value
    if (
        isDatasetTooltipVisible.value &&
        datasetModalEl && !datasetModalEl.contains(event.target)
    ) {
        isDatasetTooltipVisible.value = false
    }
    if (
        isFieldsModalVisible.value &&
        fieldsModalEl && !fieldsModalEl.contains(event.target)
    ) {
        isFieldsModalVisible.value = false
    }
}

function handleFieldSelect(field) {
    const key = currentSetting.value
    if (!selectedFields.value[key].some(f => f.id === field.id))
        selectedFields.value[key].push(field)
    isFieldsModalVisible.value = false
}

function removeField(field, type) {
    selectedFields.value[type] = selectedFields.value[type].filter(f => f.id !== field.id)
}

watch(() => selectedDataset.value?.id, async id => {
    if (id) {
        const { data } = await chartService.getColumns(id)
        indicators.value = (data.columns || []).map((c, i) => ({
            id: 'col_' + i,
            name: c.name || c,
            type: c.type || 'string',
            source: 'indicator'
        }))
    } else {
        indicators.value = []
    }
})

onMounted(() => {
    document.addEventListener('mousedown', onClickOutside)
})
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

.body-sectors {
    display: flex;
    gap: 35px;
    height: 15rem;
    justify-content: space-between;
    flex-shrink: 0;
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
    justify-content: space-between;
    gap: 20px;
    padding: 15px;
    min-height: 5rem;
    flex-shrink: 0;
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
    min-height: 120px;
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
    width: 416px;
    height: 436px;
    background-color: var(--color-primary-background);
    border-radius: 8px;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.6);
    z-index: 100;
    padding: 1rem;
    overflow: hidden;
    color: var(--color-primary-text);
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

.field-icon.indicator {
    color: var(--color-accent);
}
</style>
