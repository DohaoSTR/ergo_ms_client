<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  CircleAlert,
  ArrowLeft,
  FileSpreadsheet,
  Download,
  BarChart2,
  Settings,
  Upload,
  AlertCircle,
  AlertTriangle,
  PieChart,
  Info,
  Trash2,
} from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import {
  getCustomAnalysis,
  getSpecies,
  getCustomSiteMeans,
  getCustomSiteDistribution,
  getCustomSiteClassification
} from '@/js/api/services/bio-index'
import { handleApiError } from '@/pages/bio/js/bio-helpers'
import { getZoneTypeTranslation, getElementTitle } from '@/pages/bio/js/bio-helpers'
import { siteFieldLabels, SPECTRUM_TYPES, SCALES_TYPES, tierOptions, abundanceOptions } from '@/pages/bio/js/bio-constants'
import { generateTemplate } from '@/pages/bio/js/template-generator'
import ExcelJS from 'exceljs'

import SiteConsolidatedTable from '@/pages/bio/components/SiteConsolidatedTable.vue'
import SiteFormModal from '@/pages/bio/components/modals/SiteFormModal.vue'
import SpeciesFormModal from '@/pages/bio/components/modals/SpeciesFormModal.vue'
import ExportSettingsModal from '@/pages/bio/components/modals/ExportSettingsModal.vue'
import ImportXLSXModal from '@/pages/bio/components/modals/ImportXLSXModal.vue'
import AnalysisSettingsModal from '@/pages/bio/components/modals/AnalysisSettingsModal.vue'
import DeleteConfirmModal from '@/pages/bio/components/modals/DeleteConfirmModal.vue'
import StackedGroupChart from '@/pages/bio/components/charts/StackedGroupChart.vue'
import ScalesChart from '@/pages/bio/components/charts/ScalesChart.vue'
import SpectrumChart from '@/pages/bio/components/charts/SpectrumChart.vue'
import ClassificationCard from '@/pages/bio/components/charts/ClassificationCard.vue'

import { useConsolidatedAnalysisStore } from '@/stores/consolidatedAnalysisStore'

const toast = useToast()
const consolidatedStore = useConsolidatedAnalysisStore()
const route = useRoute()
const router = useRouter()

const isLoading = ref(true)
const error = ref(null)

const sites = computed(() => consolidatedStore.sites)
const tableData = computed(() => consolidatedStore.tableData)
const nonEmptySites = computed(() => consolidatedStore.nonEmptySites)
const hasAnalysisData = computed(() => consolidatedStore.hasAnalysisData)

// Получаем данные анализа из store
const analysisResults = computed(() => consolidatedStore.analysisResults)
const scalesChartsData = computed(() => consolidatedStore.scalesChartsData)
const spectrumChartsData = computed(() => consolidatedStore.spectrumChartsData)
const classificationChartsData = computed(() => consolidatedStore.classificationChartsData)

// Получаем настройки анализа из store
const selectedElements = computed({
  get: () => consolidatedStore.analysisSettings.selectedElements,
  set: (value) => {
    consolidatedStore.updateAnalysisSettings({ selectedElements: value })
  }
})
const showAllSitesChart = computed({
  get: () => consolidatedStore.analysisSettings.showAllSitesChart,
  set: (value) => {
    consolidatedStore.updateAnalysisSettings({ showAllSitesChart: value })
  }
})
const showIndividualSiteCharts = computed({
  get: () => consolidatedStore.analysisSettings.showIndividualSiteCharts, 
  set: (value) => {
    consolidatedStore.updateAnalysisSettings({ showIndividualSiteCharts: value })
  }
})
const showClassification = computed({
  get: () => consolidatedStore.analysisSettings.showClassification,
  set: (value) => {
    consolidatedStore.updateAnalysisSettings({ showClassification: value })
  }
})

const addSiteModalId = 'addSiteModal'
const addSpeciesModalId = 'addSpeciesModal'
const exportSettingsModalId = 'exportSettingsModal'
const importXlsxModalId = 'importXlsxModal'
const analysisSettingsModalId = 'analysisSettingsModal'
const resetConfirmModalId = 'resetConfirmModal'

const insertAfterIndex = ref(null)
const insertRowAfterIndex = ref(null)

const showExportMenu = ref(false)
const selectedSiteFields = ref(Object.keys(siteFieldLabels))
const exportFormat = ref('xlsx') // 'xlsx' or 'csv'

const showResetMenu = ref(false)

const validationSummary = ref({
  totalErrors: 0,
  speciesNotFound: 0,
  similarSpecies: 0,
  multipleSpeciesFound: 0,
  validationErrors: 0,
  invalidTiers: 0,
  invalidAbundances: 0
})
const showValidationSummary = ref(false)
const validationTimeout = ref(null)

const showInfoBlock = ref(false) // изначально показываем информационный блок
const showAnalysisView = ref(false) // Переключение между таблицей и анализом
const activeTab = ref('consolidated') // Активная вкладка: 'consolidated' или 'site_1', 'site_2', etc.

// Состояние для анализа
const isAnalyzing = ref(false)

const loadData = async () => {
  isLoading.value = false
  resetValidationFlags()

  // Проверяем URL параметр для определения текущего режима отображения
  const viewMode = route.query.view
  if (viewMode === 'analysis') {
    showAnalysisView.value = true
    
    // Проверяем query параметр 'tab' и устанавливаем активную вкладку
    const tabFromUrl = route.query.tab
    if (tabFromUrl) {
      if (tabFromUrl.startsWith('site_') && nonEmptySites.value.some(site => `site_${site.id}` === tabFromUrl)) {
        activeTab.value = tabFromUrl
      } else if (tabFromUrl === 'consolidated') {
        activeTab.value = 'consolidated'
      } else {
        // Если неверный параметр tab, устанавливаем значение по умолчанию и обновляем URL
        activeTab.value = 'consolidated'
        router.replace({
          query: { ...route.query, tab: activeTab.value }
        })
      }
    } else {
      // Если параметр tab отсутствует, добавляем его в URL
      router.replace({
        query: { ...route.query, view: 'analysis', tab: activeTab.value }
      })
    }
    
    // Если есть результаты анализа в store или есть настройки, выполняем анализ
    if (!analysisResults.value && selectedElements.value.length > 0) {
      runAnalysis({
        selectedElements: selectedElements.value,
        showAllSitesChart: showAllSitesChart.value,
        showIndividualSiteCharts: showIndividualSiteCharts.value
      })
    }
  } else {
    // По умолчанию показываем таблицу и обновляем URL если нужно
    showAnalysisView.value = false
    if (viewMode !== 'table') {
      router.replace({
        query: { ...route.query, view: 'table' }
      })
    }
  }
}

const handleAddSite = async (siteData, callback) => {
  try {
    const result = await consolidatedStore.addSite(
      siteData, 
      insertAfterIndex.value
    )
    
    if (!result.success) {
      toast.error(result.errorMessage)
      callback && callback(result.errorMessage)
      return
    }
    
    insertAfterIndex.value = null
    closeModal(addSiteModalId)
    
    toast.success(`Площадка №${siteData.site_number} успешно добавлена`)
    callback && callback(null)
  } catch (err) {
    const errorMessage = `Ошибка при добавлении площадки: ${err.message}`
    toast.error(errorMessage)
    callback && callback(errorMessage)
  }
}

const handleAddColumn = (index) => {
  insertAfterIndex.value = index
  showAddSiteModal()
}

const handleAddSpecies = (speciesData, callback) => {
  try {
    const result = consolidatedStore.addSpecies(
      speciesData, 
      insertRowAfterIndex.value
    )
    
    if (!result.success) {
      callback && callback(result.errorMessage)
      closeModal(addSpeciesModalId)
      return
    }
    
    insertRowAfterIndex.value = null
    closeModal(addSpeciesModalId)
    
    toast.success(`Добавлено видов: ${result.addedCount}`)
    callback && callback(null)
  } catch (err) {
    const errorMessage = `Ошибка при добавлении видов: ${err.message}`
    toast.error(errorMessage)
    callback && callback(errorMessage)
  }
}

const handleAddRow = (index) => {
  insertRowAfterIndex.value = index
  showAddSpeciesModal()
}

const handleTableDataChange = (newData) => {
  resetValidationFlags();
}

// Обработчик изменения отдельной ячейки
const handleCellChange = (rowIndex, field, value) => {
  if (rowIndex < 0 || rowIndex >= tableData.value.length || showValidationSummary.value === false) return;
  
  const row = tableData.value[rowIndex];
  
  // Если это ярус, сбрасываем флаг ошибки яруса
  if (field === 'tier') {
    row.tierInvalid = false;
    row.tierMessage = '';
    
    // Если была ошибка яруса, уменьшаем счетчик
    if (validationSummary.value.invalidTiers > 0) {
      validationSummary.value.invalidTiers--;
      validationSummary.value.totalErrors--;
    }
  }
  
  // Если это обилие, сбрасываем флаг ошибки обилия для этого поля
  if (field.startsWith('abundance_')) {
    if (row.abundanceMessages && row.abundanceMessages[field]) {
      // Удаляем сообщение об ошибке для этого поля
      delete row.abundanceMessages[field];
      
      // Уменьшаем счетчик невалидных обилий для строки
      if (row.invalidAbundances > 0) {
        row.invalidAbundances--;
      }
      
      // Если была ошибка обилия, уменьшаем счетчик
      if (validationSummary.value.invalidAbundances > 0) {
        validationSummary.value.invalidAbundances--;
        validationSummary.value.totalErrors--;
      }
    }
  }
  
  // Проверяем, остались ли ошибки в таблице
  if (validationSummary.value.totalErrors === 0 && showValidationSummary.value) {
    showValidationSummary.value = false;
    toast.success('Все ошибки валидации исправлены');
  }
}

// Функция для очистки флагов валидации для видов
const resetValidationFlags = () => {
  if (!tableData.value || !Array.isArray(tableData.value)) return;
  
  tableData.value.forEach(item => {
    if (item.type === 'taxon') return;
    
    // Сбрасываем флаги валидации для вида, если он был с ошибками, но сейчас данных для ошибки нет
    
    // Проверяем ярус
    if (item.tierInvalid === true && (!item.tier || (tierOptions && tierOptions.some(option => option.value === item.tier)))) {
      item.tierInvalid = false;
      item.tierMessage = '';
    }
    
    // Проверяем обилие
    if (item.invalidAbundances && item.invalidAbundances > 0) {
      let invalidCount = 0;
      
      if (item.abundanceMessages) {
        // Проверяем, остались ли невалидные значения обилия
        for (const site of sites.value) {
          const abundanceKey = `abundance_${site.id}`;
          const abundanceValue = item[abundanceKey];
          
          if (abundanceValue && item.abundanceMessages[abundanceKey] && 
              (!abundanceOptions || !abundanceOptions.some(option => option.value === abundanceValue))) {
            // Увеличиваем счетчик невалидных значений
            invalidCount++;
          } else if (item.abundanceMessages[abundanceKey]) {
            // Удаляем сообщение, если значение стало валидным
            delete item.abundanceMessages[abundanceKey];
          }
        }
        
        // Устанавливаем точное количество оставшихся невалидных значений
        item.invalidAbundances = invalidCount;
      }
    }
  });
  
  // Обновляем сводку ошибок после очистки
  updateValidationSummary();
}

