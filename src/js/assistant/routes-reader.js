import routesConfig from '@/config/routes-config.json'

class RoutesReader {
    constructor() {
        this.routesCache = []
        this.pathMapping = null
        this.initialized = false
    }

    async initialize() {
        if (this.initialized) return

        try {
            const routes = await this.buildRoutesFromConfig()
            this.routesCache = routes
            this.initialized = true

            if (routes.length === 0) {
                // Routes not loaded
            }
        } catch {
            this.routesCache = []
            this.initialized = true
        }
    }

    getAllRoutes() {
        if (!this.initialized) {
            this.initialize()
        }

        return this.routesCache || []
    }

    async buildRoutesFromConfig() {
        try {
            const parsedRoutes = this.parseRoutesConfig(routesConfig)
            return parsedRoutes

        } catch {
            return await this.buildRoutesFromConfigFallback()
        }
    }

    async buildRoutesFromConfigFallback() {
        const possiblePaths = [
            '/src/config/routes-config.json',
            '/config/routes-config.json',
            '/routes-config.json'
        ]

        for (const configPath of possiblePaths) {
            try {
                const response = await fetch(configPath)

                if (response.ok) {
                    const routesConfigFallback = await response.json()

                    const parsedRoutes = this.parseRoutesConfig(routesConfigFallback)
                    return parsedRoutes
                }
            } catch {
                // Continue to next path
            }
        }

        return []
    }

    parseRoutesConfig(routesConfig) {
        const allRoutes = []

        if (routesConfig.coreRoutes) {
            routesConfig.coreRoutes.forEach(route => {
                if (route.path && route.path !== '/:pathMatch(.*)*') {
                    allRoutes.push({
                        path: route.path,
                        name: route.name,
                        meta: route.meta || {},
                        component: route.component,
                        redirect: route.redirect
                    })
                }
            })
        }

        if (routesConfig.authRoutes) {
            routesConfig.authRoutes.forEach(route => {
                if (route.path) {
                    allRoutes.push({
                        path: route.path,
                        name: route.name,
                        meta: route.meta || {},
                        component: route.component
                    })
                }
            })
        }

        if (routesConfig.routes) {
            Object.entries(routesConfig.routes).forEach(([routeName, routeData]) => {
                if (routeData.path) {
                    allRoutes.push({
                        path: routeData.path,
                        name: routeName,
                        meta: routeData.meta || {},
                        component: routeData.component,
                        redirect: routeData.redirect
                    })
                }
            })
        }

        return allRoutes
    }

    buildPathMapping() {
        const mapping = new Map()

        this.routesCache.forEach(route => {
            const title = route.meta?.title?.toLowerCase()
            const name = route.name?.toLowerCase()

            if (title) {
                mapping.set(title, route)

                const titleWords = title.split(' ')
                titleWords.forEach(word => {
                    if (word.length > 3) {
                        if (!mapping.has(word)) {
                            mapping.set(word, route)
                        }
                    }
                })
            }

            if (name) {
                mapping.set(name, route)
            }

            const path = route.path.toLowerCase().replace(/^\//, '').replace(/\//g, ' ')
            if (path && path !== '') {
                mapping.set(path, route)
            }
        })

        this.pathMapping = mapping
    }

    findRouteByTerm(searchTerm) {
        if (!this.routesCache) {
            return null
        }

        const lowerTerm = searchTerm.toLowerCase().trim()

        let route = this.routesCache.find(route => {
            const name = (route.name || '').toLowerCase()
            return name === lowerTerm || name.includes(lowerTerm) || lowerTerm.includes(name)
        })

        if (route) {
            return route
        }

        route = this.routesCache.find(route => {
            const path = route.path.toLowerCase()
            return path.includes(lowerTerm) || lowerTerm.includes(path.replace(/\//g, ''))
        })

        if (route) {
            return route
        }

        route = this.routesCache.find(route => {
            const title = (route.meta?.title || '').toLowerCase()
            return title.includes(lowerTerm) || lowerTerm.includes(title)
        })

        return route || null
    }

    getRoutesByCategory(category) {
        if (!this.routesCache) {
            return []
        }

        const lowerCategory = category.toLowerCase()
        return this.routesCache.filter(route => {
            const routeCategory = this.categorizeRoute(route).toLowerCase()
            return routeCategory.includes(lowerCategory)
        })
    }

    getRouteCategory(route) {
        const path = route.path.toLowerCase()
        const name = (route.name || '').toLowerCase()

        if (path.includes('/admin') || name.includes('admin')) return 'admin'
        if (path.includes('/user') || name.includes('user') || name.includes('account')) return 'user'
        if (path.includes('/crm') || name.includes('crm')) return 'crm'
        if (path.includes('/lms') || name.includes('lms')) return 'lms'
        if (path.includes('/bi') || name.includes('bi')) return 'bi'
        if (path.includes('/expert') || name.includes('expert')) return 'expert'
        if (path.includes('/settings') || name.includes('settings')) return 'settings'

        return 'other'
    }

    getRouteSuggestions(searchTerm, maxResults = 5) {
        if (!this.routesCache) {
            return []
        }

        const lowerTerm = searchTerm.toLowerCase().trim()
        const suggestions = []

        for (const route of this.routesCache) {
            const name = (route.name || '').toLowerCase()
            const path = route.path.toLowerCase()
            const title = (route.meta?.title || '').toLowerCase()

            let score = 0

            if (name.includes(lowerTerm)) score += 3
            if (path.includes(lowerTerm)) score += 2
            if (title.includes(lowerTerm)) score += 1

            if (score > 0) {
                suggestions.push({ route, score })
            }
        }

        return suggestions
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults)
            .map(item => item.route)
    }

    getPageDisplayName(route) {
        return route?.meta?.title || route?.name || route?.path || 'Неизвестная страница'
    }
}

export const routesReader = new RoutesReader()
export default RoutesReader 