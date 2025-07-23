<template>
  <div class="assistant-widget">
    <AssistantButton ref="assistantButton" @toggle-chat="toggleChat" />

    <AssistantChat
      ref="assistantChat"
      :is-visible="isChatVisible"
      @send-message="handleMessage"
      @recheck-llm="recheckLLM"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import AssistantButton from './AssistantButton.vue'
import AssistantChat from './AssistantChat.vue'
import { intentAnalyzer } from '@/js/assistant/intent-analyzer.js'
import { routerActions } from '@/js/assistant/router-actions.js'
import { componentAnalyzer } from '@/js/assistant/component-analyzer.js'
import { connectionStatus } from '@/js/assistant/connection-status.js'
import '@/js/assistant/test-connection.js'

const route = useRoute()
const assistantButton = ref(null)
const assistantChat = ref(null)
const isChatVisible = ref(false)
const llmAvailable = ref(false)

const toggleChat = async (isOpen) => {
  isChatVisible.value = isOpen

  if (isOpen) {
    assistantButton.value?.hideNotification()
    connectionStatus.show()

    // Проверяем доступность LLM при открытии чата
    try {
      const { smartNavigation } = await import('@/js/assistant/smart-navigation.js')
      const { lmStudioClient } = await import('@/js/assistant/lm-studio-client.js')

      // Двойная проверка - сначала LM Studio, потом Smart Navigation
      const lmStatus = await lmStudioClient.checkConnection()
      await smartNavigation.checkLLMAvailability(true) // Принудительная проверка при открытии

      // Агрессивная синхронизация состояний
      if (lmStatus.connected && smartNavigation.llmAvailable) {
        llmAvailable.value = true
      } else if (lmStatus.connected && !smartNavigation.llmAvailable) {
        // LM Studio работает, но Smart Navigation думает что нет - исправляем
        smartNavigation.llmAvailable = true
        smartNavigation.lastLLMCheck = Date.now()
        llmAvailable.value = true
      } else {
        llmAvailable.value = false
      }

      // Финальное логирование
    } catch (error) {
      console.error('💥 Ошибка проверки при открытии чата:', error)
      llmAvailable.value = false
    }
  } else {
    connectionStatus.hide()
  }
}

const handleMessage = async (message) => {
  if (!message.trim()) return

  assistantChat.value?.addUserMessage(message)
  assistantButton.value?.startPulsing()

  try {
    const { smartNavigation } = await import('@/js/assistant/smart-navigation.js')
    const isLLMAvailable = smartNavigation.llmAvailable

    if (!isLLMAvailable) {
      const { lmStudioClient } = await import('@/js/assistant/lm-studio-client.js')
      const quickCheck = await lmStudioClient.checkConnection()

      if (quickCheck.connected) {
        smartNavigation.llmAvailable = true
        smartNavigation.lastLLMCheck = Date.now()
        llmAvailable.value = true

        assistantChat.value?.addAssistantMessage(
          '🔄 **Автоматическое исправление выполнено!**\n\n' +
            '✅ Обнаружено подключение к LM Studio\n' +
            '🔧 Состояние синхронизировано\n\n' +
            '🎉 Обрабатываю ваше сообщение...',
        )
        await nextTick()
      } else {
        assistantChat.value?.addAssistantMessage(
          '⚠️ **LLM модель недоступна**\n\n' +
            'Система работает в ограниченном режиме.\n' +
            'Будет использована базовая навигация без LLM анализа.\n\n' +
            '🔧 Для полного функционала запустите LM Studio.',
        )
      }
    } else {
      llmAvailable.value = true
    }

    const context = await getCurrentContext()
    const intentResult = await intentAnalyzer.analyzeIntent(message, context)

    if (intentResult.success) {
      const actionResult = await executeAction(intentResult)

      let formattedMessage = actionResult.message

      if (intentResult.intent !== 'NAVIGATION') {
        if (actionResult.success) {
          if (!formattedMessage.includes('✅')) {
            formattedMessage = `✅ ${formattedMessage}`
          }
        } else {
          if (!formattedMessage.includes('❌')) {
            formattedMessage = `❌ ${formattedMessage}`
          }
        }
      }

      assistantChat.value?.addAssistantMessage(formattedMessage)

      if (actionResult.usedLLM) {
        connectionStatus.show()
      }
    } else {
      assistantChat.value?.addAssistantMessage(
        'Не удалось понять ваш запрос. Попробуйте переформулировать.',
      )
    }
  } catch (error) {
    assistantChat.value?.addAssistantMessage(
      '⚠️ Произошла ошибка при обработке сообщения.\n\n' +
        `🔍 Техническая информация: ${error.message}\n\n` +
        '🧪 **Для отладки выполните в консоли:** `testLMStudio()`',
    )
  } finally {
    assistantButton.value?.stopPulsing()
  }
}

