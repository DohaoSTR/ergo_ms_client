<script setup>
import { computed } from 'vue'
import BaseApexChart from '@/pages/bio/components/charts/BaseApexChart.vue'
import { getShortElementTitle } from '@/pages/bio/js/bio-helpers'

const props = defineProps({
  data: { 
    type: Object,
    required: true 
  },
  title: { type: String, default: '' },
  height: { type: [String, Number], default: 350 },
  showPercentage: { type: Boolean, default: true },
  // Можно указать конкретные шкалы для анализа (по умолчанию - ellenberg)
  scaleTypes: { type: Array, default: () => ['ellenberg'] },
  // Показывать ли легенду
  showLegend: { type: Boolean, default: false },
  // Текущая тема оформления (light/dark)
  theme: { type: String, default: 'light' },
})

// Функция для получения эмодзи или иконки для типа зоны
const getZoneTypeIcon = (zoneType) => {
  switch (zoneType) {
    case 'forest': 
      return '🌳'; // лес
    case 'meadow': 
      return '🌿'; // луг
    default: 
      return '🏞️'; // другое
  }
};

// Формирование названия площадки
const getSiteName = (siteInfo) => {
  return `Площадка ${siteInfo.site_number} ${getZoneTypeIcon(siteInfo.zone_type)}`;
};

// Преобразование данных API в структуру данных для графика
const processedData = computed(() => {
  if (!props.data || !props.data.data) {
    return [];
  }
  
  const result = [];
  
  // Перебираем все площадки
  Object.keys(props.data.data).forEach(siteKey => {
    const siteData = props.data.data[siteKey];
    
    // Проверка наличия необходимых полей
    if (!siteData.info || !siteData.data) {
      return;
    }
    
    const siteName = getSiteName(siteData.info);
    const siteScales = [];
    
    // Перебираем запрошенные шкалы для этой площадки
    props.scaleTypes.forEach(scaleType => {
      if (siteData.data[scaleType] && Array.isArray(siteData.data[scaleType])) {
        const elements = siteData.data[scaleType].map(item => ({
          name: item.scale,
          value: item.value
        }));
        
        siteScales.push({
          name: scaleType.charAt(0).toUpperCase() + scaleType.slice(1), // Первая буква заглавная
          translatedName: getShortElementTitle(scaleType) || scaleType.charAt(0).toUpperCase() + scaleType.slice(1),
          elements
        });
      }
    });
    
    result.push({
      name: siteName,
      zoneType: siteData.info.zone_type,
      siteNumber: siteData.info.site_number,
      scales: siteScales
    });
  });
  
  return result;
});

// Формирование серий данных для ApexCharts
const series = computed(() => {
  const data = processedData.value;
  
  if (!data || data.length === 0) {
    return [];
  }
  
  // Собираем уникальные элементы шкал из всех площадок
  const elements = new Set();
  data.forEach(site => {
    site.scales.forEach(scale => {
      scale.elements.forEach(element => elements.add(element.name));
    });
  });
  
  // Создаем серию данных для каждого элемента шкалы
  return Array.from(elements).map(elementName => {
    const seriesData = [];

    // Для каждой площадки и шкалы добавляем данные
    data.forEach(site => {
      site.scales.forEach(scale => {
        // Находим элемент с таким именем
        const element = scale.elements.find(el => el.name === elementName);
        
        // Формируем точку данных с переведенными названиями
        seriesData.push({
          // Используем переведенные названия шкал
          x: `${scale.translatedName} (${site.name})`,
          y: element ? element.value : 0,
          siteInfo: {
            name: site.name,
            zoneType: site.zoneType,
            siteNumber: site.siteNumber
          }
        });
      });
    });

    return {
      name: elementName, // Используем переведенное имя элемента
      data: seriesData
    };
  });
});

// Определение максимального количества элементов в одном столбце
const maxElementsInColumn = computed(() => {
  const data = processedData.value;
  
  if (!data || data.length === 0) {
    return 0;
  }
  
  // Находим максимальное количество элементов в одной шкале
  let maxElements = 0;
  data.forEach(site => {
    site.scales.forEach(scale => {
      const elementsCount = scale.elements.length;
      if (elementsCount > maxElements) {
        maxElements = elementsCount;
      }
    });
  });

  return maxElements;
});

