import { PALETTE, getColorMap, getRowColors } from './chartColors'

export function getLineData(
  rows,
  xFields      = [],
  yFields      = [],
  y2Fields     = [],
  colorField   = null,   // { name, … }  или null
  sortFields   = [],     // [{ field, desc }]
  labelField   = null,   // { name, … }  или null
  filters      = []      // [{ field, value }]
) {
  if (!rows?.length) return { labels: [], datasets: [] };

  /* 1. Фильтры ----------------------------------------------------------- */
  rows = rows.filter(r =>
    filters.every(f => String(r[f.field]) === String(f.value))
  );

  /* 2. Сортировка -------------------------------------------------------- */
  sortFields.forEach(({ field, desc }) => {
    rows.sort((a, b) => {
      const av = a[field], bv = b[field];
      if (av === bv) return 0;
      return desc ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1);
    });
  });

  /* 3. Формируем подписи X ---------------------------------------------- */
  const makeXLabel = r => [
    ...xFields.map(f => r[f.name]),
    labelField ? r[labelField.name] : undefined,
  ].filter(Boolean).join(' / ');

  const xLabels = Array.from(new Set(rows.map(makeXLabel)));

  /* 4. Цветовые группы --------------------------------------------------- */
  const colorValues = colorField
    ? Array.from(new Set(rows.map(r => r[colorField.name])))
    : [null];

  const colorMap = colorField
    ? getColorMap(rows, colorField.name, PALETTE)   // { val → #hex }
    : {};

  /* 5. Хелпер для линии -------------------------------------------------- */
  const buildSeries = ({ fieldObj, yAxisID, dashed, baseColor }) => ({
    label : colorField
        ? `${fieldObj.name} (${baseColor.key})`
        : fieldObj.name,
    data  : xLabels.map(lbl => {
      const groupRows = rows.filter(r =>
        makeXLabel(r) === lbl &&
        (!colorField || r[colorField.name] === baseColor.key)
      );
      return groupRows.reduce((s, r) => s + Number(r[fieldObj.name] ?? 0), 0);
    }),
    yAxisID,
    borderColor     : baseColor.color,
    borderDash      : dashed ? [8, 4] : [],
    backgroundColor : 'transparent',
    pointRadius     : 3,
    tension         : 0.3,
  });

  /* 6. Датасеты ---------------------------------------------------------- */
  const datasets = [];

  colorValues.forEach((cVal, idx) => {
    const color = colorField
      ? (colorMap[cVal] ?? PALETTE[idx % PALETTE.length])
      : PALETTE[idx % PALETTE.length];

    const baseColor = { key: cVal ?? '—', color };

    yFields .forEach(f => datasets.push(
      buildSeries({ fieldObj: f, yAxisID: 'y',  dashed: false, baseColor })
    ));
    y2Fields.forEach(f => datasets.push(
      buildSeries({ fieldObj: f, yAxisID: 'y2', dashed: true,  baseColor })
    ));
  });

  return { labels: xLabels, datasets };
}

