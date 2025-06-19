import { ref } from 'vue'
import { apiClient } from '@/js/api/manager'

export function useDbTablesList() {
  const dbTables = ref([])
  const isDbLoading = ref(false)

  async function loadDbTables(connectionId) {
    if (!connectionId) return
    isDbLoading.value = true
    const res = await apiClient.get(`bi_analysis/bi_connections/${connectionId}/tables/`)
    if (res.success) {
      dbTables.value = res.data
    }
    isDbLoading.value = false
  }

  return {
    dbTables,
    isDbLoading,
    loadDbTables
  }
}
