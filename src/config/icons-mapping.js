/**
 * МАППИНГ ИКОНОК ДЛЯ КОНФИГУРАЦИОННОГО МЕНЮ
 * 
 * Данный файл содержит маппинг строковых имен иконок на компоненты
 * из библиотеки lucide-vue-next. Используется для преобразования
 * JSON конфигурации меню в реальные Vue компоненты иконок.
 * 
 * Позволяет использовать строковые имена в menu-config.json
 * вместо прямого импорта компонентов, что делает конфигурацию
 * более простой и доступной для редактирования.
 */

import {
  AtSign,
  Braces,
  Calendar,
  ChartBarStacked,
  ChartSpline,
  ChartCandlestick,
  CircleUserRound,
  Component,
  Code2,
  Grid2x2,
  Map,
  MessagesSquare,
  PictureInPicture2,
  Table2,
  TextCursorInput,
  UserCog,
  Wallet,
  KeySquare,
  BookOpen,
  NotepadTextDashed,
  Video,
  Files,
  Layers,
  GraduationCap,
  Brain,
  Users,
  BarChart3,
  Table,
  FileText,
  Square,
  Puzzle,
  CreditCard,
  Landmark,
} from 'lucide-vue-next'

/**
 * Объект маппинга строковых имен иконок на Vue компоненты
 * Ключ - строковое имя иконки (используется в JSON конфигурации)
 * Значение - импортированный компонент иконки
 */
export const iconMapping = {
  AtSign,
  Braces,
  Calendar,
  ChartBarStacked,
  ChartSpline,
  ChartCandlestick,
  CircleUserRound,
  Component,
  Code2,
  Grid2x2,
  Map,
  MessagesSquare,
  PictureInPicture2,
  Table2,
  TextCursorInput,
  UserCog,
  Wallet,
  KeySquare,
  BookOpen,
  NotepadTextDashed,
  Video,
  Files,
  Layers,
  GraduationCap,
  Brain,
  Users,
  BarChart3,
  Table,
  FileText,
  Square,
  Puzzle,
  CreditCard,
  Landmark,
}

/**
 * Функция получения компонента иконки по строковому имени
 * @param {string} iconName - имя иконки из JSON конфигурации
 * @returns {Object|null} - Vue компонент иконки или null если не найден
 */
export function getIcon(iconName) {
  return iconMapping[iconName] || null
} 