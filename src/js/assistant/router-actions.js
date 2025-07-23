import router from '@/js/routers.js'
import { routesReader } from './routes-reader.js'
import { smartNavigation } from './smart-navigation.js'

class RouterActions {
    constructor() {
        this.router = router
        this.routeCache = new Map()
    }

    getCurrentRoute() {
        return {
            path: this.router.currentRoute.value.path,
            name: this.router.currentRoute.value.name,
            meta: this.router.currentRoute.value.meta,
            params: this.router.currentRoute.value.params,
            query: this.router.currentRoute.value.query
        }
    }

    getAvailableRoutes() {
        if (this.routeCache.has('all')) {
            return this.routeCache.get('all')
        }

        // Получаем роуты из конфигурации через новый сервис
        const configRoutes = routesReader.getAllRoutes() || []

        // Получаем роуты из Vue Router для совместимости
        const vueRoutes = this.router.getRoutes().map(route => ({
            path: route.path,
            name: route.name,
            meta: route.meta || {}
        }))

        // Объединяем, отдавая приоритет конфигурации
        const allRoutes = Array.isArray(configRoutes) ? [...configRoutes] : []

        // Добавляем роуты из Vue Router, которых нет в конфигурации
        vueRoutes.forEach(vueRoute => {
            const exists = allRoutes.some(configRoute =>
                configRoute.path === vueRoute.path || configRoute.name === vueRoute.name
            )
            if (!exists) {
                allRoutes.push(vueRoute)
            }
        })

        this.routeCache.set('all', allRoutes)
        return allRoutes
    }

    async navigateToRoute(routeName, params = {}, query = {}) {
        try {
            const analysisResult = await smartNavigation.analyzeNavigationRequest(routeName)

            if (analysisResult.success && analysisResult.route) {
                const currentPath = this.router.currentRoute.value.path
                const route = analysisResult.route

                try {
                    if (route.name) {
                        await this.router.push({ name: route.name, params, query })
                    } else if (route.path) {
                        await this.router.push({ path: route.path, query })
                    } else {
                        throw new Error('Маршрут не содержит ни name, ни path')
                    }

                    const newPath = this.router.currentRoute.value.path

                    if (newPath === currentPath && route.path !== currentPath) {
                        throw new Error('Навигация не произошла - путь не изменился')
                    }

                    const routeDisplayName = smartNavigation.getRouteDisplayName(route)
                    let message = `Вы перешли на страницу: ${routeDisplayName}`

                    return {
                        success: true,
                        message: message,
                        route: route,
                        confidence: analysisResult.confidence,
                        method: analysisResult.method
                    }

                } catch (navigationError) {
                    const vueRoutes = this.router.getRoutes()
                    const routeExists = vueRoutes.some(vr =>
                        vr.name === route.name || vr.path === route.path
                    )

                    let errorMessage = `Не удалось выполнить переход к: ${smartNavigation.getRouteDisplayName(route)}`

                    if (!routeExists) {
                        errorMessage += `\n⚠️ Маршрут не существует в Vue Router`
                        errorMessage += `\n🔍 Искомый роут: name="${route.name}", path="${route.path}"`
                    } else {
                        errorMessage += `\n⚠️ Ошибка навигации: ${navigationError.message}`
                    }

                    if (analysisResult.alternatives?.length > 0) {
                        errorMessage += `\n\n💡 Попробуйте альтернативы:`
                        analysisResult.alternatives.slice(0, 3).forEach(alt => {
                            const altName = smartNavigation.getRouteDisplayName(alt)
                            errorMessage += `\n• ${altName}`
                        })
                    }

                    return {
                        success: false,
                        message: errorMessage,
                        error: navigationError
                    }
                }
            } else {
                let message = analysisResult.method === 'basic_fallback_failed' ?
                    `Маршрут "${routeName}" не найден через базовый поиск (LLM недоступен)` :
                    `Маршрут "${routeName}" не найден через LLM анализ`

                if (analysisResult.alternatives?.length > 0) {
                    const methodText = analysisResult.method?.includes('basic') ? 'Базовый поиск предлагает' : 'LLM предлагает альтернативы'
                    message += `\n\n🔍 ${methodText}:`
                    analysisResult.alternatives.slice(0, 5).forEach(alt => {
                        const altName = smartNavigation.getRouteDisplayName(alt)
                        message += `\n• ${altName}`
                    })
                }

                const stats = smartNavigation.getAnalysisStats()
                message += `\n\n📈 Доступно ${stats.totalRoutes} маршрутов в системе`
                message += `\n🔬 Метод анализа: ${stats.analysisMethod}`

                if (!stats.llmAvailable) {
                    message += `\n⚠️ LLM недоступен - функционал ограничен`
                    message += `\n💡 Попробуйте базовые команды: "профиль", "настройки", "админ"`
                }

                return {
                    success: false,
                    message: message,
                    suggestions: analysisResult.alternatives || []
                }
            }

        } catch (error) {
            return {
                success: false,
                message: `Ошибка навигации: ${error.message}`,
                error: error
            }
        }
    }

