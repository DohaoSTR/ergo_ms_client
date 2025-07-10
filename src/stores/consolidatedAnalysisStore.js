import { defineStore } from 'pinia'
import { getSiteById, getDescriptions } from '@/js/api/services/bio-index'
import { handleApiError } from '@/pages/bio/js/bio-helpers'

const STORAGE_KEY = 'consolidated-analysis-data'
const ANALYSIS_RESULTS_STORAGE_KEY = 'consolidated-analysis-results-data'
const SCALES_CHARTS_STORAGE_KEY = 'consolidated-scales-charts-data'
const SPECTRUM_CHARTS_STORAGE_KEY = 'consolidated-spectrum-charts-data'
const CLASSIFICATION_CHARTS_STORAGE_KEY = 'consolidated-classification-charts-data'

export const useConsolidatedAnalysisStore = defineStore('consolidatedAnalysis', {
  state: () => {
    // Пытаемся восстановить данные из localStorage
    const storedData = localStorage.getItem(STORAGE_KEY)
    const storedAnalysisResults = localStorage.getItem(ANALYSIS_RESULTS_STORAGE_KEY)
    const storedScalesChartsData = localStorage.getItem(SCALES_CHARTS_STORAGE_KEY)
    const storedSpectrumChartsData = localStorage.getItem(SPECTRUM_CHARTS_STORAGE_KEY)
    const storedClassificationChartsData = localStorage.getItem(CLASSIFICATION_CHARTS_STORAGE_KEY)
    
    const defaultState = {
      sites: [],
      tableData: [],
      // Добавляем хранение результатов и настроек анализа
      analysisResults: null,
      analysisSettings: {
        selectedElements: [], // По умолчанию выбраны эти элементы
        showAllSitesChart: true,
        showIndividualSiteCharts: true,
        showClassification: true
      },
      scalesChartsData: {},
      spectrumChartsData: {},
      classificationChartsData: {}
    }

    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData)
        
        // Проверяем, есть ли сохраненные результаты анализа
        let parsedAnalysisResults = null;
        if (storedAnalysisResults) {
          try {
            parsedAnalysisResults = JSON.parse(storedAnalysisResults);
          } catch (e) {
            console.error('Failed to parse stored analysis results:', e);
          }
        }
        
        // Проверяем, есть ли сохраненные данные графиков шкал
        let parsedScalesChartsData = {};
        if (storedScalesChartsData) {
          try {
            parsedScalesChartsData = JSON.parse(storedScalesChartsData);
          } catch (e) {
            console.error('Failed to parse stored scales charts data:', e);
          }
        }
        
        // Проверяем, есть ли сохраненные данные графиков спектров
        let parsedSpectrumChartsData = {};
        if (storedSpectrumChartsData) {
          try {
            parsedSpectrumChartsData = JSON.parse(storedSpectrumChartsData);
          } catch (e) {
            console.error('Failed to parse stored spectrum charts data:', e);
          }
        }
        
        // Проверяем, есть ли сохраненные данные классификаций
        let parsedClassificationChartsData = {};
        if (storedClassificationChartsData) {
          try {
            parsedClassificationChartsData = JSON.parse(storedClassificationChartsData);
          } catch (e) {
            console.error('Failed to parse stored classification charts data:', e);
          }
        }
        
        return {
          ...defaultState,
          ...parsedData,
          analysisResults: parsedAnalysisResults,
          scalesChartsData: parsedScalesChartsData,
          spectrumChartsData: parsedSpectrumChartsData,
          classificationChartsData: parsedClassificationChartsData
        }
      } catch (e) {
        console.error('Failed to parse stored data:', e)
        return defaultState
      }
    }

    return defaultState
  },

  getters: {
    // Получение списка уникальных id площадок
    siteIds: (state) => state.sites.map(site => site.id),
    
    // Получение пустых площадок (без видов)
    emptySiteIds: (state) => {
      const emptySites = []
      
      if (state.sites.length === 0) {
        return []
      }

      for (const site of state.sites) {
        const siteId = site.id
        const hasAnyValue = state.tableData.some((row) => {
          if (row.type === 'taxon') return false
          const abundanceKey = `abundance_${siteId}`
          return row[abundanceKey] !== undefined && 
                 row[abundanceKey] !== null && 
                 row[abundanceKey] !== ''
        })

        if (!hasAnyValue) {
          emptySites.push(siteId)
        }
      }

      return emptySites
    },

    // Получение площадок с данными
    nonEmptySites: (state) => {
      const emptySiteIds = useConsolidatedAnalysisStore().emptySiteIds
      return state.sites.filter(site => !emptySiteIds.includes(site.id))
    },

    emptySpeciesIds: (state) => {
      const emptySpecies = []

      if (state.tableData.length === 0) {
        return []
      }

      for (const row of state.tableData) {
        if (row.type === 'taxon') continue

        let hasAnyValue = false
        for (const site of state.sites) {
          const abundanceKey = `abundance_${site.id}`
          if (row[abundanceKey] !== undefined && 
              row[abundanceKey] !== null && 
              row[abundanceKey] !== '') {
            hasAnyValue = true
            break
          }
        }

        if (!hasAnyValue) {
          emptySpecies.push(row.id)
        }
      }

      return emptySpecies
    },
    
    // Проверка наличия данных для анализа 
    hasAnalysisData: (state) => {
      return state.sites.length > 0 && 
             state.tableData.some(item => !item.type || item.type !== 'taxon');
    }
  },

  actions: {
    // Сохранение состояния в localStorage
    saveToLocalStorage() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          sites: this.sites,
          tableData: this.tableData,
          analysisSettings: this.analysisSettings
        }))
        
        // Сохраняем результаты анализа в отдельном ключе
        if (this.analysisResults) {
          localStorage.setItem(ANALYSIS_RESULTS_STORAGE_KEY, JSON.stringify(this.analysisResults))
        } else {
          localStorage.removeItem(ANALYSIS_RESULTS_STORAGE_KEY)
        }
        
        // Сохраняем данные графиков шкал в отдельном ключе
        if (Object.keys(this.scalesChartsData).length > 0) {
          localStorage.setItem(SCALES_CHARTS_STORAGE_KEY, JSON.stringify(this.scalesChartsData))
        } else {
          localStorage.removeItem(SCALES_CHARTS_STORAGE_KEY)
        }
        
        // Сохраняем данные графиков спектров в отдельном ключе
        if (Object.keys(this.spectrumChartsData).length > 0) {
          localStorage.setItem(SPECTRUM_CHARTS_STORAGE_KEY, JSON.stringify(this.spectrumChartsData))
        } else {
          localStorage.removeItem(SPECTRUM_CHARTS_STORAGE_KEY)
        }
        
        // Сохраняем данные классификаций в отдельном ключе
        if (Object.keys(this.classificationChartsData).length > 0) {
          localStorage.setItem(CLASSIFICATION_CHARTS_STORAGE_KEY, JSON.stringify(this.classificationChartsData))
        } else {
          localStorage.removeItem(CLASSIFICATION_CHARTS_STORAGE_KEY)
        }
      } catch (e) {
        console.error('Failed to save state to localStorage:', e)
      }
    },

    // Очистка всех данных
    resetData() {
      this.sites = []
      this.tableData = []
      // Очищаем результаты анализа
      this.clearAnalysisResults()
      this.saveToLocalStorage()
    },
    
    // Очистка результатов анализа
    clearAnalysisResults() {
      this.analysisResults = null
      this.scalesChartsData = {}
      this.spectrumChartsData = {}
      this.classificationChartsData = {}
      
      // Удаляем результаты анализа и данных графиков из localStorage
      try {
        localStorage.removeItem(ANALYSIS_RESULTS_STORAGE_KEY)
        localStorage.removeItem(SCALES_CHARTS_STORAGE_KEY)
        localStorage.removeItem(SPECTRUM_CHARTS_STORAGE_KEY)
        localStorage.removeItem(CLASSIFICATION_CHARTS_STORAGE_KEY)
      } catch (e) {
        console.error('Failed to remove analysis results from localStorage:', e)
      }
    },
    
    // Обновление настроек анализа
    updateAnalysisSettings(settings) {
      this.analysisSettings = {
        ...this.analysisSettings,
        ...settings
      }
      this.saveToLocalStorage()
    },
    
    // Сохранение результатов анализа
    saveAnalysisResults(results) {
      this.analysisResults = results
      
      // Сохраняем результаты анализа в localStorage
      try {
        localStorage.setItem(ANALYSIS_RESULTS_STORAGE_KEY, JSON.stringify(results))
      } catch (e) {
        console.error('Failed to save analysis results to localStorage:', e)
      }
    },
    
    // Сохранение данных графика шкал
    saveScalesChartData(key, data) {
      this.scalesChartsData[key] = data
      
      // Обновляем данные в localStorage
      try {
        localStorage.setItem(SCALES_CHARTS_STORAGE_KEY, JSON.stringify(this.scalesChartsData))
      } catch (e) {
        console.error('Failed to save scales chart data to localStorage:', e)
      }
    },
    
    // Сохранение данных графика спектра
    saveSpectrumChartData(key, data) {
      this.spectrumChartsData[key] = data
      
      // Обновляем данные в localStorage
      try {
        localStorage.setItem(SPECTRUM_CHARTS_STORAGE_KEY, JSON.stringify(this.spectrumChartsData))
      } catch (e) {
        console.error('Failed to save spectrum chart data to localStorage:', e)
      }
    },

    // Сохранение данных классификации
    saveClassificationChartData(key, data) {
      this.classificationChartsData[key] = data
      
      // Обновляем данные в localStorage
      try {
        localStorage.setItem(CLASSIFICATION_CHARTS_STORAGE_KEY, JSON.stringify(this.classificationChartsData))
      } catch (e) {
        console.error('Failed to save classification chart data to localStorage:', e)
      }
    },

    // Генерация уникального ID для новой площадки
    generateUniqueId() {
      const maxId = this.sites.reduce((max, site) => {
        const id = typeof site.id === 'number' ? site.id : parseInt(site.id, 10)
        return isNaN(id) ? max : Math.max(max, id)
      }, 0)

      return maxId + 1
    },

    // Проверка на дублирование площадки
    checkDuplicateSite(siteNumber, zoneType) {
      return this.sites.some(site => 
        site.site_number === siteNumber && site.zone_type === zoneType
      )
    },

    // Загрузка данных площадки по ID
    async fetchSiteById(id, toast) {
      try {
        const response = await getSiteById(id)

        if (response.success) {
          return response.data
        }

        if (response.status === 404) {
          return null
        }

        throw new Error(handleApiError(
          response, 
          `Ошибка при загрузке площадки с ID: ${id}`, 
          toast
        ))
      } catch (err) {
        handleApiError(err, `Ошибка при загрузке площадки с ID: ${id}`, toast)
        return null
      }
    },

    // Загрузка описания растительности для площадки
    async fetchSiteDescriptions(siteNumber, zoneType, toast) {
      try {
        const response = await getDescriptions(siteNumber, zoneType)

        if (response.success) {
          return response.data
        }

        if (response.status === 404) {
          return []
        }

        throw new Error(
          handleApiError(
            response, 
            `Ошибка при загрузке описания растительности для площадки ${siteNumber}`, 
            toast
          )
        )
      } catch (err) {
        handleApiError(
          err, 
          `Ошибка при загрузке описания растительности для площадки ${siteNumber}`, 
          toast
        )
        return []
      }
    },

    // Объединение данных описаний в таблицу
    mergeDataIntoTable(descriptionsMap) {
      const speciesMap = new Map()

      for (const siteId in descriptionsMap) {
        const descriptions = descriptionsMap[siteId]

        for (const desc of descriptions) {
          const speciesKey = `${desc.title}_${desc.author}_${desc.tier}`

          if (!speciesMap.has(speciesKey)) {
            speciesMap.set(speciesKey, {
              id: `species_${speciesMap.size + 1}`,
              title: desc.title,
              author: desc.author,
              tier: desc.tier,
            })
          }

          const species = speciesMap.get(speciesKey)
          species[`abundance_${siteId}`] = desc.abundance
        }
      }

      return Array.from(speciesMap.values()).sort((a, b) => 
        a.title.localeCompare(b.title)
      )
    },

    // Загрузка данных площадок из API
    async loadSiteData(siteIds, toast) {
      // Если siteIds пустой, возвращаем пустой результат для начала работы с нуля
      if (!siteIds || siteIds.length === 0) {
        return {
          success: true,
          sites: [],
          tableData: [],
          errorMessage: null
        }
      }

      const sitesDetails = []
      const notFoundIds = []
      const descriptionsMap = {}

      for (const id of siteIds) {
        const siteDetails = await this.fetchSiteById(id, toast)

        if (siteDetails) {
          sitesDetails.push(siteDetails)

          const descriptions = await this.fetchSiteDescriptions(
            siteDetails.site_number,
            siteDetails.zone_type,
            toast
          )
          descriptionsMap[siteDetails.id] = descriptions
        } else {
          notFoundIds.push(id)
        }
      }

      // Обработка ошибок
      let errorMessage = null
      if (sitesDetails.length === 0 && notFoundIds.length > 0) {
        errorMessage = `Не удалось найти площадки с ID: ${notFoundIds.join(', ')}`
        
        return {
          success: false,
          errorMessage
        }
      } else if (notFoundIds.length > 0) {
        errorMessage = `Не удалось найти площадки с ID: ${notFoundIds.join(', ')}`
        
        // Частичный успех - некоторые площадки найдены
        if (toast) {
          toast.error(errorMessage)
        }
      }

      // Сортировка площадок по номерам
      const sortedSites = sitesDetails.sort((a, b) => {
        const siteNumberCompare = a.site_number - b.site_number

        if (siteNumberCompare === 0) {
          return a.zone_type.localeCompare(b.zone_type)
        }

        return siteNumberCompare
      })

      const tableData = this.mergeDataIntoTable(descriptionsMap)

      return {
        success: true,
        sites: sortedSites,
        tableData,
        errorMessage
      }
    },

    // Создание новой таблицы из выбранных площадок
    async createNewTable(siteIds, toast) {
      const result = await this.loadSiteData(siteIds, toast)
      
      if (result.success) {
        this.sites = result.sites
        this.tableData = result.tableData
        // Очищаем результаты анализа при создании новой таблицы
        this.clearAnalysisResults()
        this.saveToLocalStorage()
      }
      
      return {
        success: result.success,
        errorMessage: result.errorMessage
      }
    },

    // Добавление площадок в существующую таблицу
    async addSitesToTable(siteIds, toast) {
      // Если таблица пустая, создаем новую
      if (this.sites.length === 0) {
        return await this.createNewTable(siteIds, toast)
      }

      // Загружаем данные выбранных площадок
      const result = await this.loadSiteData(siteIds, toast)
      
      if (!result.success) {
        return result
      }
      
      // Получаем существующие ID для обновления
      const existingIds = this.sites.map(site => site.id)
      
      // Обновляем ID новых площадок, чтобы избежать конфликтов
      const idMapping = {}  // Старый ID -> Новый ID
      const newSites = result.sites.map(site => {
        // Если ID уже существует в таблице, генерируем новый
        if (existingIds.includes(site.id)) {
          const newId = this.generateUniqueId()
          idMapping[site.id] = newId
          return { ...site, id: newId }
        }
        return site
      })
      
      // Обновляем ссылки на ID в данных таблицы
      const newTableData = result.tableData.map(row => {
        const newRow = { ...row }
        
        // Обновляем ключи abundance с новыми ID
        Object.entries(idMapping).forEach(([oldId, newId]) => {
          const oldKey = `abundance_${oldId}`
          if (oldKey in newRow) {
            const newKey = `abundance_${newId}`
            newRow[newKey] = newRow[oldKey]
            delete newRow[oldKey]
          }
        })
        
        return newRow
      })
      
      // Объединяем данные
      this.sites = [...this.sites, ...newSites]
      this.tableData = this.mergeTableData(this.tableData, newTableData)
      
      // Очищаем результаты анализа при изменении данных
      this.clearAnalysisResults()
      this.saveToLocalStorage()
      
      return {
        success: true,
        addedSites: newSites.length,
        skippedSites: 0
      }
    },
    
    // Объединение двух наборов tableData без изменения порядка
    mergeTableData(existingData, newData) {
      const speciesMap = new Map()
      
      // Добавляем существующие виды в карту с сохранением порядка
      existingData.forEach(item => {
        if (item.type === 'taxon') {
          speciesMap.set(`taxon_${item.taxon_name}`, item)
        } else {
          const speciesKey = `${item.title}_${item.author}_${item.tier}`
          speciesMap.set(speciesKey, item)
        }
      })
      
      // Добавляем новые виды или обновляем существующие
      newData.forEach(item => {
        if (item.type === 'taxon') {
          const taxonKey = `taxon_${item.taxon_name}`
          if (!speciesMap.has(taxonKey)) {
            speciesMap.set(taxonKey, item)
          }
        } else {
          const speciesKey = `${item.title}_${item.author}_${item.tier}`
          
          if (speciesMap.has(speciesKey)) {
            // Объединяем данные о видах (обилие для разных площадок)
            const existingItem = speciesMap.get(speciesKey)
            speciesMap.set(speciesKey, { ...existingItem, ...item })
          } else {
            speciesMap.set(speciesKey, item)
          }
        }
      })
      
      // Сначала добавляем все существующие элементы в том же порядке
      const result = existingData.map(item => {
        const key = item.type === 'taxon' 
          ? `taxon_${item.taxon_name}` 
          : `${item.title}_${item.author}_${item.tier}`
          
        return speciesMap.get(key)
      })
      
      // Затем добавляем новые элементы, которых не было в исходном массиве
      newData.forEach(item => {
        const key = item.type === 'taxon' 
          ? `taxon_${item.taxon_name}` 
          : `${item.title}_${item.author}_${item.tier}`
          
        if (!existingData.some(existingItem => {
          const existingKey = existingItem.type === 'taxon' 
            ? `taxon_${existingItem.taxon_name}` 
            : `${existingItem.title}_${existingItem.author}_${existingItem.tier}`
          return existingKey === key
        })) {
          result.push(speciesMap.get(key))
        }
      })
      
      return result
    },

    // Добавление площадки
    addSite(siteData, insertAfterIndex = null) {
      // Проверка на дубликат
      if (this.checkDuplicateSite(siteData.site_number, siteData.zone_type)) {
        return {
          success: false,
          errorMessage: 'Такая площадка уже существует'
        }
      }

      const newSite = {
        ...siteData,
        id: this.generateUniqueId(),
        coordinates:
          siteData.latitude && siteData.longitude
            ? `${siteData.latitude}, ${siteData.longitude}`
            : '-',
      }

      if (insertAfterIndex === -1) {
        this.sites.unshift(newSite)
      } else if (
        insertAfterIndex !== null &&
        insertAfterIndex >= 0 &&
        insertAfterIndex < this.sites.length
      ) {
        this.sites.splice(insertAfterIndex + 1, 0, newSite)
      } else {
        this.sites.push(newSite)
      }

      // Очищаем результаты анализа при изменении данных
      this.clearAnalysisResults()
      this.saveToLocalStorage()
      return {
        success: true,
        site: newSite
      }
    },

    // Удаление площадки
    removeSite(siteId) {
      const siteIndex = this.sites.findIndex(site => site.id === siteId)
      if (siteIndex === -1) {
        return false
      }

      // Удаляем площадку
      this.sites.splice(siteIndex, 1)

      // Удаляем данные об обилии для этой площадки из таблицы
      const abundanceKey = `abundance_${siteId}`
      this.tableData.forEach(row => {
        if (abundanceKey in row) {
          delete row[abundanceKey]
        }
      })

      // Очищаем результаты анализа при изменении данных
      this.clearAnalysisResults()
      this.saveToLocalStorage()
      return true
    },

    // Добавление вида растения
    addSpecies(speciesData, insertRowAfterIndex = null) {
      if (!speciesData || speciesData.length === 0) {
        return {
          success: true,
          addedCount: 0
        }
      }

      let baseId = this.tableData.reduce((max, row) => {
        let id = row.id
        if (typeof id === 'string' && id.startsWith('species_')) {
          id = parseInt(id.substring(8), 10)
        } else if (typeof id === 'string') {
          id = parseInt(id, 10)
        }
        return isNaN(id) ? max : Math.max(max, id)
      }, 0)

      const newSpecies = speciesData.map(species => {
        baseId++
        return {
          id: `species_${baseId}`,
          title: species.title,
          author: species.author,
          tier: species.tier,
        }
      })

      let updatedData = [...this.tableData]

      if (insertRowAfterIndex === -1) {
        updatedData = [...newSpecies, ...updatedData]
      } else if (
        insertRowAfterIndex !== null &&
        insertRowAfterIndex >= 0 &&
        insertRowAfterIndex < updatedData.length
      ) {
        updatedData.splice(insertRowAfterIndex + 1, 0, ...newSpecies)
      } else {
        updatedData = [...updatedData, ...newSpecies]
      }

      this.tableData = updatedData
      // Очищаем результаты анализа при изменении данных
      this.clearAnalysisResults()
      this.saveToLocalStorage()

      return {
        success: true,
        addedCount: newSpecies.length
      }
    },

    // Добавление таксона
    addTaxon(taxonName, insertRowAfterIndex = null) {
      const baseId = this.tableData.reduce((max, row) => {
        let id = row.id
        if (typeof id === 'string' && id.startsWith('taxon_')) {
          id = parseInt(id.substring(6), 10)
        }
        return isNaN(id) ? max : Math.max(max, id)
      }, 0)

      const newTaxon = {
        id: `taxon_${baseId + 1}`,
        type: 'taxon',
        taxon_name: taxonName,
        isEditing: false
      }

      let updatedData = [...this.tableData]

      if (insertRowAfterIndex === -1) {
        updatedData = [newTaxon, ...updatedData]
      } else if (
        insertRowAfterIndex !== null &&
        insertRowAfterIndex >= 0 &&
        insertRowAfterIndex < updatedData.length
      ) {
        updatedData.splice(insertRowAfterIndex + 1, 0, newTaxon)
      } else {
        updatedData = [...updatedData, newTaxon]
      }

      this.tableData = updatedData
      this.saveToLocalStorage()

      return {
        success: true
      }
    },

    // Обновление данных таблицы
    updateTableData(newData) {
      this.tableData = newData
      // Очищаем результаты анализа при изменении данных
      this.clearAnalysisResults()
      this.saveToLocalStorage()
    },

    updateSites(newSites) {
      this.sites = newSites
      // Очищаем результаты анализа при изменении данных
      this.clearAnalysisResults()
      this.saveToLocalStorage()
    },

    // Обновленияе значения отдельной ячейки
    updateCellValue(rowIndex, field, value) {
      if (rowIndex < 0 || rowIndex >= this.tableData.length) return;
      
      this.tableData[rowIndex][field] = value;
      // Очищаем результаты анализа при изменении данных
      this.clearAnalysisResults()
      this.saveToLocalStorage();
    },

    // Удаление строки таблицы
    removeRow(rowId) {
      const rowIndex = this.tableData.findIndex(row => row.id === rowId)
      if (rowIndex === -1) {
        return false
      }

      this.tableData.splice(rowIndex, 1)
      // Очищаем результаты анализа при изменении данных
      this.clearAnalysisResults()
      this.saveToLocalStorage()
      return true
    },

    // Удаление всех неиспользуемых видов (видов, отсутствующих на всех площадках)
    removeEmptySpecies() {
      const emptyIds = this.emptySpeciesIds
      
      if (emptyIds.length === 0) {
        return {
          success: true,
          removedCount: 0
        }
      }
      
      // Фильтруем tableData, удаляя все пустые виды
      this.tableData = this.tableData.filter(row => {
        // Таксоны не трогаем
        if (row.type === 'taxon') return true
        
        // Удаляем виды, id которых есть в списке пустых
        return !emptyIds.includes(row.id)
      })
      
      // Очищаем результаты анализа при изменении данных
      this.clearAnalysisResults()
      this.saveToLocalStorage()
      
      return {
        success: true,
        removedCount: emptyIds.length
      }
    },
    
    // Удаление всех пустых площадок (площадок без описаний растительности)
    removeEmptySites() {
      const emptySiteIds = this.emptySiteIds
      
      if (emptySiteIds.length === 0) {
        return {
          success: true,
          removedCount: 0
        }
      }
      
      // Фильтруем sites, удаляя все пустые площадки
      this.sites = this.sites.filter(site => !emptySiteIds.includes(site.id))
      
      // Также удаляем столбцы abundance для этих площадок из tableData
      for (const siteId of emptySiteIds) {
        const abundanceKey = `abundance_${siteId}`
        this.tableData.forEach(row => {
          if (abundanceKey in row) {
            delete row[abundanceKey]
          }
        })
      }
      
      // Очищаем результаты анализа при изменении данных
      this.clearAnalysisResults()
      this.saveToLocalStorage()
      
      return {
        success: true,
        removedCount: emptySiteIds.length
      }
    },

    // Добавляем необходимые методы для перетаскивания строк и столбцов
    updateSitesOrder(fromIndex, toIndex) {
      const updatedSites = [...this.sites];
      const movedSite = updatedSites.splice(fromIndex, 1)[0];
      updatedSites.splice(toIndex, 0, movedSite);
      
      this.sites = updatedSites;
      this.saveToLocalStorage();
    },

    updateRowsOrder(fromIndex, toIndex) {
      const updatedData = [...this.tableData];
      const draggedRowData = updatedData.splice(fromIndex, 1)[0];
      updatedData.splice(toIndex, 0, draggedRowData);
      
      this.tableData = updatedData;
      this.saveToLocalStorage();
    }
  }
}) 