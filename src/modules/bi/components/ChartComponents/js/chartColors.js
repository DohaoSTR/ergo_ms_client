export const PALETTE = [
  '#41B883', '#00D8FF', '#DD1B16', '#f4b942', '#e35bcb',
  '#9288f8', '#f88d51', '#34a853', '#ea4335', '#7a7d85', '#ff7f0e', '#1f77b4'
];

/**
 * Возвращает map: уникальное значение поля → цвет
 */
export function getColorMap(dataset, colorFieldName, palette = PALETTE) {
  if (!dataset?.length || !colorFieldName) return {};
  const uniqVals = Array.from(new Set(dataset.map(row => row?.[colorFieldName])));
  return Object.fromEntries(
    uniqVals.map((val, idx) => [val, palette[idx % palette.length]])
  );
}

/**
 * Массив цветов для каждой строки/группы (по выбранному полю)
 */
export function getRowColors(dataset, colorFieldName, palette = PALETTE) {
  const colorMap = getColorMap(dataset, colorFieldName, palette);
  return dataset.map(row => colorMap[row?.[colorFieldName]] || palette[0]);
}