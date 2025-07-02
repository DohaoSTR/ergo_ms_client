/**
 * Генерирует локальный SVG аватар на основе инициалов пользователя
 */

// Предустановленные цвета для аватаров
const avatarColors = [
  '#007bff', '#6610f2', '#6f42c1', '#e83e8c', '#dc3545', 
  '#fd7e14', '#ffc107', '#28a745', '#20c997', '#17a2b8',
  '#6c757d', '#343a40', '#495057', '#868e96', '#adb5bd'
]

/**
 * Получает цвет для аватара на основе имени пользователя
 * @param {string} name - имя пользователя
 * @returns {string} цвет в формате hex
 */
function getColorFromName(name) {
  if (!name) return avatarColors[0]
  
  // Генерируем стабильный индекс на основе имени
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const index = Math.abs(hash) % avatarColors.length
  return avatarColors[index]
}

/**
 * Определяет контрастный цвет текста (белый или черный) для фона
 * @param {string} hexColor - цвет фона в формате hex
 * @returns {string} цвет текста ('white' или 'black')
 */
function getContrastTextColor(hexColor) {
  // Убираем # если есть
  const hex = hexColor.replace('#', '')
  
  // Конвертируем в RGB
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Вычисляем яркость
  const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000
  
  return brightness > 155 ? 'black' : 'white'
}

/**
 * Извлекает инициалы из имени пользователя
 * @param {string} name - полное имя пользователя
 * @returns {string} инициалы (максимум 2 символа)
 */
function getInitials(name) {
  if (!name) return '?'
  
  const words = name.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase()
  }
  
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
}

/**
 * Генерирует data URL для SVG аватара
 * @param {object} user - объект пользователя
 * @param {object} options - опции для генерации
 * @param {number} options.size - размер аватара в пикселях (по умолчанию 40)
 * @param {string} options.backgroundColor - цвет фона (по умолчанию автоматический)
 * @param {string} options.textColor - цвет текста (по умолчанию автоматический)
 * @returns {string} data URL для SVG изображения
 */
export function generateLocalAvatar(user, options = {}) {
  if (!user) return ''
  
  // Если у пользователя есть аватар, возвращаем его
  if (user.avatar && user.avatar.trim() !== '') {
    return user.avatar
  }
  
  const {
    size = 40,
    backgroundColor = null,
    textColor = null
  } = options
  
  // Получаем имя пользователя
  const name = user.full_name || user.username || user.name || 'Пользователь'
  
  // Генерируем инициалы
  const initials = getInitials(name)
  
  // Определяем цвета
  const bgColor = backgroundColor || getColorFromName(name)
  const textColorFinal = textColor || getContrastTextColor(bgColor)
  
  // Размер шрифта относительно размера аватара
  const fontSize = Math.round(size * 0.4)
  
  // Создаем SVG
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${bgColor}" rx="${size / 8}"/>
      <text 
        x="50%" 
        y="50%" 
        text-anchor="middle" 
        dominant-baseline="central" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="${fontSize}" 
        font-weight="600" 
        fill="${textColorFinal}"
      >
        ${initials}
      </text>
    </svg>
  `.trim()
  
  // Кодируем SVG в data URL
  const encodedSvg = encodeURIComponent(svg)
  return `data:image/svg+xml,${encodedSvg}`
}

/**
 * Генерирует аватар для использования в Vue компонентах
 * Совместимая функция для замены getAvatarUrl
 * @param {object} user - объект пользователя
 * @param {number} size - размер аватара (по умолчанию 40)
 * @returns {string} data URL или пустая строка
 */
export function getAvatarUrl(user, size = 40) {
  return generateLocalAvatar(user, { size })
}

export default {
  generateLocalAvatar,
  getAvatarUrl,
  getColorFromName,
  getContrastTextColor,
  getInitials
} 