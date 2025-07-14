import { apiClient } from '../../../../js/api/manager';
import { endpoints } from '../../../../js/api/endpoints';
import Cookies from 'js-cookie';

const thirtyMinutesInDays = 30 / (24 * 60);

export const authService = {
    async login(username, password) {
        const response = await apiClient.post(endpoints.auth.login, {
            username,
            password,
        }, false);
        
        if (response.success) {
            Cookies.set('token', response.data.access, { expires: thirtyMinutesInDays });
            Cookies.set('refresh', response.data.refresh, { expires: thirtyMinutesInDays });
            Cookies.set('userId', response.data.user_id, { expires: thirtyMinutesInDays }); 

            // Запускаем проверку токена после успешной авторизации
            if (typeof window !== 'undefined') {
                import('@/modules/cms/js/authGuard.js').then(({ authGuard }) => {
                    authGuard.startTokenValidation();
                });
            }
        }
        
        return response;
    },
    
    async validateRegistration(firstName, username, email, password) {
        return await apiClient.post(endpoints.auth.validateRegistration, {
            first_name: firstName,
            username,
            email,
            password,
            is_superuser: false
        }, false);
    },
    
    async sendConfirmationCode(email) {
        return await apiClient.post(endpoints.auth.sendCode, { email }, false);
    },
    
    async verifyConfirmationCode(email, code) {
        return await apiClient.post(endpoints.auth.verifyCode, { email, code }, false);
    },
    
    async registration(firstName, username, email, password) {
        return await apiClient.post(endpoints.auth.registration, {
            first_name: firstName,
            username,
            email,
            password,
            is_superuser: false
        }, false);
    },
    
    async checkToken() {
        const token = Cookies.get('token');
        if (!token) {
            return false;
        }
        
        try {
            const response = await apiClient.get(endpoints.auth.protected);
            return response.success;
        } catch (error) {
            // Если токен недействителен (401), очищаем все cookies
            if (error.response?.status === 401) {
                this.logout();
            }
            return false;
        }
    },
    
    logout() {
        Cookies.remove('token');
        Cookies.remove('refresh');
        Cookies.remove('userId'); 
        
        // Останавливаем проверку токена
        if (typeof window !== 'undefined') {
            import('@/modules/cms/js/authGuard.js').then(({ authGuard }) => {
                authGuard.stopTokenValidation();
            });
        }
    }
}; 