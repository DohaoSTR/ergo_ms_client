import axios from 'axios'

// Получение списка программ развития
export const getDevelopmentPrograms = async (params = {}) => {
  return axios.get('/api/crm/strategic-projects/development-programs/', { params })
}

// Получение конкретной программы
export const getDevelopmentProgram = async (id) => {
  return axios.get(`/api/crm/strategic-projects/development-programs/${id}/`)
}

// Создание программы развития
export const createDevelopmentProgram = async (data) => {
  return axios.post('/api/crm/strategic-projects/development-programs/', data)
}

// Импорт программы из файла
export const importDevelopmentProgram = async (formData) => {
  return axios.post('/api/crm/strategic-projects/development-programs/import_program/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// Получение тем программы развития
export const getProgramTopics = async (params = {}) => {
  return axios.get('/api/crm/strategic-projects/program-topics/', { params })
}

// Получение конкретной темы
export const getProgramTopic = async (id) => {
  return axios.get(`/api/crm/strategic-projects/program-topics/${id}/`)
}

// Бронирование темы и создание проекта
export const reserveTopicAndCreateProject = async (topicId) => {
  return axios.post(`/api/crm/strategic-projects/program-topics/${topicId}/reserve_and_create_project/`)
}

// Обновление темы
export const updateProgramTopic = async (id, data) => {
  return axios.patch(`/api/crm/strategic-projects/program-topics/${id}/`, data)
} 