const getCurrentContext = async () => {
  try {
    const currentRoute = routerActions.getCurrentRoute()
    const availableRoutes = routerActions.getAvailableRoutes().map((r) => r.name || r.path)
    const pageAnalysis = routerActions.analyzeCurrentPage()
    const componentAnalysis = componentAnalyzer.analyzePageComponents()

    // Добавляем статистику умной навигации
    const navigationStats = await routerActions.getNavigationStats()

    return {
      currentRoute: currentRoute.path,
      currentPage: pageAnalysis.pageName,
      availableRoutes: availableRoutes.slice(0, 10),
      pageComponents: Object.keys(componentAnalysis.descriptions || {}).slice(0, 5),
      breadcrumbs: pageAnalysis.breadcrumbs,
      availableActions: pageAnalysis.availableActions,
      navigationStats: navigationStats,
    }
  } catch {
    return {
      currentRoute: route.path,
      currentPage: 'текущая страница',
      availableRoutes: [],
      pageComponents: [],
      breadcrumbs: [],
      availableActions: [],
      navigationStats: { totalRoutes: 0, initialized: false },
    }
  }
}

const executeAction = async (intentResult) => {
  switch (intentResult.intent) {
    case 'NAVIGATION':
      return await handleNavigationIntent(intentResult)

    case 'PAGE_ANALYZE':
      return await handlePageAnalyzeIntent(intentResult)

    case 'COMPONENT_EXPLAIN':
      return await handleComponentExplainIntent(intentResult)

    case 'SYSTEM_OVERVIEW':
      return await handleSystemOverviewIntent(intentResult)

    case 'HELP':
      return await handleHelpIntent(intentResult)

    case 'CHAT':
    default:
      return {
        message: intentResult.message,
        usedLLM: intentResult.action === null,
      }
  }
}

const handleNavigationIntent = async (intentResult) => {
  const { params } = intentResult

  let routeToNavigate = null

  if (params.route) {
    routeToNavigate = params.route
  } else if (params.routeName) {
    routeToNavigate = params.routeName
  } else {
    const message = intentResult.message || ''
    routeToNavigate = message
  }

  if (routeToNavigate) {
    const result = await routerActions.navigateToRoute(routeToNavigate)

    if (result.success) {
      return {
        message: result.message,
        usedLLM: false,
        confidence: result.confidence,
        method: result.method,
      }
    } else {
      let message = result.message

      const { smartNavigation } = await import('@/js/assistant/smart-navigation.js')
      const isLLMAvailable = smartNavigation.llmAvailable

      if (!result.suggestions?.length) {
        if (isLLMAvailable) {
          message += '\n\n💡 Попробуйте более конкретные запросы:'
          message += '\n• "перейди в профиль"'
          message += '\n• "открой настройки безопасности"'
          message += '\n• "покажи все страницы"'
          message += '\n• "перейди в CRM"'
        } else {
          message += '\n\n⚠️ LLM недоступен. Базовые команды:'
          message += '\n• "профиль" → Account'
          message += '\n• "настройки" → Settings'
          message += '\n• "админ" → AdminPanel'
          message += '\n• "crm" → CRM система'
          message += '\n• "lms" → Система обучения'
        }
      }

      return { message, usedLLM: false }
    }
  }

  return {
    message: 'Не указан маршрут для навигации.',
    usedLLM: false,
  }
}

