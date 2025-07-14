export const typeOptions = [
    { value: 'geopolygon', label: 'Геополигон' },
    { value: 'geopoint',   label: 'Геоточка'   },
    { value: 'date',       label: 'Дата'       },
    { value: 'date&time',  label: 'Дата и время'},
    { value: 'float',      label: 'Дробное число' },
    { value: 'bool',       label: 'Логический' },
    { value: 'string',     label: 'Строка'     },
    { value: 'integer',    label: 'Целое число'},
  ];
  
  export const aggregationOptionsMap = {
    integer: [
      { value: 'count',  label: 'Количество' },
      { value: 'ucount', label: 'Уникальных' },
      { value: 'max',    label: 'Максимум'   },
      { value: 'min',    label: 'Минимум'    },
      { value: 'avg',    label: 'Среднее'    },
      { value: 'sum',    label: 'Сумма'      },
      { value: 'none',   label: 'Нет'        },
    ],
    float: [
      { value: 'count',  label: 'Количество' },
      { value: 'ucount', label: 'Уникальных' },
      { value: 'max',    label: 'Максимум'   },
      { value: 'min',    label: 'Минимум'    },
      { value: 'avg',    label: 'Среднее'    },
      { value: 'sum',    label: 'Сумма'      },
      { value: 'none',   label: 'Нет'        },
    ],
    date: [
      { value: 'min',    label: 'Ранняя дата'  },
      { value: 'max',    label: 'Поздняя дата' },
      { value: 'none',   label: 'Нет'          },
    ],
    'date&time': [
      { value: 'min',    label: 'Ранняя дата'  },
      { value: 'max',    label: 'Поздняя дата' },
      { value: 'none',   label: 'Нет'          },
    ],
    string: [
      { value: 'ucount', label: 'Уникальных' },
      { value: 'count',  label: 'Количество' },
      { value: 'none',   label: 'Нет'        },
    ],
    bool: [
      { value: 'count',  label: 'Количество' },
      { value: 'none',   label: 'Нет'        },
    ],
    geopoint: [
      { value: 'count',  label: 'Количество' },
      { value: 'none',   label: 'Нет'        },
    ],
    geopolygon: [
      { value: 'count',  label: 'Количество' },
      { value: 'none',   label: 'Нет'        },
    ],
  };
  
  /**
   * Возвращает массив опций агрегации для данного типа.
   * Если нет записи в map — возвращает [{value:'none',label:'Нет'}].
   */
  export function getAggregationOptions(type) {
    return aggregationOptionsMap[type] || [{ value: 'none', label: 'Нет' }];
  }

export function getTypeOptionsForField(field) {
  const values = field.values || []

  if (!values.length) return typeOptions

  // Только целые
  if (values.every(v => /^-?\d+$/.test(String(v).trim()))) {
    return typeOptions.filter(t => ['integer', 'string'].includes(t.value))
  }

  // Числа с точкой (и целые тоже подойдут)
  if (values.every(v => !isNaN(Number(v)))) {
    return typeOptions.filter(t => ['float', 'integer', 'string'].includes(t.value))
  }

  // Boolean
  if (values.every(v => ['true','false',true,false,1,0].includes(v))) {
    return typeOptions.filter(t => ['bool', 'integer', 'string'].includes(t.value))
  }

  // Только даты (yyyy-mm-dd, без времени)
  if (values.every(v => /^\d{4}-\d{2}-\d{2}$/.test(String(v).trim()))) {
    return typeOptions.filter(t => ['date', 'string'].includes(t.value))
  }

  // Дата и время ("date&time"), всё что распарсилось, но не попало под yyyy-mm-dd
  if (values.every(v => !isNaN(Date.parse(v)))) {
    return typeOptions.filter(t => ['date&time', 'date', 'string'].includes(t.value))
  }

  // По умолчанию только строка (и bool)
  return typeOptions.filter(t => ['string', 'bool'].includes(t.value))
}

export const aggregationColorMap = {
  count:    'agg-select agg-primary',
  ucount:   'agg-select agg-info',
  max:      'agg-select agg-success',
  min:      'agg-select agg-warning',
  avg:      'agg-select agg-secondary',
  sum:      'agg-select agg-danger',
  none:     'agg-select agg-dark',
};