// Для столбчатого графика (bar)
export function getBarData(
  dataset,
  xField,
  yField,
  colorField = null,
  options = {}
) {
  // --- 0. нормализация ---
  const xFields   = Array.isArray(xField) ? xField : [xField]
  const yFields   = (Array.isArray(yField) ? yField : [yField]).filter(Boolean)
  const filters   = options.filters      ?? []
  const labelFlds = options.labelFields  ?? []
  const sortOpt   = options.sort         ?? null
  const colorName = colorField?.name ?? colorField ?? null
  if (!dataset?.length || yFields.length === 0) return { labels: [], datasets: [] }

  // --- 1. фильтрация ---
  const passFilter = (row, { field, op = 'eq', value }) => {
    const v = row[field?.name ?? field]
    switch (op) {
      case 'eq'  : return v ==  value
      case 'neq' : return v !=  value
      case 'gt'  : return v >  value
      case 'gte' : return v >= value
      case 'lt'  : return v <  value
      case 'lte' : return v <= value
      case 'in'  : return (value ?? []).includes(v)
      case 'nin' : return !(value ?? []).includes(v)
      default    : return true
    }
  }
  const dataFiltered = dataset.filter(row =>
    filters.every(f => passFilter(row, f))
  )

  // --- 2. ключ-подпись ---
  const makeXKey = row => {
    // убираем colorField из X-полей если нужно
    const colorAsX = colorName && xFields.length === 1 && (xFields[0].name ?? xFields[0]) === colorName
    const parts = xFields
      .filter(f => !(colorName && !colorAsX && (f.name ?? f) === colorName))
      .map(f => row[f.name ?? f])
    // если поле цвета совпадает с X и оно единственное, оставляем
    if (!parts.length && colorName) parts.push(row[colorName])
    return parts.join(' · ') || '—'
  }

  const makeLabel = row =>
    (labelFlds.length
      ? labelFlds.map(f => row[f.name ?? f]).join(' · ')
      : makeXKey(row)
    )

  // --- 3. агрегация ---
  // labels → { yName → { colorVal → sum } }
  const grouped = new Map()
  const labelByKey = new Map() // ключ Х → итоговая подпись

  for (const row of dataFiltered) {
    const xKey   = makeXKey(row)
    const lbl    = makeLabel(row)
    const cVal   = colorName ? row[colorName] : '_single_'

    labelByKey.set(xKey, lbl)
    if (!grouped.has(xKey)) {
      grouped.set(
        xKey,
        Object.fromEntries(yFields.map(f => [f.name ?? f, {}]))
      )
    }
    const perY = grouped.get(xKey)
    for (const f of yFields) {
      const yName = f.name ?? f
      const val   = Number(row[yName]) || 0
      perY[yName][cVal] = (perY[yName][cVal] || 0) + val
    }
  }

  // --- 4. сортировка ---
  let keys = Array.from(grouped.keys())
  if (sortOpt) {
    const dir = sortOpt.dir === 'desc' ? -1 : 1
    const cmp = (a, b) => {
      if (sortOpt.by === 'value') {
        const yName = yFields[0].name ?? yFields[0]
        const sum = k => Object.values(grouped.get(k)[yName]).reduce((s, v) => s + v, 0)
        return (sum(a) - sum(b)) * dir
      }
      if (sortOpt.by === 'label') {
        return (labelByKey.get(a) > labelByKey.get(b) ? 1 : -1) * dir
      }
      const fieldName = sortOpt.by === 'x' ? (xFields[0].name ?? xFields[0])
                                           : sortOpt.by
      const get = k => {
        const sample = dataFiltered.find(r => makeXKey(r) === k)
        return sample?.[fieldName]
      }
      return (get(a) > get(b) ? 1 : -1) * dir
    }
    keys = keys.sort(cmp)
  }
  const labels = keys.map(k => labelByKey.get(k))

  // --- 5. datasets (универсальный режим) ---
  const isColorAsX = colorName && xFields.length === 1 && (xFields[0].name ?? xFields[0]) === colorName
  if (!colorName || isColorAsX) {
    // один dataset, разные цвета для каждого столбца если color=X
    const colorMap = colorName ? getColorMap(dataFiltered, colorName) : null
    const backgroundColors = isColorAsX
      ? keys.map(k => colorMap?.[k] || PALETTE[0])
      : PALETTE[0]

    const datasets = yFields.map((f, idx) => ({
      label: f.label || f.name || `Y${idx + 1}`,
      data : keys.map(k => {
        // убираем нули, если данных нет
        const val = grouped.get(k)[f.name ?? f][isColorAsX ? k : '_single_']
        return val != null ? val : null
      }),
      backgroundColor: backgroundColors,
      borderColor    : backgroundColors,
      stack: 'stack1'
    }))
    return { labels, datasets }
  }

  // обычный режим: datasets по цвету
  const colorMap  = getColorMap(dataFiltered, colorName)
  const colorVals = Object.keys(colorMap)
  const datasets = colorVals.map((cVal, idx) => ({
    label: cVal ?? '—',
    data : keys.map(k => {
      const val = yFields.reduce((s, f) => {
        const v = grouped.get(k)[f.name ?? f][cVal]
        return v != null ? s + v : s
      }, null)
      return val != null ? val : null
    }),
    backgroundColor: colorMap[cVal],
    borderColor    : colorMap[cVal],
    //stack: 'stack1'
  }))

  return { labels, datasets }
}

