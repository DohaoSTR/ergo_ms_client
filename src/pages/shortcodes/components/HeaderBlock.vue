<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { shortcodesService } from '@/js/api/services/shortcodes'
import * as Icons from 'lucide-vue-next'

const { component } = defineProps({ component: Object })

const router = useRouter()
const go = (l) => router.push(l.to)

const brand = component.extra_data?.brand || 'ERGO MS Сайт'
const bgClass = `bg-${component.extra_data?.bg || 'white'}`
const staticLinks = component.extra_data?.links || []

const pages = ref([])
const categories = ref([])

async function load() {
  const [pgs, cats] = await Promise.all([
    shortcodesService.getPages().then((r) => r.data),
    shortcodesService.getCategories().then((r) => r.data),
  ])
  pages.value = Array.isArray(pgs) ? pgs : pgs.results || []
  categories.value = Array.isArray(cats) ? cats : cats.results || []
}
onMounted(load)

const dynLinks = computed(() => {
  const ids = component.extra_data?.menu_pages || [] // [id]
  return pages.value
    .filter((p) => ids.includes(p.id))
    .map((p) => ({ title: p.name, to: p.full_url }))
})

const menuLinks = computed(() => [...staticLinks, ...dynLinks.value])

const query = ref('')
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  const pg = pages.value
    .filter((p) => p.name.toLowerCase().includes(q))
    .map((p) => ({ type: 'page', title: p.name, to: p.full_url }))
  const ct = categories.value
    .filter((c) => c.name.toLowerCase().includes(q))
    .map((c) => ({ type: 'cat', title: c.name, to: `/${c.slug}` }))
  return [...pg, ...ct].slice(0, 10)
})
</script>

<template>
  <header :class="['navbar', 'navbar-expand-lg', bgClass, 'shadow-sm']">
    <div class="container-fluid">
      <a class="navbar-brand fw-bold" href="/">{{ brand }}</a>

      <button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#navCnt">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div id="navCnt" class="collapse navbar-collapse">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li v-for="l in menuLinks" :key="l.to" class="nav-item">
            <a class="nav-link" @click.prevent="go(l)">{{ l.title }}</a>
          </li>
        </ul>

        <form class="d-flex position-relative">
          <input v-model="query" class="form-control me-2" placeholder="Поиск…" />
          <Icons.Search class="position-absolute top-50 end-0 translate-middle-y me-3 text-muted" />

          <ul
            v-if="filtered.length"
            class="list-group position-absolute w-100 mt-2"
            style="z-index: 999"
          >
            <li
              v-for="item in filtered"
              :key="item.to"
              class="list-group-item list-group-item-action d-flex justify-content-between"
              @click="go(item)"
            >
              <span>{{ item.title }}</span>
              <span class="badge bg-secondary">{{ item.type }}</span>
            </li>
          </ul>
        </form>
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar-toggler-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'%3E%3Cpath stroke='rgba%280,0,0,0.6%29' stroke-linecap='round' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3E%3C/svg%3E");
}
</style>
