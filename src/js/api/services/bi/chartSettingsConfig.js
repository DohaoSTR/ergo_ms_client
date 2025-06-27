import { MoveRight, MoveUp, PaintBucket, ArrowDownWideNarrow, Type, Filter, Server, ChartPie, Ellipsis, Maximize } from 'lucide-vue-next'

export const chartSettingsConfig = {
  line: [
    { key: 'x', label: 'X', icon: MoveRight, allowedTypes: ['string', 'date', 'date&time'] },
    { key: 'y', label: 'Y', icon: MoveUp, allowedTypes: ['integer', 'float'] },
    { key: 'y2', label: 'Y2', icon: MoveUp, allowedTypes: ['integer', 'float'] },
    { key: 'color', label: 'Цвета', icon: PaintBucket, allowedTypes: ['string', 'integer', 'float', 'date', 'date&time', 'bool', 'geopoint', 'geopolygon'] },
    { key: 'sort', label: 'Сортировка', icon: ArrowDownWideNarrow, allowedTypes: ['string', 'integer', 'float', 'date', 'date&time', 'bool'] },
    { key: 'labels', label: 'Подписи', icon: Type, allowedTypes: ['string'] },
    { key: 'filters', label: 'Фильтры', icon: Filter, allowedTypes: ['string', 'integer', 'float', 'date', 'date&time', 'bool', 'geopoint', 'geopolygon'] }
  ],
  bar: [
    { key: 'x', label: 'X', icon: MoveRight, allowedTypes: ['string', 'date', 'date&time', 'integer', 'float'] },
    { key: 'y', label: 'Y', icon: MoveUp, allowedTypes: ['string', 'date', 'date&time', 'integer', 'float'] },
    { key: 'color', label: 'Цвета', icon: PaintBucket, allowedTypes: ['string', 'integer', 'float', 'date', 'date&time', 'bool', 'geopoint', 'geopolygon'] },
    { key: 'sort', label: 'Сортировка', icon: ArrowDownWideNarrow, allowedTypes: ['string', 'integer', 'float', 'date', 'date&time', 'bool'] },
    { key: 'labels', label: 'Подписи', icon: Type, allowedTypes: ['string'] },
    { key: 'filters', label: 'Фильтры', icon: Filter, allowedTypes: ['string', 'integer', 'float', 'date', 'date&time', 'bool', 'geopoint', 'geopolygon'] }
  ],
  pie: [
    { key: 'category', label: 'Категории', icon: Server, allowedTypes: ['string'] },
    { key: 'color', label: 'Цвета', icon: PaintBucket, allowedTypes: ['string', 'integer', 'float', 'bool'] },
    { key: 'indicators', label: 'Показатели', icon: ChartPie, allowedTypes: ['integer', 'float'] },
    { key: 'sort', label: 'Сортировка', icon: ArrowDownWideNarrow, allowedTypes: ['string', 'integer', 'float'] },
    { key: 'labels', label: 'Подписи', icon: Type, allowedTypes: ['string'] },
    { key: 'filters', label: 'Фильтры', icon: Filter, allowedTypes: ['string', 'integer', 'float', 'bool'] }
  ],
  doughnut: [
    { key: 'category', label: 'Категории', icon: Server, allowedTypes: ['string'] },
    { key: 'color', label: 'Цвета', icon: PaintBucket, allowedTypes: ['string', 'integer', 'float', 'bool'] },
    { key: 'indicators', label: 'Показатели', icon: ChartPie, allowedTypes: ['integer', 'float'] },
    { key: 'sort', label: 'Сортировка', icon: ArrowDownWideNarrow, allowedTypes: ['string', 'integer', 'float'] },
    { key: 'labels', label: 'Подписи', icon: Type, allowedTypes: ['string'] },
    { key: 'filters', label: 'Фильтры', icon: Filter, allowedTypes: ['string', 'integer', 'float', 'bool'] }
  ],
  scatter: [
    { key: 'x', label: 'X', icon: MoveRight, allowedTypes: ['string', 'date&time', 'integer', 'float'] },
    { key: 'y', label: 'Y', icon: MoveUp, allowedTypes: ['string', 'date&time', 'integer', 'float'] },
    { key: 'dots', label: 'Точки', icon: Ellipsis, allowedTypes: ['integer', 'float'] },
    { key: 'sizeDots', label: 'Размер точек', icon: Maximize, allowedTypes: ['integer', 'float'] },
    { key: 'color', label: 'Цвета', icon: PaintBucket, allowedTypes: ['string', 'integer', 'float', 'bool'] },
    { key: 'sort', label: 'Сортировка', icon: ArrowDownWideNarrow, allowedTypes: ['integer', 'float'] },
    { key: 'filters', label: 'Фильтры', icon: Filter, allowedTypes: ['string', 'integer', 'float', 'bool'] }
  ],
  radar: [
    { key: 'category', label: 'Категории', icon: Server, allowedTypes: ['string'] },
    { key: 'indicators', label: 'Показатели', icon: ChartPie, allowedTypes: ['integer', 'float'] },
    { key: 'color', label: 'Цвета', icon: PaintBucket, allowedTypes: ['string', 'integer', 'float', 'bool'] },
    { key: 'filters', label: 'Фильтры', icon: Filter, allowedTypes: ['string', 'integer', 'float', 'bool'] }
  ],
  heatmap: [
    { key: 'x', label: 'X', icon: MoveRight, allowedTypes: ['string'] },
    { key: 'y', label: 'Y', icon: MoveUp, allowedTypes: ['string'] },
    { key: 'value', label: 'Значение', icon: ChartPie, allowedTypes: ['integer', 'float'] },
    { key: 'filters', label: 'Фильтры', icon: Filter, allowedTypes: ['string', 'integer', 'float', 'bool'] }
  ]
}
