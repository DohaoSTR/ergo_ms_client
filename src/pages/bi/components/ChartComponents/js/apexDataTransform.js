import { PALETTE } from './chartColors'

// -----------------------
// УТИЛИТЫ
// -----------------------
function getField(fields, keys, first = true) {
  if (!fields) return null
  if (!Array.isArray(keys)) keys = [keys]
  for (const k of keys) {
    if (fields[k]) {
      if (Array.isArray(fields[k])) {
        if (fields[k].length) return first ? fields[k][0] : fields[k]
      } else if (fields[k]) {
        return first ? fields[k] : [fields[k]]
      }
    }
  }
  return first ? null : []
}

// -----------------------
// BAR
// -----------------------
export function getApexSeriesBar(fields, dataset) {
  const yFields    = getField(fields, ['y'], false)
  const colorField = getField(fields, ['color', 'colors'])
  // Несколько Y — мультисерия (по каждому Y отдельный столбец)
  if (yFields.length > 1) {
    return yFields.map(f => ({
      name: f.label || f.name,
      data: dataset.map(r => Number(r[f.name]))
    }))
  }
  // Если выбран цвет (colorField) — по каждому уникальному значению color отдельная серия
  if (colorField && yFields.length === 1) {
    const uniqColors = [...new Set(dataset.map(r => r[colorField.name]))]
    return uniqColors.map(val => ({
      name: String(val),
      data: dataset
        .filter(r => r[colorField.name] === val)
        .map(r => Number(r[yFields[0].name]))
    }))
  }
  // Одна ось Y — одна серия
  if (yFields.length === 1) {
    return [{
      name: yFields[0].label || yFields[0].name,
      data: dataset.map(r => Number(r[yFields[0].name]))
    }]
  }
  return []
}

// -----------------------
// LINE/AREA
// -----------------------
export function getApexSeriesLine(fields, dataset) {
  const yFields = [
    ...(getField(fields, ['y'], false)),
    ...(getField(fields, ['y2'], false))
  ]
  const colorField = getField(fields, ['color', 'colors'])
  // Несколько Y/Y2 — мультисерия
  if (yFields.length > 1) {
    return yFields.map(f => ({
      name: f.label || f.name,
      data: dataset.map(r => Number(r[f.name]))
    }))
  }
  // По colorField — мультисерия по цвету (если только один Y)
  if (colorField && yFields.length === 1) {
    const uniqColors = [...new Set(dataset.map(r => r[colorField.name]))]
    return uniqColors.map(val => ({
      name: String(val),
      data: dataset
        .filter(r => r[colorField.name] === val)
        .map(r => Number(r[yFields[0].name]))
    }))
  }
  // Одна серия
  if (yFields.length === 1) {
    return [{
      name: yFields[0].label || yFields[0].name,
      data: dataset.map(r => Number(r[yFields[0].name]))
    }]
  }
  return []
}

// -----------------------
// PIE / DONUT
// -----------------------
export function getApexSeriesPie(fields, dataset) {
  const categoryField =
    getField(fields, ['x', 'category', 'labels'], true) ||
    getField(fields, ['categories'], true)
  const valueField =
    getField(fields, ['y', 'values', 'value', 'indicators'], true)
  if (!categoryField || !valueField) return []
  const uniqCats = [...new Set(dataset.map(r => r[categoryField.name]))]
  return [{
    name: valueField.label || valueField.name,
    data: uniqCats.map(cat =>
      dataset
        .filter(r => r[categoryField.name] === cat)
        .reduce((acc, r) => acc + Number(r[valueField.name] ?? 0), 0)
    )
  }]
}

export function getApexLabelsPie(fields, dataset) {
  const categoryField =
    getField(fields, ['x', 'category', 'labels'], true) ||
    getField(fields, ['categories'], true)
  if (!categoryField) return []
  return [...new Set(dataset.map(r => r[categoryField.name]))]
}

// -----------------------
// RADAR
// -----------------------
export function getApexSeriesRadar(fields, dataset) {
  const valueFields = getField(fields, ['y', 'indicators', 'values'], false)
  if (!valueFields.length) return []
  return valueFields.map(f => ({
    name: f.label || f.name,
    data: dataset.map(r => Number(r[f.name]))
  }))
}

// -----------------------
// SCATTER
// -----------------------
export function getApexSeriesScatter(fields, dataset) {
  const xField = getField(fields, ['x'], true)
  const yFields = getField(fields, ['y'], false)
  if (!xField || !yFields.length) return []
  return yFields.map(f => ({
    name: f.label || f.name,
    data: dataset.map(r => [Number(r[xField.name]), Number(r[f.name])])
  }))
}

// -----------------------
// HEATMAP
// -----------------------
export function getApexSeriesHeatmap(fields, dataset) {
  const xField = getField(fields, ['x'], true)
  const yField = getField(fields, ['y'], true)
  const valueField =
    getField(fields, ['value', 'y2', 'indicator', 'values'], true) || yField
  if (!xField || !yField || !valueField) return []
  const uniqY = [...new Set(dataset.map(r => r[yField.name]))]
  const uniqX = [...new Set(dataset.map(r => r[xField.name]))]
  return uniqY.map(yVal => ({
    name: String(yVal),
    data: uniqX.map(xVal => {
      const row = dataset.find(r => r[yField.name] === yVal && r[xField.name] === xVal)
      return {
        x: xVal,
        y: row ? Number(row[valueField.name]) : null
      }
    })
  }))
}

// -----------------------
// COLORS (универсально)
// -----------------------
export function getApexColors({ type, fields, dataset, series = [] }) {
  // Мультисерия по Y/Y2 — цвета просто по порядку
  const yFields = [
    ...(getField(fields, ['y'], false)),
    ...(getField(fields, ['y2'], false))
  ]
  if (['line', 'bar', 'area'].includes(type) && yFields.length > 1) {
    return PALETTE.slice(0, yFields.length)
  }
  // Если pie/donut — цветов столько, сколько категорий
  if (['pie', 'donut'].includes(type)) {
    const categoryField =
      getField(fields, ['x', 'category', 'labels'], true) ||
      getField(fields, ['categories'], true)
    if (!categoryField) return PALETTE
    const uniqCats = [...new Set(dataset.map(r => r[categoryField.name]))]
    return uniqCats.map((_, i) => PALETTE[i % PALETTE.length])
  }
  // Иначе, если есть colorField, выдаём цвета по уникальным значениям colorField
  const colorField = getField(fields, ['color', 'colors'])
  if (colorField) {
    const uniq = [...new Set(dataset.map(r => r[colorField.name]))]
    return uniq.map((_, i) => PALETTE[i % PALETTE.length])
  }
  // По умолчанию
  return PALETTE
}

// -----------------------
// ГЛАВНАЯ ФУНКЦИЯ
// -----------------------
export function getApexSeries({ type, fields, dataset }) {
  switch (type) {
    case 'line':
    case 'area':
      return getApexSeriesLine(fields, dataset)
    case 'bar':
      return getApexSeriesBar(fields, dataset)
    case 'pie':
    case 'donut':
      return getApexSeriesPie(fields, dataset)
    case 'radar':
      return getApexSeriesRadar(fields, dataset)
    case 'scatter':
      return getApexSeriesScatter(fields, dataset)
    case 'heatmap':
      return getApexSeriesHeatmap(fields, dataset)
    default:
      return []
  }
}