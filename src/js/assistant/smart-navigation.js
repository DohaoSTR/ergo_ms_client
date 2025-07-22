import { routesReader } from './routes-reader.js'
import { lmStudioClient } from './lm-studio-client.js'

class SmartNavigation {
    constructor() {
        this.allRoutes = []
        this.initialized = false
        this.llmAvailable = false
        this.lastLLMCheck = null
        this.llmCheckInterval = 30000
    }

    async checkLLMAvailability(forceCheck = false) {
        const now = Date.now()
        const cacheTimeout = 10000

        if (!forceCheck && this.lastLLMCheck && (now - this.lastLLMCheck) < cacheTimeout) {
            return this.llmAvailable
        }

        try {
            const connectionResult = await lmStudioClient.checkConnection()
            this.llmAvailable = connectionResult.connected
            this.lastLLMCheck = now

        } catch {
            if (this.llmAvailable) {
                try {
                    const retryResult = await lmStudioClient.checkConnection()
                    this.llmAvailable = retryResult.connected
                } catch {
                    this.llmAvailable = false
                }
            } else {
                this.llmAvailable = false
            }
            this.lastLLMCheck = now
        }

        return this.llmAvailable
    }

    async initialize() {
        if (this.initialized) return

        await routesReader.initialize()
        this.allRoutes = routesReader.getAllRoutes()

        if (this.allRoutes.length === 0) {
            routesReader.initialized = false
            routesReader.routesCache = null
            await routesReader.initialize()
            this.allRoutes = routesReader.getAllRoutes()
        }

        this.initialized = true
        await this.checkLLMAvailability(true)
    }

    async analyzeNavigationRequest(userRequest) {
        await this.initialize()
        await this.checkLLMAvailability()

        if (!this.llmAvailable) {
            return this.basicNavigationFallback(userRequest)
        }

        const llmResult = await this.llmRouteAnalysis(userRequest)
        return llmResult
    }

    basicNavigationFallback(userRequest) {
        if (!this.allRoutes || this.allRoutes.length === 0) {
            return {
                success: false,
                confidence: 0,
                route: null,
                message: `Маршруты не загружены. Попробуйте позже.`,
                reasoning: 'Маршруты не инициализированы',
                alternatives: [],
                method: 'no_routes'
            }
        }

        const request = userRequest.toLowerCase().trim()

        const basicMappings = {
            'аккаунт': 'Account',
            'профиль': 'Account',
            'личный кабинет': 'Account',
            'account': 'Account',
            'мой профиль': 'Account',
            'пользователь': 'Account',
            'перейди в аккаунт': 'Account',
            'перейди в профиль': 'Account',
            'открой профиль': 'Account',
            'открой аккаунт': 'Account',
            'зайди в профиль': 'Account',
            'зайди в аккаунт': 'Account',
            'покажи профиль': 'Account',
            'покажи аккаунт': 'Account',

            'настройки': 'Settings',
            'конфигурация': 'Settings',
            'settings': 'Settings',

            'админ': 'AdminPanel',
            'админка': 'AdminPanel',
            'администрирование': 'AdminPanel',
            'admin': 'AdminPanel',
            'управление': 'AdminPanel',

            'би': 'BI',
            'bi': 'BI',
            'аналитика': 'BI',
            'бизнес-интеллект': 'BI',
            'отчеты': 'BI',

            'crm': 'CRM',
            'проекты': 'CRM',
            'клиенты': 'CRM',

            'lms': 'LMS',
            'обучение': 'LMS',
            'курсы': 'LMS',

            'эксперт': 'ExpertSystem',
            'экспертная': 'ExpertSystem',
            'навыки': 'ExpertSystem',
            'компетенции': 'ExpertSystem',
            'эрго-каркас': 'ExpertSystem',
            'каркас города': 'ExpertSystem',

            'файлы': 'FileManager',
            'документы': 'FileManager',
            'загрузки': 'FileManager',

            'безопасность': 'SecuritySettings',
            'пароли': 'SecuritySettings',

            'мессенджер': 'MessengerPage',
            'чат': 'MessengerPage',
            'сообщения': 'MessengerPage',

            'почта': 'EmailPage',
            'email': 'EmailPage',
        }

        for (const [key, routeName] of Object.entries(basicMappings)) {
            if (request.includes(key)) {
                const route = this.allRoutes.find(r => r.name === routeName)
                if (route) {
                    return {
                        success: true,
                        confidence: 0.9,
                        route: route,
                        message: `Переходим на страницу: ${this.getRouteDisplayName(route)}`,
                        reasoning: 'Базовое соответствие без LLM',
                        alternatives: [],
                        method: 'basic_mapping'
                    }
                }
            }
        }

        const alternatives = []
        const requestWords = request.split(' ')

        for (const [key, routeName] of Object.entries(basicMappings)) {
            const keyWords = key.split(' ')
            const hasMatchingWord = requestWords.some(reqWord =>
                keyWords.some(keyWord =>
                    keyWord.includes(reqWord) || reqWord.includes(keyWord)
                )
            )

            if (hasMatchingWord) {
                const route = this.allRoutes.find(r => r.name === routeName)
                if (route && !alternatives.find(alt => alt.name === route.name)) {
                    alternatives.push(route)
                }
            }
        }

        return {
            success: false,
            confidence: 0,
            route: null,
            message: `Маршрут "${userRequest}" не найден через базовый поиск (LLM недоступен)`,
            reasoning: 'LLM недоступен, использован базовый поиск',
            alternatives: alternatives.slice(0, 5),
            method: 'basic_fallback'
        }
    }

