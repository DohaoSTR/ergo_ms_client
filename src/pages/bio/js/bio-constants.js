/**
 * Константы для биомодуля
 */

// Типы шкал
export const SCALES_TYPES = [
  { value: 'ellenberg', label: 'Элленберг' },
  { value: 'landolt', label: 'Ландольт' },
  { value: 'tsyganov', label: 'Цыганов' },
]

// Типы спектров
export const SPECTRUM_TYPES = [
  { value: 'raunkiaer', label: 'Жизненные формы по Раункиеру' },
  { value: 'serebryakov', label: 'Жизненные формы по Серебрякову' },
  { value: 'ecobiomorphs', label: 'Экобиоморфы' },
  { value: 'geoelements', label: 'Геоэлементы и полизональные группы' },
  { value: 'ta', label: 'Типы ареалов' },
]

// Типы спектров с сокращенными названиями
export const SPECTRUM_TYPES_SHORT = [
  { value: 'raunkiaer', label: 'Раункиер' },
  { value: 'serebryakov', label: 'Серебряков' },
  { value: 'ecobiomorphs', label: 'Экобиоморфы' },
  { value: 'geoelements', label: 'Геоэлементы' },
  { value: 'ta', label: 'Типы ареалов' },
]

// Типы местности площадок
export const zoneTypeOptions = [
  { value: 'forest', label: 'Лес' },
  { value: 'meadow', label: 'Луг' },
]

// Варианты яруса для растений
export const tierOptions = [
  { value: '', label: 'Не выбран' },
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: 'E', label: 'E' },
]

// Варианты балла обилия для растений
export const abundanceOptions = [
  { value: 'r', label: 'r - единично' },
  { value: '+', label: '+ - до 1%' },
  { value: '1', label: '1 - до 5%' },
  { value: '2', label: '2 - 5-25%' },
  { value: '3', label: '3 - 25-50%' },
  { value: '4', label: '4 - 50-75%' },
  { value: '5', label: '5 - 75-100%' },
]

// Поля для экспорта площадок
export const siteFieldLabels = {
  zone_type: 'Тип местности',
  size: 'Размер площадки',
  date: 'Дата описания',
  latitude: 'Широта',
  longitude: 'Долгота',
  district: 'Административная принадлежность (область, район)',
  mapped_point: 'Ближайший населенный пункт',
  mapped_point_distance: 'Расстояние до площадки',
  mapped_point_azimuth: 'Азимут до площадки',
  forestry_name: 'Название лесничества',
  center_distance: 'Расстояние относительно "центра" сегмента',
  center_azimuth: 'Азимут относительно "центра" сегмента',
  mesorelief_shape: 'Форма мезорельефа',
  exposition: 'Экспозиция',
  steepness: 'Крутизна',
  position_relief: 'Положение площадки в рельефе',
  microrelief_shape: 'Характер микрорельефа',
  humidification_type: 'Тип увлажнения',
  groundwater_level: 'Уровень грунтовых вод',
  brushwood_compos: 'Породный состав',
  brushwood_diameter: 'Максимальный диаметр валежин',
  brushwood_quantity: 'Количество валежин',
  decomposition_degree: 'Степерь разложения',
}
