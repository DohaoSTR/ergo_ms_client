import { apiClient }    from '@/js/api/manager'
import { endpoints }    from '@/js/api/endpoints'

const BASE       = endpoints.bi.DatasetsList           // 'bi_analysis/bi_datasets/'
const TABLES     = `${BASE}tables/`                    // 'bi_analysis/bi_datasets/tables/'
const FIELDS     = `${BASE}fields/`                    // 'bi_analysis/bi_datasets/fields/'
const UPLOAD     = endpoints.bi.Upload                 // 'bi_analysis/bi_datasets/upload/'
const FINALIZE   = `${UPLOAD}finalize/`                // 'bi_analysis/bi_datasets/upload/finalize/'
const USER_FILES = endpoints.bi.UploadedFiles          // 'bi_analysis/bi_datasets/user-files/'

export default {
  // ===== Datasets CRUD =====
  listDatasets(params) {
    // GET /api/bi_analysis/bi_datasets/?...
    return apiClient.get(BASE, params)
  },
  createDataset(payload) {
    // POST /api/bi_analysis/bi_datasets/
    return apiClient.post(BASE, payload)
  },
  getDataset(id) {
    // GET /api/bi_analysis/bi_datasets/{id}/
    return apiClient.get(`${BASE}${id}/`)
  },
  updateDataset(id, payload) {
    return apiClient.patch(`${BASE}${id}/`, payload)
  },
  deleteDataset(id) {
    return apiClient.delete(`${BASE}${id}/`)
  },
  preview(datasetId, params = { limit: 10 }) {
    return apiClient.get(
      `${BASE}${datasetId}/preview/`,
      params
    )
  },

  // ===== Rename columns (fields) =====
  renameColumns(datasetId, renames) {
    // PATCH /api/bi_analysis/bi_datasets/{id}/rename_columns/
    return apiClient.patch(`${BASE}${datasetId}/rename_columns/`, { renames });
  },

  // ===== Tables =====
  listTables(params) {
    // GET /api/bi_analysis/bi_datasets/tables/?dataset=...
    return apiClient.get(TABLES, params)
  },
  createTable(payload) {
    // payload: { dataset, connection, table_name }
    return apiClient.post(TABLES, payload)
  },

  // ===== Fields =====
  listFields(params) {
    // GET /api/bi_analysis/bi_datasets/fields/?dataset=...
    return apiClient.get(FIELDS, params)
  },

  // ===== FileUpload =====
  uploadTempFile(formData) {
    // POST multipart /api/bi_analysis/bi_datasets/upload/
    return apiClient.upload(UPLOAD, formData)
  },
  finalizeUpload(payload) {
    // POST /api/bi_analysis/bi_datasets/upload/finalize/
    return apiClient.post(FINALIZE, payload)
  },
  listUserFiles() {
    // GET /api/bi_analysis/bi_datasets/user-files/
    return apiClient.getUploadedFiles(USER_FILES)
  },
  deleteFile(id) {
    // DELETE /api/bi_analysis/bi_datasets/upload/{id}/
    return apiClient.delete(`${UPLOAD}${id}/`)
  }
}