// Генерация цветов для графика с максимальной различимостью
const generateColors = (count) => {
  // Использование золотого угла (около 137.5°) для максимального распределения цветов
  const colors = [];
  const saturation = 75; // %
  const lightness = 60; // %
  const goldenAngle = 0.381966 * 360; // ~137.5 градусов (золотое сечение)

  // Начальный оттенок (немного сдвигаем для лучших результатов)
  let hue = 47;

  for (let i = 0; i < count; i++) {
    // Добавляем золотой угол к текущему оттенку для максимального контраста
    hue = (hue + goldenAngle) % 360;

    // Небольшая вариация насыщенности и яркости для большей различимости
    // Используем детерминированную последовательность
    const adjustedSaturation = saturation - (i % 3) * 5;
    const adjustedLightness = lightness + (i % 3) * 10;

    colors.push(`hsl(${hue}, ${adjustedSaturation}%, ${adjustedLightness}%)`);
  }

  return colors;
};

// Формируем группы для оси X
const xAxisGroups = computed(() => {
  const data = processedData.value;
  
  if (!data || data.length === 0) {
    return [];
  }
  
  const groups = [];
  data.forEach(site => {
    groups.push({
      title: site.name,
      cols: site.scales.length
    });
  });

  return groups;
});

// Цветовая схема для разных типов зон
const zoneTypeColors = {
  forest: '#1B5E20', // Тёмно-зелёный для леса
  meadow: '#9CCC65', // Светло-зелёный для луга
  default: '#795548'  // Коричневый по умолчанию
};

// Настраиваем опции графика
const chartOptions = computed(() => {
  // Настройки темы
  const themeColors = {
    light: {
      background: '#FFFFFF',
      foreground: '#333333',
    },
    dark: {
      background: '#1E1E1E',
      foreground: '#E0E0E0',
    }
  };

  const currentTheme = props.theme === 'dark' ? 'dark' : 'light';
  const themeColor = themeColors[currentTheme];

  return {
    chart: {
      type: 'bar',
      stacked: true,
      stackType: props.showPercentage ? '100%' : 'normal',
      animations: {
        enabled: false // Отключаем анимации для повышения производительности
      },
      background: 'transparent', // Прозрачный фон для лучшей интеграции в карточку
    },
    theme: {
      mode: currentTheme // Используем текущую тему (light/dark)
    },
    title: {
      text: props.title,
      align: 'center',
      style: {
        color: themeColor.foreground
      }
    },
    colors: generateColors(maxElementsInColumn.value),
    plotOptions: {
      bar: {
        columnWidth: '50%',
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      type: 'category',
      group: {
        style: {
          fontSize: '14px',
          fontWeight: 700,
          colors: processedData.value.map(site => zoneTypeColors[site.zoneType] || zoneTypeColors.default)
        },
        groups: xAxisGroups.value
      },
      labels: {
        style: {
          fontSize: '12px',
          colors: themeColor.foreground // Цвет текста меток оси X
        },
        // Отображаем только название шкалы (переведенное)
        formatter: function(val) {
          // Извлекаем имя шкалы из значения
          const scaleName = val.split(' (')[0];
          return scaleName;
        }
      },
    },
    yaxis: {
      labels: {
        formatter: function(val) {
          return props.showPercentage ? val.toFixed(0) + '%' : val.toFixed(0);
        },
        style: {
          colors: themeColor.foreground // Цвет текста меток оси Y
        }
      },
    },
    legend: {
      show: props.showLegend,
      position: 'bottom',
      horizontalAlign: 'center',
      offsetY: 5,
      labels: {
        colors: themeColor.foreground // Цвет текста легенды
      }
    },
    tooltip: {
      x: {
        formatter: function(val) {
          return val.split(' (')[0] + ' (' + val.split(' (')[1];
        }
      },
      y: {
        formatter: function(val) {
          return props.showPercentage ? val.toFixed(2) + '%' : val.toFixed(2);
        },
      },
      theme: currentTheme // Тема для подсказок
    },
    // Добавляем настройки для улучшения производительности
    responsive: [{
      breakpoint: 9999,
      options: {
        animations: {
          enabled: false
        }
      }
    }],
    states: {
      hover: {
        filter: {
          type: 'none' // Отключаем эффекты при наведении для повышения производительности
        }
      },
      active: {
        filter: {
          type: 'none' // Отключаем эффекты при активации для повышения производительности
        }
      }
    }
  };
});
</script>

<template>
  <div class="stacked-group-chart">
    <div v-if="!processedData || processedData.length === 0" class="alert alert-info">
      Нет данных для отображения графика
    </div>

    <BaseApexChart
      v-else
      type="bar"
      :series="series"
      :options="chartOptions"
      :height="height"
    />
  </div>
</template>

<style scoped>
.stacked-group-chart {
  width: 100%;
}
</style> 