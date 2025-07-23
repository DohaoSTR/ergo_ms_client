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
        const cacheTimeout = 5000 // Уменьшаем время кэширования до 5 секунд

        if (!forceCheck && this.lastLLMCheck && (now - this.lastLLMCheck) < cacheTimeout) {
            return this.llmAvailable
        }

        try {
            const connectionResult = await lmStudioClient.checkConnection()
            this.llmAvailable = connectionResult.connected
            this.lastLLMCheck = now

            // Если checkConnection не работает корректно, попробуем отправить тестовое сообщение
            if (!this.llmAvailable) {
                try {
                    const testResult = await lmStudioClient.sendMessage("test", "Ответь кратко: работает")
                    if (testResult.success) {
                        this.llmAvailable = true
                    }
                } catch {
                    this.llmAvailable = false
                }
            }

        } catch {
            // Если checkConnection не работает, попробуем тестовое сообщение
            try {
                const testResult = await lmStudioClient.sendMessage("test", "Ответь кратко: работает")
                if (testResult.success) {
                    this.llmAvailable = true
                } else {
                    this.llmAvailable = false
                }
            } catch {
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

        // Убираем проверку подключения - пытаемся сразу использовать LLM
        console.log('🔍 Navigation Analysis for:', userRequest)
        const llmResult = await this.llmRouteAnalysis(userRequest)
        console.log('📝 LLM result:', llmResult)
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

        // Убираем жестко заданные маппинги - пусть LLM сам думает
        // Возвращаем список всех доступных маршрутов как альтернативы
        const alternatives = this.allRoutes.slice(0, 10) // Показываем первые 10 маршрутов

        return {
            success: false,
            confidence: 0,
            route: null,
            message: `LLM недоступен для анализа запроса "${userRequest}". Пожалуйста, попробуйте переформулировать запрос или выберите нужный раздел из списка доступных.`,
            reasoning: 'LLM недоступен, показаны доступные маршруты',
            alternatives: alternatives,
            method: 'llm_unavailable'
        }
    }

    async llmRouteAnalysis(userRequest) {
        const routesList = this.prepareRoutesForLLM()
        const prompt = this.buildNavigationPrompt(userRequest, routesList)
        const response = await lmStudioClient.sendMessage(userRequest, prompt)

        if (response.success) {
            const parsedResult = this.parseLLMResponse(response.message, userRequest)
            return parsedResult
        } else {
            return {
                success: false,
                confidence: 0,
                route: null,
                message: `LLM недоступен: ${response.error || 'Неизвестная ошибка'}`,
                reasoning: 'Ошибка LLM',
                alternatives: [],
                method: 'llm_error'
            }
        }
    }

    prepareRoutesForLLM() {
        if (!this.allRoutes || this.allRoutes.length === 0) {
            return []
        }

        // Фильтруем только маршруты без параметров
        const filteredRoutes = this.allRoutes
            .filter(route => {
                if (!route || !route.name || !route.path) return false
                // Исключаем маршруты с параметрами (:id, :slug и т.д.)
                return !route.path.includes(':')
            })
            .map(route => ({
                name: route.name,
                path: route.path
            }))

        return filteredRoutes
    }

    buildNavigationPrompt(userRequest, routesList) {
        const prompt = `Проанализируй запрос пользователя и найди подходящий маршрут.

ЗАПРОС: "${userRequest}"

ДОСТУПНЫЕ МАРШРУТЫ:
${routesList.map(route => `${route.name}: ${route.path}`).join('\n')}

ВАЖНО:
- При запросе "профиль" может быть: Account (основной профиль) или ProfilePage (профиль в аналитике) - ПЕРЕСПРОСИ
- При запросе "настройки" может быть несколько вариантов - ПЕРЕСПРОСИ  
- Если видишь похожие названия маршрутов - ОБЯЗАТЕЛЬНО уточни
- Высокая уверенность (>0.85) только при 100% точном соответствии
- Лучше переспросить, чем ошибиться

ОТВЕТЬ ТОЛЬКО JSON:
{
  "routeName": "имя_маршрута_или_null",
  "confidence": 0.1-1.0,
  "reasoning": "объяснение_или_вопрос_для_уточнения",
  "needsClarification": true_если_нужно_уточнить
}`

        return prompt
    }

    parseLLMResponse(response, userRequest) {
        try {
            let cleanResponse = response.trim()
            cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '')

            const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                throw new Error('No JSON found in LLM response')
            }

            const jsonString = jsonMatch[0]
            const data = JSON.parse(jsonString)

            // Проверяем, нужно ли уточнение (повышаем порог до 0.85)
            if (data.needsClarification || data.confidence < 0.85 || !data.routeName || data.routeName === 'null') {
                return {
                    success: false,
                    confidence: data.confidence || 0,
                    route: null,
                    message: `Уточните, пожалуйста: ${data.reasoning}`,
                    reasoning: 'Требуется уточнение от пользователя',
                    alternatives: [],
                    method: 'clarification_needed'
                }
            }

            // Ищем маршрут с точным совпадением
            let route = this.allRoutes.find(r => r.name === data.routeName)

            // Если не найден, ищем с игнорированием регистра
            if (!route) {
                route = this.allRoutes.find(r =>
                    r.name && r.name.toLowerCase() === data.routeName.toLowerCase()
                )
            }

            if (!route) {
                return {
                    success: false,
                    confidence: data.confidence || 0,
                    route: null,
                    message: `Маршрут "${data.routeName}" не найден. ${data.reasoning}`,
                    reasoning: 'Маршрут не существует',
                    alternatives: [],
                    method: 'route_not_found'
                }
            }

            const result = {
                success: true,
                confidence: data.confidence || 0,
                route: route,
                message: `Перехожу: ${this.getRouteDisplayName(route)}`,
                reasoning: data.reasoning || 'LLM анализ выполнен',
                alternatives: [],
                method: 'llm'
            }

            return result

        } catch (error) {
            return {
                success: false,
                confidence: 0,
                route: null,
                message: 'Ошибка анализа ответа LLM',
                reasoning: `Ошибка парсинга: ${error.message}`,
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
        // Убираем все шаблоны - пусть LLM сама думает
        return route.meta?.title || route.name || route.path
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
        const categories = { 'Общее': this.allRoutes.length }
        return categories
    }
}

export const smartNavigation = new SmartNavigation()
export default SmartNavigation 