// Функция для обновления сводки ошибок на основе текущих данных таблицы
const updateValidationSummary = () => {
  if (!tableData.value || tableData.value.length === 0) {
    validationSummary.value = {
      totalErrors: 0,
      speciesNotFound: 0,
      similarSpecies: 0,
      multipleSpeciesFound: 0,
      validationErrors: 0,
      invalidTiers: 0,
      invalidAbundances: 0
    };
    showValidationSummary.value = false;
    return;
  }
  
  // Считаем количество ошибок разных типов
  let speciesNotFound = 0;
  let similarSpecies = 0;
  let multipleSpeciesFound = 0;
  let validationErrors = 0;
  let invalidTiers = 0;
  let invalidAbundances = 0;
  
  // Проверяем ошибки валидации в таблице
  tableData.value.forEach(item => {
    if (!item.type) {
      // Проверка видов
      if (item.isValid === false) {
        // Классифицируем ошибки на основе validationMessage
        const message = item.validationMessage || '';
        
        if (message.includes('отсутствует в базе данных')) {
          speciesNotFound++;
        } else if (message.includes('Найден похожий вид')) {
          similarSpecies++;
        } else if (message.includes('похожих видов')) {
          multipleSpeciesFound++;
        } else if (message.includes('Ошибка при проверке')) {
          validationErrors++;
        }
      }
      
      // Проверка ярусов
      if (item.tierInvalid) {
        invalidTiers++;
      }
      
      // Проверка баллов обилия
      if (item.invalidAbundances && item.invalidAbundances > 0) {
        invalidAbundances++;
      }
    }
  });
  
  // Обновляем счетчики в сводке
  const totalErrors = speciesNotFound + similarSpecies + multipleSpeciesFound + validationErrors + 
                     invalidTiers + invalidAbundances;
  
  // Обновляем сводку валидации с новыми значениями
  validationSummary.value = {
    totalErrors,
    speciesNotFound,
    similarSpecies,
    multipleSpeciesFound,
    validationErrors,
    invalidTiers,
    invalidAbundances
  };
  
  // Обновляем видимость сводки
  if (totalErrors === 0 && showValidationSummary.value) {
    showValidationSummary.value = false;
    toast.success('Все ошибки валидации исправлены');
  } else {
    showValidationSummary.value = totalErrors > 0;
  }
}

// Handle export from modal
const handleExport = (exportOptions) => {
  if (exportOptions.format === 'xlsx') {
    exportToExcel(exportOptions)
  } else {
    exportToCSV(exportOptions)
  }
  closeModal(exportSettingsModalId)
}

// Prepare data for export with selected fields
const prepareExportData = (exportOptions) => {
  const { includeHeader, selectedFields, emptyAbundanceValue, calculateConstancy } = exportOptions

  // Создаем заголовок таблицы
  const header = ['Название вида', 'Ярус']

  // Добавляем номера площадок в заголовок
  sites.value.forEach((site) => {
    header.push(site.site_number.toString())
  })

  // Добавляем столбец класса постоянства
  if (calculateConstancy) {
    header.push('Класс постоянства')
  }

  // Массив для всех данных
  const allData = [header]

  // Добавляем шапку с информацией о площадках, если она включена
  if (includeHeader && selectedFields.length > 0) {
    // Создаем строки с данными площадок
    const siteData = []

    // Добавляем только выбранные поля площадок
    selectedFields.forEach((field) => {
      if (field in siteFieldLabels) {
        const label = siteFieldLabels[field]
        const row = [label, '']

        sites.value.forEach((site) => {
          // Специальная обработка для zone_type - используем перевод
          if (field === 'zone_type' && site[field]) {
            row.push(getZoneTypeTranslation(site[field]))
          } else {
            row.push(
              site[field] !== undefined && site[field] !== null ? site[field].toString() : '',
            )
          }
        })

        // Добавляем пустую ячейку для столбца класса постоянства
        if (calculateConstancy) {
          row.push('')
        }

        siteData.push(row)
      }
    })

    // Добавляем данные площадок в общий массив
    allData.push(...siteData)
  }

  // Рассчитываем класс постоянства если нужно
  const calculateConstancyClass = (item) => {
    if (!calculateConstancy || item.type === 'taxon') return null

    let presentCount = 0
    const totalSites = sites.value.length

    // Считаем количество площадок, где вид присутствует
    sites.value.forEach((site) => {
      const abundanceKey = `abundance_${site.id}`
      if (item[abundanceKey]) {
        presentCount++
      }
    })
    if (totalSites === 0) return null

    // Рассчитываем процент встречаемости
    const percentage = (presentCount / totalSites) * 100

    // Переводим процент в класс постоянства (римские цифры)
    if (percentage <= 20) return 'I'
    if (percentage <= 40) return 'II'
    if (percentage <= 60) return 'III'
    if (percentage <= 80) return 'IV'
    return 'V'
  }

  // Формируем строки с видами растений и таксонами
  const speciesData = tableData.value.map((item) => {
    // Если это таксон
    if (item.type === 'taxon') {
      // Для таксона создаем строку с названием и пустыми ячейками для ярусов и площадок
      const row = [item.taxon_name || 'Без названия', '']

      // Добавляем пустые ячейки для каждой площадки
      sites.value.forEach(() => {
        row.push('')
      })

      // Добавляем пустую ячейку для класса постоянства
      if (calculateConstancy) {
        row.push('')
      }

      return {
        data: row,
        isTaxon: true,
        taxonName: item.taxon_name || 'Без названия',
      }
    } else {
      // Для обычных видов объединяем title и author в одной ячейке
      const titleAuthor = item.title + (item.author ? ' ' + item.author : '')
      const row = [titleAuthor, item.tier || '']

      sites.value.forEach((site) => {
        const abundanceKey = `abundance_${site.id}`
        // Заполняем пустые ячейки в соответствии с настройкой
        row.push(item[abundanceKey] || emptyAbundanceValue)
      })

      // Добавляем класс постоянства
      if (calculateConstancy) {
        row.push(calculateConstancyClass(item) || '')
      }

      return {
        data: row,
        isTaxon: false,
      }
    }
  })

  // Добавляем данные видов в общий массив
  speciesData.forEach((item) => {
    allData.push(item.data)
  })

  return {
    allData,
    speciesData, // Возвращаем отдельно данные о видах для форматирования
  }
}

