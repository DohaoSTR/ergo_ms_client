import axios from 'axios';
import { endpoints } from '../endpoints';

// Используем импорт переменных окружения из Vue
const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api/';

export const dashboardService = {

    async getExpertSystemMetrics() {
        try {
            const url = `${API_URL}${endpoints.expert_system.analytics.systemMetrics}`;
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении метрик экспертной системы:', error);
        }
    },

    async getExpertSkillsAnalytics() {
        try {
            const url = `${API_URL}${endpoints.expert_system.analytics.skillsData}`;
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении аналитики навыков:', error);
            throw error;
        }
    },

    async getExpertTopSkills(limit = 10) {
        try {
            const url = `${API_URL}${endpoints.expert_system.analytics.topSkills}`;
            const params = limit ? { limit } : {};
            const response = await axios.get(url, { params });
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении топ навыков:', error);
        }
    },

    async getExpertStudentsStats() {
        try {
            const url = `${API_URL}${endpoints.expert_system.analytics.studentsStats}`;
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении статистики студентов:', error);
            throw error;
        }
    },

    async getExpertTestingAnalytics() {
        try {
            const url = `${API_URL}${endpoints.expert_system.analytics.testingData}`;
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении данных тестирования:', error);
        }
    },

    async getExpertSystemDashboardData() {
        try {
            const [systemMetrics, skillsAnalytics, topSkills, studentsStats, testingData] = await Promise.all([
                this.getExpertSystemMetrics(),
                this.getExpertSkillsAnalytics(),
                this.getExpertTopSkills(),
                this.getExpertStudentsStats(),
                this.getExpertTestingAnalytics()
            ]);

            return {
                systemMetrics,
                skillsAnalytics,
                topSkills,
                studentsStats,
                testingData
            };
        } catch (error) {
            console.error('Ошибка при получении данных дашборда экспертной системы:', error);
            throw error;
        }
    },
};

export default dashboardService;
