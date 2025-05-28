/**
 * Алгоритм авто-join: перебирает таблицы, ищет совпадающие поля (например, одинаковые имена колонок),
 * и возвращает массив связей: [{ source, target, sourceField, targetField, joinType }]
 */
export function autoJoinTables(tables) {
  if (!Array.isArray(tables) || tables.length < 2) return []

  const joins = []
  const main = tables[0]

  // пример: auto-join по совпадающим колонкам
  for (let i = 1; i < tables.length; i++) {
    const tableA = main
    const tableB = tables[i]

    // Допустим, у каждой таблицы есть поле columns: ['id', 'name', ...]
    const common = tableA.columns.filter(col => tableB.columns.includes(col))
    if (common.length) {
      joins.push({
        source: tableA.id,
        target: tableB.id,
        sourceField: common[0],
        targetField: common[0],
        joinType: 'inner'
      })
    }
    // Если нет совпадающих колонок, можно создать "пустой join" или оставить без связи
  }
  return joins
}