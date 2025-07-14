import { apiClient } from '../../../js/api/manager'
import { endpoints } from '../../../js/api/endpoints'

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
  getPageByFullPath(fullPath) {
    return apiClient.get('cms_shortcodes/pages/by_path/', { full_path: fullPath });
  },

  getCategories() {
    return apiClient.get(endpoints.categories.list)
  },
  getTags() {
    return apiClient.get(endpoints.tags.list)
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
  deletePage(slug) {
    return apiClient.delete(`${endpoints.shortcodes.pages}${slug}/`);
  },

  bulkCreateInstances(data) {
    return apiClient.post(endpoints.shortcodes.instances + 'bulk_create/', data)
  },

  getInstancesTree(params) {
    return apiClient.get(endpoints.shortcodes.instancesTree, params)
  },

  createSiteLayout(data) {
    return apiClient.post(endpoints.shortcodes.layout, data)
  },

  getSiteLayout() {
    return apiClient.get(endpoints.shortcodes.layout)
  },
  updateSiteLayout(id, data) {
    return apiClient.patch(`${endpoints.shortcodes.layout}${id}/`, data)
  },
  getLatestPages(categoryId, limit = 6) {
    return apiClient.get(
      endpoints.shortcodes.latest,
      { category_id: categoryId, limit },
      false
    )
  }
}
