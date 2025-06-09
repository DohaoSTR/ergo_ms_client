export function getColumnType(table, columnName) {
  if (!table || !table.columns_info) return null;
  const idx = (table.columns_info.columns || []).indexOf(columnName);
  if (idx === -1) return null;
  return (table.columns_info.types || [])[idx] || null;
}

// Проверить, совместимы ли связи между двумя таблицами
export function checkJoinCompatibility(mainTable, linkedTable, relations) {
  // relations: [{ left: "ИмяКолонки1", right: "ИмяКолонки2" }, ...]
  for (const rel of relations) {
    const typeA = getColumnType(mainTable, rel.left);
    const typeB = getColumnType(linkedTable, rel.right);
    if (!typeA || !typeB || typeA !== typeB) {
      return false;
    }
  }
  return true;
}