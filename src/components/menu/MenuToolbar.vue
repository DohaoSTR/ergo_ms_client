<template>
  <div class="menu-toolbar">
    <div class="tools" :class="{ collapsed: isCollapsed && !isHovering }">
      <div class="toolbar__user" :class="{ collapsed: isCollapsed && !isHovering }">
        <div class="tools__user__avatar">
          <UserMenu />
        </div>
        <div class="tools__user__name" v-if="shouldShowFullInfo">
          <div class="user__fullname">{{ userFullName }}</div>
          <div class="user__description">В сети</div>
        </div>
      </div>
      <div class="tools-buttons" v-if="shouldShowFullInfo">
        <div class="tools__assistant" @click="toggleAssistant">
          <div
            class="header-btn assistant-btn"
            :class="{ active: isAssistantVisible }"
            v-tooltip
            title="AI Ассистент"
          >
            <Bot :size="24" />
          </div>
        </div>
        <div class="tools__theme">
          <ToggleTheme />
        </div>
        <div class="tools__notifications">
          <UserNotifications />
        </div>
      </div>
    </div>

    <AssistantChat
      ref="assistantChat"
      :is-visible="isAssistantVisible"
      @send-message="handleAssistantMessage"
    />
  </div>
</template>

<script setup>
import { Search, Bot } from 'lucide-vue-next'
import UserMenu from '@/components/header/UserMenu.vue'
import ToggleTheme from '@/components/header/ToggleTheme.vue'
import UserNotifications from '@/components/header/UserNotifications.vue'
import AssistantChat from '@/components/assistant/AssistantChat.vue'
import { computed, ref } from 'vue'
import { useUserStore } from '@/modules/cms/js/userStore.js'
import { intentAnalyzer } from '@/js/assistant/intent-analyzer.js'
import { routerActions } from '@/js/assistant/router-actions.js'
import { componentAnalyzer } from '@/js/assistant/component-analyzer.js'
import { connectionStatus } from '@/js/assistant/connection-status.js'

const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false,
  },
  isHovering: {
    type: Boolean,
    default: false,
  },
})

const userStore = useUserStore()
const isAssistantVisible = ref(false)
const assistantChat = ref(null)

const shouldShowFullInfo = computed(() => {
  return !props.isCollapsed || props.isHovering
})

const userFullName = computed(() => {
  if (!userStore.user) return 'Гость'

  if (userStore.displayName === 'Гость') return 'Гость'

  const firstName = userStore.user.first_name?.trim()
  const lastName = userStore.user.last_name?.trim()

  const cleanFirstName = firstName === ' ' ? '' : firstName
  const cleanLastName = lastName === ' ' ? '' : lastName

  if (cleanFirstName && cleanLastName) {
    return `${cleanFirstName} ${cleanLastName}`
  }

  if (cleanFirstName) {
    return cleanFirstName
  }

  if (cleanLastName) {
    return cleanLastName
  }

  return 'Гость'
})

const toggleAssistant = () => {
  isAssistantVisible.value = !isAssistantVisible.value

  if (isAssistantVisible.value) {
    connectionStatus.show()
  } else {
    connectionStatus.hide()
  }
}

const handleAssistantMessage = async (message) => {
  try {
    const context = await getCurrentContext()
    const intentResult = await intentAnalyzer.analyzeIntent(message, context)

    if (intentResult.success) {
      const actionResult = await executeAction(intentResult)

      if (assistantChat.value) {
        assistantChat.value.addAssistantMessage(actionResult.message)
        assistantChat.value.setTyping(false)
      }

      if (actionResult.usedLLM) {
        connectionStatus.show()
      }
    } else {
      if (assistantChat.value) {
        assistantChat.value.addAssistantMessage(
          'Не удалось понять ваш запрос. Попробуйте переформулировать.',
        )
        assistantChat.value.setTyping(false)
      }
    }
  } catch (error) {
    console.error('Error processing message:', error)
    if (assistantChat.value) {
      assistantChat.value.addAssistantMessage(
        'Извините, произошла ошибка при обработке вашего сообщения.',
      )
      assistantChat.value.setTyping(false)
    }
  }
}

const getCurrentContext = async () => {
  try {
    const currentRoute = routerActions.getCurrentRoute()
    const availableRoutes = routerActions.getAvailableRoutes().map((r) => r.name || r.path)
    const pageAnalysis = routerActions.analyzeCurrentPage()
    const componentAnalysis = componentAnalyzer.analyzePageComponents()

    return {
      currentRoute: currentRoute.path,
      currentPage: pageAnalysis.pageName,
      availableRoutes: availableRoutes.slice(0, 10),
      pageComponents: Object.keys(componentAnalysis.descriptions || {}).slice(0, 5),
      breadcrumbs: pageAnalysis.breadcrumbs,
      availableActions: pageAnalysis.availableActions,
    }
  } catch (error) {
    console.error('Error getting context:', error)
    return {
      currentRoute: '/',
      currentPage: 'текущая страница',
      availableRoutes: [],
      pageComponents: [],
      breadcrumbs: [],
      availableActions: [],
    }
  }
}

