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
    return apiClient.post(BASE, payload)
  },
  joinTable({ datasetId, stagingName, leftColumn, rightColumn, joinType }) {
  return apiClient.post(
    `/bi_analysis/bi_datasets/${datasetId}/auto-join/`,
    {
      staging_name: stagingName,
      left_column: leftColumn,
      right_column: rightColumn,
      join_type: joinType
    }
  );
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
  },
  removeRelation({ datasetId, rightTableId }) {
  return apiClient.post(
    `bi_analysis/bi_datasets/${datasetId}/remove-relation/`,
    { right_table_id: rightTableId }
  )
},

  addTableToDataset(datasetId, fileId) {
    return apiClient.post(`${BASE}${datasetId}/add-table/`, { file_id: fileId });
  },

  updateDataset (id, payload) {
    return apiClient.patch(`bi_analysis/bi_datasets/${id}/`, payload)
  },

  // ===== AUTO-JOIN API =====
  getStagingTables(connectionId) {
    // GET /bi_analysis/bi_datasets/connection/{connectionId}/tables/
    return apiClient.get(`${BASE}connection/${connectionId}/tables/`)
  },

  createFromStaging(connectionId, tableName) {
    // POST /bi_analysis/bi_datasets/create-from-table/
    return apiClient.post(`${BASE}create-from-table/`, {
      connection_id: connectionId,
      table_name: tableName,
    })
  },

  joinStagingTable(datasetId, tableName) {
    // POST /bi_analysis/bi_datasets/join-table/
    return apiClient.post(`${BASE}join-table/`, {
      dataset_id: datasetId,
      table_name: tableName,
    })
  },
  createFromFile(connectionId, fileId) {
    return apiClient.post('/bi_analysis/bi_datasets/create-from-table/', {
        connection_id: connectionId,
        file_id: fileId,
    })
},
}