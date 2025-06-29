import axios from "axios";
import Cookies from 'js-cookie';

// Используем правильный базовый URL с портом API сервера
const API_BASE_URL = `http://${import.meta.env.VITE_API_HOST || 'localhost'}:${import.meta.env.VITE_API_PORT || '8000'}/api`;

class ProjectManagementApi {
    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            }
        });

        // Добавляем токен авторизации к каждому запросу
        this.client.interceptors.request.use(
            (config) => {
                // Используем тот же способ получения токена, что и в manager.js
                const token = Cookies.get('token');
                
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                } else {
                    console.warn('Токен авторизации не найден!')
                }
                
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );
    }

    // ПРОЕКТЫ
    async getProjects(params = {}) {
        return await this.client.get('/crm/api/projects/', { params });
    }

    async getProject(id) {
        return await this.client.get(`/crm/api/projects/${id}/`);
    }

    async createProject(data) {
        return await this.client.post('/crm/api/projects/', data);
    }

    async updateProject(id, data) {
        return await this.client.patch(`/crm/api/projects/${id}/`, data);
    }

    async deleteProject(id) {
        return await this.client.delete(`/crm/api/projects/${id}/`);
    }

    async getProjectTasks(projectId) {
        return await this.client.get(`/crm/api/projects/${projectId}/tasks/`);
    }

    async getProjectStatistics(projectId) {
        return await this.client.get(`/crm/api/projects/${projectId}/statistics/`);
    }

    async addProjectMember(projectId, userData) {
        return await this.client.post(`/crm/api/projects/${projectId}/add_member/`, userData);
    }

    async removeProjectMember(projectId, userId) {
        return await this.client.delete(`/crm/api/projects/${projectId}/remove_member/`, {
            data: { user_id: userId }
        });
    }

    // ЗАДАЧИ
    async getTasks(params = {}) {
        return await this.client.get('/crm/api/tasks/', { params });
    }

    async getTask(id) {
        return await this.client.get(`/crm/api/tasks/${id}/`);
    }

    async createTask(data) {
        return await this.client.post('/crm/api/tasks/', data);
    }

    async updateTask(id, data) {
        return await this.client.patch(`/crm/api/tasks/${id}/`, data);
    }

    async deleteTask(id) {
        return await this.client.delete(`/crm/api/tasks/${id}/`);
    }

    async changeTaskStatus(taskId, status) {
        return await this.client.post(`/crm/api/tasks/${taskId}/change_status/`, { status });
    }

    // КАЛЕНДАРЬ
    async getTasksForCalendar(params = {}) {
        return await this.client.get('/crm/api/tasks/calendar/', { params });
    }

    async createTaskFromCalendar(data) {
        return await this.client.post('/crm/api/tasks/create_from_calendar/', data);
    }

    // КАНБАН
    async getKanbanTasks(params = {}) {
        return await this.client.get('/crm/api/tasks/kanban/', { params });
    }

    async updateTaskKanbanOrder(taskId, data) {
        return await this.client.post(`/crm/api/tasks/${taskId}/update_kanban_order/`, data);
    }

    // КОММЕНТАРИИ
    async getTaskComments(taskId) {
        return await this.client.get('/crm/api/task-comments/', {
            params: { task_id: taskId }
        });
    }

    async addTaskComment(taskId, content) {
        return await this.client.post(`/crm/api/tasks/${taskId}/add_comment/`, { content });
    }

    async updateTaskComment(commentId, data) {
        return await this.client.patch(`/crm/api/task-comments/${commentId}/`, data);
    }

    async deleteTaskComment(commentId) {
        return await this.client.delete(`/crm/api/task-comments/${commentId}/`);
    }

    // УЧЕТ ВРЕМЕНИ
    async getTimeLogs(params = {}) {
        return await this.client.get('/crm/api/time-logs/', { params });
    }

    async getMyTimeLogs() {
        return await this.client.get('/crm/api/time-logs/my_time_logs/');
    }

    async addTimeLog(taskId, data) {
        return await this.client.post(`/crm/api/tasks/${taskId}/add_time_log/`, data);
    }

    async updateTimeLog(logId, data) {
        return await this.client.patch(`/crm/api/time-logs/${logId}/`, data);
    }

    async deleteTimeLog(logId) {
        return await this.client.delete(`/crm/api/time-logs/${logId}/`);
    }

    // ПОЛЬЗОВАТЕЛИ
    async getUsers(params = {}) {
        return await this.client.get('/crm/api/users/', { params });
    }

    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    async uploadFile(file, taskId = null) {
        const formData = new FormData();
        formData.append('file', file);
        if (taskId) {
            formData.append('task_id', taskId);
        }

        return await this.client.post('/crm/api/upload-file/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
    }

    // Получение статистики для дашборда
    async getDashboardStatistics() {
        try {
            const [projectsResponse, tasksResponse] = await Promise.all([
                this.getProjects({ my_projects: true }),
                this.getTasks({ my_tasks: true })
            ]);

            const projects = projectsResponse.data.results || projectsResponse.data;
            const tasks = tasksResponse.data.results || tasksResponse.data;

            const now = new Date();
            const overdueTasks = tasks.filter(task => 
                task.due_date && 
                new Date(task.due_date) < now && 
                task.status !== 'done'
            );

            return {
                totalProjects: projects.length,
                activeProjects: projects.filter(p => p.status === 'active').length,
                myTasks: tasks.length,
                overdueTasks: overdueTasks.length,
                completedTasks: tasks.filter(t => t.status === 'done').length
            };
        } catch (error) {
            console.error('Ошибка получения статистики:', error);
            return {
                totalProjects: 0,
                activeProjects: 0,
                myTasks: 0,
                overdueTasks: 0,
                completedTasks: 0
            };
        }
    }

    // Поиск по проектам и задачам
    async search(query, type = 'all') {
        const params = { search: query };
        
        if (type === 'projects') {
            return await this.getProjects(params);
        } else if (type === 'tasks') {
            return await this.getTasks(params);
        } else {
            // Поиск по всем типам
            const [projects, tasks] = await Promise.all([
                this.getProjects(params),
                this.getTasks(params)
            ]);
            
            return {
                projects: projects.data.results || projects.data,
                tasks: tasks.data.results || tasks.data
            };
        }
    }

    // Экспорт данных
    async exportProjects(format = 'csv') {
        return await this.client.get('/crm/api/projects/export/', {
            params: { format },
            responseType: 'blob'
        });
    }

    async exportTasks(format = 'csv', projectId = null) {
        const params = { format };
        if (projectId) {
            params.project_id = projectId;
        }
        
        return await this.client.get('/crm/api/tasks/export/', {
            params,
            responseType: 'blob'
        });
    }
}

const projectManagementApi = new ProjectManagementApi();
export default projectManagementApi; 