const handlePageAnalyzeIntent = async () => {
  try {
    const pageAnalysis = routerActions.analyzeCurrentPage()
    const componentAnalysis = componentAnalyzer.analyzePageComponents()

    let message = `📍 **Анализ текущей страницы:**\n\n`
    message += `**Страница:** ${pageAnalysis.pageName}\n`
    message += `**Путь:** ${pageAnalysis.route.path}\n\n`

    if (pageAnalysis.breadcrumbs.length > 1) {
      message += `**Навигация:** ${pageAnalysis.breadcrumbs.map((b) => b.name).join(' → ')}\n\n`
    }

    if (componentAnalysis.totalComponents) {
      message += `**Компоненты на странице:** ${componentAnalysis.totalComponents}\n`

      const mainComponents = Object.entries(componentAnalysis.componentTypes)
        .filter(([, components]) => components.length > 0)
        .map(([type, components]) => `${type}: ${components.length}`)
        .join(', ')

      if (mainComponents) {
        message += `**Типы:** ${mainComponents}\n\n`
      }
    }

    if (componentAnalysis.interactiveElements?.length > 0) {
      message += `**Интерактивные элементы:**\n`
      componentAnalysis.interactiveElements.forEach((element) => {
        message += `• ${element.description}\n`
      })
      message += '\n'
    }

    if (pageAnalysis.availableActions.length > 0) {
      message += `**Что можно сделать:**\n`
      pageAnalysis.availableActions.slice(0, 5).forEach((action) => {
        message += `• ${action}\n`
      })
    }

    return { message, usedLLM: false }
  } catch {
    return { message: 'Не удалось проанализировать страницу. Попробуйте еще раз.', usedLLM: false }
  }
}

const handleComponentExplainIntent = async () => {
  try {
    const componentAnalysis = componentAnalyzer.analyzePageComponents()

    let message = `🔧 **Компоненты на странице:**\n\n`

    const descriptions = componentAnalysis.descriptions || {}
    const componentsToShow = Object.entries(descriptions).slice(0, 8)

    if (componentsToShow.length > 0) {
      componentsToShow.forEach(([component, description]) => {
        message += `**${component}**\n${description}\n\n`
      })

      if (Object.keys(descriptions).length > 8) {
        message += `_И еще ${Object.keys(descriptions).length - 8} компонентов..._\n\n`
      }

      message += `💡 Спросите про конкретный компонент для подробного объяснения!`
    } else {
      message = 'На этой странице не обнаружено распознаваемых компонентов.'
    }

    return { message, usedLLM: false }
  } catch {
    return {
      message: 'Не удалось проанализировать компоненты. Попробуйте еще раз.',
      usedLLM: false,
    }
  }
}

const handleSystemOverviewIntent = async () => {
  try {
    const { routesReader } = await import('@/js/assistant/routes-reader.js')
    const allRoutes = routesReader.getAllRoutes()

    // Группируем маршруты по категориям
    const categories = {
      Пользователь: [],
      Администрирование: [],
      CRM: [],
      LMS: [],
      Контент: [],
      'BI и Аналитика': [],
      'Экспертная система': [],
      Другое: [],
    }

    allRoutes.forEach((route) => {
      const name = route.name?.toLowerCase() || ''
      const path = route.path?.toLowerCase() || ''
      const title = route.meta?.title || routesReader.getPageDisplayName(route)

      if (!route.meta?.requiresAuth === false && route.path !== '/:pathMatch(.*)*') {
        if (name.includes('user') || name === 'account' || name.includes('security')) {
          categories['Пользователь'].push(`• **${title}** (${route.path})`)
        } else if (
          name.includes('admin') ||
          name.includes('users') ||
          name.includes('groups') ||
          name.includes('permissions')
        ) {
          categories['Администрирование'].push(`• **${title}** (${route.path})`)
        } else if (path.includes('crm') || name.includes('project') || name.includes('strategic')) {
          categories['CRM'].push(`• **${title}** (${route.path})`)
        } else if (path.includes('lms') || name.includes('course') || name.includes('badge')) {
          categories['LMS'].push(`• **${title}** (${route.path})`)
        } else if (
          name.includes('shortcode') ||
          name.includes('page') ||
          name.includes('template') ||
          name.includes('categories') ||
          name.includes('filemanager')
        ) {
          categories['Контент'].push(`• **${title}** (${route.path})`)
        } else if (
          name.includes('bi') ||
          name.includes('dashboard') ||
          name.includes('chart') ||
          name.includes('analytics')
        ) {
          categories['BI и Аналитика'].push(`• **${title}** (${route.path})`)
        } else if (
          path.includes('expert') ||
          name.includes('skill') ||
          name.includes('test') ||
          name.includes('vacancy')
        ) {
          categories['Экспертная система'].push(`• **${title}** (${route.path})`)
        } else {
          categories['Другое'].push(`• **${title}** (${route.path})`)
        }
      }
    })

    let message = `🗺️ **Карта системы ERGO MS**\n\nВсего доступно **${allRoutes.length}** разделов:\n\n`

    Object.entries(categories).forEach(([category, routes]) => {
      if (routes.length > 0) {
        message += `**🔸 ${category}**\n${routes.slice(0, 8).join('\n')}`
        if (routes.length > 8) {
          message += `\n_и еще ${routes.length - 8} разделов..._`
        }
        message += '\n\n'
      }
    })

    message += `💡 **Как использовать:**\n• Просто скажите "перейди в [название]"\n• Например: "открой CRM", "перейди в настройки"\n• Или спросите: "что делает [раздел]?"`

    return { message, usedLLM: false }
  } catch (error) {
    console.error('Error generating system overview:', error)
    return {
      message: 'Не удалось загрузить список разделов системы. Попробуйте еще раз.',
      usedLLM: false,
    }
  }
}

