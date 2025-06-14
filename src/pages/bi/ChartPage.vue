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
                    <select class="form-select form-select-sm" id="smallSelect" :disabled="!selectedDataset">
                        <option selected>Откройте это меню выбора</option>
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
                    <DatasetIndicators :dataset="selectedDataset" />
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
        <div class="body-settings border-elements elements-color" style="height: 5rem;" v-if="!isFullScreen">
            <div class="setting">
                <div class="setting-header">
                    <div class="setting-header-left">
                        <MoveDown size="18" />
                        <h6 class="m-0 me-1">Y</h6>
                    </div>
                    <div class="setting-header-right">
                        <button class="btn btn-sm fw-bold" style="padding: 0; margin: 0; display: flex;">
                            <Plus size="16" />
                        </button>
                    </div>
                </div>
            </div>
            <div class="setting">
                <div class="setting-header">
                    <div class="setting-header-left">
                        <MoveRight size="18" />
                        <h6 class="m-0 me-1">X</h6>
                    </div>
                    <div class="setting-header-right">
                        <button class="btn btn-sm fw-bold" style="padding: 0; margin: 0; display: flex;">
                            <Plus size="16" />
                        </button>
                    </div>
                </div>
            </div>
            <div class="setting">
                <div class="setting-header">
                    <div class="setting-header-left">
                        <PaintBucket size="18" />
                        <h6 class="m-0 me-1">Цвета</h6>
                    </div>
                    <div class="setting-header-right">
                        <button class="btn btn-sm fw-bold" style="padding: 0; margin: 0; display: flex;">
                            <Plus size="16" />
                        </button>
                    </div>
                </div>
            </div>
            <div class="setting">
                <div class="setting-header">
                    <div class="setting-header-left">
                        <ArrowDownWideNarrow size="18" />
                        <h6 class="m-0 me-1" style="padding-top: 0.6px; padding-bottom: 0.6px;">Сортировка</h6>
                    </div>
                    <div class="setting-header-right">
                        <button class="btn btn-sm fw-bold" style="padding: 0; margin: 0; display: flex;">
                            <Plus size="16" />
                        </button>
                    </div>
                </div>
            </div>
            <div class="setting">
                <div class="setting-header">
                    <div class="setting-header-left">
                        <Type size="18" />
                        <h6 class="m-0 me-1">Подписи</h6>
                    </div>
                    <div class="setting-header-right">
                        <button class="btn btn-sm fw-bold" style="padding: 0; margin: 0; display: flex;">
                            <Plus size="16" />
                        </button>
                    </div>
                </div>
            </div>
            <div class="setting">
                <div class="setting-header">
                    <div class="setting-header-left">
                        <Filter size="18" />
                        <h6 class="m-0 me-1">Фильтры</h6>
                    </div>
                    <div class="setting-header-right">
                        <button class="btn btn-sm fw-bold" style="padding: 0; margin: 0; display: flex;">
                            <Plus size="16" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div class="body-chart border-elements elements-color" :class="{ fullscreen: isFullScreen }">
            <div class="alert alert-info" role="alert"
                style="height: 100%; text-align: center; display: flex; justify-content: center; align-items: center; flex-direction: column; gap: 10px;">
                <CircleAlert :size="40" class="me-1" />Прежде чем увидеть содержимое, добавьте датасет
            </div>
        </div>
    </div>
    <transition name="fade-slide" appear>
        <div v-if="isDatasetTooltipVisible" class="tooltip-panel"
            :style="{ left: tooltipPosition.x + 'px', top: tooltipPosition.y + 'px', position: 'fixed', zIndex: 1000 }"
            ref="tooltipRef">
            <DatasetTooltip v-if="isDatasetTooltipVisible" :selectedDataset="selectedDataset" @select="handleSelectDataset" ref="tooltipRef"/>
        </div>
    </transition>
</template>

<script setup>
import { ChartPie, Maximize, MoveDown, MoveRight, PaintBucket, ArrowDownWideNarrow, Type, Plus, CircleAlert, Ellipsis, Filter, Database } from 'lucide-vue-next';
import { ref, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'

import DatasetTooltip from '@/pages/bi/components/ChartComponents/DatasetsTooltip.vue'
import DatasetIndicators from '@/pages/bi/components/ChartComponents/DatasetIndicators.vue'
import DatasetMeasures from '@/pages/bi/components/ChartComponents/DatasetMeasures.vue'
import DatasetSettings from '@/pages/bi/components/ChartComponents/DatasetSettings.vue'

const isFullScreen = ref(false)
const headerRef = ref(null)
const headerHeight = ref(0)

const isDatasetTooltipVisible = ref(false)
const tooltipPosition = ref({ x: 0, y: 0 })
const tooltipRef = ref(null)
const buttonRef = ref(null)
const selectedDataset = ref(null)

function toggleFullScreen() {
    if (!isFullScreen.value) {
        nextTick(() => {
            headerHeight.value = headerRef.value ? headerRef.value.offsetHeight : 0
            isFullScreen.value = true
        })
    } else {
        isFullScreen.value = false
    }
}

function openDatasetTooltip(event) {
    // event — MouseEvent от кнопки
    const rect = buttonRef.value.getBoundingClientRect()
    // Немного ниже и чуть правее кнопки
    tooltipPosition.value = {
        x: rect.left,
        y: rect.bottom + 6
    }
    isDatasetTooltipVisible.value = true
    nextTick(() => {
        // auto-focus или что-то ещё
    })
}

function closeDatasetTooltip() {
    isDatasetTooltipVisible.value = false
}

function handleSelectDataset(ds) {
  selectedDataset.value = ds
  closeDatasetTooltip()
}

function onClickOutside(event) {
    const tooltipEl = tooltipRef.value
    const buttonEl = buttonRef.value
    if (
        tooltipEl && !tooltipEl.contains(event.target) &&
        buttonEl && !buttonEl.contains(event.target)
    ) {
        closeDatasetTooltip()
    }
}

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
    height: 5rem;
    flex-shrink: 0;
}

.setting {
    background-color: var(--color-secondary-background);
    width: 100%;
    border-radius: 8px;
    padding: 10px;
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
    min-height: 32rem;
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
</style>
