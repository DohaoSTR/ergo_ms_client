import axios from 'axios'
import Cookies from 'js-cookie'

// Класс для работы с API
class ApiClient {
    // Конструктор класса
    constructor() {
        this.baseUrl = `http://${import.meta.env.VITE_API_HOST || 'localhost'}:${import.meta.env.VITE_API_PORT || '8000'}/`;
        this.apiPath = 'api/';
        this.client = axios.create({
            baseURL: `${this.baseUrl}${this.apiPath}`,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Добавляем перехватчик ответов для автоматического logout при истечении токена
        this.client.interceptors.response.use(
            (response) => {
                // Возвращаем успешные ответы как есть
                return response;
            },
            (error) => {
                // Проверяем, является ли ошибка 401 (Unauthorized)
                if (error.response?.status === 401) {
                    // Очищаем токены и данные пользователя
                    this.logout();
                    
                    // Перенаправляем на стартовую страницу
                    if (typeof window !== 'undefined' && window.location) {
                        // Проверяем, не находимся ли мы уже на стартовой странице
                        if (!window.location.pathname.includes('/start') && !window.location.pathname.includes('/login')) {
                            window.location.href = '/start';
                        }
                    }
                }
                
                // Возвращаем ошибку для дальнейшей обработки
                return Promise.reject(error);
            }
        );
    }

    // Основные методы запросов
    // Метод для GET-запросов
    async get(endpoint, params = {}, needToken = true) {
        try {
            const config = { params };
            if (needToken) {
                this._addAuthToken(config);
            }
            const response = await this.client.get(endpoint, config);
            return this.handleResponse(response);
        } catch (error) {
            const errorInfo = this.handleError(error);
            // Пробрасываем ошибку дальше для обработки в composables
            throw error;
        }
    }

    // Метод для POST-запросов
    async post(endpoint, data = {}, needToken = true) {
        try {
            const config = {};
            if (needToken) {
                this._addAuthToken(config);
            }

            // Если отправляем FormData, не устанавливаем Content-Type,
            // чтобы axios автоматически установил правильный multipart/form-data с boundary
            if (data instanceof FormData) {
                config.headers = {
                    ...config.headers,
                    'Content-Type': undefined // Позволяет axios автоматически установить правильный заголовок
                };
            }

            const response = await this.client.post(endpoint, data, config);
            return this.handleResponse(response);
        } catch (error) {
            const errorInfo = this.handleError(error);
            // Пробрасываем ошибку дальше для обработки в composables
            throw error;
        }
    }

    // Метод для PUT-запросов
    async put(endpoint, data = {}, needToken = true) {
        try {
            const config = {};
            if (needToken) {
                this._addAuthToken(config);
            }

            // Если отправляем FormData, не устанавливаем Content-Type,
            // чтобы axios автоматически установил правильный multipart/form-data с boundary
            if (data instanceof FormData) {
                config.headers = {
                    ...config.headers,
                    'Content-Type': undefined // Позволяет axios автоматически установить правильный заголовок
                };
            }

            const response = await this.client.put(endpoint, data, config);
            return this.handleResponse(response);
        } catch (error) {
            const errorInfo = this.handleError(error);
            // Пробрасываем ошибку дальше для обработки в composables
            throw error;
        }
    }

    async patch(endpoint, data = {}, needToken = true) {
        try {
            const cfg = {}
            if (needToken) this._addAuthToken(cfg)
            if (data instanceof FormData) {
                cfg.headers = { ...cfg.headers, 'Content-Type': undefined }
            }
            const r = await this.client.patch(endpoint, data, cfg)
            return this.handleResponse(r)
        } catch (e) {
            const errorInfo = this.handleError(e)
            // Пробрасываем ошибку дальше для обработки в composables
            throw e
        }
    }

    // Метод для DELETE-запросов
    async delete(endpoint, params = {}, needToken = true) {
        try {
            const config = { params };
            if (needToken) {
                this._addAuthToken(config);
            }
            const response = await this.client.delete(endpoint, config);
            return this.handleResponse(response);
        } catch (error) {
            const errorInfo = this.handleError(error);
            // Пробрасываем ошибку дальше для обработки в composables
            throw error;
        }
    }

    async upload(endpoint, formData, needToken = true) {
        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };
            if (needToken) {
                this._addAuthToken(config);
            }
            const response = await this.client.post(endpoint, formData, config);
            return this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    async getUploadedFiles(endpoint, needToken = true) {
        try {
            const config = {};
            if (needToken) {
                this._addAuthToken(config);
            }
            const response = await this.client.get(endpoint, config);
            return this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    // Метод для скачивания файлов (бинарные данные)
    async downloadFile(endpoint, params = {}, needToken = true) {
        try {
            const config = { 
                params,
                responseType: 'blob' // Важно для бинарных данных
            };
            if (needToken) {
                this._addAuthToken(config);
            }
            const response = await this.client.get(endpoint, config);
            
            // Для бинарных данных возвращаем специальный формат
            return {
                success: true,
                data: response.data, // Это blob объект
                message: 'Файл успешно загружен',
                status: response.status
            };
        } catch (error) {
            const errorInfo = this.handleError(error);
            throw error;
        }
    }

    // Вспомогательный метод для добавления токена авторизации в конфигурацию
    _addAuthToken(config) {
        const token = Cookies.get('token');
        if (token) {
            if (!config.headers) {
                config.headers = {};
            }
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    }

    logout() {
        Cookies.remove('token');
        Cookies.remove('refresh');
        Cookies.remove('userId');
    }
    // Обработчики ответов
    handleResponse(response) {
        // Успешные статусы: 200 OK, 201 Created, 204 No Content и т.д.
        if (response.status >= 200 && response.status < 300) {
            const data = response.data || {};

            // Для DELETE-запросов с кодом 204 (No Content) считаем успешным
            if (response.status === 204) {
                return {
                    success: true,
                    data: null,
                    message: 'Успешно удалено',
                    status: response.status
                };
            }

            // Если сервер вернул success: false, сохраняем это значение
            // Иначе считаем ответ успешным по умолчанию
            const success = data.success !== undefined ? data.success : true;

            return {
                success,
                data,
                message: data.message,
                status: response.status
            };
        }

        return {
            success: false,
            errors: response.data,
            status: response.status
        };
    }

    // Обработчик ошибок
    handleError(error) {
        const errorMessage = error.response?.data?.message ||
            error.response?.data?.detail ||
            error.response?.data ||
            error.message ||
            'Ошибка сервера';

        const status = error.response?.status;
        const statusText = error.response?.statusText;

        console.error(`API Error [${status || 'undefined'}${statusText ? ' ' + statusText : ''}]:`, errorMessage);

        return {
            success: false,
            message: errorMessage,
            status: status,
            errors: error.response?.data
        };
    }
}

// Создать и экспортировать синглтон-объект
export const apiClient = new ApiClient(); 