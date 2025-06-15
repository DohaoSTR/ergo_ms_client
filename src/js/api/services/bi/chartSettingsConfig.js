import { MoveRight, MoveUp, PaintBucket, ArrowDownWideNarrow, Type, Filter, Server, ChartPie, Ellipsis, Maximize } from 'lucide-vue-next'

export const chartSettingsConfig = {
  line: [
    { key: 'x', label: 'X', icon: MoveRight, allowedTypes: ['string', 'date'] }, // x — категория или дата
    { key: 'y', label: 'Y', icon: MoveUp, allowedTypes: ['number'] },
    { key: 'y2', label: 'Y2', icon: MoveUp, allowedTypes: ['number'] },
    { key: 'color', label: 'Цвета', icon: PaintBucket, allowedTypes: ['string', 'number'] },
    { key: 'sort', label: 'Сортировка', icon: ArrowDownWideNarrow, allowedTypes: ['string', 'number', 'date'] },
    { key: 'labels', label: 'Подписи', icon: Type, allowedTypes: ['string'] },
    { key: 'filters', label: 'Фильтры', icon: Filter, allowedTypes: ['string', 'number', 'date', 'boolean'] }
  ],
  bar: [
    { key: 'x', label: 'X', icon: MoveRight, allowedTypes: ['string', 'date'] },
    { key: 'y', label: 'Y', icon: MoveUp, allowedTypes: ['number'] },
    { key: 'color', label: 'Цвета', icon: PaintBucket, allowedTypes: ['string', 'number'] },
    { key: 'sort', label: 'Сортировка', icon: ArrowDownWideNarrow, allowedTypes: ['string', 'number', 'date'] },
    { key: 'labels', label: 'Подписи', icon: Type, allowedTypes: ['string'] },
    { key: 'filters', label: 'Фильтры', icon: Filter, allowedTypes: ['string', 'number', 'date', 'boolean'] }
  ],
  pie: [
    { key: 'category', label: 'Категории', icon: Server, allowedTypes: ['string'] },
    { key: 'color', label: 'Цвета', icon: PaintBucket, allowedTypes: ['string', 'number'] },
    { key: 'indicators', label: 'Показатели', icon: ChartPie, allowedTypes: ['number'] },
    { key: 'sort', label: 'Сортировка', icon: ArrowDownWideNarrow, allowedTypes: ['string', 'number'] },
    { key: 'labels', label: 'Подписи', icon: Type, allowedTypes: ['string'] },
    { key: 'filters', label: 'Фильтры', icon: Filter, allowedTypes: ['string', 'number', 'date', 'boolean'] }
  ],
  donut: [
    { key: 'category', label: 'Категории', icon: Server, allowedTypes: ['string'] },
    { key: 'color', label: 'Цвета', icon: PaintBucket, allowedTypes: ['string', 'number'] },
    { key: 'indicators', label: 'Показатели', icon: ChartPie, allowedTypes: ['number'] },
    { key: 'sort', label: 'Сортировка', icon: ArrowDownWideNarrow, allowedTypes: ['string', 'number'] },
    { key: 'labels', label: 'Подписи', icon: Type, allowedTypes: ['string'] },
    { key: 'filters', label: 'Фильтры', icon: Filter, allowedTypes: ['string', 'number', 'date', 'boolean'] }
  ],
  scatter: [
    { key: 'x', label: 'X', icon: MoveRight, allowedTypes: ['number'] },
    { key: 'y', label: 'Y', icon: MoveUp, allowedTypes: ['number'] },
    { key: 'dots', label: 'Точки', icon: Ellipsis, allowedTypes: ['number'] },
    { key: 'sizeDots', label: 'Размер точек', icon: Maximize, allowedTypes: ['number'] },
    { key: 'color', label: 'Цвета', icon: PaintBucket, allowedTypes: ['string', 'number'] },
    { key: 'sort', label: 'Сортировка', icon: ArrowDownWideNarrow, allowedTypes: ['number'] },
    { key: 'filters', label: 'Фильтры', icon: Filter, allowedTypes: ['string', 'number', 'date', 'boolean'] }
  ],
  radar: [
    { key: 'category', label: 'Категории', icon: Server, allowedTypes: ['string'] },
    { key: 'indicators', label: 'Показатели', icon: ChartPie, allowedTypes: ['number'] },
    { key: 'color', label: 'Цвета', icon: PaintBucket, allowedTypes: ['string', 'number'] },
    { key: 'filters', label: 'Фильтры', icon: Filter, allowedTypes: ['string', 'number', 'date', 'boolean'] }
  ],
  heatmap: [
    { key: 'x', label: 'X', icon: MoveRight, allowedTypes: ['string'] },
    { key: 'y', label: 'Y', icon: MoveUp, allowedTypes: ['string'] },
    { key: 'value', label: 'Значение', icon: ChartPie, allowedTypes: ['number'] },
    { key: 'filters', label: 'Фильтры', icon: Filter, allowedTypes: ['string', 'number', 'date', 'boolean'] }
  ]
}
