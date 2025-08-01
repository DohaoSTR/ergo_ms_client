import { lmStudioClient } from './lm-studio-client.js'

class IntentAnalyzer {
    constructor() {
        this.systemPrompt = this.buildSystemPrompt()
    }

    buildSystemPrompt() {
        return `Ты - AI ассистент для веб-приложения ERGO MS. Анализируй намерения пользователя.

ДОСТУПНЫЕ ДЕЙСТВИЯ:
1. NAVIGATION - переход по страницам
2. COMPONENT_EXPLAIN - объяснение компонентов на текущей странице
3. PAGE_ANALYZE - анализ текущей страницы
4. SYSTEM_OVERVIEW - показ всех разделов системы
5. HELP - справка
6. CHAT - обычный разговор

ФОРМАТ ОТВЕТА:
{
  "intent": "NAVIGATION|COMPONENT_EXPLAIN|PAGE_ANALYZE|SYSTEM_OVERVIEW|HELP|CHAT",
  "action": "navigate_to_route",
  "message": "ответ",
  "params": {"route": "имя_маршрута"}
}

Для NAVIGATION всегда используй action: "navigate_to_route" и указывай конкретное имя маршрута в params.route`
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

        if (context.availableRoutes && context.availableRoutes.length > 0) {
            prompt.push(`Доступные маршруты: ${context.availableRoutes.join(', ')}`)
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

        // Убираем жестко заданные маппинги - пусть LLM сам думает
        // Оставляем только базовую логику для определения типа намерения

        if (this.matchesKeywords(lowerMessage, ['перейди', 'переход', 'открой', 'иди', 'перейти', 'покажи страницу'])) {
            return {
                type: 'NAVIGATION',
                action: 'navigate_to_route',
                defaultMessage: 'Попробуйте переформулировать запрос более конкретно, например: "перейди в профиль" или "открой настройки"',
                params: { route: null, routeName: null }
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