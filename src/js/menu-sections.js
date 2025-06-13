import {
  AtSign,
  Braces,
  Calendar,
  ChartBarStacked,
  ChartSpline,
  ChartCandlestick,
  CircleUserRound,
  Component,
  Code2,
  Grid2x2,
  Map,
  MessagesSquare,
  PictureInPicture2,
  Table2,
  TextCursorInput,
  UserCog,
  Wallet,
  KeySquare,
  BookOpen,
  NotepadTextDashed,
  Video
} from 'lucide-vue-next'

// Аккаунт
export const UserMenuSection = {
  id: 1,
  icon: CircleUserRound,
  routeName: 'User',
  title: 'Аккаунт',
  list: [
    { path: 'Account', name: 'Профиль' },
    { path: 'Teams', name: 'Команды' },
    { path: 'Projects', name: 'Проекты' },
    { path: 'Connections', name: 'Связи' },
  ],
}


// Настройки аккаунта
export const SettingsMenuSection = {
  id: 2,
  icon: UserCog,
  routeName: 'Settings',
  title: 'Настройки',
  list: [
    { path: 'AccountSettings', name: 'Аккаунт' },
    { path: 'SecuritySettings', name: 'Безопасность' },
    { path: 'NotificationSettings', name: 'Уведомления' },
    { path: 'ConnectionSettings', name: 'Связи' },
    { path: 'Roles', name: 'Ролевые настройки' },
  ],
}

// Электронная почта
export const EmailMenuSection = {
  id: 3,
  icon: AtSign,
  routeName: 'Email',
  title: 'Электронная почта',
}

// Мессенджер
export const ChatMenuSection = {
  id: 4,
  icon: MessagesSquare,
  routeName: 'Messenger',
  title: 'Мессенджер',
}

// Карты
export const MapsMenuSection = {
  id: 5,
  icon: Map,
  routeName: 'Maps',
  title: 'Карты',
}

// Календарь
export const CalendarMenuSection = {
  id: 6,
  icon: Calendar,
  routeName: 'Calendar',
  title: 'Календарь',
}

// Канбан-доска
export const KanbanMenuSection = {
  id: 7,
  icon: Grid2x2,
  routeName: 'Kanban',
  title: 'Канбан-доска',
}

// Админ-панель
export const AdminPanelMenuSection = {
  id: 8,
  icon: KeySquare,
  routeName: 'AdminPanel',
  title: 'Админ-панель',
  list: [
    { path: 'CategoriesPanel', name: 'Настройка категорий' },
    { path: 'GroupsPanel', name: 'Настройка групп' },
    { path: 'PermissionsPanel', name: 'Настройка прав' },
    { path: 'UsersPanel', name: 'Настройка пользователей' },
    { path: 'LiminationPanel', name:'Настройка ограничений'}
  ],
}

export const WatermarkedVideoSection = {
  id: 9,
  icon: Video,
  routeName: 'Watermarked-Video',
  title: 'Видео с вотермаркой',
}

// BI секция
export const BIMenuSection = {
  id: 10,
  icon: ChartSpline,
  routeName: 'BI',
  title: 'BI',
  list: [
    {
      name: 'Датасеты',
      page: 'datasets',
      isOffcanvas: true
    },
    {
      name: 'Подключения',
      page: 'connections',
      isOffcanvas: true
    },
    {
      name: 'Чарты',
      page: 'charts',
      isOffcanvas: true
    },
  ],
}

export const ShortcodesMenuSection = {
  id: 11,
  icon: Braces,
  routeName: 'Shortcodes',
  title: 'Редактор страниц',
  list: [
    { path: 'MainShortcodePage', name: 'Главная' },
    { path: 'ShortcodeEditor', name: 'Редактор страниц' },
    { path: 'Templates', name: 'Компоненты' },
  ],
}

// Модуль учебной аналитики
export const EducationAnalyticMenuSection = {
  id: 12,
  icon: ChartCandlestick,
  routeName: 'EducationAnalyticModule',
  title: 'Учебная аналитика',
  list: [
    { path: 'MainPage', name: "Общее" },
    { path: 'StatsPage', name: "Статистика" },
    { path: 'LearningTrackPage', name: "Траектория" },
    { path: 'ReportsPage', name: "Отчёты" },
    { path: 'ProfilePage', name: "Профиль" },
    { path: 'AdminPanelPage', name: "Админ-панель" },
    { path: 'SuperUserPage', name: "SAdmin  " },
  ],
}

// Модуль экспертной системы
export const ExpertSystemSection = {
  id: 13,
  icon: ChartBarStacked,
  routeName: 'ExpertSystem',
  title: 'Анализ вакансий',
  list: [
    { path: 'Skills', name: 'Навыки' },
    { path: 'Profile', name: 'Профиль' },
    { path: 'Groups', name: 'Группы' },
    { path: 'Vacancies', name: 'Вакансии' },
    { path: 'Proforientation', name: 'Профориентация' },
    { path: 'Profession', name: 'Менеджер профессий' },
    { path: 'OrientationTest', name: 'Менеджер тестов' },
    { path: 'AllTests', name: 'Управление тестами для навыков' },
    { path: 'StudentCourses', name: 'Рекомендованные курсы' },
    { path: 'StudentsList', name: 'Студенты' }
  ],
}

// Аналитика
export const AssetsAnalyseMenuSection = {
  id: 14,
  icon: Code2,
  routeName: 'AssetsAnalyse',
  title: 'Анализ курсов активов',
};
