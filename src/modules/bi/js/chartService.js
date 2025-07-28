import { apiClient }    from '@/js/api/manager'

export default {
  getColumns(datasetId) {
    return apiClient.get(`/bi_analysis/bi_datasets/${datasetId}/columns/`)
  },
  getRows(datasetId) {
    return apiClient.get(`/bi_analysis/bi_datasets/${datasetId}/rows/`)
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
  },
  getDatasetRowsAgg(datasetId, fields) {
    return apiClient.post(`/bi_analysis/bi_datasets/${datasetId}/rows-agg/`, { fields })
  }
}
