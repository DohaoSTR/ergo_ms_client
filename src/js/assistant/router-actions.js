import router from '@/js/routers.js'
import axios from 'axios'

class RouterActions {
    constructor() {
        this.router = router
        this.cachedRoutes = null
        this.cacheTimestamp = null
        this.cacheTimeout = 5 * 60 * 1000 // 5 минут
    }

    async fetchRoutesFromAPI() {
        try {
            const response = await axios.get('/api/cms/get-routes-paths/')
            const data = response.data

            if (data.routes && Array.isArray(data.routes)) {
                return data.routes.map(route => ({
                    name: route.name,
                    path: route.path,
                    title: route.title,
                    meta: { title: route.title }
                }))
            }

            return []
        } catch (error) {
            console.error('Ошибка при загрузке маршрутов из API:', error)
            return this.getFallbackRoutes()
        }
    }

    getFallbackRoutes() {
        return [
            { name: 'Account', path: '/user/account', title: 'Личный кабинет' },
            { name: 'Settings', path: '/settings', title: 'Настройки' },
            { name: 'SecuritySettings', path: '/user/security', title: 'Безопасность' },
            { name: 'UsersPanel', path: '/admin-panel/users', title: 'Пользователи' },
            { name: 'AdminPanel', path: '/admin-panel', title: 'Админ панель' },
            { name: 'GroupsPanel', path: '/admin-panel/groups', title: 'Группы' },
            { name: 'CategoriesPanel', path: '/admin-panel/categories', title: 'Категории' },
            { name: 'BI', path: '/bi', title: 'Бизнес аналитика' },
            { name: 'CRM', path: '/crm', title: 'CRM' },
            { name: 'LMS', path: '/lms', title: 'LMS' },
            { name: 'ExpertSystem', path: '/expert-system', title: 'Экспертная система' },
            { name: 'DatabaseAnalyze', path: '/user/analyze/databaseanalyze', title: 'Анализ базы данных' },
            { name: 'Analyze', path: '/user/analyze', title: 'Анализ данных' }
        ]
    }