// Export to Excel
const exportToExcel = async (exportOptions) => {
  try {
    const { allData, speciesData } = prepareExportData(exportOptions)

    // Создаем новую книгу Excel
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Сводная таблица')

    // Добавляем данные на лист
    worksheet.addRows(allData)

    // Устанавливаем ширину столбцов
    worksheet.getColumn(1).width = 50 // Название вида или таксон
    worksheet.getColumn(2).width = 10 // Ярус

    // Устанавливаем ширину для всех площадок
    for (let i = 3; i < 3 + sites.value.length; i++) {
      worksheet.getColumn(i).width = 15
    }

    // Если добавлен столбец класса постоянства
    if (exportOptions.calculateConstancy) {
      worksheet.getColumn(3 + sites.value.length).width = 20 // Увеличенная ширина для класса постоянства
    }

    // Настраиваем базовый шрифт
    const defaultFont = { name: 'Times New Roman', size: 12 }

    // Преобразуем числовые значения в числовой формат
    worksheet.eachRow((row, rowIndex) => {
      // Номера площадок (первая строка)
      if (rowIndex === 1) {
        for (let col = 3; col < 3 + sites.value.length; col++) {
          const cell = row.getCell(col)
          const value = cell.value
          if (typeof value === 'string' && !isNaN(Number(value))) {
            cell.value = Number(value)
          }
        }
      }

      // Значения обилия (в строках с данными видов)
      if (rowIndex >= (exportOptions.includeHeader ? exportOptions.selectedFields.length + 2 : 2)) {
        for (let col = 3; col < 3 + sites.value.length; col++) {
          const cell = row.getCell(col)
          const value = cell.value
          if (typeof value === 'string' && value !== '' && !isNaN(Number(value))) {
            cell.value = Number(value)
          }
        }
      }

      // Применяем Times New Roman для всех ячеек
      row.eachCell((cell) => {
        cell.font = { ...defaultFont }
      })
    })

    // Определяем границы таблицы
    const lastRow = worksheet.rowCount
    const lastCol = exportOptions.calculateConstancy
      ? 3 + sites.value.length
      : 2 + sites.value.length

    // Определяем границы для областей
    const thickBorder = { style: 'medium' }
    const noBorder = { style: 'none' }

    // Стилизуем заголовок (первая строка)
    const headerRow = worksheet.getRow(1)
    headerRow.font = { ...defaultFont, bold: true }
    headerRow.eachCell((cell, colIndex) => {
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }

      // Верхняя и нижняя границы для всего заголовка
      cell.border = {
        top: thickBorder,
        bottom: thickBorder,
        left: noBorder,
        right: noBorder,
      }

      // Левая граница для первой ячейки заголовка
      if (colIndex === 1) {
        cell.border.left = thickBorder
      }

      // Правая граница для последней ячейки заголовка
      if (colIndex === lastCol) {
        cell.border.right = thickBorder
      }

      // Левая и правая границы для столбца ярусов
      if (colIndex === 2) {
        cell.border.left = thickBorder
        cell.border.right = thickBorder
      }

      // Левая и правая границы для столбца класса постоянства
      if (exportOptions.calculateConstancy && colIndex === lastCol) {
        cell.border.left = thickBorder
        cell.border.right = thickBorder
      }
    })

    // Область шапки с информацией о площадках
    if (exportOptions.includeHeader && exportOptions.selectedFields.length > 0) {
      const headerEndRow = exportOptions.selectedFields.length + 1

      // Стилизуем строки шапки
      for (let i = 2; i <= headerEndRow; i++) {
        const row = worksheet.getRow(i)
        row.font = { ...defaultFont, bold: true }

        row.eachCell((cell, colIndex) => {
          // Настраиваем перенос строк только для первого столбца (названия полей)
          if (colIndex === 1) {
            cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true }
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: false }
          }

          // Устанавливаем границы для ячеек шапки
          cell.border = {
            top: noBorder,
            bottom: noBorder,
            left: noBorder,
            right: noBorder,
          }

          // Левая граница для первой колонки
          if (colIndex === 1) {
            cell.border.left = thickBorder
          }

          // Правая граница для последней колонки
          if (colIndex === lastCol) {
            cell.border.right = thickBorder
          }

          // Левая и правая границы для столбца ярусов
          if (colIndex === 2) {
            cell.border.left = thickBorder
            cell.border.right = thickBorder
          }

          // Левая и правая границы для столбца класса постоянства
          if (exportOptions.calculateConstancy && colIndex === lastCol) {
            cell.border.left = thickBorder
            cell.border.right = thickBorder
          }
        })
      }

      // Нижняя граница для последней строки шапки
      const lastHeaderRow = worksheet.getRow(headerEndRow)
      lastHeaderRow.eachCell((cell) => {
        cell.border = {
          ...cell.border,
          bottom: thickBorder,
        }
      })
    }

    // Настройка области данных видов и таксонов
    const dataStartRow = exportOptions.includeHeader ? exportOptions.selectedFields.length + 2 : 2
    let currentRow = dataStartRow
    let previousWasTaxon = false

    speciesData.forEach((item, index) => {
      const rowIndex = dataStartRow + index
      const row = worksheet.getRow(rowIndex)

      // Применяем шрифт Times New Roman для всех ячеек
      row.eachCell((cell) => {
        cell.font = { ...defaultFont }

        // По умолчанию убираем все границы
        cell.border = {
          top: noBorder,
          bottom: noBorder,
          left: noBorder,
          right: noBorder,
        }
      })

      // Добавляем базовые границы
      // Левая граница для первой колонки
      row.getCell(1).border.left = thickBorder

      // Правая граница для последней колонки
      row.getCell(lastCol).border.right = thickBorder

      // Левая и правая границы для столбца ярусов
      row.getCell(2).border.left = thickBorder
      row.getCell(2).border.right = thickBorder

      // Левая и правая границы для столбца класса постоянства
      if (exportOptions.calculateConstancy) {
        row.getCell(lastCol).border.left = thickBorder
        row.getCell(lastCol).border.right = thickBorder
      }

      // Специальное форматирование для таксонов
      if (item.isTaxon) {
        previousWasTaxon = true

        // Объединяем ячейки для таксона на всю ширину
        worksheet.mergeCells(rowIndex, 1, rowIndex, lastCol)

        // Применяем стиль для таксона
        const taxonCell = row.getCell(1)
        taxonCell.font = { ...defaultFont, bold: true }
        taxonCell.alignment = { horizontal: 'center', vertical: 'middle' }
        taxonCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }, // Светло-серый фон
        }

        // Устанавливаем границы вокруг таксона
        taxonCell.border = {
          top: thickBorder,
          bottom: thickBorder,
          left: thickBorder,
          right: thickBorder,
        }
      } else {
        // Для обычных видов центрируем ячейки обилия и яруса
        for (let col = 2; col <= lastCol; col++) {
          const cell = row.getCell(col)
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        }

        // Левое выравнивание для названия вида
        row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }

        // Если предыдущая строка была таксоном, добавляем верхнюю границу
        if (previousWasTaxon) {
          row.eachCell((cell) => {
            cell.border.top = thickBorder
          })
          previousWasTaxon = false
        }
      }

      currentRow++
    })

    // Добавляем нижнюю границу для последней строки
    const finalRow = worksheet.getRow(lastRow)
    finalRow.eachCell((cell) => {
      cell.border = {
        ...cell.border,
        bottom: thickBorder,
      }
    })

    // Генерируем имя файла с датой и временем
    const date = new Date()
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    const timeStr = `${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}`
    const fileName = `Сводная_таблица_${dateStr}_${timeStr}.xlsx`

    // Создаем buffer для скачивания
    const buffer = await workbook.xlsx.writeBuffer()

    // Создаем blob и скачиваем файл
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    console.error('Ошибка при экспорте XLSX файла:', err)
    toast.error(`Ошибка при экспорте файла: ${err.message}`)
  }
}

// Export to CSV
const exportToCSV = (exportOptions) => {
  try {
    const { allData } = prepareExportData(exportOptions)

    // Преобразуем данные в CSV
    const csvContent = allData
      .map((row) => {
        return row
          .map((cell) => {
            // Обрабатываем ячейки с запятыми и кавычками
            if (cell === null || cell === undefined) return ''
            const cellStr = cell.toString()
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
              return `"${cellStr.replace(/"/g, '""')}"`
            }
            return cellStr
          })
          .join(',')
      })
      .join('\n')

    // Добавляем BOM (Byte Order Mark) для корректного отображения кириллицы
    const BOM = '\uFEFF'
    const csvContentWithBOM = BOM + csvContent

    // Создаем Blob с данными CSV
    const blob = new Blob([csvContentWithBOM], { type: 'text/csv;charset=utf-8;' })

    // Генерируем имя файла с датой и временем
    const date = new Date()
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    const timeStr = `${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}`
    const fileName = `Сводная_таблица_${dateStr}_${timeStr}.csv`

    // Создаем ссылку для скачивания
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'

    // Добавляем ссылку в DOM, имитируем клик и удаляем
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    console.error('Ошибка при экспорте CSV файла:', err)
    toast.error(`Ошибка при экспорте файла: ${err.message}`)
  }
}

// Обработка запроса на генерацию шаблона
const handleGenerateTemplate = async (options) => {
  try {
    const success = await generateTemplate({
      withHeaders: options.withHeaders,
    })
    
    if (!success) {
      toast.error('Не удалось сгенерировать шаблон')
    }
  } catch (err) {
    console.error('Ошибка при генерации шаблона:', err)
    toast.error(`Ошибка при генерации шаблона: ${err.message}`)
  }
}

// Обработка импорта XLSX файла
const handleImport = async (importData) => {
  try {
    const { file, setImportingComplete } = importData
    
    // Проверка файла
    if (!file) {
      if (setImportingComplete) setImportingComplete()
      throw new Error('Файл не выбран')
    }
    
    isLoading.value = true
    
    // Создаем читатель файла для работы с ArrayBuffer
    const reader = new FileReader()
    
    // Обрабатываем файл как ArrayBuffer
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        
        // Создаем книгу Excel из массива данных
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(data)
        
        // Получаем первый лист
        const worksheet = workbook.getWorksheet(1)
        if (!worksheet) {
          if (setImportingComplete) setImportingComplete()
          throw new Error('Лист не найден в файле Excel')
        }
        
        // Импортируем данные из файла
        const parsedData = parseWorksheet(worksheet)
        
        if (parsedData.sites.length > 0) {
          consolidatedStore.updateSites(parsedData.sites)
        }
        
        if (parsedData.tableData.length > 0) {
          consolidatedStore.updateTableData(parsedData.tableData)
        }
        
        // Валидация данных о видах растений
        const validationResults = await validateSpeciesData(parsedData.tableData, parsedData.sites)
        
        // Обновляем сводку ошибок после изменения данных
        updateValidationSummary()
        
        // Устанавливаем результаты валидации
        validationSummary.value = validationResults
        showValidationSummary.value = validationResults.totalErrors > 0
        
        // Если есть таймаут валидации, очищаем его
        if (validationTimeout.value) {
          clearTimeout(validationTimeout.value)
          validationTimeout.value = null;
        }
        
        // Закрываем модальное окно
        closeModal(importXlsxModalId)
        
        // Показываем сообщение об успешном импорте
        if (validationResults.totalErrors > 0) {
          toast.warning(`Данные импортированы с ${validationResults.totalErrors} ошибками. Проверьте таблицу.`)
        } else {
          toast.success('Данные успешно импортированы')
        }
        
        // Сбрасываем состояние загрузки только после успешного импорта
        if (setImportingComplete) setImportingComplete()
      } catch (err) {
        // В случае ошибки также сбрасываем состояние
        if (setImportingComplete) setImportingComplete()
        console.error('Ошибка при обработке файла:', err)
        toast.error(`Ошибка при обработке файла: ${err.message}`)
      } finally {
        isLoading.value = false
      }
    }
    
    // Обработка ошибки чтения файла
    reader.onerror = () => {
      if (setImportingComplete) setImportingComplete()
      toast.error('Ошибка при чтении файла')
      isLoading.value = false
    }
    
    // Чтение файла как ArrayBuffer
    reader.readAsArrayBuffer(file)
    
  } catch (err) {
    // Сбрасываем состояние загрузки при любой ошибке
    if (importData && importData.setImportingComplete) importData.setImportingComplete()
    console.error('Ошибка при импорте файла:', err)
    toast.error(`Ошибка при импорте файла: ${err.message}`)
    isLoading.value = false
  }
}

/**
 * Валидирует данные о видах растений, используя API getSpecies и проверяя ярусы и обилие
 * @param {Array} tableDataArray - Массив данных таблицы с видами растений
 * @param {Array} sitesData - Массив данных о площадках для валидации
 * @returns {Object} Объект со сводной информацией о результатах валидации
 */
