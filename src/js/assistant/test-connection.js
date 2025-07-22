import { lmStudioClient } from './lm-studio-client.js'
import { intentAnalyzer } from './intent-analyzer.js'

export async function testConnection() {
    console.log('🔍 Тестируем подключение к LM Studio...')

    try {
        const result = await lmStudioClient.checkConnection()

        if (result.connected) {
            console.log('✅ LM Studio подключен!')
            console.log('📋 Модель:', result.model)
            return result
        } else {
            console.log('❌ LM Studio недоступен:', result.error)
            return result
        }
    } catch (error) {
        console.log('❌ Ошибка подключения:', error.message)
        return { connected: false, error: error.message }
    }
}

export async function testSimpleMessage(message = 'Привет! Как дела?') {
    console.log('💬 Тестируем отправку сообщения:', message)

    try {
        const result = await lmStudioClient.sendMessage(message, 'Ты полезный ассистент. Отвечай кратко и дружелюбно.')

        if (result.success) {
            console.log('✅ Ответ получен:')
            console.log(result.message)
            console.log('📊 Использование токенов:', result.usage)
            return result
        } else {
            console.log('❌ Ошибка при отправке:', result.error)
            return result
        }
    } catch (error) {
        console.log('❌ Ошибка:', error.message)
        return { success: false, error: error.message }
    }
}

export async function testIntentAnalysis(message = 'Перейди в настройки') {
    console.log('🧠 Тестируем анализ намерений:', message)

    try {
        const result = await intentAnalyzer.analyzeIntent(message, {
            currentRoute: '/test',
            currentPage: 'Тестовая страница',
            availableRoutes: ['Account', 'Settings', 'UsersPanel'],
            pageComponents: ['TestComponent', 'NavigationComponent']
        })

        console.log('✅ Результат анализа:')
        console.log('- Намерение:', result.intent)
        console.log('- Действие:', result.action)
        console.log('- Сообщение:', result.message)
        console.log('- Параметры:', result.params)

        return result
    } catch (error) {
        console.log('❌ Ошибка анализа:', error.message)
        return { success: false, error: error.message }
    }
}

export async function runFullTest() {
    console.log('🚀 Запускаем полный тест системы ассистента...\n')

    const results = {
        connection: null,
        simpleMessage: null,
        intentAnalysis: null
    }

    console.log('1️⃣ Тест подключения:')
    results.connection = await testConnection()
    console.log('')

    if (results.connection.connected) {
        console.log('2️⃣ Тест простого сообщения:')
        results.simpleMessage = await testSimpleMessage()
        console.log('')

        console.log('3️⃣ Тест анализа намерений:')
        results.intentAnalysis = await testIntentAnalysis()
        console.log('')
    } else {
        console.log('⏭️ Пропускаем тесты LLM - нет подключения')
    }

    console.log('📊 ИТОГОВЫЙ ОТЧЕТ:')
    console.log('━'.repeat(50))
    console.log('Подключение:', results.connection.connected ? '✅ OK' : '❌ FAIL')

    if (results.simpleMessage) {
        console.log('Простое сообщение:', results.simpleMessage.success ? '✅ OK' : '❌ FAIL')
    }

    if (results.intentAnalysis) {
        console.log('Анализ намерений:', results.intentAnalysis.success ? '✅ OK' : '❌ FAIL')
    }

    console.log('━'.repeat(50))

    return results
}

export async function diagnoseCORS() {
    console.log('🔍 Диагностика CORS проблем...')

    try {
        const lmStudioUrl = import.meta.env.VITE_LM_STUDIO_URL || 'http://127.0.0.1:1234'
        const response = await fetch(`${lmStudioUrl}/v1/models`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            mode: 'cors'
        })

        console.log('📡 Статус ответа:', response.status)
        console.log('📋 Headers:', [...response.headers.entries()])

        if (response.ok) {
            const data = await response.json()
            console.log('✅ Данные получены:', data)
            return { success: true, data }
        } else {
            console.log('❌ Ошибка HTTP:', response.statusText)
            return { success: false, error: response.statusText }
        }

    } catch (error) {
        console.log('❌ Ошибка CORS или сети:', error.message)
        return { success: false, error: error.message }
    }
}

if (typeof window !== 'undefined') {
    window.testLMStudio = {
        testConnection,
        testSimpleMessage,
        testIntentAnalysis,
        runFullTest,
        diagnoseCORS
    }

    console.log('🛠️ Утилиты тестирования LM Studio доступны в window.testLMStudio')
    console.log('Попробуйте: window.testLMStudio.runFullTest()')
} 