import { lmStudioClient } from './lm-studio-client.js'

class IntentAnalyzer {
    constructor() {
        this.systemPrompt = this.buildSystemPrompt()
    }

    buildSystemPrompt() {
        return `Ты - AI ассистент для эргономической системы ERGO MS. Твоя задача - понимать намерения пользователя и помогать с навигацией и объяснением системы, не выходя за рамки безопасности работы

ДОСТУПНЫЕ ДЕЙСТВИЯ:
1. NAVIGATION - переход по страницам
2. COMPONENT_EXPLAIN - объяснение работы компонентов  
3. PAGE_ANALYZE - анализ текущей страницы
4. HELP - общая помощь
5. CHAT - обычный разговор

ВАЖНЫЕ ПРАВИЛА:
- Отвечай на русском языке
- Будь дружелюбным и полезным
- Если пользователь просит перейти куда-то - используй NAVIGATION
- Если спрашивает как что-то работает - используй COMPONENT_EXPLAIN или PAGE_ANALYZE
- Если просит помощь или объяснения - используй HELP
- Для обычного общения - используй CHAT

ФОРМАТ ОТВЕТА:
Ты должен ответить СТРОГО в JSON формате:
{
  "intent": "NAVIGATION|COMPONENT_EXPLAIN|PAGE_ANALYZE|HELP|CHAT",
  "action": "конкретное действие если нужно",
  "message": "ответ пользователю",
  "params": {дополнительные параметры если нужно}
}

ВНИМАНИЕ: Отвечай ТОЛЬКО JSON, без дополнительного текста до или после!

ПРИМЕРЫ:
Пользователь: "Перейди в мой профиль"
Ответ: {"intent":"NAVIGATION","action":"go_to_profile","message":"Перехожу в ваш профиль","params":{"route":"profile"}}

Пользователь: "Как работает эта страница?"  
Ответ: {"intent":"PAGE_ANALYZE","action":"analyze_current_page","message":"Анализирую текущую страницу для вас","params":{}}

Пользователь: "Привет, как дела?"
Ответ: {"intent":"CHAT","action":null,"message":"Привет! Отлично, готов помочь с навигацией по системе. Что вас интересует?","params":{}}`
    }