const validateSpeciesData = async (tableDataArray, sitesData = null) => {
  try {
    // Используем переданные данные о площадках или текущие, если не переданы
    const sitesToValidate = sitesData || sites.value
    
    // Отфильтровываем таксоны, оставляем только виды для проверки
    const speciesList = tableDataArray.filter(item => !item.type || item.type !== 'taxon')
    
    if (speciesList.length === 0) return {
      totalErrors: 0,
      speciesNotFound: 0,
      similarSpecies: 0,
      multipleSpeciesFound: 0,
      validationErrors: 0,
      invalidTiers: 0,
      invalidAbundances: 0
    }

    // Проверяем каждый вид через API с фильтрацией по title и author
    let speciesNotFound = 0;
    let similarSpecies = 0;
    let multipleSpeciesFound = 0;
    let validationErrors = 0;
    let invalidTiers = 0;
    let invalidAbundances = 0;
    
    // Получаем валидные значения ярусов и баллов обилия
    const validTiers = tierOptions.map(option => option.value);
    const validAbundances = abundanceOptions.map(option => option.value);
    
    for (const tableRow of speciesList) {
      // Проверка видов по API
      const params = {}
      if (tableRow.title) params.title = tableRow.title.trim()
      if (tableRow.author) params.author = tableRow.author.trim()
      
      // Пропускаем проверку, если не указаны ни название, ни автор
      if (!params.title && !params.author) continue
      
      try {
        const response = await getSpecies(params)
        
        // Проверяем результаты запроса
        if (response.success && response.data) {
          if (response.data.count === 0) {
            // Видов не найдено
            tableRow.isValid = false
            tableRow.validationMessage = `Вид отсутствует в базе данных`
            speciesNotFound++
          } else if (response.data.count === 1) {
            // Найден 1 вид - проверяем точное совпадение
            const foundSpecies = response.data.results[0]
            const inputTitle = tableRow.title.trim().toLowerCase()
            const foundTitle = foundSpecies.title.trim().toLowerCase()
            
            // Если автор не указан и найден точно один вид - автоматически заполняем автора
            if (!tableRow.author && inputTitle === foundTitle) {
              // Автоматически добавляем автора
              tableRow.author = foundSpecies.author
              tableRow.isValid = true
              tableRow.validationMessage = `Вид найден: ${foundSpecies.title} ${foundSpecies.author}`
            } else {
              // Сравниваем авторов без учета точек
              const inputAuthor = tableRow.author ? tableRow.author.trim().toLowerCase().replace(/\./g, '') : ''
              const foundAuthor = foundSpecies.author ? foundSpecies.author.trim().toLowerCase().replace(/\./g, '') : ''
              
              if (inputTitle === foundTitle && inputAuthor === foundAuthor) {
                // Полное совпадение
                tableRow.isValid = true
                tableRow.validationMessage = `Вид найден: ${foundSpecies.title} ${foundSpecies.author}`
              } else {
                // Частичное совпадение
                tableRow.isValid = false
                tableRow.validationMessage = `Найден похожий вид: ${foundSpecies.title} ${foundSpecies.author}`
                similarSpecies++
              }
            }
          } else {
            // Найдено несколько видов
            tableRow.isValid = false
            tableRow.validationMessage = `Найдено ${response.data.count} похожих видов`
            multipleSpeciesFound++
          }
        } else {
          tableRow.isValid = false
          tableRow.validationMessage = 'Ошибка при проверке вида'
          validationErrors++
        }
      } catch (err) {
        console.error(`Ошибка при проверке вида ${tableRow.title} ${tableRow.author}:`, err)
        // В случае ошибки считаем вид невалидным
        tableRow.isValid = false
        tableRow.validationMessage = `Ошибка при проверке вида: ${err.message}`
        validationErrors++
      }
      
      // Проверка валидности яруса
      if (tableRow.tier && !validTiers.includes(tableRow.tier)) {
        tableRow.tierInvalid = true;
        tableRow.tierMessage = `Недопустимое значение яруса: ${tableRow.tier}`;
        invalidTiers++;
      } else {
        tableRow.tierInvalid = false;
        tableRow.tierMessage = '';
      }
      
      // Проверка баллов обилия для площадок
      tableRow.invalidAbundances = 0;
      tableRow.abundanceMessages = {};
      
      sitesToValidate.forEach(site => {
        const abundanceKey = `abundance_${site.id}`;
        const abundanceValue = tableRow[abundanceKey];
        
        if (abundanceValue && !validAbundances.includes(abundanceValue)) {
          tableRow.abundanceMessages[abundanceKey] = `Недопустимое значение балла обилия: ${abundanceValue}`;
          tableRow.invalidAbundances++;
          invalidAbundances++;
        }
      });
    }
    
    const totalErrors = speciesNotFound + similarSpecies + multipleSpeciesFound + validationErrors + 
                      invalidTiers + invalidAbundances;
    
    return {
      totalErrors,
      speciesNotFound,
      similarSpecies,
      multipleSpeciesFound,
      validationErrors,
      invalidTiers,
      invalidAbundances
    }
  } catch (err) {
    error.value = handleApiError(err, 'Ошибка при валидации видов', toast)
    console.error('Ошибка при валидации видов:', err)
    return {
      totalErrors: 0,
      speciesNotFound: 0,
      similarSpecies: 0, 
      multipleSpeciesFound: 0,
      validationErrors: 1,
      invalidTiers: 0,
      invalidAbundances: 0
    }
  }
}

/**
 * Парсит лист Excel и извлекает данные о площадках и видах
 * @param {Object} worksheet - Лист Excel из библиотеки ExcelJS
 * @returns {Object} Объект с данными о площадках (sites) и данными таблицы (tableData)
 */
const parseWorksheet = (worksheet) => {
  // Результирующие массивы
  const sites = []
  const tableData = []
  
  if (!worksheet) return { sites, tableData }
  
  // Определяем количество строк и столбцов
  const rowCount = worksheet.rowCount
  const columnCount = worksheet.columnCount
  
  if (rowCount < 2 || columnCount < 3) {
    throw new Error('Файл не содержит достаточно данных для импорта')
  }
  
  // Получаем заголовок с номерами площадок (первая строка)
  const headerRow = worksheet.getRow(1)
  
  // Проверяем, есть ли в последнем столбце "Класс постоянства"
  const lastColumnIndex = columnCount
  const lastColumnHeader = headerRow.getCell(lastColumnIndex).value
  const hasConstancyClass = lastColumnHeader === 'Класс постоянства' || 
                           lastColumnHeader === 'Постоянство'
  
  // Количество площадок с учетом столбцов "Название вида", "Ярус" и возможного "Класса постоянства"
  let siteCount = columnCount - 2 // По умолчанию: все столбцы кроме названия и яруса
  if (hasConstancyClass) {
    siteCount = siteCount - 1 // Вычитаем еще и столбец "Класс постоянства"
  }
  
  // Автоматическое определение наличия шапки
  // Проверяем вторую строку - содержит ли она названия полей известных параметров площадок
  const secondRow = worksheet.getRow(2)
  const firstCellValue = secondRow.getCell(1).value
  const hasHeaders = firstCellValue && Object.values(siteFieldLabels).some(label => 
    firstCellValue.toString().toLowerCase().includes(label.toLowerCase())
  )
  
  // Если есть шапка, определяем сколько строк она занимает
  let headerRowsCount = 0
  if (hasHeaders) {
    // Шапка начинается со строки 2 и может содержать все поля из siteFieldLabels
    headerRowsCount = Object.keys(siteFieldLabels).length
  }
  
  // Создаем массив площадок
  for (let i = 0; i < siteCount; i++) {
    const columnIndex = i + 3 // Смещение 3 т.к. первые два столбца - вид и ярус
    const siteNumber = headerRow.getCell(columnIndex).value
    
    if (siteNumber !== null && siteNumber !== undefined) {
      // Создаем уникальный идентификатор для временной площадки
      const siteId = Date.now() + i
      
      const site = {
        id: siteId,
        site_number: siteNumber,
        zone_type: 'forest', // По умолчанию лес
      }
      
      // Если есть заголовки с информацией о площадках, обрабатываем их
      if (hasHeaders) {
        // Получаем данные о площадках из заголовка
        Object.keys(siteFieldLabels).forEach((field, fieldIndex) => {
          const dataRow = worksheet.getRow(fieldIndex + 2) // Строки заголовка начинаются со 2 (после номеров площадок)
          const value = dataRow.getCell(columnIndex).value
          
          if (value !== null && value !== undefined && value !== '') {
            // Особая обработка для zone_type
            if (field === 'zone_type') {
              const strValue = value.toString().toLowerCase().trim()
              if (strValue === 'лес') {
                site[field] = 'forest'
              } else if (strValue === 'луг') {
                site[field] = 'meadow'
              } else {
                site[field] = value.toString()
              }
            } else {
              site[field] = value.toString()
            }
          }
        })
      }
      
      sites.push(site)
    }
  }
  
  // Определяем начальную строку с данными о видах
  const dataStartRow = hasHeaders ? headerRowsCount + 2 : 2
  
  // Генерируем ID для строк и формируем массив данных таблицы
  let rowId = 1
  
  // Счетчик последовательных пустых строк для определения конца таблицы
  let consecutiveEmptyRows = 0
  const emptyRowsThreshold = 1 // Порог пустых строк для определения конца таблицы
  
  // Обрабатываем строки с видами
  for (let rowIndex = dataStartRow; rowIndex <= rowCount; rowIndex++) {
    const row = worksheet.getRow(rowIndex)
    const speciesNameValue = row.getCell(1).value
    const tierValue = row.getCell(2).value
    
    // Если строка полностью пустая, увеличиваем счетчик пустых строк
    if (!speciesNameValue) {
      consecutiveEmptyRows++
      
      // Если достигли порога пустых строк, считаем что достигли конца таблицы
      if (consecutiveEmptyRows >= emptyRowsThreshold) {
        break // Выходим из цикла обработки строк
      }
      
      continue // Пропускаем текущую пустую строку
    } else {
      // Сбрасываем счетчик пустых строк, так как текущая строка не пустая
      consecutiveEmptyRows = 0
    }
    
    // Проверяем, является ли строка таксоном только по объединенным ячейкам
    let isTaxon = false;
    
    const cell = row.getCell(1);
    
    // Проверяем объединение ячеек
    if (cell.master && cell.master._mergeCount > 0) {
      isTaxon = true;
    }
    
    if (isTaxon) {
      // Добавляем строку таксона
      tableData.push({
        id: `taxon_${rowId++}`,
        type: 'taxon',
        taxon_name: speciesNameValue.toString().trim(),
        isEditing: false
      });
    } else {
      // Это обычный вид - разделяем название вида и автора
      const speciesNameString = speciesNameValue.toString();
      const words = speciesNameString.split(' ');
      
      // Название вида - первые 2 слова
      let title = '';
      let author = '';
      
      if (words.length <= 2) {
        title = speciesNameString;
      } else {
        title = words.slice(0, 2).join(' ');
        author = words.slice(2).join(' ');
      }
      
      // Создаем объект строки таблицы для вида растения
      const tableRow = {
        id: `species_${rowId++}`,
        title: title.trim(),
        author: author.trim(),
        tier: tierValue ? tierValue.toString().toUpperCase() : '',
        isValid: null, // Статус валидации
        validationMessage: '' // Сообщение валидации
      }
      
      // Добавляем значения обилия для каждой площадки
      sites.forEach((site, index) => {
        const columnIndex = index + 3
        let abundanceValue = row.getCell(columnIndex).value
        
        // Обработка пустых значений и точек
        if (abundanceValue === null || abundanceValue === undefined || abundanceValue === '.' || abundanceValue === '') {
          abundanceValue = ''
        } else {
          abundanceValue = abundanceValue.toString()
        }
        
        tableRow[`abundance_${site.id}`] = abundanceValue
      })
      
      tableData.push(tableRow)
    }
  }
  
  return { sites, tableData }
}

