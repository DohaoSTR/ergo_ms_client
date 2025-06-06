# Инструкция по установке и запуску

## Установка
```bash
# Установка зависимостей
npm install
```

## Основные команды

### Разработка
```bash
# Запуск проекта в режиме разработки
npm run dev
```

### Сборка
```bash
# Сборка проекта
npm run build

# Предварительный просмотр сборки
npm run preview
```

### Линтинг и форматирование
```bash
# Проверка кода линтером
npm run lint

# Форматирование кода
npm run format
```

### Очистка
```bash
# Очистка кэша npm
npm cache clean --force
```

## Дополнительно

При возникновении проблем с зависимостями:
1. Удалите папку node_modules
2. Удалите файл package-lock.json
3. Очистите кэш npm: `npm cache clean --force`
4. Переустановите зависимости: `npm install`
```