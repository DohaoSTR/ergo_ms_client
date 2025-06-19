import { apiClient } from '../manager';
import { endpoints } from '../endpoints';
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
            return false;
        }
    },
    
    logout() {
        Cookies.remove('token');
        Cookies.remove('refresh');
        Cookies.remove('userId'); 
    }
}; 