const prepareDataForAnalysis = () => {
  const customData = {}

  sites.value.forEach((site) => {
    const siteId = site.id
    customData[siteId] = {
      descriptions: [],
      metadata: {
        site_number: site.site_number,
        zone_type: site.zone_type
      }
    }

    tableData.value.forEach((row) => {
      if (row.type === 'taxon') {
        return
      }

      const abundanceKey = `abundance_${siteId}`

      if (row[abundanceKey]) {
        customData[siteId].descriptions.push({
          title: row.title,
          author: row.author,
          tier: row.tier || '',
          abundance: row[abundanceKey],
        })
      }
    })
  })

  return customData
}

const performCustomAnalysis = async (elements) => {
  try {
    const customData = prepareDataForAnalysis()

    const analysisElements = elements || [
      'raunkiaer',
      'serebryakov',
      'ecobiomorphs',
      'geoelements',
      'ta',
      'ellenberg',
      'landolt',
      'tsyganov',
    ]

    const response = await getCustomAnalysis(customData, analysisElements)

    if (response.success) {
      return {
        data: response.data.data,
        customData: customData // Сохраняем customData для использования в графиках шкал
      }
    } else {
      throw new Error(response.message || 'Ошибка при выполнении анализа')
    }
  } catch (err) {
    const errorMessage = handleApiError(err, 'Ошибка при выполнении анализа данных', toast)
    console.error(errorMessage, err)
    throw err
  }
}

// Функция для загрузки данных шкал для одной площадки
const loadScalesData = async (siteData, scaleTypes) => {
  if (!siteData || !scaleTypes || !Array.isArray(scaleTypes) || scaleTypes.length === 0) return

  // Для каждого типа шкалы загружаем данные
  for (const scaleType of scaleTypes) {
    const chartKey = `${siteData.metadata.site_number}_${siteData.metadata.zone_type}_${scaleType}`;
    try {
      // Устанавливаем состояние загрузки
      consolidatedStore.saveScalesChartData(chartKey, {
        data: null,
        isLoading: true,
        error: null
      });

      // Выполняем запрос на сервер
      const response = await getCustomSiteMeans(siteData, scaleType)

      if (response.success) {
        // Сохраняем полученные данные
        consolidatedStore.saveScalesChartData(chartKey, {
          data: response.data,
          isLoading: false,
          error: null
        });
      } else {
        // Сохраняем ошибку
        consolidatedStore.saveScalesChartData(chartKey, {
          data: null,
          isLoading: false,
          error: handleApiError(response, `Ошибка загрузки данных шкалы ${scaleType}`)
        });
      }
    } catch (err) {
      // Обрабатываем ошибки при загрузке
      consolidatedStore.saveScalesChartData(chartKey, {
        data: null,
        isLoading: false,
        error: handleApiError(err, `Ошибка загрузки данных шкалы ${scaleType}`)
      });
    }
  }
}

// Функция для загрузки данных спектров для одной площадки
const loadSpectrumData = async (siteData, spectrumTypes) => {
  if (!siteData || !spectrumTypes || !Array.isArray(spectrumTypes) || spectrumTypes.length === 0) return

  // Для каждого типа спектра загружаем данные
  for (const spectrumType of spectrumTypes) {
    const chartKey = `${siteData.metadata.site_number}_${siteData.metadata.zone_type}_${spectrumType}`;
    try {
      // Устанавливаем состояние загрузки
      consolidatedStore.saveSpectrumChartData(chartKey, {
        data: null,
        isLoading: true,
        error: null
      });

      // Выполняем запрос на сервер
      const response = await getCustomSiteDistribution(siteData, spectrumType)

      if (response.success) {
        // Сохраняем полученные данные
        consolidatedStore.saveSpectrumChartData(chartKey, {
          data: response.data,
          isLoading: false,
          error: null
        });
      } else {
        // Сохраняем ошибку
        consolidatedStore.saveSpectrumChartData(chartKey, {
          data: null,
          isLoading: false,
          error: handleApiError(response, `Ошибка загрузки данных спектра ${spectrumType}`)
        });
      }
    } catch (err) {
      // Обрабатываем ошибки при загрузке
      consolidatedStore.saveSpectrumChartData(chartKey, {
        data: null,
        isLoading: false,
        error: handleApiError(err, `Ошибка загрузки данных спектра ${spectrumType}`)
      });
    }
  }
}

// Функция для загрузки данных классификации для одной площадки
const loadClassificationData = async (siteData) => {
  if (!siteData) return

  const chartKey = `${siteData.metadata.site_number}_${siteData.metadata.zone_type}_classification`;
  try {
    // Устанавливаем состояние загрузки
    consolidatedStore.saveClassificationChartData(chartKey, {
      data: [],
      isLoading: true,
      error: null
    });

    // Выполняем запрос на сервер
    const response = await getCustomSiteClassification(siteData)

    if (response.success) {
      // Сохраняем полученные данные
      consolidatedStore.saveClassificationChartData(chartKey, {
        data: response.data.data || [],
        isLoading: false,
        error: null
      });
    } else {
      // Сохраняем ошибку
      consolidatedStore.saveClassificationChartData(chartKey, {
        data: [],
        isLoading: false,
        error: handleApiError(response, `Ошибка загрузки данных классификации`)
      });
    }
  } catch (err) {
    // Обрабатываем ошибки при загрузке
    consolidatedStore.saveClassificationChartData(chartKey, {
      data: [],
      isLoading: false,
      error: handleApiError(err, `Ошибка загрузки данных классификации`)
    });
  }
}

// Запуск анализа
const runAnalysis = async (settings) => {
  // Если настройки не переданы, используем текущие значения
  const elements = settings?.selectedElements || selectedElements.value
  
  if (elements.length === 0) {
    toast.warning('Выберите хотя бы один элемент для анализа')
    return
  }

  try {
    isAnalyzing.value = true
    
    // Обновляем настройки в store
    if (settings) {
      consolidatedStore.updateAnalysisSettings({
        selectedElements: elements,
        showAllSitesChart: settings.showAllSitesChart !== undefined ? settings.showAllSitesChart : showAllSitesChart.value,
        showIndividualSiteCharts: settings.showIndividualSiteCharts !== undefined ? settings.showIndividualSiteCharts : showIndividualSiteCharts.value,
        showClassification: settings.showClassification !== undefined ? settings.showClassification : showClassification.value
      })
    }
    
    // Запускаем основной анализ
    const result = await performCustomAnalysis(elements)
    
    // Сохраняем результаты анализа в store
    consolidatedStore.saveAnalysisResults(result)
    
    // Выделяем типы шкал и спектров из выбранных элементов
    const selectedScaleTypes = elements.filter(element => 
      SCALES_TYPES.some(scale => scale.value === element)
    )
    
    const selectedSpectrumTypes = elements.filter(element => 
      SPECTRUM_TYPES.some(spectrum => spectrum.value === element)
    )
    
    // Текущее значение настройки показа классификации
    const shouldShowClassification = settings?.showClassification !== undefined ? 
                                    settings.showClassification : showClassification.value

    // Загружаем данные для всех площадок и выбранных элементов
    const customData = result.customData || {}
    for (const siteId in customData) {
      const siteData = customData[siteId]

      // Загружаем данные шкал
      if (selectedScaleTypes.length > 0) {
        await loadScalesData(siteData, selectedScaleTypes)
      }

      // Загружаем данные спектров
      if (selectedSpectrumTypes.length > 0) {
        await loadSpectrumData(siteData, selectedSpectrumTypes)
      }
      
      // Загружаем данные классификации только если включена соответствующая настройка
      if (shouldShowClassification) {
        await loadClassificationData(siteData)
      }
    }
    
    // Проверяем какие вкладки доступны и выбираем активную
    if (showAllSitesChart.value) {
      activeTab.value = 'consolidated'
    } else if (showIndividualSiteCharts.value && nonEmptySites.value.length > 0) {
      activeTab.value = `site_${nonEmptySites.value[0].id}`
    }
  } catch (err) {
    toast.error('Ошибка при выполнении анализа')
    console.error(err)
  } finally {
    isAnalyzing.value = false
  }
}

// Show export settings modal
const showExportSettings = (format) => {
  exportFormat.value = format
  showExportMenu.value = false

  showExportSettingsModal()
}

const closeModal = (modalId) => {
  const dismissBtn = document.querySelector(`#${modalId} [data-bs-dismiss="modal"]`)
  if (dismissBtn) {
    dismissBtn.click()
  }
}

// Функция для показа модального окна добавления площадки
const showAddSiteModal = () => {
  const modal = document.createElement('button')
  modal.setAttribute('data-bs-toggle', 'modal')
  modal.setAttribute('data-bs-target', `#${addSiteModalId}`)
  modal.style.display = 'none'
  document.body.appendChild(modal)
  modal.click()
  document.body.removeChild(modal)
}

// Функция для показа модального окна добавления вида
const showAddSpeciesModal = () => {
  const modal = document.createElement('button')
  modal.setAttribute('data-bs-toggle', 'modal')
  modal.setAttribute('data-bs-target', `#${addSpeciesModalId}`)
  modal.style.display = 'none'
  document.body.appendChild(modal)
  modal.click()
  document.body.removeChild(modal)
}

// Функция для показа модального окна настроек экспорта
const showExportSettingsModal = () => {
  const modal = document.createElement('button')
  modal.setAttribute('data-bs-toggle', 'modal')
  modal.setAttribute('data-bs-target', `#${exportSettingsModalId}`)
  modal.style.display = 'none'
  document.body.appendChild(modal)
  modal.click()
  document.body.removeChild(modal)
}

// Функция для показа модального окна настроек анализа
const showAnalysisSettingsModal = () => {
  const modal = document.createElement('button')
  modal.setAttribute('data-bs-toggle', 'modal')
  modal.setAttribute('data-bs-target', `#${analysisSettingsModalId}`)
  modal.style.display = 'none'
  document.body.appendChild(modal)
  modal.click()
  document.body.removeChild(modal)
}

// Функция для показа модального окна импорта
const showImportModal = () => {
  const modal = document.createElement('button')
  modal.setAttribute('data-bs-toggle', 'modal')
  modal.setAttribute('data-bs-target', `#${importXlsxModalId}`)
  modal.style.display = 'none'
  document.body.appendChild(modal)
  modal.click()
  document.body.removeChild(modal)
}

