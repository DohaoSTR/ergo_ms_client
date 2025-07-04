import axios from 'axios'

// Генерация отчета по стратегическим проектам
export const generateStrategicReport = async (filters) => {
  return axios.post('/api/crm/strategic-projects/reports/generate/', filters, {
    responseType: 'blob'
  })
}

// Получение списка последних сформированных отчетов
export const getRecentReports = async (limit = 10) => {
  return axios.get('/api/crm/strategic-projects/reports/recent/', {
    params: { limit }
  })
}

// Скачивание отчета
export const downloadReport = async (reportId) => {
  return axios.get(`/api/crm/strategic-projects/reports/${reportId}/download/`, {
    responseType: 'blob'
  })
}

// Просмотр отчета
export const viewReport = async (reportId) => {
  return axios.get(`/api/crm/strategic-projects/reports/${reportId}/view/`)
}

// Получение статистики по проектам
export const getProjectStatistics = async (filters = {}) => {
  return axios.get('/api/crm/strategic-projects/statistics/', {
    params: filters
  })
}

// Получение данных для графиков
export const getChartData = async (chartType, filters = {}) => {
  return axios.get(`/api/crm/strategic-projects/charts/${chartType}/`, {
    params: filters
  })
}

// Экспорт данных в различных форматах
export const exportProjectData = async (format, filters = {}) => {
  return axios.post('/api/crm/strategic-projects/export/', {
    format,
    ...filters
  }, {
    responseType: 'blob'
  })
} 