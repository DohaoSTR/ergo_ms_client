/**
 * Утилиты для работы с номерами телефонов
 */

/**
 * Форматирует номер телефона с маской
 * @param {string} phone - номер телефона
 * @returns {string} отформатированный номер или пустая строка
 */
export function formatPhoneWithMask(phone) {
  // Если номер не заполнен или пустой, возвращаем пустую строку
  if (!phone || phone.trim() === '' || phone === 'Не указан') {
    return ''
  }
  
  // Убираем все нечисловые символы
  const cleaned = phone.replace(/\D/g, '')
  
  // Если номер слишком короткий, возвращаем как есть
  if (cleaned.length < 4) {
    return phone
  }
  
  // Форматируем в зависимости от длины
  if (cleaned.length === 11 && cleaned.startsWith('7')) {
    // Российский номер: +7 (XXX) XXX-XX-XX
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`
  } else if (cleaned.length === 11 && cleaned.startsWith('8')) {
    // Российский номер с 8: 8 (XXX) XXX-XX-XX
    return `8 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`
  } else if (cleaned.length === 10) {
    // Номер без кода страны: (XXX) XXX-XX-XX
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8, 10)}`
  }
  
  // Если номер не подходит под стандартные форматы, возвращаем как есть
  return phone
}

/**
 * Проверяет, является ли номер телефона пустым
 * @param {string} phone - номер телефона
 * @returns {boolean} true если номер пустой
 */
export function isPhoneEmpty(phone) {
  return !phone || phone.trim() === '' || phone === 'Не указан' || phone === 'Не указано'
}

/**
 * Возвращает отформатированный номер телефона или пустую строку
 * @param {string} phone - номер телефона
 * @returns {string} отформатированный номер или пустая строка
 */
export function displayPhone(phone) {
  if (isPhoneEmpty(phone)) {
    return ''
  }
  return formatPhoneWithMask(phone)
} 