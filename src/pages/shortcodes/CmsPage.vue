<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, watch, computed } from 'vue'
import { shortcodesService } from '@/js/api/services/shortcodes'
import PublicCanvas from './PublicCanvas.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref(null)
const details = ref(null)
const notFound = ref(false)
const page = ref(null)
const components = ref([])

const editLink = computed(() =>
  page.value ? `/shortcodes/shortcode-editor?page=${page.value.id}` : null
)

function pathFromRoute(r) {
  const parts = Array.isArray(r.params.parts) ? r.params.parts : [r.params.parts]
  return parts.filter(Boolean).join('/')
}
const fullPath = ref(pathFromRoute(route))

const goHome = () => router.push('/')
const goShortcodes = () => router.push('/shortcodes')

async function loadPage() {
  loading.value = true
  error.value = null
  notFound.value = false
  components.value = []

  const queryPath = fullPath.value || 'home'

  try {
    const lResp = await shortcodesService.getSiteLayout()
    const layout = Array.isArray(lResp.data) ? lResp.data[0] : lResp.data

    const pResp = await shortcodesService.getPageByFullPath(queryPath)
    if (!pResp.data?.id) throw new Error('Page not found')
    page.value = pResp.data

    const wrapTpl = async (tplId, inject = false) => {
      if (!tplId) return []
      const { data: tpl } = await shortcodesService.getTemplate(tplId)
      return [
        {
          uid: 'tpl-' + tpl.id,
          template: tpl.id,
          template_name: tpl.name,
          component_type: tpl.component_type,
          class_list: tpl.class_list,
          extra_data: inject
            ? { ...tpl.extra_data, menu_pages: layout?.menu_pages || [] }
            : tpl.extra_data,
          allow_children: tpl.allow_children,
          icon_name: tpl.icon_name,
          children: [],
        },
      ]
    }

    const [header, body, footer] = await Promise.all([
      wrapTpl(layout?.header_template, true),
      shortcodesService
        .getInstancesTree({ page: page.value.id })
        .then((r) => (Array.isArray(r.data) ? r.data : [])),
      wrapTpl(layout?.footer_template),
    ])

    components.value = [...header, ...body, ...footer]
    loading.value = false
  } catch (e) {
    console.error(e)
    loading.value = false
    error.value = e.message || 'Ошибка загрузки страницы'
    details.value = e
    notFound.value = /not found/i.test(e.message) || e.response?.status === 404
  }
}

watch(
  () => route.params.parts,
  () => {
    fullPath.value = pathFromRoute(route)
    loadPage()
  },
  { immediate: true }
)
</script>

<template>
  <div class="my-2">
    <div class="d-flex align-items-center mb-4">
      <h2 class="mb-0 me-3">
        CMS-страница: {{ page?.name || fullPath || 'home' }}
      </h2>

      <!-- показываем кнопку, только когда страница существует -->
      <router-link v-if="editLink" :to="editLink" class="btn btn-outline-primary btn-sm">
        ✏️ Редактировать
      </router-link>
    </div>


    <div v-if="loading">Загрузка…</div>

    <template v-else-if="notFound">
      <div class="d-flex flex-column align-items-center text-center my-5">
        <img src="@/assets/NotFound.svg" alt="404" class="img-fluid mb-4" style="max-width: 500px" />

        <h2 class="mb-2">Страница не найдена</h2>
        <p class="text-muted mb-4">
          К сожалению, запрошенная страница отсутствует или была удалена.
        </p>

        <div class="d-flex gap-2">
          <button class="btn btn-primary" @click="goHome">На главную</button>
          <button class="btn btn-outline-secondary" @click="goShortcodes">
            Управление страницами
          </button>
        </div>
      </div>
    </template>


    <template v-else-if="error">
      <div class="alert alert-danger">
        {{ error }}
        <pre class="bg-light p-2 mt-3 rounded">{{ JSON.stringify(details, null, 2) }}</pre>
      </div>
    </template>

    <PublicCanvas v-else :components="components" />
  </div>
</template>
