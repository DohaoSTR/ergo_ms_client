import { createRouter, createWebHistory } from 'vue-router'
import { checkToken } from '@/js/api/services/auth-index'

const mainRoutes = [
  {
    path: '/',
    redirect: { name: 'Account' },
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/NotFound.vue'),
    meta: {
      title: 'Страница не найдена',
      requiresAuth: true,
    },
  },
  {
    path:'/logout',
    name:'logout',
    component:()=> import('@/components/header/Logout.vue'),
    meta:{
      title:'-',
    }
  }
]

// Панель управления
const dashboardRoutes = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/pages/dashboard/ParentLayout.vue'),
    redirect: { name: 'Analytics' },
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/pages/dashboard/ParentLayout.vue'),
        meta: {
          requiresAuth: true,
        },
      },
    ],
  },
]

// Аккаунт пользователя
const userRoutes = [
  {
    path: '/user',
    name: 'User',
    component: () => import('@/pages/user/ParentLayout.vue'),
    redirect: { name: 'Account' },
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: 'account',
        name: 'Account',
        component: () => import('@/pages/user/account/ParentLayout.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: 'teams',
        name: 'Teams',
        component: () => import('@/pages/user/teams/ParentLayout.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: 'projects',
        name: 'Projects',
        component: () => import('@/pages/user/projects/ParentLayout.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: 'connections',
        name: 'Connections',
        component: () => import('@/pages/user/connections/ParentLayout.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/pages/dashboard/ParentLayout.vue'),
        meta: {
          requiresAuth: true,
        },
      },
    ],
  },
]

// Секция "Analyze"
const analyzeRoutes = [
  {
    path: '/user/analyze',
    name: 'Analyze',
    component: () => import('@/pages/user/analyze/Analyze.vue'),
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: 'databaseanalyze',
        name: 'DatabaseAnalyze',
        component: () => import('@/pages/user/analyze/DatabaseAnalyze.vue'),
        meta: {
          requiresAuth: true
        },
      }
    ]
  },
];