    async llmRouteAnalysis(userRequest) {
        try {
            const routesList = this.prepareRoutesForLLM()
            const prompt = this.buildNavigationPrompt(userRequest, routesList)
            const response = await lmStudioClient.sendMessage(userRequest, prompt)

            if (response.success) {
                const parsedResult = this.parseLLMResponse(response.message)
                return parsedResult
            } else {
                this.llmAvailable = false
                this.lastLLMCheck = Date.now()

                return {
                    success: false,
                    confidence: 0,
                    route: null,
                    message: 'LLM модель недоступна. Навигация заблокирована.',
                    reasoning: 'Ошибка подключения к LM Studio',
                    alternatives: [],
                    method: 'llm_error'
                }
            }
        } catch {
            this.llmAvailable = false
            this.lastLLMCheck = Date.now()

            return {
                success: false,
                confidence: 0,
                route: null,
                message: 'LLM модель недоступна. Навигация заблокирована.',
                reasoning: 'Ошибка подключения к LM Studio',
                alternatives: [],
                method: 'llm_error'
            }
        }
    }

    prepareRoutesForLLM() {
        if (!this.allRoutes || this.allRoutes.length === 0) {
            return []
        }

        const filteredRoutes = this.allRoutes
            .filter(route => route && route.name && route.path)
            .map(route => ({
                name: route.name,
                path: route.path,
                title: route.meta?.title || route.name,
                description: this.getRouteDescription(route),
                category: this.categorizeRoute(route)
            }))

        return filteredRoutes
    }

    getRouteDescription(route) {
        const path = route.path.toLowerCase()
        const title = route.meta?.title || ''

        if (path.includes('/admin')) return 'Административная панель для управления системой'
        if (path.includes('/user')) return 'Пользовательский раздел, личный кабинет'
        if (path.includes('/crm')) return 'CRM система для работы с клиентами и проектами'
        if (path.includes('/lms')) return 'Система управления обучением и курсами'
        if (path.includes('/bi')) return 'Бизнес-интеллект, аналитика и создание отчетов'
        if (path.includes('/expert')) return 'Экспертная система для оценки навыков и компетенций'
        if (path.includes('/filemanager')) return 'Управление файлами и документами'
        if (path.includes('/settings')) return 'Настройки и конфигурация системы'
        if (path.includes('/shortcode')) return 'Конструктор сайта и управление контентом'
        if (path.includes('/categories')) return 'Управление категориями и классификацией'
        if (path.includes('/email')) return 'Работа с электронной почтой'
        if (path.includes('/messenger')) return 'Система обмена сообщениями'

        if (title) return `${title} - ${path}`

        return `Раздел системы: ${route.name || path}`
    }

    buildNavigationPrompt(userRequest, routesList) {
        const prompt = `Ты помощник по навигации. Найди подходящий маршрут.

ДОСТУПНЫЕ МАРШРУТЫ:
${routesList.map(route => `${route.name}: ${route.path}`).join('\n')}

ПРИМЕРЫ СООТВЕТСТВИЙ:
- "би", "bi", "аналитика", "бизнес-интеллект" → BI
- "профиль", "аккаунт", "личный кабинет" → Account  
- "настройки", "конфигурация" → Settings
- "админ", "админка", "администрирование" → AdminPanel
- "пользователи", "управление пользователями" → UsersPanel
- "crm", "проекты", "клиенты" → CRM
- "lms", "обучение", "курсы" → LMS
- "экспертная", "эксперт", "навыки", "компетенции", "эрго-каркас", "каркас города" → ExpertSystem
- "файлы", "документы", "загрузки" → FileManager
- "безопасность", "пароли" → SecuritySettings
- "мессенджер", "чат", "сообщения" → MessengerPage
- "почта", "email" → EmailPage

ОТВЕТЬ ТОЛЬКО JSON:
{
  "routeName": "имя_маршрута",
  "confidence": 0.95,
  "reasoning": "объяснение"
}`

        return prompt
    }