// Функция для показа модального окна подтверждения сброса
const showResetConfirmModal = () => {
  const modal = document.createElement('button')
  modal.setAttribute('data-bs-toggle', 'modal')
  modal.setAttribute('data-bs-target', `#${resetConfirmModalId}`)
  modal.style.display = 'none'
  document.body.appendChild(modal)
  modal.click()
  document.body.removeChild(modal)
}

// Функция для обработки подтверждения сброса данных
const handleResetConfirm = () => {
  try {
    consolidatedStore.resetData()
    closeModal(resetConfirmModalId)
    toast.success('Все данные успешно сброшены')
  } catch (err) {
    console.error('Ошибка при сбросе данных:', err)
    toast.error(`Ошибка при сбросе данных: ${err.message}`)
  }
}

// Функция для определения класса элемента в зависимости от его позиции и общего количества
const computeClass = (index, total) => {
  if (total === 1) {
    return 'col-12'
  }
  if (total % 2 !== 0 && index === total - 1) {
    return 'col-12'
  }
  return 'col-12 col-lg-6'
}

// Функция для переключения вкладок в анализе
const switchTab = (tab) => {
  activeTab.value = tab
  
  // Обновляем URL с новым параметром вкладки
  router.replace({
    query: { ...route.query, tab: tab }
  })
}

const toggleValidationSummary = () => {
  if (validationSummary.value && validationSummary.value.totalErrors > 0) {
    showValidationSummary.value = !showValidationSummary.value
  }
}

// Функция для переключения видимости информационного блока
const toggleInfoBlock = () => {
  showInfoBlock.value = !showInfoBlock.value
}

// Toggle export menu
const toggleExportMenu = () => {
  showExportMenu.value = !showExportMenu.value
}

const toggleToAnalysis = () => {
  showAnalysisView.value = true
  
  // Обновляем URL с параметром режима отображения
  router.replace({
    query: { ...route.query, view: 'analysis' }
  })
  
  // Если нет результатов анализа, но есть сохраненные настройки, выполняем анализ
  if (!analysisResults.value && selectedElements.value.length > 0) {
    runAnalysis({
      selectedElements: selectedElements.value,
      showAllSitesChart: showAllSitesChart.value,
      showIndividualSiteCharts: showIndividualSiteCharts.value
    });
  } 
  // Если нет ни результатов, ни настроек, показываем настройки анализа
  else if (!analysisResults.value) {
    showAnalysisSettingsModal();
  }
}

const toggleToTable = () => {
  showAnalysisView.value = false
  
  // Обновляем URL с параметром режима отображения
  router.replace({
    query: { ...route.query, view: 'table' }
  })
}

// Handle click outside for dropdown
const handleClickOutside = (event) => {
  const exportDropdownEl = document.getElementById('exportDropdown')
  const resetDropdownEl = document.getElementById('resetDropdown')
  
  if (exportDropdownEl && !exportDropdownEl.contains(event.target) && showExportMenu.value) {
    showExportMenu.value = false
  }
  
  if (resetDropdownEl && !resetDropdownEl.contains(event.target) && showResetMenu.value) {
    showResetMenu.value = false
  }
}

const currentTheme = ref('light')
let themeObserver

onMounted(() => {
  loadData()
  document.addEventListener('click', handleClickOutside)

  // Слежка за изменениями атрибута data-bs-theme
  themeObserver = new MutationObserver(() => {
    currentTheme.value = document.documentElement.getAttribute('data-bs-theme') || 'light'
  })

  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-bs-theme'],
  })

  // Установка текущего значения
  currentTheme.value = document.documentElement.getAttribute('data-bs-theme') || 'light'
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (themeObserver) themeObserver.disconnect()
})

// Функция для очистки всех неиспользуемых видов
const handleDeleteEmptySpecies = () => {
  try {
    const emptySpeciesIds = consolidatedStore.emptySpeciesIds
    
    if (emptySpeciesIds.length === 0) {
      toast.warning('Все виды имеют описания минимум на одной площадке')
      return
    }
    
    consolidatedStore.removeEmptySpecies()
    toast.success(`Удалено ${emptySpeciesIds.length} неиспользуемых видов`)
    showResetMenu.value = false
  } catch (err) {
    console.error('Ошибка при удалении неиспользуемых видов:', err)
    toast.error(`Ошибка при удалении неиспользуемых видов: ${err.message}`)
  }
}

// Функция для удаления всех пустых площадок
const handleDeleteEmptySites = () => {
  try {
    const emptySiteIds = consolidatedStore.emptySiteIds
    
    if (emptySiteIds.length === 0) {
      toast.warning('Все площадки содержат описания видов')
      return
    }
    
    consolidatedStore.removeEmptySites()
    toast.success(`Удалено ${emptySiteIds.length} пустых площадок`)
    showResetMenu.value = false
  } catch (err) {
    console.error('Ошибка при удалении пустых площадок:', err)
    toast.error(`Ошибка при удалении пустых площадок: ${err.message}`)
  }
}

// Функция для переключения меню сброса
const toggleResetMenu = () => {
  showResetMenu.value = !showResetMenu.value
}
</script>

