import { apiClient }    from '@/js/api/manager'
import { endpoints }    from '@/js/api/endpoints'

export default {
  getColumns(datasetId) {
    return apiClient.get(endpoints.bi.ChartsColumns(datasetId))
  },
  getRows(datasetId) {
    return apiClient.get(endpoints.bi.ChartsRows(datasetId))
  },
  getDatasetRows(datasetId) {
    return apiClient.get(`/bi_analysis/bi_datasets/${datasetId}/rows/`)
  },
  getChart(chartId) {
    return apiClient.get(`/bi_analysis/bi_charts/${chartId}/`)
  },
  getDataset(datasetId) {
    return apiClient.get(`/bi_analysis/bi_datasets/${datasetId}/`)
  },
  createChart(payload) {
    return apiClient.post('/bi_analysis/bi_charts/', { ...payload, params: payload.params ?? payload.settings });
  },
  updateChart(id, payload) {
    return apiClient.put(`/bi_analysis/bi_charts/${id}/`, { ...payload, params: payload.params ?? payload.settings });
  }
}
