import { apiClient } from '../manager'
import { endpoints } from '../endpoints'

export const shortcodesService = {
  // Базовые шаблоны
  getTemplates() {
    return apiClient.get(endpoints.shortcodes.templates)
  },
  getTemplate(id) {
    return apiClient.get(`${endpoints.shortcodes.templates}${id}/`)
  },
  createTemplate(data) {
    return apiClient.post(endpoints.shortcodes.templates, data)
  },
  updateTemplate(id, data) {
    return apiClient.put(`${endpoints.shortcodes.templates}${id}/`, data)
  },
  deleteTemplate(id) {
    return apiClient.delete(`${endpoints.shortcodes.templates}${id}/`)
  },

  // Страницы
  getPages() {
    return apiClient.get(endpoints.shortcodes.pages)
  },

  getPageSlug(slug) {
    return apiClient.get(`${endpoints.shortcodes.pages}${slug}/`)
  },

  // Экземпляры
  createInstance(data) {
    return apiClient.post(endpoints.shortcodes.instances, data)
  },

  getInstances(params = {}) {
    return apiClient.get(endpoints.shortcodes.instances, params)
  },

  createPage(data) {
    return apiClient.post(endpoints.shortcodes.pages, data)
  },

  bulkCreateInstances(data) {
    return apiClient.post(endpoints.shortcodes.instances + 'bulk_create/', data)
  },

  getInstancesTree(params) {
    return apiClient.get(endpoints.shortcodes.instancesTree, params)
  }
}
