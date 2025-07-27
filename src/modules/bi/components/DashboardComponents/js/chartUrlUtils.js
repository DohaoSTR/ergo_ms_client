import { endpoints } from '../../../../../js/api/endpoints.js';

const CHART_BASE_URL = 'http://localhost:8001/bi/chart/';

export const validateChartUrl = (url) => {
    if (!url || typeof url !== 'string') {
        return {
            isValid: false,
            error: 'URL не может быть пустым',
            chartId: null
        };
    }

    if (!url.startsWith(CHART_BASE_URL)) {
        return {
            isValid: false,
            error: `некорректный URL адрес чарта`,
            chartId: null
        };
    }

    const chartId = extractChartId(url);
    
    if (!chartId) {
        return {
            isValid: false,
            error: 'Не удалось извлечь ID чарта из URL',
            chartId: null
        };
    }

    return {
        isValid: true,
        error: null,
        chartId: chartId
    };
};

export const extractChartId = (url) => {
    if (!url || typeof url !== 'string') {
        return null;
    }

    const pathAfterBase = url.replace(CHART_BASE_URL, '');
    
    const cleanPath = pathAfterBase.replace(/\/$/, '');
    
    if (/^\d+$/.test(cleanPath)) {
        return cleanPath;
    }

    return null;
};

export const isValidChartBaseUrl = (url) => {
    return url && typeof url === 'string' && url.startsWith(CHART_BASE_URL);
};

export const buildChartUrl = (chartId) => {
    return `${CHART_BASE_URL}${chartId}/`;
};

export const checkChartAccess = async (chartId, apiClient = null) => {
    try {
        if (!chartId) {
            return {
                hasAccess: false,
                message: 'ID чарта не указан'
            };
        }

        if (apiClient) {
            const endpoint = endpoints.bi.chart.get(chartId);
            const response = await apiClient.get(endpoint);
            
            if (response.data) {
                return {
                    hasAccess: true,
                    message: 'Чарт найден и доступен'
                };
            } else {
                return {
                    hasAccess: false,
                    message: 'Чарт не найден'
                };
            }
        } else {         
            return {
                hasAccess: true,
                message: 'Доступ разрешен (режим заглушки)'
            };
        }
    } catch (error) {
        
        if (error.response?.status === 403) {
            return {
                hasAccess: false,
                message: 'доступ к чарту запрещен'
            };
        } else if (error.response?.status === 404) {
            return {
                hasAccess: false,
                message: 'чарт с указанным ID не найден'
            };
        } else if (error.response?.status >= 500) {
            return {
                hasAccess: false,
                message: 'ошибка сервера при проверке чарта'
            };
        } else {
            return {
                hasAccess: false,
                message: 'не удалось проверить доступ к чарту'
            };
        }
    }
};

export const validateChartUrlWithAccess = async (url, apiClient = null) => {
    const urlValidation = validateChartUrl(url);
    
    if (!urlValidation.isValid) {
        return urlValidation;
    }

    const accessCheck = await checkChartAccess(urlValidation.chartId, apiClient);
    
    return {
        isValid: accessCheck.hasAccess,
        error: accessCheck.hasAccess ? null : accessCheck.message,
        chartId: urlValidation.chartId,
        hasAccess: accessCheck.hasAccess
    };
}; 