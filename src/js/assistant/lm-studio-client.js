class LMStudioClient {
    constructor(baseUrl = import.meta.env.VITE_LM_STUDIO_URL || 'http://127.0.0.1:1234') {
        this.baseUrl = baseUrl
        this.apiUrl = `${baseUrl}/v1`
        this.model = 'local-model'
        this.connected = false
        this.lastConnectionCheck = 0
        this.connectionCheckInterval = 30000
    }

    async checkConnection() {
        // Упрощаем проверку - просто пытаемся получить список моделей
        try {
            const response = await fetch(`${this.apiUrl}/models`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors'
            })

            if (response.ok) {
                const data = await response.json()
                if (data.data && data.data.length > 0) {
                    this.model = data.data[0].id
                    this.connected = true
                    this.lastConnectionCheck = Date.now()
                    return { connected: true, model: this.model, url: this.baseUrl }
                }
            }
        } catch (error) {
            console.log('Models endpoint failed, but LM Studio might still work for chat')
        }

        // Если /models не работает, пробуем тестовый запрос к chat/completions
        try {
            const testResponse = await fetch(`${this.apiUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors',
                body: JSON.stringify({
                    model: this.model || 'local-model',
                    messages: [{ role: 'user', content: 'test' }],
                    max_tokens: 1
                })
            })

            if (testResponse.ok) {
                this.connected = true
                this.lastConnectionCheck = Date.now()
                return { connected: true, model: this.model || 'local-model', url: this.baseUrl }
            }
        } catch (error) {
            console.log('Chat completions test failed:', error.message)
        }

        this.connected = false
        return { connected: false, error: 'LM Studio connection failed' }
    }

    async ensureConnection() {
        const now = Date.now()

        if (this.connected && (now - this.lastConnectionCheck) < this.connectionCheckInterval) {
            return { connected: true, model: this.model }
        }

        return await this.checkConnection()
    }

    async sendMessage(userMessage, systemContext = null) {
        try {
            // Простая проверка доступности - пытаемся отправить запрос
            // Если запрос пройдет, значит LM Studio работает

            const messages = []

            let combinedMessage = userMessage
            if (systemContext) {
                combinedMessage = `${systemContext}\n\nПользователь: ${userMessage}`
            }

            messages.push({
                role: 'user',
                content: combinedMessage
            })

            const response = await fetch(`${this.apiUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors',
                body: JSON.stringify({
                    model: this.model || 'local-model',
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1000,
                    stream: false
                })
            })

            if (!response.ok) {
                const errorText = await response.text()

                try {
                    const errorJson = JSON.parse(errorText)
                    if (errorJson.error && errorJson.error.includes('Only user and assistant roles are supported')) {
                        throw new Error('Модель поддерживает только роли user и assistant. Попробуйте другую модель.')
                    } else if (errorJson.error && errorJson.error.includes('jinja template')) {
                        throw new Error('Ошибка шаблона модели. Выберите модель из lmstudio-community с исправленными шаблонами.')
                    }
                    throw new Error(`LM Studio API error: ${response.status} - ${errorJson.error || errorText}`)
                } catch {
                    throw new Error(`LM Studio API error: ${response.status} - ${errorText}`)
                }
            }

            const data = await response.json()

            if (data.choices && data.choices.length > 0) {
                const aiResponse = data.choices[0].message.content.trim()

                // Успешный ответ - помечаем что подключение работает
                this.connected = true
                this.lastConnectionCheck = Date.now()

                return {
                    success: true,
                    message: aiResponse,
                    usage: data.usage,
                    model: this.model
                }
            } else {
                throw new Error('No response from model')
            }

        } catch (error) {
            this.connected = false

            return {
                success: false,
                error: error.message,
                fallbackMessage: `Не удалось получить ответ от AI модели (${this.baseUrl}). Убедитесь что LM Studio запущен и модель загружена.`
            }
        }
    }

    async sendStreamingMessage(userMessage, systemContext = null, onChunk = null) {
        try {
            const messages = []

            if (systemContext) {
                messages.push({
                    role: 'system',
                    content: systemContext
                })
            }

            messages.push({
                role: 'user',
                content: userMessage
            })

            const response = await fetch(`${this.apiUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors',
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1000,
                    stream: true
                })
            })

            if (!response.ok) {
                throw new Error(`LM Studio API error: ${response.status}`)
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let fullMessage = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value)
                const lines = chunk.split('\n')

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6)
                        if (data === '[DONE]') break

                        try {
                            const parsed = JSON.parse(data)
                            if (parsed.choices?.[0]?.delta?.content) {
                                const content = parsed.choices[0].delta.content
                                fullMessage += content
                                if (onChunk) onChunk(content)
                            }
                        } catch {
                            // Parse error ignored
                        }
                    }
                }
            }

            return {
                success: true,
                message: fullMessage.trim()
            }

        } catch (error) {
            return {
                success: false,
                error: error.message,
                fallbackMessage: 'Ошибка при получении потокового ответа от AI.'
            }
        }
    }
}

export const lmStudioClient = new LMStudioClient()
export default LMStudioClient

// Для отладки в консоли браузера
window.testLMStudio = async () => {
    console.log('🧪 Тестируем LM Studio подключение...')
    const result = await lmStudioClient.checkConnection()
    console.log('🎯 Результат теста:', result)
    return result
}

window.debugLMStudio = async () => {
    console.log('🔧 Полная диагностика LM Studio...')

    // Информация о клиенте
    console.log('📊 Настройки клиента:', {
        baseUrl: lmStudioClient.baseUrl,
        apiUrl: lmStudioClient.apiUrl,
        model: lmStudioClient.model,
        connected: lmStudioClient.connected,
        lastCheck: new Date(lmStudioClient.lastConnectionCheck).toLocaleTimeString()
    })

    // Тестируем подключение
    const result = await lmStudioClient.checkConnection()

    // Информация о браузере
    console.log('🌐 Информация о браузере:', {
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        cookieEnabled: navigator.cookieEnabled
    })

    // Проверяем CORS
    try {
        const corsTest = await fetch('http://127.0.0.1:1234/v1/models', { method: 'HEAD' })
        console.log('🔒 CORS тест успешен:', corsTest.status)
    } catch (corsError) {
        console.log('🔒 CORS проблема:', corsError.message)
    }

    return result
} 