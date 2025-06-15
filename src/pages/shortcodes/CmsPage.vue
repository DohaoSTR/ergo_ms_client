<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, watch } from 'vue'
import { shortcodesService } from '@/js/api/services/shortcodes'
import PublicCanvas from './PublicCanvas.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref(null)
const errorDetails = ref(null)
const page = ref(null)
const components = ref([])
const notFound = ref(false)

const pageSlug = ref(getPageSlugFromRoute(route))

function getPageSlugFromRoute(routeObj) {
  const parts = Array.isArray(routeObj.params.parts)
    ? routeObj.params.parts
    : [routeObj.params.parts]
  return parts.length === 0 || !parts[0] ? 'home' : parts[parts.length - 1]
}

function goHome() {
  router.push('/')
}

function goShortcodes() {
  router.push('/shortcodes')
}

// асинхронная загрузка страницы и компонентов
async function loadPage() {
  loading.value = true
  error.value = null
  errorDetails.value = null
  page.value = null
  components.value = []
  notFound.value = false

  try {
    const pageResp = await shortcodesService.getPageSlug(pageSlug.value)
    if (!pageResp.data || !pageResp.data.id) {
      throw new Error('Page not found')
    }
    page.value = pageResp.data
    const instResp = await shortcodesService.getInstancesTree({ page: page.value.id })
    components.value = instResp.data
    loading.value = false
  } catch (err) {
    console.log('Error object:', err)
    if (
      (err.response && err.response.status === 404) ||
      (err.message && err.message.toLowerCase().includes('not found'))
    ) {
      error.value = 'Страница не найдена'
      notFound.value = true
    } else {
      error.value = err.message || 'Ошибка загрузки страницы'
    }
    loading.value = false
    page.value = null
    components.value = []
    errorDetails.value = err
  }
}

watch(
  () => route.params.parts,
  () => {
    pageSlug.value = getPageSlugFromRoute(route)
    loadPage()
  },
  { immediate: true }
)
</script>

<template>
  <div>
    <h2>CMS Страница: {{ page?.name || pageSlug }}</h2>
    <div v-if="loading">Загрузка...</div>
    <!-- 404 Не найдена -->
    <div v-else-if="notFound">
      <div class="d-flex flex-column align-items-center mt-5">
        <div class="my-4">
          <img
            src="@/assets/NotFound.svg"
            alt="404 Not Found"
            style="max-width: 500px; width: 100%"
          />
        </div>
        <div class="alert alert-warning text-center mt-4">
          {{ error }}
          <button class="btn btn-outline-primary ms-3" @click="goHome">На главную</button>
          <button class="btn btn-primary ms-3" @click="goShortcodes">Управление страницами</button>
        </div>
      </div>
    </div>
    <div v-else-if="error">
      <div class="alert alert-danger">
        {{ error }}
        <pre class="bg-light p-2 rounded">{{ JSON.stringify(errorDetails, null, 2) }}</pre>
      </div>
    </div>
    <div v-else>
      <PublicCanvas :components="components" />
    </div>
  </div>
</template>
