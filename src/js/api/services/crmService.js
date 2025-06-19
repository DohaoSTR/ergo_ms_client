import axios from 'axios';
import { endpoints } from '../endpoints';

// Используем импорт переменных окружения из Vue
const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api/';

export const crmService = {

    async getMonthlyStats(year = null) {
        try {
            const url = `${API_URL}${endpoints.crm.monthlyStats}`;
            const params = year ? { year } : {};

            const response = await axios.get(url, { params });
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении статистики задач:', error);
            throw error;
        }
    },

    async getPriorityStats() {
        try {
            const url = `${API_URL}${endpoints.crm.priorityStats}`;
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении статистики задач по приоритетам:', error);
            throw error;
        }
    },

    async getSectionStats() {
        try {
            const url = `${API_URL}${endpoints.crm.sectionStats}`;
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении статистики по секциям:', error);
            throw error;
        }
    },

    async getProjectCompletionStats() {
      try {
          const url = `${API_URL}${endpoints.crm.projectCompletionStats}`;
          const response = await axios.get(url);
          return response.data;
      } catch (error) {
          console.error('Ошибка при получении статистики завершенности проектов:', error);
          throw error;
      }
  },

  async getUserProductivityStats() {
      try {
          const url = `${API_URL}${endpoints.crm.userProductivityStats}`;
          const response = await axios.get(url);
          return response.data;
      } catch (error) {
          console.error('Ошибка при получении статистики продуктивности пользователей:', error);
          throw error;
      }
  },

    async getDeadlineAnalysis() {
      try {
          const url = `${API_URL}${endpoints.crm.deadlineAnalysis}`;
          const response = await axios.get(url);
          return response.data;
      } catch (error) {
          console.error('Ошибка при получении анализа дедлайнов:', error);
          throw error;
      }
  },

  async getTaskCreationTrend() {
      try {
          const url = `${API_URL}${endpoints.crm.taskCreationTrend}`;
          const response = await axios.get(url);
          return response.data;
      } catch (error) {
          console.error('Ошибка при получении тренда создания задач:', error);
          throw error;
      }
  },

  async getProjectTimelineStats() {
    try {
        const url = `${API_URL}${endpoints.crm.projectTimelineStats}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Ошибка при получении статистики временных рамок проектов:', error);
        throw error;
    }
  },

  async getCalendarActivityStats() {
    try {
        const url = `${API_URL}${endpoints.crm.calendarActivityStats}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Ошибка при получении статистики активности календаря:', error);
        throw error;
    }
  },
};

export default crmService;