const handleHelpIntent = async () => {
  const navigationStats = await routerActions.getNavigationStats()
  const isLLMAvailable = navigationStats.llmAvailable

  if (!isLLMAvailable) {
    const message = `🤖 **AI Ассистент ERGO MS** ⚠️ **Ограниченный режим**\n\n❌ **LLM модель недоступна**\nФункционал сведен к минимальному.\n\n🔧 **Что работает:**\n• Базовый поиск по ключевым словам\n• Простые команды навигации\n• Показ списка всех страниц\n• Анализ текущей страницы\n\n🧭 **Базовые команды навигации:**\n• "профиль" → Личный кабинет\n• "настройки" → Настройки системы\n• "админ" → Админ панель\n• "пользователи" → Управление пользователями\n• "crm" → CRM система\n• "lms" → Система обучения\n• "bi" → Бизнес-интеллект\n• "файлы" → Файловый менеджер\n\n📋 **Анализ страниц (работает):**\n• "Где я нахожусь?"\n• "Что это за страница?"\n\n🗺️ **Просмотр системы (работает):**\n• "Покажи все страницы"\n• "Какие есть разделы?"\n\n💡 **Для полного функционала:**\n• Запустите LM Studio\n• Загрузите модель\n• Перезапустите помощника\n\n📊 **Статистика:**\n• Доступно ${navigationStats.totalRoutes} маршрутов\n• Метод анализа: ${navigationStats.analysisMethod}\n• Последняя проверка LLM: ${navigationStats.lastLLMCheck ? new Date(navigationStats.lastLLMCheck).toLocaleTimeString() : 'Не проверялось'}\n\n⚠️ В базовом режиме точность навигации значительно снижена!`

    return { message, usedLLM: false }
  }

  const message = `🤖 **AI Ассистент ERGO MS v3.0** ✅ **Полный режим**\n\n**🧠 Полностью динамическая навигация:**\n• Только LLM анализ - никаких статических правил!\n• Анализирую ВСЕ ${navigationStats.totalRoutes} маршрутов системы\n• Показываю процент уверенности (0-100%)\n• Подробные объяснения каждого выбора\n• Умные альтернативы при неточных запросах\n\n🎯 **Метод анализа:** ${navigationStats.analysisMethod}\n\n🧭 **Примеры навигации:**\n• "Перейди в профиль"\n• "Открой настройки безопасности"\n• "Покажи админ панель"\n• "Хочу работать с проектами"\n• "Нужна аналитика продаж"\n\n📋 **Анализ страниц**\n• "Где я нахожусь?"\n• "Как работает эта страница?"\n• "Что здесь можно сделать?"\n\n🔧 **Объяснение компонентов**\n• "Объясни компоненты"\n• "Что делает эта кнопка?"\n• "Как работает таблица?"\n\n🗺️ **Просмотр всех разделов**\n• "Покажи все страницы"\n• "Какие есть разделы?"\n• "Что доступно в системе?"\n\n💬 **Умное общение**\n• Просто описывайте что хотите сделать\n• Я понимаю контекст и намерения\n• Объясняю почему выбрал именно этот путь\n\n📞 **Примеры сложных запросов:**\n• "Хочу посмотреть как учатся студенты"\n• "Нужно настроить права доступа"\n• "Покажи где можно создать отчет"\n• "Хочу управлять контентом сайта"\n\nПросто опишите что хотите - я найду лучший путь! 😊\n\n✅ **LLM модель подключена и работает!**`

  return { message, usedLLM: false }
}

