import ExcelJS from 'exceljs'
import { siteFieldLabels } from '@/pages/bio/js/bio-constants'

/**
 * Создает и скачивает шаблон XLSX для импорта данных о видах растений на площадках
 * @param {Object} options - Настройки генерации шаблона
 * @param {boolean} options.withHeaders - Включать ли шапку с полями площадок
 * @param {number} options.siteCount - Количество площадок (по умолчанию 6)
 */
export async function generateTemplate(options = {}) {
  const { withHeaders = false, siteCount = 6 } = options

  try {
    // Создаем новую книгу Excel
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Шаблон для импорта')

    // Создаем заголовок таблицы
    const header = ['Название вида', 'Ярус']

    // Добавляем номера площадок в заголовок
    for (let i = 1; i <= siteCount; i++) {
      header.push(i)
    }

    // Настройки шрифта
    const defaultFont = { name: 'Times New Roman', size: 12 }
    const boldFont = { ...defaultFont, bold: true }

    // Определяем границы для областей (как в экспорте)
    const thickBorder = { style: 'medium' }
    const noBorder = { style: 'none' }
    
    // Добавляем заголовок
    const headerRow = worksheet.addRow(header)
    
    // Применяем стили к заголовку
    headerRow.eachCell((cell, colIndex) => {
      cell.font = boldFont
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      
      // Верхняя и нижняя границы для всего заголовка
      cell.border = {
        top: thickBorder,
        bottom: thickBorder,
        left: noBorder,
        right: noBorder,
      }
      
      // Левая граница для первой ячейки заголовка
      if (colIndex === 1) {
        cell.border.left = thickBorder
      }
      
      // Правая граница для последней ячейки заголовка
      if (colIndex === 2 + siteCount) {
        cell.border.right = thickBorder
      }
      
      // Левая и правая границы для столбца ярусов
      if (colIndex === 2) {
        cell.border.left = thickBorder
        cell.border.right = thickBorder
      }
    })

    // Устанавливаем ширину столбцов
    worksheet.getColumn(1).width = 50 // Название вида
    worksheet.getColumn(2).width = 10 // Ярус
    
    // Устанавливаем ширину для столбцов площадок
    for (let i = 3; i < 3 + siteCount; i++) {
      worksheet.getColumn(i).width = 15
    }

    // Если нужна шапка с информацией о площадках
    if (withHeaders) {
      // Добавляем строки с полями для каждой площадки
      Object.keys(siteFieldLabels).forEach((field, idx) => {
        const rowData = [siteFieldLabels[field], '']
        
        // Добавляем пустые ячейки для каждой площадки
        for (let i = 0; i < siteCount; i++) {
          rowData.push('')
        }
        
        const row = worksheet.addRow(rowData)
        
        // Применяем стили к строкам шапки
        row.eachCell((cell, colIndex) => {
          cell.font = boldFont
          
          // Настраиваем перенос строк только для первого столбца (названия полей)
          if (colIndex === 1) {
            cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true }
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: false }
          }
          
          // Устанавливаем границы для ячеек шапки
          cell.border = {
            top: noBorder,
            bottom: noBorder,
            left: noBorder,
            right: noBorder,
          }
          
          // Левая граница для первой колонки
          if (colIndex === 1) {
            cell.border.left = thickBorder
          }
          
          // Правая граница для последней колонки
          if (colIndex === 2 + siteCount) {
            cell.border.right = thickBorder
          }
          
          // Левая и правая границы для столбца ярусов
          if (colIndex === 2) {
            cell.border.left = thickBorder
            cell.border.right = thickBorder
          }
        })
        
        // Добавляем нижнюю границу для последней строки шапки
        if (idx === Object.keys(siteFieldLabels).length - 1) {
          row.eachCell((cell) => {
            cell.border = {
              ...cell.border,
              bottom: thickBorder,
            }
          })
        }
      })
    }

    // Новый набор данных с таксонами и видами
    const exampleData = [
      // Первый таксон
      { 
        name: 'Д. в. асс. Rhodobryo rosei–Piceetum abietis', 
        isTaxon: true 
      },
      {
        name: 'Picea abies (L.) H. Karst.',
        tier: 'A',
        abundances: ['4', '5', '5', '5', '4', '4']
      },
      {
        name: 'Carex digitata L.',
        tier: 'C',
        abundances: ['+', '+', '1', '+', 'r', '+']
      },
      {
        name: 'Luzula pilosa (L.) Willd.',
        tier: 'C',
        abundances: ['+', 'r', 'r', '+', '+', 'r']
      },
      {
        name: 'Gymnocarpium dryopteris (L.) Newman',
        tier: 'C',
        abundances: ['.', '+', '+', '1', '.', '.']
      },
      {
        name: 'Rhodobryum roseum (Hedw.) Limpr.',
        tier: 'D',
        abundances: ['r', '.', '.', '.', '+', '+']
      },
      {
        name: 'Plagiomnium affine (Blandow ex Funck) T.J.Kop.',
        tier: 'D',
        abundances: ['+', '.', '.', '.', '1', '.']
      },
      // Второй таксон
      { 
        name: 'Д. в. субасс. Rh. r.–P. a. caricetosum pilosae', 
        isTaxon: true 
      },
      {
        name: 'Quercus robur L.',
        tier: 'A',
        abundances: ['.', '+', '+', '1', '.', '.']
      },
      {
        name: 'Corylus avellana L.',
        tier: 'B',
        abundances: ['2', '.', '+', '3', '+', '+']
      }
    ];
    
    // Смещение для строки данных
    const dataStartRow = withHeaders ? Object.keys(siteFieldLabels).length + 1 : 1
    
    let previousWasTaxon = false;
    
    // Добавляем примеры видов и таксонов в таблицу
    exampleData.forEach((item, idx) => {
      let row;
      
      if (item.isTaxon) {
        // Добавляем таксон
        const rowData = [item.name, ''];
        
        // Добавляем пустые ячейки для площадок
        for (let i = 0; i < siteCount; i++) {
          rowData.push('');
        }
        
        row = worksheet.addRow(rowData);
        
        // Объединяем ячейки для таксона на всю ширину
        worksheet.mergeCells(row.number, 1, row.number, 2 + siteCount);
        
        // Применяем стиль для таксона
        const taxonCell = row.getCell(1);
        taxonCell.font = { ...defaultFont, bold: true };
        taxonCell.alignment = { horizontal: 'center', vertical: 'middle' };
        taxonCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }, // Светло-серый фон
        };
        
        // Устанавливаем границы вокруг таксона
        taxonCell.border = {
          top: thickBorder,
          bottom: thickBorder,
          left: thickBorder,
          right: thickBorder,
        };
        
        previousWasTaxon = true;
      } else {
        // Добавляем вид
        const rowData = [
          item.name,
          item.tier
        ];
        
        // Добавляем значения обилия для площадок
        for (let i = 0; i < siteCount; i++) {
          rowData.push(i < item.abundances.length ? item.abundances[i] : '.');
        }
        
        row = worksheet.addRow(rowData);
        
        // Применяем стили к строкам данных
        row.eachCell((cell, colIndex) => {
          cell.font = { ...defaultFont };
          
          // По умолчанию убираем все границы
          cell.border = {
            top: noBorder,
            bottom: noBorder,
            left: noBorder,
            right: noBorder,
          };
          
          // Левая граница для первой колонки
          if (colIndex === 1) {
            cell.border.left = thickBorder;
          }
          
          // Правая граница для последней колонки
          if (colIndex === 2 + siteCount) {
            cell.border.right = thickBorder;
          }
          
          // Левая и правая границы для столбца ярусов
          if (colIndex === 2) {
            cell.border.left = thickBorder;
            cell.border.right = thickBorder;
          }
          
          // Выравнивание для ячеек
          if (colIndex === 1) {
            // Левое выравнивание для названия вида
            cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
          } else {
            // Центрирование для яруса и обилия
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
        });
        
        // Если предыдущая строка была таксоном, добавляем верхнюю границу
        if (previousWasTaxon) {
          row.eachCell((cell) => {
            cell.border.top = thickBorder;
          });
          previousWasTaxon = false;
        }
      }
      
      // Если это последняя строка данных, добавляем нижнюю границу
      if (idx === exampleData.length - 1) {
        row.eachCell((cell) => {
          cell.border.bottom = thickBorder;
        });
      }
    });

    // Добавляем примечания и инструкции после основной таблицы
    worksheet.addRow([]) // Пустая строка перед примечаниями
    
    const notesRow = worksheet.addRow(['Примечания:', ''])
    notesRow.font = boldFont
    
    const notes = [
      ['1. Название вида укажите в формате: "Название вида Автор" (например, Abelia coreana Nakai)', ''],
      ['2. Ярус должен быть одним из: A, B, C, D, E (может быть пустым)', ''],
      ['3. Баллы обилия: r, +, 1, 2, 3, 4, 5', ''],
      ['4. Пустые ячейки (либо точки) означают отсутствие вида на площадке', ''],
      ['5. Не меняйте структуру шаблона и порядок столбцов', ''],
      ['6. Можно добавлять столбцы для новых площадок и строки для новых видов', ''],
      ['7. Проверьте правильность названий видов перед импортом', ''],
      ['8. Для выделения таксонов объедините ячейки как минимум на 2 столбца', ''],
      ['9. В таблице не должно быть пустых строк', ''],
      ['10. Поддерживаемые типы площадок (при использовании шапки): "Лес" по умолчанию, "Луг"'],
    ]
    
    // Добавляем примечания с переносом строк
    notes.forEach(note => {
      const row = worksheet.addRow(note)
      row.getCell(1).alignment = { horizontal: 'left', vertical: 'top', wrapText: true }
      row.getCell(1).font = { ...defaultFont }
    })

    // Генерируем имя файла с датой и временем
    const date = new Date()
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    const timeStr = `${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}`
    const fileName = `Шаблон_импорта_${withHeaders ? 'с_шапкой' : 'без_шапки'}_${dateStr}_${timeStr}.xlsx`

    // Создаем buffer для скачивания
    const buffer = await workbook.xlsx.writeBuffer()

    // Создаем blob и скачиваем файл
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    return true
  } catch (err) {
    console.error('Ошибка при генерации шаблона XLSX:', err)
    return false
  }
} 