<template>
  <div>
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

    <template v-else>
      <!-- Представление таблицы -->
      <div v-if="!showAnalysisView">
        <!-- Информационный блок с подсказками -->
        <Transition name="fade">
          <div v-if="showInfoBlock" class="info-block mb-3">
            <div class="info-header d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center">
                <Info :size="18" class="me-2 info-icon" />
                <h5 class="mb-0">Информация о странице</h5>
              </div>
              <button type="button" class="btn-close" @click="showInfoBlock = false"></button>
            </div>
            
            <div class="info-content mt-2">
              <p class="mb-2">Эта страница предназначена для работы с временными данными о площадках и их анализа</p>
              
              <h6 class="mb-1 mt-2">Контекстное меню (правый клик мыши):</h6>
              <ul class="mb-2 small">
                <li><strong>На столбце</strong> - клик по ячейке с номером площадки для добавления/удаления площадок</li>
                <li><strong>На строке</strong> - клик по левой ячейке строки с маркером перетаскивания для добавления/удаления видов</li>
              </ul>
              
              <h6 class="mb-1 mt-2">Перетаскивание элементов:</h6>
              <ul class="mb-2 small">
                <li><strong>Столбцы</strong> - удерживая мышью специальную полоску-маркер в верхней части столбца</li>
                <li><strong>Строки</strong> - удерживая мышью специальную полоску-маркер в левой части строки</li>
              </ul>
              
              <h6 class="mb-1 mt-2">Цветовые индикаторы:</h6>
              <ul class="mb-2 small">
                <li><strong>Маркеры столбцов</strong> - цветная полоса в верхней части столбца:
                  <ul>
                    <li><span style="color: var(--bs-success)">Зеленый</span> - площадка содержит растительность</li>
                    <li><span style="color: var(--bs-warning)">Жёлтый</span> - площадка пустая (нет растительности)</li>
                  </ul>
                </li>
                <li><strong>Маркеры строк</strong> - цветная полоса в левой части строки:
                  <ul>
                    <li><span style="color: var(--bs-success)">Зеленый</span> - вид присутствует минимум на одной площадке</li>
                    <li><span style="color: var(--bs-warning)">Жёлтый</span> - вид отсутствует на всех площадках</li>
                    <li><span style="color: var(--bs-danger)">Красный</span> - в строке есть невалидные данные</li>
                    <li><span style="color: var(--bs-info)">Синий</span> - строка представляет таксон</li>
                  </ul>
                </li>
                <li><strong>Выделение ячеек</strong>:
                  <ul>
                    <li>
                      <span style="color: var(--bs-danger)">Красные ячейки</span> - недопустимые значения (неверный ярус, неправильный балл обилия, вид отсутствует в базе данных).
                      <br><em class="small" style="color: var(--bs-gray-600)">Возможны только при импорте невалидных данных из Excel.</em>
                    </li>
                  </ul>
                </li>
              </ul>
              
              <h6 class="mb-1 mt-2">Другие возможности:</h6>
              <ul class="mb-2 small">
                <li>Импорт (<span><Upload :size="12" /></span>) / экспорт (<span style="color: var(--bs-success)"><FileSpreadsheet :size="12" /></span>) данных из Excel для дальнейшей работы</li>
                <li>Анализ данных с построением графиков по экологическим шкалам и спектрам</li>
                <li>Возможность удаления неиспользуемых видов, пустых площадок и полного сброса всех введенных данных (<span style="color: var(--bs-danger)"><Trash2 :size="12" /></span>)</li>
                <li>Все изменения на этой странице временные и не сохраняются в базе данных</li>
              </ul>
            </div>
            
            <div class="info-footer mt-2">
              <p class="mb-0 small">Используйте кнопки в правом верхнем углу таблицы для импорта/экспорта данных и перехода к анализу.</p>
            </div>
          </div>
        </Transition>
        
        <!-- Сводка валидации -->
        <Transition name="fade">
          <div v-if="showValidationSummary && validationSummary.totalErrors > 0" 
              class="validation-summary mb-3">
            <div class="validation-header d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center">
                <AlertTriangle :size="18" class="me-2 validation-icon" />
                <h5 class="mb-0">Найдены ошибки в импортированных данных</h5>
              </div>
              <button type="button" class="btn-close" @click="showValidationSummary = false"></button>
            </div>
            
            <div class="validation-details mt-2">
              <div v-if="validationSummary.speciesNotFound > 0" class="validation-item">
                <AlertCircle :size="16" class="me-2 validation-icon" />
                <span>Виды отсутствуют в базе данных: {{ validationSummary.speciesNotFound }}</span>
              </div>
              <div v-if="validationSummary.similarSpecies > 0" class="validation-item">
                <AlertCircle :size="16" class="me-2 validation-icon" />
                <span>Найдены похожие виды: {{ validationSummary.similarSpecies }}</span>
              </div>
              <div v-if="validationSummary.multipleSpeciesFound > 0" class="validation-item">
                <AlertCircle :size="16" class="me-2 validation-icon" />
                <span>Найдено несколько похожих видов: {{ validationSummary.multipleSpeciesFound }}</span>
              </div>
              <div v-if="validationSummary.validationErrors > 0" class="validation-item">
                <AlertCircle :size="16" class="me-2 validation-icon" />
                <span>Ошибки при проверке видов: {{ validationSummary.validationErrors }}</span>
              </div>
              <div v-if="validationSummary.invalidTiers > 0" class="validation-item">
                <AlertCircle :size="16" class="me-2 validation-icon" />
                <span>Недопустимые значения ярусов: {{ validationSummary.invalidTiers }}</span>
              </div>
              <div v-if="validationSummary.invalidAbundances > 0" class="validation-item">
                <AlertCircle :size="16" class="me-2 validation-icon" />
                <span>Недопустимые значения баллов обилия: {{ validationSummary.invalidAbundances }}</span>
              </div>
            </div>
            
            <div class="validation-footer mt-2">
              <p class="mb-0">Невалидные данные подсвечены красным цветом в таблице. Проверьте названия и авторов видов, ярусы и баллы обилия.</p>
            </div>
          </div>
        </Transition>

        <div class="card p-0">
          <div
            class="card-header custom-card-header border border-bottom-0 text-white d-flex justify-content-between align-items-center"
          >
            <h5 class="mb-0">Сводная таблица видов на площадках</h5>
            <div class="d-flex gap-2">
              
              <!-- Кнопка для показа/скрытия сводки валидации -->
              <button 
                class="btn btn-sm btn-warning" 
                @click="toggleValidationSummary"
                v-tooltip title=""
                :class="{'d-none': validationSummary.totalErrors === 0}"
              >
                <AlertTriangle :size="18" />
                <span class="ms-1 validation-counter" v-if="validationSummary.totalErrors > 0">
                  {{ validationSummary.totalErrors }}
                </span>
              </button>

              <!-- Кнопка для показа информационного блока -->
              <button 
                class="btn btn-sm btn-info" 
                @click="toggleInfoBlock"
                v-tooltip :title="showInfoBlock ? 'Скрыть информацию' : 'Показать информацию'"
              >
                <Info :size="18" />
              </button>

              <!-- Кнопка сброса данных (заменяем на дропдаун) -->
              <div class="dropdown">
                <button
                  class="btn btn-sm btn-danger dropdown-toggle"
                  type="button"
                  @click="toggleResetMenu"
                  v-tooltip title="Удаление данных"
                  id="resetDropdown"
                  aria-expanded="false"
                >
                  <Trash2 :size="18" />
                </button>
                <ul
                  class="dropdown-menu dropdown-menu-end"
                  :class="{ show: showResetMenu }"
                  aria-labelledby="resetDropdown"
                >
                  <li>
                    <a class="dropdown-item" :class="{ 'disabled': consolidatedStore.emptySpeciesIds.length === 0 }" href="#" @click.prevent="handleDeleteEmptySpecies">
                      <Trash2 :size="14" class="me-2" />
                      Удалить неиспользуемые виды
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" :class="{ 'disabled': consolidatedStore.emptySiteIds.length === 0 }" href="#" @click.prevent="handleDeleteEmptySites">
                      <Trash2 :size="14" class="me-2" />
                      Удалить пустые площадки
                    </a>
                  </li>
                  <li>
                    <hr class="dropdown-divider">
                  </li>
                  <li>
                    <a class="dropdown-item text-danger" href="#" @click.prevent="showResetConfirmModal">
                      <AlertTriangle :size="14" class="me-2" />
                      Сбросить все данные
                    </a>
                  </li>
                </ul>
              </div>
              
              <!-- Кнопка импорта XLSX -->
              <button class="btn btn-sm btn-light" @click="showImportModal" v-tooltip title="Импорт из Excel">
                <Upload :size="18" />
              </button>
              
              <!-- Dropdown menu for export options -->
              <div class="dropdown">
                <button
                  class="btn btn-sm btn-success dropdown-toggle"
                  type="button"
                  @click="toggleExportMenu"
                  v-tooltip title="Экспорт данных"
                  id="exportDropdown"
                  aria-expanded="false"
                >
                  <FileSpreadsheet :size="18" />
                </button>
                <ul
                  class="dropdown-menu dropdown-menu-end"
                  :class="{ show: showExportMenu }"
                  aria-labelledby="exportDropdown"
                >
                  <li>
                    <a class="dropdown-item" href="#" @click.prevent="showExportSettings('xlsx')">
                      <Download :size="14" class="me-2" />
                      Экспорт в Excel (.xlsx)
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="#" @click.prevent="showExportSettings('csv')">
                      <Download :size="14" class="me-2" />
                      Экспорт в CSV (.csv)
                    </a>
                  </li>
                </ul>
              </div>
              
              <!-- Кнопка перехода к анализу -->
              <button class="btn btn-sm btn-primary btn-consolidated-analysis" @click="toggleToAnalysis" 
                :disabled="!hasAnalysisData || validationSummary.totalErrors > 0"
                :class="{ 'disabled': !hasAnalysisData || validationSummary.totalErrors > 0 }"
                v-tooltip :title="!hasAnalysisData ? 'Отсутствуют данные для анализа' : (validationSummary.totalErrors > 0 ? 'Исправьте ошибки в таблице' : '')"
              >
                <BarChart2 :size="18" class="me-1" />
                К анализу
              </button>
            </div>
          </div>
          <div class="card-body">
            <SiteConsolidatedTable
              v-model:tableData="tableData"
              v-model:sites="sites"
              :loading="isLoading"
              @add-site="handleAddColumn"
              @add-species="handleAddRow"
              @update:tableData="handleTableDataChange"
              @cell-change="handleCellChange"
            />
          </div>
        </div>
      </div>

      <!-- Представление анализа данных -->
      <div v-else>
        <!-- Информационный блок с подсказками для режима анализа -->
        <Transition name="fade">
          <div v-if="showInfoBlock" class="info-block mb-3">
            <div class="info-header d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center">
                <Info :size="18" class="me-2 info-icon" />
                <h5 class="mb-0">Информация об анализе данных</h5>
              </div>
              <button type="button" class="btn-close" @click="showInfoBlock = false"></button>
            </div>
            
            <div class="info-content mt-2">
              <p class="mb-2">В этом режиме вы можете анализировать данные площадок с помощью графиков</p>
              
              <h6 class="mb-1 mt-2">Основные функции:</h6>
              <ul class="mb-2 small">
                <li>Кнопка <strong>настройки</strong> <Settings size="14" class="align-text-bottom" /> - выбор шкал и спектров для анализа</li>
                <li>Вкладка <strong>Сводный график</strong> - процентное распределение выбранных параметров по всем площадкам</li>
                <li>Вкладки с <strong>номерами площадок</strong> - детальный анализ каждой площадки отдельно</li>
              </ul>
              
              <h6 class="mb-1 mt-2">Работа с результатами:</h6>
              <ul class="mb-2 small">
                <li>Наведите на элементы графиков для просмотра подробной информации</li>
                <li>Сделайте скриншот графиков для использования в отчетах</li>
                <li>Для возврата к редактированию данных используйте кнопку "К таблице"</li>
              </ul>
            </div>
            
            <div class="info-footer mt-2">
              <p class="mb-0 small">Для расчёта графиков используются только виды с указанными значениями обилия.</p>
            </div>
          </div>
        </Transition>
      
        <div class="card p-0">
          <div
            class="card-header custom-card-header border text-white d-flex justify-content-between align-items-center"
          >
            <h5 class="mb-0">Анализ данных площадок</h5>
            <div class="d-flex gap-2">
              <!-- Кнопка для показа информационного блока -->
              <button 
                class="btn btn-sm btn-info" 
                @click="toggleInfoBlock"
                v-tooltip :title="showInfoBlock ? 'Скрыть информацию' : 'Показать информацию'"
              >
                <Info :size="18" />
              </button>
              
              <button
                class="btn btn-sm btn-light"
                type="button"
                @click="showAnalysisSettingsModal"
                v-tooltip title="Настройки анализа"
              >
                <Settings :size="18" />
              </button>

              <button class="btn btn-sm btn-primary" @click="toggleToTable">
                <ArrowLeft :size="18" class="me-1" />
                К таблице
              </button>
            </div>
          </div>
          <div class="card-body">
            <!-- Индикатор загрузки при анализе -->
            <div v-if="isAnalyzing" class="d-flex justify-content-center my-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Анализ данных...</span>
              </div>
              <div class="ms-3">Выполняется анализ данных...</div>
            </div>

            <!-- Результаты анализа -->
            <div v-if="analysisResults && !isAnalyzing" class="analysis-results border border-top-0 p-3">
              <!-- Сообщение, если нет площадок с данными -->
              <div v-if="showIndividualSiteCharts && nonEmptySites.length === 0" class="alert alert-warning">
                <div class="d-flex align-items-center">
                  <AlertTriangle :size="20" class="me-2" />
                  <span>Не найдено площадок с данными для анализа. Добавьте виды и укажите обилие для выбранных площадок.</span>
                </div>
              </div>

              <!-- Вкладки для переключения между сводным графиком и индивидуальными площадками -->
              <div v-if="nonEmptySites.length > 0 || showAllSitesChart" class="analysis-tabs-container">
                <div class="analysis-tabs-scroll">
                  <div class="analysis-tabs-header border-bottom">
                    <!-- Вкладка сводного графика -->
                    <button 
                      v-if="showAllSitesChart"
                      class="analysis-tab-btn consolidated alert-info" 
                      :class="{'active': activeTab === 'consolidated'}"
                      @click="switchTab('consolidated')"
                    >
                      <PieChart :size="16" class="me-1" />
                      <span>Сводный график</span>
                    </button>
                    
                    <!-- Вкладки для каждой площадки -->
                    <template v-if="showIndividualSiteCharts">
                      <button 
                        v-for="site in nonEmptySites" 
                        :key="`tab-site-${site.id}`"
                        class="analysis-tab-btn alert-success" 
                        :class="{
                          'active': activeTab === `site_${site.id}`,
                          'forest': site.zone_type === 'forest',
                          'meadow': site.zone_type === 'meadow'
                        }"
                        @click="switchTab(`site_${site.id}`)"
                      >
                        <span>Площадка №{{ site.site_number }}</span>
                      </button>
                    </template>
                  </div>
                </div>
              </div>
              
              <!-- Содержимое активной вкладки -->
              <div class="analysis-tab-content mt-3">
                <!-- Сводный график -->
                <div v-if="activeTab === 'consolidated'" class="chart-container p-3">
                  <StackedGroupChart 
                    :data="{data: analysisResults.data}"
                    :scaleTypes="selectedElements"
                    :showPercentage="true"
                    :theme="currentTheme"
                    height="500"
                  />
                </div>
                
                <!-- Отдельные графики по выбранной площадке -->
                <template v-else>
                  <template v-for="site in nonEmptySites" :key="`content-site-${site.id}`">
                    <div v-if="activeTab === `site_${site.id}`" class="site-charts-container">
                      <!-- Классификация -->
                      <ClassificationCard 
                        v-if="showClassification"
                        class="mb-5"
                        :classifications="classificationChartsData[`${site.site_number}_${site.zone_type}_classification`]?.data || []" 
                        :isLoading="classificationChartsData[`${site.site_number}_${site.zone_type}_classification`]?.isLoading || false" 
                        :error="classificationChartsData[`${site.site_number}_${site.zone_type}_classification`]?.error" 
                      />
                      
                      <!-- Графики шкал для выбранной площадки -->
                      <div class="mb-5">
                        <h5 class="border-bottom pb-2 mb-4">Экологические шкалы</h5>
                        <div class="row g-4">
                          <!-- Отображаем только выбранные шкалы -->
                          <div v-for="(element, index) in selectedElements.filter(item => SCALES_TYPES.map(scale => scale.value).includes(item))" 
                              :key="`scale-${site.id}-${element}`" 
                              :class="computeClass(index, selectedElements.filter(item => SCALES_TYPES.map(scale => scale.value).includes(item)).length)">
                            <div class="card h-100 p-0">
                              <div class="card-header">
                                <h6 class="mb-0">{{ getElementTitle(element) }}</h6>
                              </div>
                              <div class="card-body">
                                <div class="scales-chart h-100">
                                  <ScalesChart 
                                    v-if="analysisResults && analysisResults.customData && scalesChartsData[`${site.site_number}_${site.zone_type}_${element}`]"
                                    :chartData="scalesChartsData[`${site.site_number}_${site.zone_type}_${element}`]?.data || {}"
                                    :isLoading="scalesChartsData[`${site.site_number}_${site.zone_type}_${element}`]?.isLoading || false"
                                    :error="scalesChartsData[`${site.site_number}_${site.zone_type}_${element}`]?.error || null"
                                    :scaleType="element"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <!-- Сообщение, если нет выбранных шкал -->
                          <div v-if="!selectedElements.some(item => SCALES_TYPES.map(scale => scale.value).includes(item))" 
                              class="col-12 text-center text-muted py-3">
                            <p>Не выбраны шкалы для анализа. Добавьте шкалы в настройках анализа.</p>
                          </div>
                        </div>
                      </div>

                      <!-- Спектры экологических групп для выбранной площадки -->
                      <div class="mb-0">
                        <h5 class="border-bottom pb-2 mb-4">Спектры экологических групп</h5>
                        <div class="row g-4">
                          <!-- Отображаем только выбранные спектры -->
                          <div v-for="(element, index) in selectedElements.filter(item => SPECTRUM_TYPES.map(spectrum => spectrum.value).includes(item))" 
                              :key="`spectrum-${site.id}-${element}`" 
                              :class="computeClass(index, selectedElements.filter(item => SPECTRUM_TYPES.map(spectrum => spectrum.value).includes(item)).length)">
                            <div class="card h-100 p-0">
                              <div class="card-header">
                                <h6 class="mb-0">{{ getElementTitle(element) }}</h6>
                              </div>
                              <div class="card-body">
                                <div class="spectrum-chart h-100">
                                  <SpectrumChart 
                                    v-if="analysisResults && analysisResults.customData && spectrumChartsData[`${site.site_number}_${site.zone_type}_${element}`]"
                                    :chartData="spectrumChartsData[`${site.site_number}_${site.zone_type}_${element}`]?.data || {}"
                                    :isLoading="spectrumChartsData[`${site.site_number}_${site.zone_type}_${element}`]?.isLoading || false"
                                    :error="spectrumChartsData[`${site.site_number}_${site.zone_type}_${element}`]?.error || null"
                                    :spectrumType="element"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <!-- Сообщение, если нет выбранных спектров -->
                          <div v-if="!selectedElements.some(item => SPECTRUM_TYPES.map(spectrum => spectrum.value).includes(item))" 
                              class="col-12 text-center text-muted py-3">
                            <p>Не выбраны спектры для анализа. Добавьте спектры в настройках анализа.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                </template>
              </div>
            </div>

            <!-- Сообщение при отсутствии результатов -->
            <div v-if="!analysisResults && !isAnalyzing" class="text-center text-muted my-5">
              Нажмите на кнопку настроек анализа и выберите элементы для анализа
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Create Site Modal -->
    <SiteFormModal :modalId="addSiteModalId" @createSite="handleAddSite" />

    <!-- Create Species Modal -->
    <SpeciesFormModal
      :modalId="addSpeciesModalId"
      @addSpecies="handleAddSpecies"
      :showAbundance="false"
      :existingDescriptions="tableData"
    />

    <!-- Export Settings Modal -->
    <ExportSettingsModal
      :modalId="exportSettingsModalId"
      :exportFormat="exportFormat"
      :initialSelectedFields="selectedSiteFields"
      @export="handleExport"
    />

    <!-- Добавляем модальное окно импорта XLSX -->
    <ImportXLSXModal
      :modalId="importXlsxModalId"
      @import="handleImport"
      @generate-template="handleGenerateTemplate"
    />
    
    <!-- Добавляем модальное окно настроек анализа -->
    <AnalysisSettingsModal
      :modalId="analysisSettingsModalId"
      @run-analysis="runAnalysis"
    />
    
    <!-- Модальное окно подтверждения сброса данных -->
    <DeleteConfirmModal
      :modalId="resetConfirmModalId"
      title="Подтверждение сброса данных"
      message="Вы уверены, что хотите сбросить все данные таблицы?"
      warningText="Это действие удалит все площадки и виды, добавленные для временного анализа. Оригинальные данные не будут затронуты. Данное действие нельзя будет отменить."
      confirmButtonText="Сбросить"
      @confirm="handleResetConfirm"
    />
  </div>
