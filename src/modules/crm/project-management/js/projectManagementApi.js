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
        return await this.client.get('/crm/projects/', { params });
    }

    async getProject(id) {
        return await this.client.get(`/crm/projects/${id}/`);
    }

    async createProject(data) {
        return await this.client.post('/crm/projects/', data);
    }

    async updateProject(id, data) {
        return await this.client.patch(`/crm/projects/${id}/`, data);
    }

    async deleteProject(id) {
        return await this.client.delete(`/crm/projects/${id}/`);
    }

    async getProjectTasks(projectId) {
        return await this.client.get(`/crm/projects/${projectId}/tasks/`);
    }

    async getProjectStatistics(projectId) {
        return await this.client.get(`/crm/projects/${projectId}/statistics/`);
    }

    async addProjectMember(projectId, userData) {
        return await this.client.post(`/crm/projects/${projectId}/add_member/`, userData);
    }

    async removeProjectMember(projectId, userId) {
        return await this.client.delete(`/crm/projects/${projectId}/remove_member/`, {
            data: { user_id: userId }
        });
    }

    // ЗАДАЧИ
    async getTasks(params = {}) {
        return await this.client.get('/crm/tasks/', { params });
    }

    async getTask(id) {
        return await this.client.get(`/crm/tasks/${id}/`);
    }

    async createTask(data) {
        return await this.client.post('/crm/tasks/', data);
    }

    async updateTask(id, data) {
        return await this.client.patch(`/crm/tasks/${id}/`, data);
    }

    async deleteTask(id) {
        return await this.client.delete(`/crm/tasks/${id}/`);
    }

    async changeTaskStatus(taskId, status) {
        return await this.client.post(`/crm/tasks/${taskId}/change_status/`, { status });
    }

    // КАЛЕНДАРЬ
    async getTasksForCalendar(params = {}) {
        return await this.client.get('/crm/tasks/calendar/', { params });
    }

    async createTaskFromCalendar(data) {
        return await this.client.post('/crm/tasks/create_from_calendar/', data);
    }

    // КАНБАН
    async getKanbanTasks(params = {}) {
        return await this.client.get('/crm/tasks/kanban/', { params });
    }

    async updateTaskKanbanOrder(taskId, data) {
        return await this.client.post(`/crm/tasks/${taskId}/update_kanban_order/`, data);
    }

    // КОММЕНТАРИИ
    async getTaskComments(taskId) {
        return await this.client.get('/crm/task-comments/', {
            params: { task_id: taskId }
        });
    }

    async addTaskComment(taskId, content) {
        return await this.client.post(`/crm/tasks/${taskId}/add_comment/`, { content });
    }

    async updateTaskComment(commentId, data) {
        return await this.client.patch(`/crm/task-comments/${commentId}/`, data);
    }

    async deleteTaskComment(commentId) {
        return await this.client.delete(`/crm/task-comments/${commentId}/`);
    }

    // УЧЕТ ВРЕМЕНИ
    async getTimeLogs(params = {}) {
        return await this.client.get('/crm/time-logs/', { params });
    }

    async getMyTimeLogs() {
        return await this.client.get('/crm/time-logs/my_time_logs/');
    }

    async addTimeLog(taskId, data) {
        return await this.client.post(`/crm/tasks/${taskId}/add_time_log/`, data);
    }

    async updateTimeLog(logId, data) {
        return await this.client.patch(`/crm/time-logs/${logId}/`, data);
    }

    async deleteTimeLog(logId) {
        return await this.client.delete(`/crm/time-logs/${logId}/`);
    }

    // ПОЛЬЗОВАТЕЛИ
    async getUsers(params = {}) {
        return await this.client.get('/crm/users/', { params });
    }

    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    async uploadFile(file, taskId = null) {
        const formData = new FormData();
        formData.append('file', file);
        if (taskId) {
            formData.append('task_id', taskId);
        }

        return await this.client.post('/crm/upload-file/', formData, {
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
        return await this.client.get('/crm/projects/export/', {
            params: { format },
            responseType: 'blob'
        });
    }

    async exportTasks(format = 'csv', projectId = null) {
        const params = { format };
        if (projectId) {
            params.project_id = projectId;
        }
        
        return await this.client.get('/crm/tasks/export/', {
            params,
            responseType: 'blob'
        });
    }

    // УПРАВЛЕНИЕ СТАТУСАМИ И ПРИОРИТЕТАМИ

    // Статусы проектов
    async getProjectStatuses(params = {}) {
        return await this.client.get('/crm/project-statuses/', { params });
    }

    async getProjectStatus(id) {
        return await this.client.get(`/crm/project-statuses/${id}/`);
    }

    async createProjectStatus(data) {
        return await this.client.post('/crm/project-statuses/', data);
    }

    async updateProjectStatus(id, data) {
        return await this.client.patch(`/crm/project-statuses/${id}/`, data);
    }

    async deleteProjectStatus(id) {
        return await this.client.delete(`/crm/project-statuses/${id}/`);
    }

    async getActiveProjectStatuses() {
        return await this.client.get('/crm/project-statuses/active/');
    }

    async getDefaultProjectStatus() {
        return await this.client.get('/crm/project-statuses/default/');
    }

    // Приоритеты проектов
    async getProjectPriorities(params = {}) {
        return await this.client.get('/crm/project-priorities/', { params });
    }

    async getProjectPriority(id) {
        return await this.client.get(`/crm/project-priorities/${id}/`);
    }

    async createProjectPriority(data) {
        return await this.client.post('/crm/project-priorities/', data);
    }

    async updateProjectPriority(id, data) {
        return await this.client.patch(`/crm/project-priorities/${id}/`, data);
    }

    async deleteProjectPriority(id) {
        return await this.client.delete(`/crm/project-priorities/${id}/`);
    }

    async getActiveProjectPriorities() {
        return await this.client.get('/crm/project-priorities/active/');
    }

    async getDefaultProjectPriority() {
        return await this.client.get('/crm/project-priorities/default/');
    }

    // Статусы задач
    async getTaskStatuses(params = {}) {
        return await this.client.get('/crm/task-statuses/', { params });
    }

    async getTaskStatus(id) {
        return await this.client.get(`/crm/task-statuses/${id}/`);
    }

    async createTaskStatus(data) {
        return await this.client.post('/crm/task-statuses/', data);
    }

    async updateTaskStatus(id, data) {
        return await this.client.patch(`/crm/task-statuses/${id}/`, data);
    }

    async deleteTaskStatus(id) {
        return await this.client.delete(`/crm/task-statuses/${id}/`);
    }

    async getActiveTaskStatuses() {
        return await this.client.get('/crm/task-statuses/active/');
    }

    async getKanbanTaskStatuses() {
        return await this.client.get('/crm/task-statuses/kanban_columns/');
    }

    async getDefaultTaskStatus() {
        return await this.client.get('/crm/task-statuses/default/');
    }

    // Приоритеты задач
    async getTaskPriorities(params = {}) {
        return await this.client.get('/crm/task-priorities/', { params });
    }

    async getTaskPriority(id) {
        return await this.client.get(`/crm/task-priorities/${id}/`);
    }

    async createTaskPriority(data) {
        return await this.client.post('/crm/task-priorities/', data);
    }

    async updateTaskPriority(id, data) {
        return await this.client.patch(`/crm/task-priorities/${id}/`, data);
    }

    async deleteTaskPriority(id) {
        return await this.client.delete(`/crm/task-priorities/${id}/`);
    }

    async getActiveTaskPriorities() {
        return await this.client.get('/crm/task-priorities/active/');
    }

    async getDefaultTaskPriority() {
        return await this.client.get('/crm/task-priorities/default/');
    }
}

const projectManagementApi = new ProjectManagementApi();
export default projectManagementApi; 