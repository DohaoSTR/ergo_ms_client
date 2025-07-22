class IntentAnalyzer {
    constructor(client = null) {
        this.client = client
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

ВАЖНЫЕ ПРАВИЛА ДЛЯ НАВИГАЦИИ:
- Анализируй СЕМАНТИКУ запроса пользователя
- Используй список доступных маршрутов из контекста
- Для "профиль", "личный кабинет", "аккаунт" выбирай Account (/user/account)
- Для "настройки" без уточнения выбирай Settings (/settings)
- Для "настройки безопасности" выбирай SecuritySettings (/user/security)
- Для "пользователи", "управление пользователями" выбирай UsersPanel
- Возвращай ТОЧНОЕ имя маршрута из списка доступных

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
Контекст содержит: Account: /user/account - Личный кабинет пользователя, профиль
Ответ: {"intent":"NAVIGATION","action":"go_to_profile","message":"Перехожу в ваш профиль","params":{"route":"Account","routeName":"профиль"}}

Пользователь: "Открой настройки"
Контекст содержит: Settings: /settings - Системные настройки приложения
Ответ: {"intent":"NAVIGATION","action":"go_to_settings","message":"Открываю настройки системы","params":{"route":"Settings","routeName":"настройки"}}

Пользователь: "Где я нахожусь?"  
Ответ: {"intent":"PAGE_ANALYZE","action":"analyze_current_page","message":"Анализирую текущую страницу для вас","params":{}}

Пользователь: "Объясни компоненты на этой странице"
Ответ: {"intent":"COMPONENT_EXPLAIN","action":"explain_component","message":"Анализирую компоненты текущей страницы","params":{}}

Пользователь: "Помощь"
Ответ: {"intent":"HELP","action":"show_help","message":"Показываю справку по возможностям ассистента","params":{}}

Пользователь: "Как мне сделать dnd на моей странице bi?"
Ответ: {"intent":"CHAT","action":null,"message":"Для реализации drag and drop на BI странице рекомендую использовать Vue Draggable или SortableJS. Это самые популярные решения для Vue приложений. Что именно нужно перетаскивать?","params":{}}`
    }

    async analyzeIntent(userMessage, context = {}) {
        try {
            const systemPrompt = this.buildSystemPrompt()
            const contextPrompt = await this.buildContextPrompt(context)
            const userPrompt = `${contextPrompt}\n\nПользователь: "${userMessage}"`

            console.log('🔍 Запрос в LM Studio...', {
                model: this.client.model,
                userMessage: userMessage.substring(0, 50) + '...'
            })

            const response = await this.client.sendMessage(systemPrompt, userPrompt)

            if (response && response.trim()) {
                console.log('✅ Получен ответ от LM Studio:', response.substring(0, 100) + '...')

                try {
                    const parsed = JSON.parse(response.trim())
                    console.log('✅ LLM успешно обработал запрос:', parsed.intent)
                    return parsed
                } catch (parseError) {
                    console.warn('⚠️ Ошибка парсинга JSON от LLM:', parseError)
                    console.log('📝 Сырой ответ:', response)
                    return this.fallbackAnalysis(userMessage, response)
                }
            } else {
                console.warn('⚠️ Пустой ответ от LM Studio')
                return this.fallbackAnalysis(userMessage, null)
            }

        } catch (error) {
            console.error('❌ Ошибка при анализе намерений:', error)
            return this.fallbackAnalysis(userMessage, null)
        }
    }

    async buildContextPrompt(context) {
        const prompt = []

        if (context.currentRoute) {
            prompt.push(`Текущий маршрут: ${context.currentRoute}`)
        }

        if (context.currentPage) {
            prompt.push(`Текущая страница: ${context.currentPage}`)
        }

        if (context.availableRoutes && context.availableRoutes.length > 0) {
            prompt.push(`ДОСТУПНЫЕ МАРШРУТЫ (name: path):`)

            const routeDescriptions = await this.getRouteDescriptions(context.availableRoutes)
            context.availableRoutes.forEach(routeName => {
                const routeInfo = routeDescriptions[routeName] || `Маршрут ${routeName}`
                prompt.push(`- ${routeName}: ${routeInfo}`)
            })
        }

        if (context.pageComponents && context.pageComponents.length > 0) {
            prompt.push(`Компоненты на странице: ${context.pageComponents.join(', ')}`)
        }

        return prompt.join('\n')
    }

    async getRouteDescriptions(routeNames) {
        try {
            const response = await fetch('/api/cms/get-routes-paths/')
            const data = await response.json()

            if (data.routes && Array.isArray(data.routes)) {
                const descriptions = {}
                data.routes.forEach(route => {
                    if (routeNames.includes(route.name)) {
                        descriptions[route.name] = `${route.path} - ${route.title}`
                    }
                })

                routeNames.forEach(routeName => {
                    if (!descriptions[routeName]) {
                        descriptions[routeName] = this.getFallbackDescription(routeName)
                    }
                })

                return descriptions
            }
        } catch (error) {
            console.error('Ошибка при получении описаний маршрутов:', error)
        }

        const fallbackDescriptions = {}
        routeNames.forEach(routeName => {
            fallbackDescriptions[routeName] = this.getFallbackDescription(routeName)
        })

        return fallbackDescriptions
    }

    getFallbackDescription(routeName) {
        const routeDescriptions = {
            'Account': '/user/account - Личный кабинет пользователя, профиль',
            'SecuritySettings': '/user/security - Настройки безопасности пользователя',
            'Settings': '/settings - Системные настройки приложения',
            'UsersPanel': '/admin-panel/users - Панель управления пользователями',
            'AdminPanel': '/admin-panel - Админ панель системы',
            'GroupsPanel': '/admin-panel/groups - Управление группами пользователей',
            'CategoriesPanel': '/admin-panel/categories - Управление категориями',
            'BI': '/bi - Модуль бизнес-аналитики',
            'CRM': '/crm - CRM система',
            'LMS': '/lms - Система управления обучением',
            'ExpertSystem': '/expert-system - Экспертная система',
            'Profile': '/expert-system/account - Профиль в экспертной системе',
            'ProfilePage': '/education_analytics/profile - Профиль в аналитике образования',
            'DatabaseAnalyze': '/user/analyze/databaseanalyze - Анализ базы данных',
            'Analyze': '/user/analyze - Анализ данных'
        }

        return routeDescriptions[routeName] || `Маршрут ${routeName}`
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
            let routeName = 'профиль'

            if (this.matchesKeywords(lowerMessage, ['профиль', 'profile', 'аккаунт', 'account', 'личный кабинет'])) {
                route = 'Account'
                routeName = 'профиль'
            } else if (this.matchesKeywords(lowerMessage, ['настройки', 'settings']) && !this.matchesKeywords(lowerMessage, ['безопасности', 'security'])) {
                route = 'Settings'
                routeName = 'настройки системы'
            } else if (this.matchesKeywords(lowerMessage, ['настройки безопасности', 'безопасность', 'security'])) {
                route = 'SecuritySettings'
                routeName = 'настройки безопасности'
            } else if (this.matchesKeywords(lowerMessage, ['пользователи', 'users']) || (this.matchesKeywords(lowerMessage, ['админ', 'admin']) && this.matchesKeywords(lowerMessage, ['пользователи', 'users']))) {
                route = 'UsersPanel'
                routeName = 'панель пользователей'
            } else if (this.matchesKeywords(lowerMessage, ['админ панель', 'admin panel']) && !this.matchesKeywords(lowerMessage, ['пользователи', 'группы', 'категории'])) {
                route = 'AdminPanel'
                routeName = 'админ панель'
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