</template>

<style scoped lang="scss">
.card-header {
  padding: 0.75rem 1rem;
}

.card-body {
  padding: 0;
}

.fade-enter-active {
  animation: fadeIn 0.2s ease-in-out;
}

.fade-leave-active {
  animation: fadeOut 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-5px);
  }
}

.dropdown-menu {
  &.show {
    display: block;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
  }
}

.btn-consolidated-analysis {
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed !important;
    pointer-events: all !important;
  }
}

// Стили для сводки валидации
.validation-summary {
  background-color: rgba(var(--bs-warning-rgb), 0.1);
  border: 1px solid rgba(var(--bs-warning-rgb), 0.3);
  border-radius: var(--bs-border-radius);
  padding: 1rem;
  
  .validation-header {
    color: var(--bs-warning);
    font-weight: 500;
    
    .validation-icon {
      color: var(--bs-warning);
    }
  }
  
  .validation-details {
    .validation-item {
      display: flex;
      align-items: center;
      margin-bottom: 0.5rem;
      
      .validation-icon {
        color: var(--bs-danger);
      }
    }
  }
  
  .validation-footer {
    font-size: 0.9rem;
    color: var(--bs-gray-700);
  }
}

// Добавляем стили для счетчика ошибок
.validation-counter {
  font-size: 0.75rem;
  font-weight: bold;
}

// Стили для информационного блока
.info-block {
  background-color: rgba(var(--bs-info-rgb), 0.07);
  border: 1px solid rgba(var(--bs-info-rgb), 0.2);
  border-radius: var(--bs-border-radius);
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  
  .info-header {
    color: var(--bs-info);
    font-weight: 500;
    
    .info-icon {
      color: var(--bs-info);
    }
  }
  
  .info-content {
    color: var(--bs-gray-700);
    
    h6 {
      color: var(--bs-info);
      font-size: 0.95rem;
      border-bottom: 1px solid rgba(var(--bs-info-rgb), 0.2);
      padding-bottom: 0.25rem;
    }
    
    ul {
      padding-left: 1.25rem;
      margin-bottom: 0.5rem;
      
      li {
        margin-bottom: 0.25rem;
      }
      
      &.small li {
        line-height: 1.4;
      }
    }
  }
  
  .info-footer {
    font-size: 0.85rem;
    color: var(--bs-gray-600);
    font-style: italic;
    padding-top: 0.25rem;
    border-top: 1px dashed rgba(var(--bs-info-rgb), 0.2);
  }
}

.analysis-results{
    border-radius: 0 0 var(--bs-border-radius) var(--bs-border-radius);
}

// Стили для вкладок анализа
.analysis-tabs-container {
  position: relative;
  width: 100%;
  
  .analysis-tabs-scroll {
    width: 100%;
    overflow-x: auto;
    scrollbar-width: thin;
    
    &::-webkit-scrollbar {
      height: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 10px;
    }
  }


  
  .analysis-tabs-header {
    display: flex;
    min-width: min-content;
    padding-bottom: 0.5rem;
    gap: 0.25rem;
    
    .analysis-tab-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 1rem;
      border: 1px solid var(--bs-gray-200);
      background: var(--bs-light);
      border-radius: var(--bs-border-radius);
      color: var(--bs-gray-700);
      cursor: pointer;
      transition: all 0.2s;
      max-width: 160px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      
      &:hover {
        background-color: var(--bs-gray-100);
      }
      
      &.active {
        background-color: var(--bs-primary);
        color: white;
        border-color: var(--bs-primary);
      }
      
      // Специальные стили для кнопки "Сводный график"
      &.consolidated {
        background-color: var(--bs-alert-bg);
        color: var(--bs-info);
        border-color: rgba(var(--bs-info-rgb), 0.3);
        
        &:hover {
          background-color: rgba(var(--bs-info-rgb), 0.25);
        }
        
        &.active {
          background-color: var(--bs-info);
          color: white;
          border-color: var(--bs-info);
        }
      }
      
      // Цветовая индикация по типу зоны
      &.forest {
        background-color: rgba(25, 135, 84, 0.15);
        color: var(--bs-success);
        border-color: rgba(25, 135, 84, 0.3);
        
        &.active {
          background-color: var(--bs-success);
          color: white;
          border-color: var(--bs-success);
        }
      }
      
      &.meadow {
        background-color: rgba(255, 193, 7, 0.15);
        color: var(--bs-warning);
        border-color: rgba(255, 193, 7, 0.3);
        
        &.active {
          background-color: var(--bs-warning);
          color: white;
          border-color: var(--bs-warning);
        }
      }
    }
  }
}

.analysis-tab-content {
  min-height: 500px;
}

.chart-container {
  border-radius: var(--bs-border-radius);
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.05);
}

.site-charts-container {
  .site-header {
    .site-zone-type {
      font-size: 0.9rem;
      font-weight: normal;
      
      &.forest {
        color: var(--bs-success);
      }
      
      &.meadow {
        color: var(--bs-warning);
      }
    }
  }
}

.custom-card-header {
  background-color: var(--bs-secondary);
  border-bottom: none;
  
  [data-bs-theme="dark"] & {
    background-color: rgba(var(--bs-secondary-rgb), 0.07);
  }
}
</style>