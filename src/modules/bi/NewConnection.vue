<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import ConnectorCard from '@/modules/bi/components/ConnectorCard.vue'

const searchQuery = ref('')
const router = useRouter()

// Список всех карточек
const allConnectors = [
  { name: 'ClickHouse', icon: '/src/assets/bi/icons/clickhouse.svg', category: 'db', route: 'clickhouse' },
  { name: 'Microsoft SQL Server', icon: '/src/assets/bi/icons/mssql.svg', category: 'db', route: 'mssql' },
  { name: 'PostgreSQL', icon: '/src/assets/bi/icons/postgres.svg', category: 'db', route: 'postgresql' },
  { name: 'Файлы', icon: '/src/assets/bi/icons/folder_windows_style.svg', category: 'file', route: 'file' }
]

// Отфильтрованные по поиску
const filteredConnectors = computed(() =>
  allConnectors.filter(c =>
    c.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
)

// Группировка по категориям
const dbConnectors = computed(() =>
  filteredConnectors.value.filter(c => c.category === 'db')
)

const fileConnectors = computed(() =>
  filteredConnectors.value.filter(c => c.category === 'file')
)

function handleClick(route) {
  router.push(`/bi/connections/new/${route}`)
}
</script>

<template>
  <div class="page" style="margin-left: 5rem; margin-right: 5rem;">
    <div class="mb-2" style="width: 15rem; margin-bottom: 30px;">
      <input class="form-control form-control-sm" type="text" id="smallInput" placeholder="Имя коннектора" v-model="searchQuery" aria-label="Имя коннектора"/>
    </div>
    <div class="category" v-if="dbConnectors.length">
      <h2>Базы данных</h2>
      <div class="cards">
        <ConnectorCard v-for="conn in dbConnectors" :key="conn.name" :name="conn.name" :icon="conn.icon" @click="handleClick(conn.route)"/>
      </div>
    </div>
    <div class="category" v-if="fileConnectors.length">
      <h2>Файлы и сервисы</h2>
      <div class="cards">
        <ConnectorCard v-for="conn in fileConnectors" :key="conn.name" :name="conn.name" :icon="conn.icon" @click="handleClick(conn.route)"/>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.category {
  margin-bottom: 40px;
}
.cards {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
