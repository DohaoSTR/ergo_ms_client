<template>
  <div class="source-settings-help d-flex flex-column h-100 p-3" style="width: 100%;">
    <div class="settings-body d-flex flex-grow-1 overflow-hidden">
      <div class="func-sidebar d-flex flex-column">
        <input v-model="funcSearch" type="text" class="form-control form-control-sm bg-dark text-white mb-2" placeholder="Поиск функции…"/>
        <ul class="list-group list-group-flush flex-grow-1 overflow-auto">
          <li v-for="cat in filteredCats" :key="cat" class="list-group-item bg-transparent text-white list-item-hover" :class="{ active: selectedCat === cat }" @click="selectedCat = cat">
            {{ cat }}
          </li>
        </ul>
      </div>
      <div class="func-detail flex-grow-1 ms-3 bg-dark text-white p-3 rounded overflow-auto">
        <h6 class="mb-2">{{ selectedCat }}</h6>
        <pre class="mb-0">{{ syntax[selectedCat] }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
    expression: { type: String, default: '' }
})
const emit = defineEmits(['update:expression'])

const localExpr = ref(props.expression)
watch(localExpr, val => emit('update:expression', val))

const funcSearch = ref('')
const categories = [
    'Агрегатные функции',
    'Логические функции',
    'Математические функции',
    'Оконные функции',
    'Операторы',
    'Строковые функции',
    'Функции даты и времени',
    'Функции работы с массивами',
    'Функции преобразования типов',
    'Функции разметки'
]
const filteredCats = computed(() =>
    categories.filter(c =>
        c.toLowerCase().includes(funcSearch.value.toLowerCase())
    )
)
const selectedCat = ref(filteredCats.value[0] || categories[0])

const syntax = {
    'Агрегатные функции': `SUM(column)\nCOUNT(column)\nAVG(column)`,
    'Логические функции': `CASE WHEN condition THEN result ELSE default END`,
    'Математические функции': `ROUND(x, 2)\nCEIL(x)\nFLOOR(x)`,
    'Оконные функции': `ROW_NUMBER() OVER (PARTITION BY …)\nRANK() OVER (…)`,
    'Операторы': `+  -  *  /  %  =  <>  >  <  >=  <=`,
    'Строковые функции': `CONCAT(a,b)\nSUBSTR(str, start, len)`,
    'Функции даты и времени': `DATE_TRUNC('month', date)\nNOW()`,
    'Функции работы с массивами': `ARRAY_LENGTH(arr)\nUNNEST(arr)`,
    'Функции преобразования типов': `CAST(x AS INTEGER)\nTO_CHAR(date, format)`,
    'Функции разметки': `COALESCE(a, b)\nNVL(a, b)`
}
</script>

<style scoped>
.settings-body {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.func-sidebar {
  flex: 0 0 200px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.func-sidebar ul {
  flex: 1 1 auto;
  min-height: 0;
}

.func-detail {
  flex: 1 1 auto;
  min-height: 0;
}

.list-item-hover:hover,
.list-item-hover.active {
  background-color: var(--color-hover-background);
}
</style>