const executeAction = async (intentResult) => {
  switch (intentResult.intent) {
    case 'NAVIGATION':
      return await handleNavigationIntent(intentResult)
    case 'PAGE_ANALYZE':
      return await handlePageAnalyzeIntent()
    case 'COMPONENT_EXPLAIN':
      return await handleComponentExplainIntent()
    case 'HELP':
      return await handleHelpIntent()
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

  if (params.route) {
    const result = await routerActions.navigateToRoute(params.route)

    if (result.success) {
      return {
        message: `✅ ${result.message}\n\nВы перешли на страницу: ${params.routeName || params.route}`,
        usedLLM: false,
      }
    } else {
      const suggestions = result.suggestions || []
      let message = `❌ ${result.message}`

      if (suggestions.length > 0) {
        message += '\n\n🔍 Возможно, вы имели в виду:\n'
        suggestions.forEach((route) => {
          message += `• ${route.name || route.path}\n`
        })
      }

      return { message, usedLLM: false }
    }
  }

  return { message: intentResult.message, usedLLM: false }
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

const handleHelpIntent = async () => {
  const message = `🤖 **AI Ассистент ERGO MS**\n\n**Что я умею:**\n\n🧭 **Навигация**\n• "Перейди в профиль"\n• "Открой настройки"\n• "Покажи пользователей"\n\n📋 **Анализ страниц**\n• "Где я нахожусь?"\n• "Как работает эта страница?"\n• "Что здесь можно сделать?"\n\n🔧 **Объяснение компонентов**\n• "Объясни компоненты"\n• "Что делает эта кнопка?"\n• "Как работает таблица?"\n\n💬 **Общение**\n• Просто задавайте вопросы обычным языком\n• Я понимаю контекст текущей страницы\n\n📞 **Примеры запросов:**\n• "Как добавить нового пользователя?"\n• "Перейди на главную"\n• "Объясни что здесь происходит"\n\nПросто пишите как обычно - я вас пойму! 😊`

  return { message, usedLLM: false }
}
</script>

<style scoped lang="scss">
@media (width >= 1200px) {
  .header__menu {
    display: none;
  }
}

.menu-toolbar {
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: var(--color-secondary-background);
  margin: 3%;
  width: auto;
  height: auto;
  padding: 10px;
  border-radius: 10px;

  .tools {
    display: flex;
    justify-content: space-between;
    width: 100%;

    &.collapsed {
      justify-content: center;
    }
  }
}

.toolbar__user {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;

  &.collapsed {
    justify-content: center;
    gap: 0;
  }
}

.tools__user__name {
  display: flex;
  flex-direction: column;
}

.tools-buttons {
  display: flex;
  gap: 2px;
  justify-content: center;
  align-items: center;
}

.tools__assistant {
  .assistant-btn {
    color: var(--color-primary-text);
    border-radius: 0.5rem;

    &:hover {
      background-color: var(--color-hover-background);
      color: var(--color-accent);
    }

    &.active {
      background-color: var(--bs-primary-bg-subtle);
      color: var(--bs-primary);

      &:hover {
        background-color: var(--bs-primary-border-subtle);
      }
    }
  }
}

.user__description {
  font-size: 12px;
  color: var(--color-secondary-text);
}

.search {
  @include flex-row-gap($padding-internal, center);
  width: 50%;

  input {
    border: none;
    outline: none;
    width: 100%;
  }
}

.tools {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.tools__user__avatar {
  cursor: pointer;
  background-color: grey;
  border-radius: 50%;

  position: relative;

  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 3px;
    width: 8px;
    height: 8px;
    border-radius: 100%;
    box-shadow: 0 0 0 2px var(--color-primary-background);
    background-color: #4caf50;
  }
}
</style>

<style lang="scss">
.header-btn {
  padding: 7px 8px;
  border-radius: 100%;
  cursor: pointer;
  transition: background-color $transition;

  &:hover {
    background-color: var(--color-secondary-background);
  }
}

.header-dropdown-item {
  @include flex-row-gap(12px, center);
  transition: all $transition;
  padding: $padding-internal $padding-external;
  cursor: pointer;
}

.header-dropdown-center .header-dropdown-menu {
  inset: 0 auto auto 0;
  transform: translate3d(-60px, 60.6px, 0px);
}
</style>
