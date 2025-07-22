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
                    console.log(`✅ LM Studio подключен! Модель: ${this.model}`)
                    return { connected: true, model: this.model }
                }
            }

            this.connected = false
            return { connected: false, error: 'No models available' }
        } catch (error) {
            this.connected = false
            console.warn(`❌ LM Studio недоступен: ${error.message}`)
            return { connected: false, error: error.message }
        }
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
            const connectionStatus = await this.ensureConnection()
            if (!connectionStatus.connected) {
                throw new Error('LM Studio недоступен')
            }

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

            console.log('🤖 Отправляю запрос в LM Studio...', {
                model: this.model,
                userMessage: userMessage.substring(0, 50) + '...'
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
                    stream: false
                })
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`LM Studio API error: ${response.status} - ${errorText}`)
            }

            const data = await response.json()

            if (data.choices && data.choices.length > 0) {
                const aiResponse = data.choices[0].message.content.trim()
                console.log('✅ Получен ответ от LM Studio:', aiResponse.substring(0, 100) + '...')

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
            console.error('❌ LM Studio Client Error:', error)

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
                        } catch (parseError) {
                            console.debug('Parse error ignored:', parseError)
                        }
                    }
                }
            }

            return {
                success: true,
                message: fullMessage.trim()
            }

        } catch (error) {
            console.error('LM Studio Streaming Error:', error)
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