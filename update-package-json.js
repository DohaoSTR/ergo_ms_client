// Скрипт для обновления данных из env файла в package.json файле
import fs from 'fs';
import path from 'path';

// Путь к файлу vite.config.js
const viteConfigPath = path.resolve(process.cwd(), 'vite.config.js');
const viteConfigUrl = new URL(`file://${viteConfigPath}`);

// Чтение конфигурации Vite
const viteConfig = await import(viteConfigUrl);

// Получение порта из конфигурации Vite
const port = viteConfig.default.server.port;

// Путь к файлу package.json
const packageJsonPath = path.resolve(process.cwd(), 'package.json');

// Чтение package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

// Обновление скрипта stop в package.json
packageJson.scripts.stop = `kill-port ${port}`;

// Запись обновленного package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
