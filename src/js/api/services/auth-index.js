import { authService } from '@/js/api/services/auth';

export const authorization = authService.login;
export const validateRegistration = authService.validateRegistration;
export const sendConfirmationCode = authService.sendConfirmationCode;
export const verifyConfirmationCode = authService.verifyConfirmationCode;
export const registration = authService.registration;
export const checkToken = authService.checkToken;
export const logout = authService.logout;