    // Оставляем старые методы для совместимости
    findRouteByName(name) {
        const routes = this.getAvailableRoutes()
        return routes.find(route =>
            route.name === name ||
            (route.name && route.name.toLowerCase() === name.toLowerCase())
        )
    }

    findRouteByPath(path) {
        const routes = this.getAvailableRoutes()
        return routes.find(route =>
            route.path === path ||
            route.path.toLowerCase() === path.toLowerCase()
        )
    }

    smartRouteSearch(searchTerm) {
        // Используем новый сервис для умного поиска
        return routesReader.findRouteByTerm(searchTerm)
    }

    getSimilarRoutes(searchTerm, maxResults = 5) {
        // Используем новый сервис для получения предложений
        return routesReader.getRouteSuggestions(searchTerm, maxResults)
    }

    levenshteinDistance(str1, str2) {
        const matrix = []

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i]
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1]
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    )
                }
            }
        }

        return matrix[str2.length][str1.length]
    }

    analyzeCurrentPage() {
        const currentRoute = this.getCurrentRoute()
        const analysis = {
            route: currentRoute,
            pageName: this.getPageDisplayName(currentRoute),
            breadcrumbs: this.generateBreadcrumbs(currentRoute),
            availableActions: this.getAvailablePageActions(currentRoute)
        }

        return analysis
    }

    getPageDisplayName(route) {
        // Используем новый сервис для получения названия страницы
        return routesReader.getPageDisplayName(route)
    }

    generateBreadcrumbs(route) {
        const pathParts = route.path.split('/').filter(part => part)
        const breadcrumbs = [{ name: 'Главная', path: '/' }]

        let currentPath = ''
        for (const part of pathParts) {
            currentPath += `/${part}`

            try {
                const foundRoute = routesReader.findRouteByTerm(currentPath)
                const displayName = foundRoute ?
                    routesReader.getPageDisplayName(foundRoute) :
                    this.getPageDisplayName({ path: currentPath })

                breadcrumbs.push({
                    name: displayName || part,
                    path: currentPath
                })
            } catch {
                breadcrumbs.push({
                    name: part,
                    path: currentPath
                })
            }
        }

        return breadcrumbs
    }

    getAvailablePageActions(route) {
        const baseActions = [
            'Перейти на другую страницу',
            'Показать навигационное меню',
            'Открыть справку'
        ]

        // Динамически определяем действия на основе типа страницы
        const pageSpecificActions = this.getPageSpecificActions(route)

        return [...baseActions, ...pageSpecificActions]
    }

    getPageSpecificActions(route) {
        const routeName = route.name?.toLowerCase() || ''
        const routePath = route.path?.toLowerCase() || ''

        // Определяем тип страницы и возвращаем соответствующие действия
        if (routeName.includes('user') || routePath.includes('profile') || routeName === 'account') {
            return ['Редактировать профиль', 'Изменить пароль', 'Настроить уведомления']
        }

        if (routeName.includes('admin') || routePath.includes('admin')) {
            return ['Добавить пользователя', 'Управлять ролями', 'Экспорт данных']
        }

        if (routeName.includes('settings') || routePath.includes('settings')) {
            return ['Сохранить изменения', 'Сбросить настройки', 'Резервное копирование']
        }

        if (routeName.includes('files') || routePath.includes('filemanager')) {
            return ['Загрузить файл', 'Создать папку', 'Поиск по файлам']
        }

        if (routeName.includes('project') || routePath.includes('crm')) {
            return ['Создать проект', 'Добавить задачу', 'Экспорт отчета']
        }

        if (routeName.includes('lms') || routePath.includes('course')) {
            return ['Записаться на курс', 'Просмотреть прогресс', 'Скачать материалы']
        }

        return []
    }

    // Новые методы для работы с категориями
    getRoutesByCategory(category) {
        return routesReader.getRoutesByCategory(category)
    }

    getAllCategories() {
        return ['admin', 'cms', 'crm', 'lms', 'bi', 'expert', 'user']
    }

    searchRoutes(query, maxResults = 10) {
        return routesReader.getRouteSuggestions(query, maxResults)
    }

    // Новый метод для получения статистики умной навигации
    async getNavigationStats() {
        return smartNavigation.getAnalysisStats()
    }
}

export const routerActions = new RouterActions()
export default RouterActions 