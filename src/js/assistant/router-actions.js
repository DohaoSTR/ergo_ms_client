import router from '@/js/routers.js'

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

        const routes = this.router.getRoutes().map(route => ({
            path: route.path,
            name: route.name,
            meta: route.meta || {}
        }))

        this.routeCache.set('all', routes)
        return routes
    }

    async navigateToRoute(routeName, params = {}, query = {}) {
        try {
            const route = this.findRouteByName(routeName)
            if (route) {
                await this.router.push({ name: routeName, params, query })
                return {
                    success: true,
                    message: `Переход выполнен: ${route.path}`,
                    route: route
                }
            }

            const routeByPath = this.findRouteByPath(routeName)
            if (routeByPath) {
                await this.router.push({ path: routeName, query })
                return {
                    success: true,
                    message: `Переход выполнен: ${routeName}`,
                    route: routeByPath
                }
            }

            const smartMatch = this.smartRouteSearch(routeName)
            if (smartMatch) {
                await this.router.push({ name: smartMatch.name, params, query })
                return {
                    success: true,
                    message: `Переход выполнен: ${smartMatch.path}`,
                    route: smartMatch
                }
            }

            return {
                success: false,
                message: `Маршрут "${routeName}" не найден`,
                suggestions: this.getSimilarRoutes(routeName)
            }

        } catch (error) {
            return {
                success: false,
                message: `Ошибка навигации: ${error.message}`,
                error: error
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

    smartRouteSearch(searchTerm) {
        const routes = this.getAvailableRoutes()
        const lowerSearchTerm = searchTerm.toLowerCase()

        const termMapping = {
            'профиль': ['Account', 'User'],
            'аккаунт': ['Account', 'User'],
            'пользователи': ['UsersPanel', 'AdminPanel'],
            'настройки': ['Settings', 'SecuritySettings'],
            'безопасность': ['SecuritySettings'],
            'админ': ['AdminPanel', 'UsersPanel', 'GroupsPanel', 'CategoriesPanel'],
            'панель': ['AdminPanel', 'UsersPanel', 'GroupsPanel', 'CategoriesPanel'],
            'группы': ['GroupsPanel'],
            'категории': ['CategoriesPanel'],
            'главная': ['Account'],
            'dashboard': ['Account'],
            'home': ['Account']
        }

        for (const [ruTerm, enTerms] of Object.entries(termMapping)) {
            if (lowerSearchTerm.includes(ruTerm)) {
                for (const enTerm of enTerms) {
                    const route = routes.find(r =>
                        r.name?.toLowerCase().includes(enTerm) ||
                        r.path.toLowerCase().includes(enTerm)
                    )
                    if (route) return route
                }
            }
        }

        for (const enTerms of Object.values(termMapping)) {
            for (const enTerm of enTerms) {
                if (lowerSearchTerm.includes(enTerm)) {
                    const route = routes.find(r =>
                        r.name?.toLowerCase().includes(enTerm) ||
                        r.path.toLowerCase().includes(enTerm)
                    )
                    if (route) return route
                }
            }
        }

        return routes.find(route =>
            route.name?.toLowerCase().includes(lowerSearchTerm) ||
            route.path.toLowerCase().includes(lowerSearchTerm)
        )
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