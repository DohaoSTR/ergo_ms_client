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
4. SYSTEM_OVERVIEW - показ всех доступных разделов системы (когда просят "покажи все страницы", "какие есть разделы", "что доступно")
5. HELP - общая справка (только когда явно просят "помощь", "что ты умеешь", "команды")
6. CHAT - обычный разговор и ответы на вопросы

ДОСТУПНЫЕ РОУТЫ В СИСТЕМЕ:
- Account - профиль пользователя (/user/account)
- SecuritySettings - настройки безопасности (/user/security)
- Settings - основные настройки (/settings)
- AdminPanel - панель администратора (/admin-panel)
- UsersPanel - управление пользователями (/admin-panel/users)
- GroupsPanel - управление группами (/admin-panel/groups)
- CategoriesPanel - управление категориями (/admin-panel/categories)
- CRM - CRM система (/crm)
- LMS - система обучения (/lms)
- BI - бизнес-интеллект (/bi)
- FileManager - файловый менеджер (/filemanager)
- ExpertSystem - экспертная система (/expert-system)

ВАЖНЫЕ ПРАВИЛА ДЛЯ НАВИГАЦИИ:
- Используй ТОЧНЫЕ имена роутов: Account, SecuritySettings, Settings, AdminPanel, UsersPanel, etc.
- НЕ изобретай свои названия типа "account/settings" - используй только реальные имена
- Для профиля используй "Account"
- Для настроек безопасности используй "SecuritySettings"
- Для основных настроек используй "Settings"
- Для админ панели используй "AdminPanel"

ВАЖНЫЕ ПРАВИЛА:
- Отвечай на русском языке
- CHAT используй для ВСЕХ технических вопросов: "как сделать", "как реализовать", "что такое", drag and drop, программирование
- COMPONENT_EXPLAIN используй ТОЛЬКО когда просят объяснить компоненты именно на текущей странице
- SYSTEM_OVERVIEW используй когда хотят увидеть весь список доступных разделов или страниц системы
- HELP используй ТОЛЬКО для запросов справки о самом ассистенте
- Будь дружелюбным и полезным
- Давай конкретные и полезные ответы

ФОРМАТ ОТВЕТА:
Ты должен ответить СТРОГО в JSON формате:
{
  "intent": "NAVIGATION|COMPONENT_EXPLAIN|PAGE_ANALYZE|SYSTEM_OVERVIEW|HELP|CHAT",
  "action": "конкретное действие если нужно",
  "message": "ответ пользователю",
  "params": {дополнительные параметры если нужно}
}

ВНИМАНИЕ: Отвечай ТОЛЬКО JSON, без дополнительного текста до или после!

ПРИМЕРЫ НАВИГАЦИИ:
Пользователь: "Перейди в мой профиль"
Ответ: {"intent":"NAVIGATION","action":"navigate_to_route","message":"Перехожу в ваш профиль","params":{"route":"Account"}}

Пользователь: "Открой настройки безопасности"
Ответ: {"intent":"NAVIGATION","action":"navigate_to_route","message":"Открываю настройки безопасности","params":{"route":"SecuritySettings"}}

Пользователь: "Перейди в настройки"
Ответ: {"intent":"NAVIGATION","action":"navigate_to_route","message":"Перехожу в настройки","params":{"route":"Settings"}}

Пользователь: "Открой админ панель"
Ответ: {"intent":"NAVIGATION","action":"navigate_to_route","message":"Открываю панель администратора","params":{"route":"AdminPanel"}}

Пользователь: "Где я нахожусь?"  
Ответ: {"intent":"PAGE_ANALYZE","action":"analyze_current_page","message":"Анализирую текущую страницу для вас","params":{}}

Пользователь: "Объясни компоненты на этой странице"
Ответ: {"intent":"COMPONENT_EXPLAIN","action":"explain_component","message":"Анализирую компоненты текущей страницы","params":{}}

Пользователь: "Покажи все страницы"
Ответ: {"intent":"SYSTEM_OVERVIEW","action":"show_all_routes","message":"Показываю все доступные разделы системы","params":{}}

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
            } else if (this.matchesKeywords(lowerMessage, ['crm', 'проекты', 'стратегические'])) {
                route = 'CRM'
                routeName = 'CRM'
            } else if (this.matchesKeywords(lowerMessage, ['lms', 'обучение', 'курсы'])) {
                route = 'LMS'
                routeName = 'LMS'
            } else if (this.matchesKeywords(lowerMessage, ['bi', 'аналитика', 'дашборд'])) {
                route = 'BI'
                routeName = 'BI'
            } else if (this.matchesKeywords(lowerMessage, ['файлы', 'файловый', 'менеджер'])) {
                route = 'FileManager'
                routeName = 'файловый менеджер'
            } else if (this.matchesKeywords(lowerMessage, ['экспертная', 'навыки', 'тесты', 'expert'])) {
                route = 'ExpertSystem'
                routeName = 'экспертная система'
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

        if (this.matchesKeywords(lowerMessage, ['покажи все страницы', 'все разделы', 'какие есть разделы', 'что доступно в системе', 'все модули', 'обзор системы', 'список страниц', 'все пути', 'карта сайта'])) {
            return {
                type: 'SYSTEM_OVERVIEW',
                action: 'show_all_routes',
                defaultMessage: 'Показываю все доступные разделы и страницы системы',
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