/** Круговая и кольцевая диаграмма (pie/doughnut) */
export function getPieData(
  rows,
  categoryFields = [],          // массив объектов
  valueFields    = [],          // массив объектов (≥1!)
  colorFieldArr  = [],          // массив (можно пустой)
  sortFields     = [],          // [{field, desc}]
  filters        = []           // [{field, value}]
) {
  if (!rows?.length || !categoryFields.length || !valueFields.length) {
    return { labels: [], datasets: [] }
  }

  /* 1. фильтруем -------------------------------------------------------- */
  rows = rows.filter(r =>
    filters.every(f => String(r[f.field]) === String(f.value))
  )

  /* 2. формируем label по ВСЕМ категориям ------------------------------ */
  const makeLabel = r => categoryFields.map(f => r[f.name]).join(' / ')

  /* 3. агрегируем по label -------------------------------------------- */
  const bucket = new Map()   // label → { sums: Array(valueFields.length) }
  rows.forEach(r => {
    const lbl = makeLabel(r)
    if (!bucket.has(lbl))
      bucket.set(lbl, { sums: Array(valueFields.length).fill(0), row: r })
    const obj = bucket.get(lbl)
    valueFields.forEach((vf, i) => {
      obj.sums[i] += Number(r[vf.name] ?? 0)
    })
  })

  /* 4. сортировка ------------------------------------------------------ */
  let entries = Array.from(bucket.entries()) // [label, {sums,row}]
  sortFields.forEach(({ field, desc }) => {
    const idx = categoryFields.findIndex(f => f.name === field)
    entries.sort((a, b) => {
      let av, bv
      if (idx !== -1) {                    // сортируем по категории
        av = a[0]; bv = b[0]
      } else {                             // сортируем по значению (берём первое valueField)
        av = a[1].sums[0]; bv = b[1].sums[0]
      }
      if (av === bv) return 0
      return desc ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1)
    })
  })

  const labels = entries.map(([lbl]) => lbl)

  /* 5. цвета ----------------------------------------------------------- */
  const colorField = colorFieldArr?.[0] || null
  let background = PALETTE
  if (colorField) {
    const colorMap = getColorMap(rows, colorField.name, PALETTE)
    background = entries.map(([, { row }]) =>
      colorMap[row[colorField.name]]
    )
  }

  /* 6. формируем datasets (одно «кольцо» на valueField) --------------- */
  const datasets = valueFields.map((vf, idx) => ({
    label: vf.name,
    data : entries.map(([, obj]) => obj.sums[idx]),
    backgroundColor: background,
    hoverOffset: 6, // чуть выдвигаем сегмент при наведении
  }))

  return { labels, datasets }
}

function makeEncoder() {
  const map  = new Map()    // value → idx
  const rev  = []           // idx   → value
  return {
    encode(v) {
      if (!map.has(v)) {
        map.set(v, rev.length)
        rev.push(v)
      }
      return map.get(v)
    },
    labels: rev,            // порядок появления
  }
}

/** Точечная диаграмма (scatter) */
export function getScatterData(
  rows,
  xFields      = [],
  yFields      = [],
  groupFields  = [],
  sizeFields   = [],
  colorFields  = [],
  sortFields   = [],
  filters      = []
) {
  const xField = xFields[0]
  const yField = yFields[0]
  if (!rows?.length || !xField || !yField) return { labels: [], datasets: [] }

  /* ── фильтры */
  rows = rows.filter(r =>
    filters.every(f => String(r[f.field]) === String(f.value))
  )

  /* ── кодировщики категорий → число */
  const xEnc = makeEncoder()
  const yEnc = makeEncoder()

  /* ── цвет / группа / размер */
  const groupField = groupFields[0] ?? null
  const sizeField  = sizeFields [0] ?? null
  const colorField = colorFields[0] ?? groupField
  const colorMap   = colorField ? getColorMap(rows, colorField.name, PALETTE) : null

  /* ── масштаб радиуса */
  let sizeScale = () => 6
  if (sizeField) {
    const nums = rows.map(r => +r[sizeField.name] || 0)
    const min = Math.min(...nums), max = Math.max(...nums)
    sizeScale = v => (max === min ? 10 : 6 + (14 * (v - min)) / (max - min))
  }

  /* ── группировка */
  const groups = groupField
    ? Array.from(new Set(rows.map(r => r[groupField.name])))
    : [null]

  const datasets = groups.map((g, idx) => {
    const pts = rows.filter(r => !g || r[groupField.name] === g)
      .map(r => {
        const xv = +r[xField.name];  // пробуем как число
        const yv = +r[yField.name];
        return {
          x: Number.isFinite(xv) ? xv : xEnc.encode(r[xField.name]),
          y: Number.isFinite(yv) ? yv : yEnc.encode(r[yField.name]),
          r: sizeScale(+r[sizeField?.name] || 0),
          __color__: colorField ? r[colorField.name] : null,
        }
      })

    return {
      label: g ?? yField.name,
      data : pts,
      backgroundColor: pts.map(p =>
        p.__color__ ? colorMap[p.__color__] : PALETTE[idx % PALETTE.length]
      ),
      showLine: false,
    }
  })

  /* ── если X или Y были категориальными, отдаём подписи для axis */
  const meta = {}
  if (xEnc.labels.length) meta.xLabels = xEnc.labels
  if (yEnc.labels.length) meta.yLabels = yEnc.labels

  return { datasets, meta }
}

