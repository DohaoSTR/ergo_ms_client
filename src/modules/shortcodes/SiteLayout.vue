<template>
  <div class="container py-5">
    <div class="card shadow-lg rounded-3 overflow-hidden border-0">
      <div class="card-header bg-white border-bottom-0">
        <h2 class="mb-0 text-primary">Глобальная разметка</h2>
      </div>

      <div class="card-body">
        <form @submit.prevent="save">
          <div class="row g-4">
            <div class="col-md-6">
              <label class="form-label fw-semibold text-secondary">Шапка</label>
              <select
                v-model.number="layout.header_template"
                class="form-select form-select-lg shadow-sm"
              >
                <option :value="null">— нет —</option>
                <option v-for="t in templates" :key="t.id" :value="t.id">
                  {{ t.name }}
                </option>
              </select>
            </div>

            <div class="col-md-6">
              <label class="form-label fw-semibold text-secondary">Подвал</label>
              <select
                v-model.number="layout.footer_template"
                class="form-select form-select-lg shadow-sm"
              >
                <option :value="null">— нет —</option>
                <option v-for="t in templates" :key="t.id" :value="t.id">
                  {{ t.name }}
                </option>
              </select>
            </div>
          </div>

          <hr class="my-5" />

          <h4 class="text-primary mb-3">Пункты меню (страницы)</h4>

          <!-- Поиск -->
          <input
            v-model.trim="search"
            type="text"
            class="form-control mb-3"
            placeholder="Найти страницу…"
          />

          <!-- список страниц с чек-боксами -->
          <div class="menu-list border rounded p-3 mb-3" style="max-height: 280px; overflow: auto">
            <table class="table table-sm align-middle mb-0">
              <tbody>
                <tr v-for="p in filteredPages" :key="p.id">
                  <td style="width: 42px">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      :value="p.id"
                      v-model="selectedPageIds"
                    />
                  </td>
                  <td>
                    <span class="fw-semibold">{{ p.name }}</span>
                    <div class="small text-muted">{{ p.full_url }}</div>
                  </td>
                </tr>
                <tr v-if="!filteredPages.length">
                  <td colspan="2" class="text-center text-muted py-3">Ничего не найдено</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="selectedPages.length" class="mb-4">
            <span class="badge bg-secondary me-1 mb-1" v-for="p in selectedPages" :key="p.id">
              {{ p.name }}
            </span>
          </div>

          <div class="d-flex justify-content-end mt-4">
            <button class="btn btn-primary btn-lg px-5 shadow" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { shortcodesService } from '@/modules/cms/js/shortcodes'

const templates = ref([])
const pages = ref([])
const layout = ref({
  id: null,
  header_template: null,
  footer_template: null,
  menu_pages: [],
})
const search = ref('')
const saving = ref(false)

const selectedPageIds = computed({
  get: () => layout.value.menu_pages,
  set: (ids) => {
    layout.value.menu_pages = ids
  },
})

const filteredPages = computed(() => {
  const q = search.value.toLowerCase()
  return pages.value.filter(
    (p) => p.name.toLowerCase().includes(q) || p.full_url.toLowerCase().includes(q)
  )
})

const selectedPages = computed(() =>
  pages.value.filter((p) => selectedPageIds.value.includes(p.id))
)

async function load() {
  const [tplResp, layResp, pageResp] = await Promise.all([
    shortcodesService.getTemplates(),
    shortcodesService.getSiteLayout(),
    shortcodesService.getPages(),
  ])

  templates.value = tplResp.data || []

  const exist = Array.isArray(layResp.data) ? layResp.data[0] : layResp.data
  if (exist) {
    layout.value = {
      id: exist.id,
      header_template: exist.header_template,
      footer_template: exist.footer_template,
      menu_pages: exist.menu_pages || [],
    }
  }

  pages.value = pageResp.data || []
}

async function save() {
  saving.value = true
  try {
    const payload = {
      header_template: layout.value.header_template,
      footer_template: layout.value.footer_template,
      menu_pages: selectedPageIds.value, // <-- массив чисел
    }

    if (layout.value.id) {
      await shortcodesService.updateSiteLayout(layout.value.id, payload)
    } else {
      const r = await shortcodesService.createSiteLayout(payload)
      layout.value.id = r.data.id
    }

    alert('Сохранено ✔')
  } catch (e) {
    console.error(e)
    alert('Ошибка: ' + (e.response?.data?.detail || e.message))
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.container {
  max-width: 900px;
}
.menu-list table {
  table-layout: fixed;
}
.menu-list td {
  vertical-align: middle;
}
</style>