    parseLLMResponse(response) {
        try {
            let cleanResponse = response.trim()
            cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '')

            const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                throw new Error('No JSON found in LLM response')
            }

            const jsonString = jsonMatch[0]
            const data = JSON.parse(jsonString)

            if (!data.routeName) {
                throw new Error('LLM response missing routeName')
            }

            const route = this.allRoutes.find(r => r.name === data.routeName)

            if (!route) {
                throw new Error(`Route "${data.routeName}" not found`)
            }

            const result = {
                success: data.confidence >= 0.3,
                confidence: data.confidence || 0,
                route: route,
                message: `LLM рекомендует: ${this.getRouteDisplayName(route)}`,
                reasoning: data.reasoning || 'LLM анализ выполнен',
                alternatives: this.parseAlternatives(data.alternatives || []),
                method: 'llm'
            }

            return result

        } catch {
            return {
                success: false,
                confidence: 0,
                route: null,
                message: 'LLM модель недоступна. Навигация заблокирована.',
                reasoning: 'Ошибка парсинга ответа LLM',
                method: 'llm_parse_failed',
                alternatives: []
            }
        }
    }

    parseAlternatives(alternativeNames) {
        return alternativeNames
            .map(name => this.allRoutes.find(r => r.name === name))
            .filter(route => route !== undefined)
    }

    getRouteDisplayName(route) {
        let displayName = route.meta?.title || route.name || route.path

        if (route.name === 'AdminPanel') {
            displayName = route.meta?.title || 'Админ-панель'
        } else if (route.name === 'Account') {
            displayName = route.meta?.title || 'Профиль пользователя'
        } else if (route.name === 'BI') {
            displayName = route.meta?.title || 'Бизнес-интеллект'
        } else if (route.name === 'Settings') {
            displayName = route.meta?.title || 'Настройки'
        } else if (route.name === 'LMS') {
            displayName = route.meta?.title || 'Система обучения'
        } else if (route.name === 'CRM') {
            displayName = route.meta?.title || 'CRM система'
        } else if (route.name === 'ExpertSystem') {
            displayName = route.meta?.title || 'Экспертная система'
        }

        return displayName
    }

    getAnalysisStats() {
        return {
            totalRoutes: this.allRoutes.length,
            initialized: this.initialized,
            routeCategories: this.getRouteCategories(),
            analysisMethod: this.llmAvailable ? 'llm_only' : 'llm_unavailable',
            llmAvailable: this.llmAvailable,
            lastLLMCheck: this.lastLLMCheck
        }
    }

    getRouteCategories() {
        const categories = {}
        this.allRoutes.forEach(route => {
            const category = this.categorizeRoute(route)
            categories[category] = (categories[category] || 0) + 1
        })
        return categories
    }

    categorizeRoute(route) {
        const name = (route.name || '').toLowerCase()
        const path = route.path.toLowerCase()

        if (name.includes('admin') || name.includes('users') || name.includes('groups') || path.includes('admin'))
            return 'Администрирование'
        if (path.includes('crm') || name.includes('project') || name.includes('strategic'))
            return 'CRM'
        if (path.includes('lms') || name.includes('course') || name.includes('badge'))
            return 'LMS'
        if (name.includes('bi') || name.includes('analytics') || name.includes('dashboard') || path.includes('bi'))
            return 'BI'
        if (name.includes('user') || name.includes('account') || name.includes('security') || path.includes('user'))
            return 'Пользователь'
        if (path.includes('expert') || name.includes('skill') || name.includes('test') || name.includes('vacancy'))
            return 'Экспертная система'
        if (name.includes('shortcode') || name.includes('page') || name.includes('template') || path.includes('shortcode'))
            return 'Контент'
        if (name.includes('categories') || name.includes('tag') || path.includes('categories'))
            return 'Категории'
        if (name.includes('file') || path.includes('filemanager'))
            return 'Файлы'
        if (name.includes('settings') || path.includes('settings'))
            return 'Настройки'

        return 'Другое'
    }
}

export const smartNavigation = new SmartNavigation()
export default SmartNavigation 