// Настройки аккаунта
const settingsRoutes = [
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/pages/settings/ParentLayout.vue'),
    redirect: { name: 'AccountSettings' },
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: 'account',
        name: 'AccountSettings',
        component: () => import('@/pages/settings/account/ParentLayout.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: 'security',
        name: 'SecuritySettings',
        component: () => import('@/pages/settings/security/ParentLayout.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: 'billing',
        name: 'BillingSettings',
        component: () => import('@/pages/settings/billing/ParentLayout.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: 'notifications',
        name: 'NotificationSettings',
        component: () => import('@/pages/settings/notifications/ParentLayout.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: 'connections',
        name: 'ConnectionSettings',
        component: () => import('@/pages/settings/connections/ParentLayout.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: 'roles',
        name: 'Roles',
        component: () => import('@/pages/roles/ParentLayout.vue'),
        meta: {
          requiresAuth: true,
        },
      },
    ],
  },
]

// Электронная почта
const emailRoutes = [
  {
    path: '/email',
    name: 'Email',
    component: () => import('@/pages/email/ParentLayout.vue'),
    meta: {
      requiresAuth: true,
    },
  },
]

// Мессенджер
const messengerRoutes = [
  {
    path: '/messenger',
    name: 'Messenger',
    component: () => import('@/pages/messenger/ParentLayout.vue'),
    meta: {
      requiresAuth: true,
    },
  },
]

// Карты
const mapsRoutes = [
  {
    path: '/maps',
    name: 'Maps',
    component: () => import('@/pages/maps/ParentLayout.vue'),
    meta: { title: 'Карты', requiresAuth: true },
  },
]

// Ценовой план
const billingRoutes = [
  {
    path: '/billing',
    name: 'Billing',
    component: () => import('@/pages/billing/ParentLayout.vue'),
    meta: { title: 'Ценовой план', requiresAuth: true },
  },
]

// Календарь
const calendarRoutes = [
  {
    path: '/calendar',
    name: 'Calendar',
    component: () => import('@/pages/calendar/ParentLayout.vue'),
    meta: { title: 'Календарь', requiresAuth: true },
  },
]

// Канбан-доска
const kanbanRoutes = [
  {
    path: '/kanban',
    name: 'Kanban',
    component: () => import('@/pages/kanban/ParentLayout.vue'),
    meta: { title: 'Канбан-доска', requiresAuth: true },
  },
]

// Таблицы
const tableRoutes = [
  {
    path: '/tables',
    name: 'Tables',
    component: () => import('@/pages/datatables/ParentLayout.vue'),
    meta: { title: 'Таблицы', requiresAuth: true },
  },
]

// Графики
const chartsRoutes = [
  {
    path: '/charts',
    name: 'Charts',
    component: () => import('@/pages/charts/ParentLayout.vue'),
    redirect: { name: 'ChartsJS' },
    children: [
      {
        path: 'charts-js',
        name: 'ChartsJS',
        component: () => import('@/pages/charts/chartjs/ParentLayout.vue'),
        meta: { title: 'ChartsJS', requiresAuth: true },
      },
      {
        path: 'apex-charts',
        name: 'ApexCharts',
        component: () => import('@/pages/charts/apexcharts/ParentLayout.vue'),
        meta: { title: 'ApexCharts', requiresAuth: true },
      },
    ],
  },
]

// Модальные окна
const modalWindowsRoutes = [
  {
    path: '/modal-windows',
    name: 'ModalWindows',
    component: () => import('@/pages/modals/ParentLayout.vue'),
    meta: { title: 'Модальные окна', requiresAuth: true },
  },
]

// Формы ввода
const inputsRoutes = [
  {
    path: '/inputs',
    name: 'Inputs',
    component: () => import('@/pages/inputs/ParentLayout.vue'),
    meta: { title: 'Формы ввода', requiresAuth: true },
  },
]

// Компоненты
const componentsRoutes = [
  {
    path: '/components',
    name: 'Components',
    component: () => import('@/pages/components/ParentLayout.vue'),
    redirect: { name: 'Alerts' },
    children: [
      {
        path: 'alerts',
        name: 'Alerts',
        component: () => import('@/pages/components/AlertComponents.vue'),
        meta: { title: 'Уведомления', requiresAuth: true },
      },
      {
        path: 'badges',
        name: 'Badges',
        component: () => import('@/pages/components/BadgeComponents.vue'),
        meta: { title: 'Значки', requiresAuth: true },
      },
      {
        path: 'carousel',
        name: 'Carousel',
        component: () => import('@/pages/components/CarouselComponents.vue'),
        meta: { title: 'Карусель', requiresAuth: true },
      },
      {
        path: 'list-groups',
        name: 'ListGroups',
        component: () => import('@/pages/components/ListGroupComponents.vue'),
        meta: { title: 'Группы списков', requiresAuth: true },
      },
      {
        path: 'typography',
        name: 'Typography',
        component: () => import('@/pages/components/TypographyComponents.vue'),
        meta: { title: 'Типография', requiresAuth: true },
      },
    ],
  },
]

// Маршрутизация страниц модуля учебной аналитики
const learningAnalyticsRoutes = [
  {
    path: '/education_analytics',
    name: 'EducationAnalyticModule',
    component: () => import('@/pages/education_analytics_module/ParentLayout.vue'),
    redirect: { name: 'MainPage' },
    children: [
      {
        path: 'main',
        name: 'MainPage',
        component: () => import('@/pages/education_analytics_module/MainPage.vue'),
        meta: { title: 'MainPage', requiresAuth: true },
      },
      {
        path: 'learning_track',
        name: 'LearningTrackPage',
        component: () => import('@/pages/education_analytics_module/LearningTrack.vue'),
        meta: { title: 'LearningTrackPage', requiresAuth: true },
      },
      {
        path: 'reports',
        name: 'ReportsPage',
        component: () => import('@/pages/education_analytics_module/ReportsPage.vue'),
        meta: { title: 'ReportsPage', requiresAuth: true },
      },
      {
        path: 'stats',
        name: 'StatsPage',
        component: () => import('@/pages/education_analytics_module/StatsPage.vue'),
        meta: { title: 'StatsPage', requiresAuth: true },
      },
      {
        path: 'profile',
        name: 'ProfilePage',
        component: () => import('@/pages/education_analytics_module/ProfilePage.vue'),
        meta: { title: 'ProfilePage', requiresAuth: true },
      },
      {
        path: 'admin',
        name: 'AdminPanelPage',
        component: () => import('@/pages/education_analytics_module/AdminPanelPage.vue'),
        meta: { title: 'AdminPanelPage', requiresAuth: true },
      },
      {
        path: 'root',
        name: 'SuperUserPage',
        component: () => import('@/pages/education_analytics_module/SuperUserPanelPage.vue'),
        meta: { title: 'SuperUserPage', requiresAuth: true },
      },
    ],
  },
]

const startRoutes = [
  {
    path: '/start-page',
    name: 'StartPage',
    component: () => import('@/pages/auth/StartPage.vue'),
    meta: {
      startRoute: true,
      requiresAuth: false,
    },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/auth/LoginPage.vue'),
    meta: {
      startRoute: true,
      requiresAuth: false,
    },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/pages/auth/RegisterPage.vue'),
    meta: {
      startRoute: true,
      requiresAuth: false,
    },
  },
  {
    path: '/verify-email',
    name: 'VerifyEmail',
    component: () => import('@/pages/auth/VerifyEmailPage.vue'),
    meta: {
      startRoute: true,
      requiresAuth: false,
    },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/pages/auth/ForgotPasswordPage.vue'),
    meta: {
      startRoute: true,
      requiresAuth: false,
    },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/pages/auth/ResetPasswordPage.vue'),
    meta: {
      startRoute: true,
      requiresAuth: false,
    },
  },
  {
    path: '/two-steps',
    name: 'TwoSteps',
    component: () => import('@/pages/auth/TwoStepsPage.vue'),
    meta: {
      startRoute: true,
      requiresAuth: false,
    },
  },
]

const adminpanelRoutes = [
  {
    path: '/AdminPanel',
    name: 'AdminPanel',
    component: () => import('@/pages/AdminPanel/ParentLayout.vue'),
    redirect: { name: 'GroupsPanel' },
    meta: { title: 'Админ-панель', requiresAuth: true },
    children: [
      {
        path: 'CategoriesPanel',
        name: 'CategoriesPanel',
        component: () => import('@/pages/AdminPanel/Categories.vue'),
        meta: { title: 'Панель категорий', requiresAuth: true },
      },
      {
        path: 'GroupsPanel',
        name: 'GroupsPanel',
        component: () => import('@/pages/AdminPanel/Groups.vue'),
        meta: { title: 'Панель групп', requiresAuth: true },
      },
      {
        path: 'PermissionsPanel',
        name: 'PermissionsPanel',
        component: () => import('@/pages/AdminPanel/Permissions.vue'),
        meta: { title: 'Панель прав', requiresAuth: true },
      },
      {
        path: 'UsersPanel',
        name: 'UsersPanel',
        component: () => import('@/pages/AdminPanel/Users.vue'),
        meta: { title: 'Панель пользователей', requiresAuth: true },
      },
      {
        path: 'LiminationsPanel',
        name: 'LiminationPanel',
        component: () => import('@/pages/AdminPanel/limitationSettings.vue'),
        meta: { title: 'Панель Ограничений', requiresAuth: true },
      },
    ],
  },
]
const waterMarkvideoRoute = [
  {
    path: '/watermarked-video',
    name: 'Watermarked-Video',
    component: () => import('@/pages/WatermarkVideo/ParentLayout.vue'),
    meta: {
      requiresAuth: true,
    },
  },
]

const biRoutes = [
  {
    path: '/bi',
    name: 'BI',
    component: () => import('@/pages/bi/HomePageBI.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/bi/storagelist',
    name: 'StorageList',
    component: () => import('@/pages/bi/StorageListPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/bi/storage',
    name: 'BIStorage',
    component: () => import('@/pages/bi/DatasetListPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/bi/connections/new',
    name: 'NewConnection',
    component: () => import('@/pages/bi/NewConnection.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/bi/connections/new/file',
    name: 'NewFile',
    component: () => import('@/pages/bi/NewFile.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/bi/connections/new/clickhouse',
    name: 'ClickHouse',
    component: () => import('@/pages/bi/components/db-settings/ClickHouse.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/bi/connections/new/mssql',
    name: 'MySQL',
    component: () => import('@/pages/bi/components/db-settings/MSSQL.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/bi/connections/new/postgresql',
    name: 'PostgreSQL',
    component: () => import('@/pages/bi/components/db-settings/PostgreSQL.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/bi/connections/:pk',
    name: 'connection-detail',
    component: () => import('@/pages/bi/components/db-settings/ConnectionDetail.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/bi/connections/:pk/files',
    name: 'ConnectionFiles',
    component: () => import('@/pages/bi/ConnectionFiles.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/bi/connections/new/dataset',
    name: 'NewDataset',
    component: () => import('@/pages/bi/DatasetPage.vue'),
    meta: { requiresAuth: true },
  },
]

const shortcodeRoutes = [
  {
    path: '/shortcodes',
    name: 'Shortcodes',
    component: () => import('@/pages/shortcodes/ParentLayout.vue'),
    meta: { title: 'Конструктор сайта', requiresAuth: true },
    redirect: { name: 'MainShortcodePage' },
    children: [
      {
        path: 'editor',
        name: 'MainShortcodePage',
        component: () => import('@/pages/shortcodes/editor/MainPage.vue'),
        meta: {
          title: 'Главная',
          requiresAuth: true
        },
      },
      {
        path: 'editor',
        name: 'ShortcodeEditor',
        component: () => import('@/pages/shortcodes/editor/ShortcodeEditor.vue'),
        meta: {
          title: 'Редактор страниц',
          requiresAuth: true
        },
      },
      {
        path: 'create-page',
        name: 'CreatePage',
        component: () => import('@/pages/shortcodes/editor/CreatePage.vue'),
        meta: {
          title: 'Создание страниц',
          requiresAuth: true
        },
      },
      {
        path: 'create-template',
        name: 'CreateTemplate',
        component: () => import('@/pages/shortcodes/editor/CreateTemplate.vue'),
        meta: {
          title: 'Создание шаблонов',
          requiresAuth: true
        },
      },
      {
        path: 'categories-page',
        name: 'PageCategories',
        component: () => import('@/pages/shortcodes/editor/PageCategories.vue'),
        meta: {
          title: 'Категории страниц',
          requiresAuth: true
        },
      },
      {
        path: 'templates',
        name: 'Templates',
        component: () => import('@/pages/shortcodes/editor/TemplateManager.vue'),
        meta: {
          title: 'Компоненты',
          requiresAuth: true
        },
      },
      {
        path: 'templates/:id?',
        name: 'TemplateEditor',
        component: import('@/pages/shortcodes/editor/TemplateEditor.vue'),
        props: true,
        meta: {
          title: 'Редактор компонентов',
          requiresAuth: true
        },
      }
    ],
  },
]

const expertSystemRoutes = [
  {
    path: '/expert-system',
    name: 'ExpertSystem',
    component: () => import('@/pages/expert-system/ParentLayout.vue'),
    meta: { requiresAuth: true },
    redirect: { name: 'ChoiceRole' },
    children: [
      { path: 'orientation-question/:testId', name: 'OrientationQuestionManager', component: () => import('@/pages/expert-system/OrientationQuestionManager.vue'), meta: { title: 'Менеджер вопросов', requiresAuth: true } },
      { path: 'orientation-answer/:questionId', name: 'OrientationAnswerManager', component: () => import('@/pages/expert-system/OrientationAnswerManager.vue'), meta: { title: 'Менеджер ответов', requiresAuth: true } },
      { path: 'proforientation-test/:testId', name: 'ProforientationTest', component: () => import('@/pages/expert-system/ProforientationTest.vue'), meta: { title: 'Прохождение теста', requiresAuth: true } },
      {
        path: 'choice-role',
        name: 'ChoiceRole',
        component: () => import('@/pages/expert-system/ChoiceRole.vue'),
        meta: { title: 'Выбор роли', requiresAuth: true },
      },
      {
        path: 'account',
        name: 'Profile',
        component: () => import('@/pages/expert-system/ProfileDashboard.vue'),
        meta: { title: 'Профиль', requiresAuth: true },
      },
      {
        path: 'skills',
        name: 'Skills',
        component: () => import('@/pages/expert-system/SkillManager.vue'),
        meta: { title: 'Навыки', requiresAuth: true },
      },
      {
        path: 'student-register',
        name: 'StudentRegister',
        component: () => import('@/pages/expert-system/StudentRegister.vue'),
        meta: { title: 'Регистрация студента', requiresAuth: true },
      },
      {
        path: 'company-register',
        name: 'CompanyRegister',
        component: () => import('@/pages/expert-system/CompanyRegister.vue'),
        meta: { title: 'Вход / Регистрация работодателя', requiresAuth: true },
      },
      {
        path: 'group-manager',
        name: 'Groups',
        component: () => import('@/pages/expert-system/GroupManager.vue'),
        meta: { title: 'Группы обучения', requiresAuth: true },
      },
      {
        path: 'proforientation',
        name: 'Proforientation',
        component: () => import('@/pages/expert-system/ProforientationTest.vue'),
        meta: { title: 'Профориентация', requiresAuth: true }
      },
      {
        path: 'addstudent-skills',
        name: 'Addstudentskills',
        component: () => import('@/pages/expert-system/AddSkillForStudentsWithExpirience.vue'),
        meta: { title: 'Добавление навыков студенту', requiresAuth: true },
      },
      {
        path: 'profession-manager',
        name: 'Profession',
        component: () => import('@/pages/expert-system/ProfessionManager.vue'),
        meta: { title: 'Менеджер профессий', requiresAuth: true },
      },
      {
        path: 'orientation-test',
        name: 'OrientationTest',
        component: () => import('@/pages/expert-system/OrientationTestManager.vue'),
        meta: { title: 'Менеджер ориентационных тестов', requiresAuth: true },
      },
      {
        path: 'orientation-question',
        name: 'OrientationQuestion',
        component: () => import('@/pages/expert-system/OrientationQuestionManager.vue'),
        meta: { title: 'Менеджер управление ориентационными вопросами', requiresAuth: true },
      },
      {
        path: 'orientation-answer',
        name: 'OrientationAnswer',
        component: () => import('@/pages/expert-system/OrientationAnswerManager.vue'),
        meta: { title: 'Менеджер управление вариантов ответов на вопросы', requiresAuth: true }
      },
      {
        path: 'all-tests',
        name: 'AllTests',
        component: () => import('@/pages/expert-system/Tests/AllTestsPage.vue'),
        meta: { title: 'Тесты', requiresAuth: true },
      },
      {
        path: 'test-creation',
        name: 'TestCreation',
        component: () => import('@/pages/expert-system/Tests/TestCreation.vue'),
        meta: { title: 'Создание тестов', requiresAuth: true },
      },
      {
        path: 'test-preview/:id',
        name: 'TestPreview',
        component: () => import('@/pages/expert-system/Tests/TestViewPage.vue'),
        meta: { title: 'Предпросмотр теста', requiresAuth: true },
        props: (route) => ({
          id: route.params.id
        })
      },
      {
        path: 'test/:id',
        name: 'TestPage',
        component: () => import('@/pages/expert-system/Tests/TestPage.vue'),
        meta: { title: 'Предпросмотр теста', requiresAuth: true },
        props: (route) => ({
          id: route.params.id
        })
      },
      {
        path:'test-result/:id',
        name:'TestResult',
        component:()=> import('@/pages/expert-system/Tests/TestResult.vue'),
        meta:{title:'Результат теста', requiresAuth:true},
        props:(route)=>({
          id:Number(route.params.id)
        })
      },
      {
        path: 'vacancies',
        name: 'Vacancies',
        component: () => import('@/pages/expert-system/StudentVacancies.vue'),
        meta: { title: 'Вакансии', requiresAuth: true },
      },
      {
        path: '/vacancy/:id',
        name: 'VacancyDetail',
        component: () => import('@/pages/expert-system/VacancyDetail.vue'),
        meta: {
          title: 'Детали вакансии',
          requiresAuth: true,
        },
      },
      {
        path: '/company/:id',
        name: 'CompanyDetail',
        component: () => import('@/pages/expert-system/CompanyDetail.vue'),
        meta: {
          title: 'Детали компании',
          requiresAuth: true,
        },
      },
      {
        path: '/student/:id',
        name: 'StudentDetail',
        component: () => import('@/pages/expert-system/StudentDetail.vue'),
        meta: {
          title: 'Детали студента',
          requiresAuth: true,
        },
      },
      {
        path: '/course/:id',
        name: 'CourseDetail',
        component: () => import('@/pages/expert-system/CourseDetail.vue'),
        meta: {
          title: 'Детали курса',
          requiresAuth: true,
        },
      },
      {
        path: '/students',
        name: 'StudentsList',
        component: () => import('@/pages/expert-system/StudentList.vue'),
        meta: {
          title: 'Поиск студентов',
          requiresAuth: true,
        },
      },
      {
        path: '/student-courses',
        name: 'StudentCourses',
        component: () => import('@/pages/expert-system/StudentCourses.vue'),
        meta: {
          title: 'Рекомендованные курсы',
          requiresAuth: true,
        },
      },
    ],
  },
]

const routes = [
  ...startRoutes,
  ...mainRoutes,
  ...dashboardRoutes,
  ...userRoutes,
  ...analyzeRoutes,
  ...settingsRoutes,
  ...emailRoutes,
  ...messengerRoutes,
  ...billingRoutes,
  ...mapsRoutes,
  ...calendarRoutes,
  ...kanbanRoutes,
  ...tableRoutes,
  ...chartsRoutes,
  ...modalWindowsRoutes,
  ...inputsRoutes,
  ...componentsRoutes,
  ...adminpanelRoutes,
  ...waterMarkvideoRoute,
  ...biRoutes,
  ...shortcodeRoutes,
  ...expertSystemRoutes,
  ...learningAnalyticsRoutes,
]

routes.forEach((route) => {
  if (!route.meta || !Object.prototype.hasOwnProperty.call(route.meta, 'startRoute')) {
    route.meta = route.meta || {}
    route.meta.startRoute = false
  }
})

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    runCheckToken()
      .then((isChecked) => {
        if (isChecked === false) {
          next({ name: 'StartPage' })
        } else {
          next(true)
        }
      })
      .catch((error) => {
        console.error('Ошибка проверки токена:', error)
        next({ name: 'StartPage' })
      })
  } else {
    next()
  }
})

async function runCheckToken() {
  const isChecked = await checkToken()
  return isChecked
}
import { checkAccessToPage, CheckAccessToComponents } from './GroupsPolitics'
export default router
router.beforeEach((to, from, next) => {
    checkAccessToPage(to.path)
    next()
    CheckAccessToComponents(to.path)
})