const recheckLLM = async () => {
  try {
    const { smartNavigation } = await import('@/js/assistant/smart-navigation.js')
    const { lmStudioClient } = await import('@/js/assistant/lm-studio-client.js')

    // Сначала проверяем LM Studio
    const lmStudioResult = await lmStudioClient.checkConnection()

    // Затем Smart Navigation
    await smartNavigation.checkLLMAvailability(true)

    // Синхронизируем состояния более агрессивно
    if (lmStudioResult.connected) {
      smartNavigation.llmAvailable = true
      smartNavigation.lastLLMCheck = Date.now()
      llmAvailable.value = true
    } else {
      llmAvailable.value = false
    }

    if (llmAvailable.value) {
      assistantChat.value?.addAssistantMessage(
        '✅ **LLM модель теперь доступна!**\n\n' +
          `🔌 LM Studio: ${lmStudioResult.connected ? 'подключен' : 'отключен'}\n` +
          `🤖 Модель: ${lmStudioResult.model || 'не определена'}\n` +
          `🧠 Smart Navigation: ${smartNavigation.llmAvailable ? 'активен' : 'неактивен'}\n` +
          `📊 UI состояние: ${llmAvailable.value ? 'разблокирован' : 'заблокирован'}\n\n` +
          '🎉 **Можете пользоваться чатом!**',
      )
    } else {
      assistantChat.value?.addAssistantMessage(
        '❌ **LLM модель все еще недоступна**\n\n' +
          `🔌 LM Studio: ${lmStudioResult.connected ? 'подключен' : 'отключен'}\n` +
          `❌ Ошибка: ${lmStudioResult.error || 'неизвестная'}\n\n` +
          '🔧 Проверьте подключение к LM Studio.',
      )
    }
  } catch (error) {
    console.error('💥 Ошибка перепроверки LLM:', error)
    llmAvailable.value = false
    assistantChat.value?.addAssistantMessage(
      `❌ **Ошибка при проверке LLM модели**\n\n` +
        `🔍 Техническая информация: ${error.message}\n\n` +
        '🔧 Попробуйте обновить страницу.',
    )
  }
}

