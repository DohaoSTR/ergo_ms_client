class ComponentAnalyzer {
    constructor() {
        this.componentCache = new Map()
        this.knownComponents = this.buildKnownComponentsMap()
    }

    buildKnownComponentsMap() {
        return {
            'NotificationProvider': 'Провайдер уведомлений - управляет всплывающими уведомлениями',
            'NotificationToast': 'Компонент всплывающих уведомлений',
            'TableEditor': 'Редактор таблиц - позволяет редактировать данные в табличном формате',
            'NavigationButtons': 'Навигационные кнопки для переключения между страницами',
            'DefaultAvatar': 'Аватар по умолчанию для пользователей',
            'DropDown': 'Выпадающий список с опциями',
            'ModalCenter': 'Модальное окно по центру экрана',
            'ChoiceDialog': 'Диалог выбора с несколькими вариантами',
            'ConfirmDialog': 'Диалог подтверждения действий',

            'AssistantWidget': 'Главный виджет AI ассистента',
            'AssistantButton': 'Кнопка вызова ассистента',
            'AssistantChat': 'Окно чата с ассистентом',
            'AssistantMessage': 'Отдельное сообщение в чате',
            'AssistantTyping': 'Индикатор печати ассистента',

            'LayoutMenu': 'Основной лейаут с меню навигации',
            'LayoutStart': 'Лейаут стартовой страницы',
            'LayoutPublic': 'Лейаут для публичных страниц',

            'MenuComponent': 'Компонент навигационного меню',
            'MenuHeader': 'Заголовок меню',
            'MenuSidebar': 'Боковая панель меню',

            'HeaderComponent': 'Компонент заголовка страницы',
            'HeaderUser': 'Информация о пользователе в заголовке',
            'HeaderSearch': 'Поиск в заголовке',

            'CrmDashboard': 'Панель управления CRM',
            'CrmContacts': 'Управление контактами',
            'CrmDeals': 'Управление сделками',
            'CrmTasks': 'Задачи CRM системы'
        }
    }

    analyzePageComponents() {
        try {
            const components = this.getComponentsOnPage()
            const analysis = {
                totalComponents: components.length,
                componentTypes: this.categorizeComponents(components),
                descriptions: this.getComponentDescriptions(components),
                functionality: this.analyzeFunctionality(components),
                interactiveElements: this.findInteractiveElements()
            }

            return analysis
        } catch (error) {
            console.error('Error analyzing page components:', error)
            return {
                error: 'Не удалось проанализировать компоненты страницы',
                fallback: this.getFallbackAnalysis()
            }
        }
    }

    getComponentsOnPage() {
        const components = []

        try {
            // Исправленный селектор - ищем элементы с data-v атрибутами
            const vueElements = document.querySelectorAll('[class*="data-v-"], [data-v], .vue-component')
            vueElements.forEach(element => {
                const componentName = this.extractComponentName(element)
                if (componentName && !components.includes(componentName)) {
                    components.push(componentName)
                }
            })

            // Альтернативный поиск Vue компонентов
            const elementsWithVueData = document.querySelectorAll('*')
            elementsWithVueData.forEach(element => {
                // Ищем атрибуты, начинающиеся с data-v-
                for (let attr of element.attributes) {
                    if (attr.name.startsWith('data-v-')) {
                        const componentName = this.extractComponentName(element)
                        if (componentName && !components.includes(componentName)) {
                            components.push(componentName)
                        }
                        break
                    }
                }
            })
        } catch (error) {
            console.warn('Ошибка при поиске Vue компонентов:', error)
        }

        const alwaysPresentComponents = ['NotificationProvider']
        alwaysPresentComponents.forEach(comp => {
            if (!components.includes(comp)) {
                components.push(comp)
            }
        })

        if (document.querySelector('.assistant-widget')) {
            const assistantComponents = ['AssistantWidget', 'AssistantButton']
            if (document.querySelector('.assistant-chat')) {
                assistantComponents.push('AssistantChat', 'AssistantMessage')
            }
            if (document.querySelector('.assistant-typing')) {
                assistantComponents.push('AssistantTyping')
            }

            assistantComponents.forEach(comp => {
                if (!components.includes(comp)) {
                    components.push(comp)
                }
            })
        }

        return components
    }

    extractComponentName(element) {
        const className = element.className
        const tagName = element.tagName.toLowerCase()

        const patterns = [
            /([A-Z][a-z]+)+/g,
            /component-([a-z-]+)/g,
            /vue-([a-z-]+)/g
        ]

        for (const pattern of patterns) {
            const matches = className.match(pattern)
            if (matches && matches.length > 0) {
                return this.formatComponentName(matches[0])
            }
        }

        const tagMapping = {
            'nav': 'NavigationComponent',
            'header': 'HeaderComponent',
            'aside': 'SidebarComponent',
            'main': 'MainContentComponent',
            'footer': 'FooterComponent'
        }

        return tagMapping[tagName] || null
    }

    formatComponentName(rawName) {
        return rawName
            .replace(/^component-/, '')
            .replace(/^vue-/, '')
            .replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())
            .replace(/^([a-z])/, (match, letter) => letter.toUpperCase())
    }

    categorizeComponents(components) {
        const categories = {
            layout: [],
            navigation: [],
            forms: [],
            data: [],
            ui: [],
            assistant: [],
            other: []
        }

        components.forEach(component => {
            const lowerName = component.toLowerCase()

            if (lowerName.includes('layout')) {
                categories.layout.push(component)
            } else if (lowerName.includes('menu') || lowerName.includes('nav') || lowerName.includes('header')) {
                categories.navigation.push(component)
            } else if (lowerName.includes('form') || lowerName.includes('input') || lowerName.includes('button')) {
                categories.forms.push(component)
            } else if (lowerName.includes('table') || lowerName.includes('list') || lowerName.includes('data')) {
                categories.data.push(component)
            } else if (lowerName.includes('assistant')) {
                categories.assistant.push(component)
            } else if (lowerName.includes('modal') || lowerName.includes('dialog') || lowerName.includes('dropdown')) {
                categories.ui.push(component)
            } else {
                categories.other.push(component)
            }
        })

        return categories
    }

    getComponentDescriptions(components) {
        const descriptions = {}

        components.forEach(component => {
            descriptions[component] = this.knownComponents[component] ||
                `Компонент ${component} - требует дополнительного анализа`
        })

        return descriptions
    }

    analyzeFunctionality(components) {
        const functionality = {
            interactive: [],
            display: [],
            navigation: [],
            data_manipulation: []
        }

        components.forEach(component => {
            const lowerName = component.toLowerCase()

            if (lowerName.includes('button') || lowerName.includes('form') || lowerName.includes('input') || lowerName.includes('editor')) {
                functionality.interactive.push(component)
            }

            if (lowerName.includes('table') || lowerName.includes('list') || lowerName.includes('display')) {
                functionality.display.push(component)
            }

            if (lowerName.includes('menu') || lowerName.includes('nav') || lowerName.includes('router')) {
                functionality.navigation.push(component)
            }

            if (lowerName.includes('editor') || lowerName.includes('form') || lowerName.includes('crud')) {
                functionality.data_manipulation.push(component)
            }
        })

        return functionality
    }

    findInteractiveElements() {
        const interactiveElements = []

        const buttons = document.querySelectorAll('button, .btn, [role="button"]')
        if (buttons.length > 0) {
            interactiveElements.push({
                type: 'buttons',
                count: buttons.length,
                description: `${buttons.length} кнопок для взаимодействия`
            })
        }

        const forms = document.querySelectorAll('form, .form')
        if (forms.length > 0) {
            interactiveElements.push({
                type: 'forms',
                count: forms.length,
                description: `${forms.length} форм для ввода данных`
            })
        }

        const links = document.querySelectorAll('a[href], .link')
        if (links.length > 0) {
            interactiveElements.push({
                type: 'links',
                count: links.length,
                description: `${links.length} ссылок для навигации`
            })
        }

        const modals = document.querySelectorAll('.modal, .dialog, [role="dialog"]')
        if (modals.length > 0) {
            interactiveElements.push({
                type: 'modals',
                count: modals.length,
                description: `${modals.length} модальных окон`
            })
        }

        return interactiveElements
    }

    getFallbackAnalysis() {
        return {
            totalComponents: 'неизвестно',
            componentTypes: {
                layout: ['основной лейаут'],
                navigation: ['навигационное меню'],
                ui: ['элементы интерфейса'],
                other: ['прочие компоненты']
            },
            descriptions: {
                'общие': 'Стандартные компоненты веб-приложения для отображения интерфейса'
            },
            functionality: {
                display: ['отображение контента'],
                navigation: ['навигация по страницам']
            },
            interactiveElements: []
        }
    }

    explainComponent(componentName) {
        const description = this.knownComponents[componentName]

        if (description) {
            return {
                success: true,
                component: componentName,
                description: description,
                type: this.getComponentType(componentName),
                usage: this.getComponentUsage(componentName)
            }
        }

        return {
            success: false,
            component: componentName,
            message: `Компонент "${componentName}" не найден в базе знаний`,
            suggestion: 'Попробуйте спросить про другие компоненты на странице'
        }
    }

    getComponentType(componentName) {
        const lowerName = componentName.toLowerCase()

        if (lowerName.includes('layout')) return 'Лейаут'
        if (lowerName.includes('button')) return 'Кнопка'
        if (lowerName.includes('form')) return 'Форма'
        if (lowerName.includes('table')) return 'Таблица'
        if (lowerName.includes('modal')) return 'Модальное окно'
        if (lowerName.includes('menu')) return 'Меню'
        if (lowerName.includes('header')) return 'Заголовок'
        if (lowerName.includes('assistant')) return 'Ассистент'

        return 'UI компонент'
    }

    getComponentUsage(componentName) {
        const usageMap = {
            'NotificationProvider': 'Автоматически управляет уведомлениями по всему приложению',
            'TableEditor': 'Для редактирования данных в табличном формате - кликните по ячейке',
            'AssistantWidget': 'Кликните по кружку справа снизу для открытия чата',
            'ModalCenter': 'Открывается автоматически при определенных действиях',
            'DropDown': 'Кликните для открытия списка опций',
            'NavigationButtons': 'Используйте для переключения между страницами данных'
        }

        return usageMap[componentName] || 'Стандартное использование согласно типу компонента'
    }
}

export const componentAnalyzer = new ComponentAnalyzer()
export default ComponentAnalyzer 