/** Радарная диаграмма (radar) */
export function getRadarData (
  rows,
  categoryField,
  valueFields = [],
  colorField   = null,
  filters      = [],
  sortFields   = []
) {
  if (!rows?.length || !categoryField || !valueFields.length) {
    return { labels: [], datasets: [] }
  }

  /* 1. фильтры ----------------------------------------------------------- */
  rows = rows.filter(r =>
    filters.every(f => String(r[f.field]) === String(f.value))
  )

  /* 2. агрегируем дубликаты категорий (сумма) ---------------------------- */
  const bucket = new Map()     // key = category → { sums: valueFields.length }
  rows.forEach(r => {
    const cat = r[categoryField.name]
    if (!bucket.has(cat))
      bucket.set(cat, Array(valueFields.length).fill(0))
    const arr = bucket.get(cat)
    valueFields.forEach((vf, i) => {
      arr[i] += Number(r[vf.name] ?? 0)
    })
  })

  /* 3. базовые метки оси ------------------------------------------------- */
  let labels = Array.from(bucket.keys())

  /* 4. сортировка категорий (по первой метрике или по label) ------------ */
  sortFields.forEach(({ field, desc }) => {
    labels.sort((a, b) => {
      let av, bv
      if (field === categoryField.name) { av = a; bv = b }
      else {                              // по значению первой метрики
        av = bucket.get(a)[0]
        bv = bucket.get(b)[0]
      }
      if (av === bv) return 0
      return desc ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1)
    })
  })

  /* 5. цветовая карта ---------------------------------------------------- */
  const colorMap = colorField
    ? getColorMap(rows, colorField.name, PALETTE)
    : null

  /* 6-a. если ЗАДАН colorField  → по нему делаем отдельный dataset ------- */
  if (colorField) {
    const uniqColors = Array.from(new Set(rows.map(r => r[colorField.name])))
    const firstMetric = valueFields[0]

    const datasets = uniqColors.map((cVal, idx) => ({
      label           : `${firstMetric.name} / ${cVal}`,
      data            : labels.map(cat => {
        // фильтруем по категории + цвету
        const rowsOfCat = rows.filter(r =>
          r[categoryField.name] === cat &&
          r[colorField.name]   === cVal
        )
        return rowsOfCat.reduce(
          (s, r) => s + Number(r[firstMetric.name] ?? 0), 0
        )
      }),
      backgroundColor : (colorMap[cVal] || PALETTE[idx % PALETTE.length]) + '44',
      borderColor     : colorMap[cVal] || PALETTE[idx % PALETTE.length],
      fill            : true,
    }))

    return { labels, datasets }
  }

  /* 6-b. colorField НЕТ  → по каждому valueField свой набор -------------- */
  const datasets = valueFields.map((vf, idx) => ({
    label           : vf.name,
    data            : labels.map(cat => bucket.get(cat)[idx]),
    backgroundColor : PALETTE[idx % PALETTE.length] + '44',
    borderColor     : PALETTE[idx % PALETTE.length],
    fill            : true,
  }))

  return { labels, datasets }
}

/** Тепловая карта (heatmap) */
export function getHeatmapData(dataset, xField, yField, valueField, colorField) {
  // Для большинства heatmap-библиотек нужно делать массив серий по оси Y
  if (!xField || !yField || !valueField) return { labels: [], datasets: [] }
  const xLabels = Array.from(new Set(dataset.map(row => row[xField.name])))
  const yLabels = Array.from(new Set(dataset.map(row => row[yField.name])))

  // Заполняем двумерную матрицу: rows = y, cols = x
  const dataMatrix = yLabels.map(yVal =>
    xLabels.map(xVal => {
      const match = dataset.find(row =>
        row[xField.name] === xVal && row[yField.name] === yVal
      )
      return match ? Number(match[valueField.name]) : null
    })
  )

  // Для Chart.js heatmap-like: series = по y, каждая серия — значения по x
  const datasets = yLabels.map((yVal, idx) => ({
    label: yVal,
    data: dataMatrix[idx],
    backgroundColor: PALETTE[idx % PALETTE.length]
  }))

  return { labels: xLabels, datasets }
}