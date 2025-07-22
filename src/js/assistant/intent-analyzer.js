import { lmStudioClient } from './lm-studio-client.js'

class IntentAnalyzer {
    constructor() {
        this.systemPrompt = this.buildSystemPrompt()
    }

    buildSystemPrompt() {
        return `Ты - AI ассистент для веб-приложения ERGO MS. Твоя задача - понимать намерения пользователя и помогать с навигацией и объяснением системы.

ДОСТУПНЫЕ ДЕЙСТВИЯ:
1. NAVIGATION - переход по страницам (когда пользователь просит "перейди", "открой")
2. COMPONENT_EXPLAIN - объяснение компонентов НА ТЕКУЩЕЙ странице (только когда явно просят "объясни компоненты", "покажи компоненты")
3. PAGE_ANALYZE - анализ текущей страницы (когда спрашивают "где я", "что это за страница")  
4. HELP - общая справка (только когда явно просят "помощь", "что ты умеешь", "команды")
5. CHAT - обычный разговор и ответы на вопросы

ВАЖНЫЕ ПРАВИЛА:
- Отвечай на русском языке
- CHAT используй для ВСЕХ технических вопросов: "как сделать", "как реализовать", "что такое", drag and drop, программирование
- COMPONENT_EXPLAIN используй ТОЛЬКО когда просят объяснить компоненты именно на текущей странице
- HELP используй ТОЛЬКО для запросов справки о самом ассистенте
- Будь дружелюбным и полезным
- Давай конкретные и полезные ответы

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

Пользователь: "Где я нахожусь?"  
Ответ: {"intent":"PAGE_ANALYZE","action":"analyze_current_page","message":"Анализирую текущую страницу для вас","params":{}}

Пользователь: "Объясни компоненты на этой странице"
Ответ: {"intent":"COMPONENT_EXPLAIN","action":"explain_component","message":"Анализирую компоненты текущей страницы","params":{}}

Пользователь: "Помощь"
Ответ: {"intent":"HELP","action":"show_help","message":"Показываю справку по возможностям ассистента","params":{}}

Пользователь: "Как мне сделать dnd на моей странице bi?"
Ответ: {"intent":"CHAT","action":null,"message":"Для реализации drag and drop на BI странице рекомендую использовать Vue Draggable или SortableJS. Это самые популярные решения для Vue приложений. Что именно нужно перетаскивать?","params":{}}

Пользователь: "drag and drop, как сделать?"
Ответ: {"intent":"CHAT","action":null,"message":"Drag and drop можно реализовать с помощью HTML5 API или библиотек. Что именно нужно перетаскивать?","params":{}}`
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

        if (this.matchesStartOfMessage(lowerMessage, ['где я', 'где я нахожусь', 'что это за страница', 'анализ страницы'])) {
            return {
                type: 'PAGE_ANALYZE',
                action: 'analyze_current_page',
                defaultMessage: 'Анализирую текущую страницу и ее компоненты',
                params: {}
            }
        }

        if (this.matchesStartOfMessage(lowerMessage, ['объясни компоненты', 'покажи компоненты', 'какие компоненты здесь', 'компоненты на странице'])) {
            return {
                type: 'COMPONENT_EXPLAIN',
                action: 'explain_component',
                defaultMessage: 'Объясняю как работают компоненты на этой странице',
                params: {}
            }
        }

        if (this.matchesStartOfMessage(lowerMessage, ['помощь', 'help', 'что ты умеешь', 'команды', 'справка'])) {
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
            defaultMessage: this.generateChatResponse(lowerMessage),
            params: {}
        }
    }

    generateChatResponse(message) {
        if (message.includes('drag') && message.includes('drop') || message.includes('dnd')) {
            return 'Для реализации drag and drop в Vue рекомендую использовать:\n\n1. **Vue Draggable** - npm install vuedraggable\n2. **SortableJS** - npm install sortablejs\n3. **HTML5 Drag API** - нативный подход\n\nЧто именно нужно перетаскивать?'
        }

        if (message.includes('как сделать') || message.includes('как реализовать')) {
            return 'Постараюсь помочь с реализацией. Опишите подробнее что нужно сделать.'
        }

        return 'Постараюсь ответить на ваш вопрос. Если нужна помощь с навигацией, скажите "перейди в..." или спросите про конкретную страницу.'
    }

    matchesKeywords(message, keywords) {
        return keywords.some(keyword => message.includes(keyword))
    }

    matchesStartOfMessage(message, phrases) {
        return phrases.some(phrase => message.startsWith(phrase) || message.includes(phrase + ' ') || message === phrase)
    }
}

export const intentAnalyzer = new IntentAnalyzer()
export default IntentAnalyzer 