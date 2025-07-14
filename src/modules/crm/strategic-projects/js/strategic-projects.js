import axios from 'axios'

// Получение списка стратегических проектов
export const getStrategicProjects = async (params = {}) => {
  return axios.get('/api/crm/strategic-projects/strategic-projects/', { params })
}

// Получение конкретного проекта
export const getStrategicProject = async (id) => {
  return axios.get(`/api/crm/strategic-projects/strategic-projects/${id}/`)
}

// Создание проекта
export const createStrategicProject = async (data) => {
  return axios.post('/api/crm/strategic-projects/strategic-projects/', data)
}

// Обновление проекта
export const updateStrategicProject = async (id, data) => {
  return axios.patch(`/api/crm/strategic-projects/strategic-projects/${id}/`, data)
}

// Удаление проекта
export const deleteStrategicProject = async (id) => {
  return axios.delete(`/api/crm/strategic-projects/strategic-projects/${id}/`)
}

// Отправка проекта на утверждение
export const submitProjectForApproval = async (id) => {
  return axios.post(`/api/crm/strategic-projects/strategic-projects/${id}/submit_for_approval/`)
}

// Утверждение проекта
export const approveProject = async (id) => {
  return axios.post(`/api/crm/strategic-projects/strategic-projects/${id}/approve/`)
}

// Отклонение проекта
export const rejectProject = async (id, comment) => {
  return axios.post(`/api/crm/strategic-projects/strategic-projects/${id}/reject/`, { comment })
}

// Запуск проекта
export const startProject = async (id) => {
  return axios.post(`/api/crm/strategic-projects/strategic-projects/${id}/start_project/`)
}

// Завершение проекта
export const completeProject = async (id) => {
  return axios.post(`/api/crm/strategic-projects/strategic-projects/${id}/complete_project/`)
}

// Получение статистики
export const getProjectStatistics = async () => {
  return axios.get('/api/crm/strategic-projects/strategic-projects/statistics/')
}

// Генерация отчета
export const generateReport = async (data) => {
  return axios.post('/api/crm/strategic-projects/strategic-projects/generate_report/', data, {
    responseType: 'blob'
  })
} 