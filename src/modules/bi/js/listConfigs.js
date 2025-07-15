import { DatasetDTO, DashboardDTO, ConnectionDTO, ChartDTO } from '@/modules/bi/components/dto/index.js'
import { endpoints } from '@/js/api/endpoints.js'

// Конфигурации для разных типов элементов
export const listConfigs = {
  // Конфигурация для подключений
  connections: {
    type: 'connections',
    endpoint: endpoints.bi.ConnectionsList,
    createRoute: '/bi/connections/new',
    createButtonText: 'Создать подключение',
    createButtonWidth: '15.0rem',
    searchPlaceholder: 'Поиск...',
    mapData: (item) => new ConnectionDTO({
      id: item.id,
      name: item.name,
      connector_type_display: item.connector_type_display || item.connector_type,
      created_at: item.created_at,
      config: item.config,
      owner: item.owner
    }),
    filterFunction: (term) => (item) =>
      item.name?.toLowerCase().includes(term) ||
      item.connector_type_display?.toLowerCase().includes(term)
  },

  // Конфигурация для датасетов
  datasets: {
    type: 'datasets',
    endpoint: endpoints.bi.DatasetsList,
    createRoute: '/bi/dataset/new',
    createButtonText: 'Создать датасет',
    createButtonWidth: '10rem',
    searchPlaceholder: 'Введите для поиска...',
    mapData: (item) => new DatasetDTO({
      id: item.id,
      name: item.name,
      owner_username: item.owner_username,
      created_at: item.created_at,
      storage_type: item.storage_type
    }),
    filterFunction: (term) => (item) =>
      item.name?.toLowerCase().includes(term) ||
      item.owner_username?.toLowerCase().includes(term)
  },

  // Конфигурация для чартов
  charts: {
    type: 'charts',
    endpoint: endpoints.bi.ChartsList,
    createRoute: '/bi/chart/new',
    createButtonText: 'Создать чарт',
    createButtonWidth: '10rem',
    searchPlaceholder: 'Поиск...',
    mapData: (item) => new ChartDTO({
      id: item.id,
      name: item.name,
      type_display: item.type_display || item.type,
      created_at: item.created_at,
      owner: item.owner
    }),
    filterFunction: (term) => (item) =>
      item.name?.toLowerCase().includes(term) ||
      item.type_display?.toLowerCase().includes(term)
  },

  // Конфигурация для дашбордов
  dashboards: {
    type: 'dashboards',
    endpoint: endpoints.bi.DashboardList,
    createRoute: '/bi/dashboard/new',
    createButtonText: 'Создать дашборд',
    createButtonWidth: '11rem',
    searchPlaceholder: 'Введите для поиска...',
    mapData: (item) => new DashboardDTO({
      id: item.id,
      name: item.name,
      owner_username: item.owner_username,
      created_at: item.created_at,
      description: item.description,
      charts_count: item.charts_count
    }),
    filterFunction: (term) => (item) =>
      item.name?.toLowerCase().includes(term) ||
      item.owner_username?.toLowerCase().includes(term)
  }
}

// Функция для получения конфигурации по типу
export function getListConfig(type) {
  return listConfigs[type]
}

// Функция для проверки существования конфигурации
export function hasListConfig(type) {
  return type in listConfigs
} 