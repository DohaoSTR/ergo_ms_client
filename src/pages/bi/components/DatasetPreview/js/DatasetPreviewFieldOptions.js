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

export const aggregationColorMap = {
  count:    'agg-select agg-primary',
  ucount:   'agg-select agg-info',
  max:      'agg-select agg-success',
  min:      'agg-select agg-warning',
  avg:      'agg-select agg-secondary',
  sum:      'agg-select agg-danger',
  none:     'agg-select agg-dark',
};
