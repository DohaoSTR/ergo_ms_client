import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

export const uploadStorageData = async (formData) => {
  const url = endpoints.bi.uploadStorageData
  return await apiClient.client.post(url, formData)
}

export const getStorageDataList = async () => {
  const url = endpoints.bi.getStorageList
  return await apiClient.client.get(url)
}