// Экспортируем функции для отладки в консоль браузера
window.debugAssistant = {
  async testLLM() {
    try {
      const { smartNavigation } = await import('@/js/assistant/smart-navigation.js')
      await smartNavigation.checkLLMAvailability(true)
      return smartNavigation.llmAvailable
    } catch (error) {
      console.error('💥 Ошибка тестирования:', error)
      return false
    }
  },

  async recheckAll() {
    console.log('🔄 Полная перепроверка системы...')
    const llmTest = await this.testLLM()
    const lmStudioTest = await window.testLMStudio()
    console.log('📊 Итоговые результаты:', {
      smartNavigation: llmTest,
      lmStudioClient: lmStudioTest.connected,
    })
    return { smartNavigation: llmTest, lmStudioClient: lmStudioTest.connected }
  },

  async fixSystem() {
    try {
      const { lmStudioClient } = await import('@/js/assistant/lm-studio-client.js')
      const { smartNavigation } = await import('@/js/assistant/smart-navigation.js')

      const lmStatus = await lmStudioClient.checkConnection()
      await smartNavigation.checkLLMAvailability(true)
      const smartNavStatus = smartNavigation.llmAvailable

      const shouldBeAvailable = lmStatus.connected && smartNavStatus

      if (shouldBeAvailable) {
        window.dispatchEvent(
          new CustomEvent('llm-status-changed', {
            detail: { available: true, model: lmStatus.model, force: true },
          }),
        )

        return {
          success: true,
          lmStudio: lmStatus.connected,
          smartNav: smartNavStatus,
        }
      } else {
        return {
          success: false,
          lmStudio: lmStatus.connected,
          smartNav: smartNavStatus,
        }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  async forceUnblock() {
    console.log('🔓 Принудительное разблокирование чата...')

    try {
      const { smartNavigation } = await import('@/js/assistant/smart-navigation.js')
      const { lmStudioClient } = await import('@/js/assistant/lm-studio-client.js')

      // Сначала проверяем реальное состояние LM Studio
      console.log('🔍 Проверяем реальное состояние LM Studio...')
      const realStatus = await lmStudioClient.checkConnection()
      console.log('🔌 Реальный статус LM Studio:', realStatus)

      if (realStatus.connected) {
        // Если LM Studio доступен, принудительно обновляем все состояния
        console.log('✅ LM Studio доступен, принудительно разблокируем чат...')

        smartNavigation.llmAvailable = true
        smartNavigation.lastLLMCheck = Date.now()

        // Принудительно обновляем UI через глобальные события
        window.dispatchEvent(
          new CustomEvent('llm-status-changed', {
            detail: { available: true, model: realStatus.model },
          }),
        )

        console.log('🎉 Чат разблокирован и события отправлены!')

        return {
          success: true,
          message: 'Чат успешно разблокирован',
          lmStudio: realStatus,
        }
      } else {
        console.log('❌ LM Studio действительно недоступен:', realStatus.error)
        return {
          success: false,
          message: 'LM Studio недоступен',
          error: realStatus.error,
        }
      }
    } catch (error) {
      console.error('💥 Ошибка принудительного разблокирования:', error)
      return { success: false, error: error.message }
    }
  },

  async reinitializeSystem() {
    console.log('🔄 Полная переинициализация системы...')

    try {
      const { smartNavigation } = await import('@/js/assistant/smart-navigation.js')
      const { routesReader } = await import('@/js/assistant/routes-reader.js')
      const { lmStudioClient } = await import('@/js/assistant/lm-studio-client.js')

      // Шаг 1: Сбрасываем все состояния
      console.log('🔧 Сбрасываем состояния...')
      smartNavigation.initialized = false
      smartNavigation.llmAvailable = false
      smartNavigation.allRoutes = []
      smartNavigation.lastLLMCheck = null

      routesReader.initialized = false
      routesReader.routesCache = null
      routesReader.pathMapping = null

      // Шаг 2: Переинициализируем routes-reader
      console.log('📋 Переинициализируем routes-reader...')
      await routesReader.initialize()
      const routesCount = routesReader.getAllRoutes().length

      // Шаг 3: Переинициализируем smart-navigation
      console.log('🧠 Переинициализируем smart-navigation...')
      await smartNavigation.initialize()

      // Шаг 4: Проверяем LM Studio
      console.log('🔌 Проверяем LM Studio...')
      const lmStatus = await lmStudioClient.checkConnection()

      // Шаг 5: Синхронизируем состояния
      if (lmStatus.connected) {
        smartNavigation.llmAvailable = true
        smartNavigation.lastLLMCheck = Date.now()

        // Отправляем глобальное событие для обновления UI
        window.dispatchEvent(
          new CustomEvent('llm-status-changed', {
            detail: { available: true, model: lmStatus.model },
          }),
        )
      }

      console.log('✅ Переинициализация системы завершена:', {
        routes: routesCount,
        lmStudio: lmStatus.connected,
        smartNav: smartNavigation.llmAvailable,
      })

      return {
        success: routesCount > 0 || lmStatus.connected,
        routes: routesCount,
        lmStudio: lmStatus.connected,
        smartNav: smartNavigation.llmAvailable,
      }
    } catch (error) {
      console.error('💥 Ошибка переинициализации:', error)
      return { success: false, error: error.message }
    }
  },

  async forceUpdateUI() {
    console.log('🔄 Принудительное обновление UI состояния...')

    try {
      const { smartNavigation } = await import('@/js/assistant/smart-navigation.js')
      const { lmStudioClient } = await import('@/js/assistant/lm-studio-client.js')

      // Проверяем реальные состояния
      const lmStatus = await lmStudioClient.checkConnection()
      const smartNavStatus = smartNavigation.llmAvailable

      console.log('📊 Текущие состояния:', {
        lmStudio: lmStatus.connected,
        smartNavigation: smartNavStatus,
      })

      // Определяем правильное состояние
      const shouldBeAvailable = lmStatus.connected && smartNavStatus

      if (shouldBeAvailable) {
        // Отправляем глобальное событие для принудительного обновления UI
        window.dispatchEvent(
          new CustomEvent('llm-status-changed', {
            detail: { available: true, model: lmStatus.model, force: true },
          }),
        )

        console.log('🎉 UI состояние принудительно обновлено!')

        return {
          success: true,
          lmStudio: lmStatus.connected,
          smartNav: smartNavStatus,
        }
      } else {
        console.log('❌ Компоненты системы недоступны')
        return {
          success: false,
          lmStudio: lmStatus.connected,
          smartNav: smartNavStatus,
        }
      }
    } catch (error) {
      console.error('💥 Ошибка обновления UI:', error)
      return { success: false, error: error.message }
    }
  },
}

onMounted(() => {
  // Assistant widget initialized
})

onUnmounted(() => {
  connectionStatus.destroy()

  // Удаляем слушатель глобального события
  if (window._llmStatusListener) {
    window.removeEventListener('llm-status-changed', window._llmStatusListener)
    delete window._llmStatusListener
  }

  delete window.debugAssistant
})

defineExpose({
  showNotification: () => assistantButton.value?.showNotification(),
  openChat: () => toggleChat(true),
  closeChat: () => toggleChat(false),
  showConnectionStatus: () => connectionStatus.show(),
})
</script>
