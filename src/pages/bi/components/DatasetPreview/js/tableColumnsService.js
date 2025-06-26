import { apiClient } from '@/js/api/manager'

// Универсальный метод для получения колонок таблицы (файл или БД)
export async function fetchTableColumns(table) {
  // 1. Загруженный файл: columns_info приходит из API, используем его
  if (table.columns_info && table.columns_info.columns) {
    return table.columns_info.columns;
  }
  // 2. DataSetTable
  if (table.table_name && table.id) {
    const resp = await apiClient.get(`/bi_datasets/tables/${table.id}/columns/`)
    return resp.data.columns || [];
  }
  // 3. Таблица из БД
  if (table.connection && table.table_name) {
    const resp = await apiClient.get(`/bi_connections/${table.connection}/tables/${table.table_name}/columns/`)
    return resp.data.columns || [];
  }
  return [];
}

// Если нужны еще и типы
export function getTableColumnTypes(table) {
  if (table.columns_info && table.columns_info.types) {
    return table.columns_info.types;
  }
  return [];
}