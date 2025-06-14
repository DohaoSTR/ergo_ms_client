import { apiClient } from '@/js/api/manager'

export default {
  /** GET /api/bi_analysis/bi_connections/<id>/ */
  get(id) {
    return apiClient.get(`bi_analysis/bi_connections/${id}/`)
      .then(r => r.data);
  }
}