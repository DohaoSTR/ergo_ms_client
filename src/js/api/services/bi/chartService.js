import { apiClient }    from '@/js/api/manager'
import { endpoints }    from '@/js/api/endpoints'

export default {
  /* GET список реальных колонок итоговой таблицы датасета */
  getColumns (datasetId) {
    return apiClient.get(endpoints.bi.ChartsColumns(datasetId))
  }
}