    async getAvailableRoutes() {
        const now = Date.now()

        if (this.cachedRoutes && this.cacheTimestamp && (now - this.cacheTimestamp < this.cacheTimeout)) {
            return this.cachedRoutes
        }

        try {
            const apiRoutes = await this.fetchRoutesFromAPI()
            const routerRoutes = this.router.getRoutes()

            const combinedRoutes = []
            const seenRoutes = new Set()

            apiRoutes.forEach(route => {
                if (!seenRoutes.has(route.name)) {
                    combinedRoutes.push(route)
                    seenRoutes.add(route.name)
                }
            })

            routerRoutes.forEach(route => {
                if (route.name && !seenRoutes.has(route.name)) {
                    combinedRoutes.push({
                        name: route.name,
                        path: route.path,
                        title: route.meta?.title || route.name,
                        meta: route.meta
                    })
                    seenRoutes.add(route.name)
                }
            })

            this.cachedRoutes = combinedRoutes
            this.cacheTimestamp = now

            console.log('🔄 Обновлен кеш маршрутов из API:', combinedRoutes.length, 'маршрутов')
            return this.cachedRoutes

        } catch (error) {
            console.error('Ошибка при получении маршрутов:', error)

            if (this.cachedRoutes) {
                return this.cachedRoutes
            }

            return this.getFallbackRoutes()
        }
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

    async navigateToRoute(routeIdentifier) {
        try {
            console.log('🔍 Navigating to route:', routeIdentifier)
            const routes = await this.getAvailableRoutes()
            console.log('📋 Available routes:', routes.map(r => r.name || r.path))

            let targetRoute = null

            if (typeof routeIdentifier === 'string') {
                targetRoute = await this.smartRouteSearch(routeIdentifier)
            } else if (routeIdentifier && typeof routeIdentifier === 'object') {
                targetRoute = routeIdentifier
            }

            if (!targetRoute) {
                console.log('❌ Route not found:', routeIdentifier)
                return {
                    success: false,
                    error: `Маршрут "${routeIdentifier}" не найден`
                }
            }

            console.log('✅ Found route:', targetRoute.name, targetRoute.path)

            await this.router.push(targetRoute.path)
            return {
                success: true,
                route: targetRoute
            }

        } catch (error) {
            console.error('❌ Navigation error:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }

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

    async smartRouteSearch(searchTerm) {
        const routes = await this.getAvailableRoutes()
        const lowerSearchTerm = searchTerm.toLowerCase()

        console.log('🔍 Smart route search for:', searchTerm)
        console.log('📋 Search in routes:', routes.map(r => r.name || r.path))

        const exactMatch = routes.find(route => route.name === searchTerm)
        if (exactMatch) {
            console.log(`✅ Found exact name match: ${exactMatch.name} (${exactMatch.path})`)
            return exactMatch
        }

        const pathMatch = routes.find(route => route.path === searchTerm)
        if (pathMatch) {
            console.log(`✅ Found exact path match: ${pathMatch.name} (${pathMatch.path})`)
            return pathMatch
        }

        const partialMatch = routes.find(route =>
            route.name?.toLowerCase().includes(lowerSearchTerm) ||
            route.path.toLowerCase().includes(lowerSearchTerm) ||
            route.title?.toLowerCase().includes(lowerSearchTerm)
        )

        if (partialMatch) {
            console.log(`✅ Found partial match: ${partialMatch.name} (${partialMatch.path})`)
        } else {
            console.log('❌ No routes found')
        }

        return partialMatch
    }

    getSimilarRoutes(searchTerm, maxResults = 5) {
        const routes = this.getAvailableRoutes()
        const lowerSearchTerm = searchTerm.toLowerCase()

        const scored = routes
            .map(route => {
                let score = 0
                const routeName = (route.name || '').toLowerCase()
                const routePath = route.path.toLowerCase()

                if (routeName.includes(lowerSearchTerm) || routePath.includes(lowerSearchTerm)) {
                    score += 10
                }

                const nameDistance = this.levenshteinDistance(lowerSearchTerm, routeName)
                const pathDistance = this.levenshteinDistance(lowerSearchTerm, routePath)
                score += Math.max(0, 10 - Math.min(nameDistance, pathDistance))

                return { route, score }
            })
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults)
            .map(item => item.route)

        return scored
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
        const nameMapping = {
            '/': 'Главная страница',
            '/dashboard': 'Панель управления',
            '/profile': 'Профиль пользователя',
            '/users': 'Управление пользователями',
            '/settings': 'Настройки системы',
            '/reports': 'Отчеты и аналитика',
            '/documents': 'Документы',
            '/tasks': 'Задачи',
            '/calendar': 'Календарь',
            '/messages': 'Сообщения'
        }

        return nameMapping[route.path] || route.name || route.path
    }

    generateBreadcrumbs(route) {
        const pathParts = route.path.split('/').filter(part => part)
        const breadcrumbs = [{ name: 'Главная', path: '/' }]

        let currentPath = ''
        for (const part of pathParts) {
            currentPath += `/${part}`
            breadcrumbs.push({
                name: this.getPageDisplayName({ path: currentPath }),
                path: currentPath
            })
        }

        return breadcrumbs
    }

    getAvailablePageActions(route) {
        const baseActions = [
            'Перейти на другую страницу',
            'Показать навигационное меню',
            'Открыть справку'
        ]

        const pageSpecificActions = {
            '/profile': ['Редактировать профиль', 'Изменить пароль', 'Настроить уведомления'],
            '/users': ['Добавить пользователя', 'Управлять ролями', 'Экспорт данных'],
            '/settings': ['Сохранить изменения', 'Сбросить настройки', 'Резервное копирование'],
            '/documents': ['Загрузить документ', 'Создать папку', 'Поиск по документам']
        }

        return [...baseActions, ...(pageSpecificActions[route.path] || [])]
    }
}

export const routerActions = new RouterActions()
export default RouterActions 