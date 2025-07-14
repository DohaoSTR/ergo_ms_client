import { apiClient } from '../../../js/api/manager'
import { endpoints } from '../../../js/api/endpoints'

export const categoryService = {
    getCategories() {
        return apiClient.get(endpoints.shortcodes.categories)
    },
    getCategory(id) {
        return apiClient.get(`${endpoints.shortcodes.categories}${id}/`)
    },
    createCategory(data) {
        return apiClient.post(endpoints.shortcodes.categories, data)
    },
    updateCategory(id, data) {
        return apiClient.put(`${endpoints.shortcodes.categories}${id}/`, data)
    },
    deleteCategory(id) {
        return apiClient.delete(`${endpoints.shortcodes.categories}${id}/`)
    },
}