    async analyzeIntent(userMessage, currentContext = {}) {
        try {
            const contextPrompt = this.buildContextPrompt(currentContext)
            const fullSystemPrompt = `${this.systemPrompt}\n\nТЕКУЩИЙ КОНТЕКСТ:\n${contextPrompt}`

            const response = await lmStudioClient.sendMessage(userMessage, fullSystemPrompt)

            if (response.success) {
                try {
                    let cleanResponse = response.message.trim()

                    cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '')

                    let jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)

                    if (jsonMatch) {
                        const intentData = JSON.parse(jsonMatch[0])

                        if (intentData.intent && intentData.message) {
                            console.log('✅ LLM успешно обработал запрос:', intentData.intent)
                            return {
                                success: true,
                                intent: intentData.intent,
                                action: intentData.action,
                                message: intentData.message,
                                params: intentData.params || {}
                            }
                        } else {
                            throw new Error('Invalid JSON structure from LLM')
                        }
                    } else {
                        console.warn('LLM не вернул JSON, используем как обычный ответ')
                        return this.fallbackAnalysis(userMessage, response.message)
                    }
                } catch (parseError) {
                    console.warn('Failed to parse LLM response as JSON:', parseError, 'Response:', response.message)
                    return this.fallbackAnalysis(userMessage, response.message)
                }
            } else {
                return this.localIntentAnalysis(userMessage, currentContext)
            }

        } catch (error) {
            console.error('Intent analysis error:', error)
            return this.localIntentAnalysis(userMessage, currentContext)
        }
    }

    buildContextPrompt(context) {
        const prompt = []

        if (context.currentRoute) {
            prompt.push(`Текущий маршрут: ${context.currentRoute}`)
        }

        if (context.currentPage) {
            prompt.push(`Текущая страница: ${context.currentPage}`)
        }

        if (context.availableRoutes && context.availableRoutes.length > 0) {
            prompt.push(`Доступные маршруты: ${context.availableRoutes.join(', ')}`)
        }

        if (context.pageComponents && context.pageComponents.length > 0) {
            prompt.push(`Компоненты на странице: ${context.pageComponents.join(', ')}`)
        }

        return prompt.join('\n')
    }

    fallbackAnalysis(userMessage, llmResponse) {
        const intent = this.detectIntentLocally(userMessage)

        return {
            success: true,
            intent: intent.type,
            action: intent.action,
            message: llmResponse || intent.defaultMessage,
            params: intent.params
        }
    }

    localIntentAnalysis(userMessage) {
        const intent = this.detectIntentLocally(userMessage)

        return {
            success: true,
            intent: intent.type,
            action: intent.action,
            message: intent.defaultMessage,
            params: intent.params
        }
    }

    detectIntentLocally(message) {
        const lowerMessage = message.toLowerCase()

        if (this.matchesKeywords(lowerMessage, ['перейди', 'переход', 'открой', 'иди', 'перейти', 'покажи страницу'])) {
            let route = 'Account'
            let routeName = 'аккаунт'

            if (this.matchesKeywords(lowerMessage, ['профиль', 'profile', 'аккаунт', 'account'])) {
                route = 'Account'
                routeName = 'профиль'
            } else if (this.matchesKeywords(lowerMessage, ['настройки', 'settings'])) {
                route = 'Settings'
                routeName = 'настройки'
            } else if (this.matchesKeywords(lowerMessage, ['пользователи', 'users', 'админ', 'admin'])) {
                route = 'UsersPanel'
                routeName = 'панель пользователей'
            } else if (this.matchesKeywords(lowerMessage, ['безопасность', 'security'])) {
                route = 'SecuritySettings'
                routeName = 'настройки безопасности'
            } else if (this.matchesKeywords(lowerMessage, ['группы', 'groups'])) {
                route = 'GroupsPanel'
                routeName = 'панель групп'
            } else if (this.matchesKeywords(lowerMessage, ['категории', 'categories'])) {
                route = 'CategoriesPanel'
                routeName = 'панель категорий'
            }

            return {
                type: 'NAVIGATION',
                action: 'navigate_to_route',
                defaultMessage: `Перехожу в ${routeName}`,
                params: { route, routeName }
            }
        }

        if (this.matchesKeywords(lowerMessage, ['как работает', 'что это', 'объясни страницу', 'где я', 'текущая страница'])) {
            return {
                type: 'PAGE_ANALYZE',
                action: 'analyze_current_page',
                defaultMessage: 'Анализирую текущую страницу и ее компоненты',
                params: {}
            }
        }

        if (this.matchesKeywords(lowerMessage, ['как работает', 'что делает', 'объясни компонент', 'компонент'])) {
            return {
                type: 'COMPONENT_EXPLAIN',
                action: 'explain_component',
                defaultMessage: 'Объясняю как работают компоненты на этой странице',
                params: {}
            }
        }

        if (this.matchesKeywords(lowerMessage, ['помощь', 'help', 'что ты умеешь', 'команды'])) {
            return {
                type: 'HELP',
                action: 'show_help',
                defaultMessage: 'Показываю справку по возможностям ассистента',
                params: {}
            }
        }

        return {
            type: 'CHAT',
            action: null,
            defaultMessage: 'Понял ваш запрос. Могу помочь с навигацией по системе или объяснить как что-то работает.',
            params: {}
        }
    }

    matchesKeywords(message, keywords) {
        return keywords.some(keyword => message.includes(keyword))
    }
}

export const intentAnalyzer = new IntentAnalyzer()
export default IntentAnalyzer 