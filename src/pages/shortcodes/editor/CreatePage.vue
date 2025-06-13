<template>
  <div class="template-editor min-vh-100 d-flex align-items-center justify-content-center">
    <div class="card shadow p-5 w-100">
      <div class="d-flex align-items-center mb-4">
        <h2 class="mb-0 me-3">Создание страницы</h2>
        <span class="badge bg-secondary">Страница</span>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-12">
          <label class="form-label fw-bold">Название страницы</label>
          <input
            v-model="meta.title"
            type="text"
            class="form-control form-control-lg"
            placeholder="Введите название страницы"
            autofocus
          />
        </div>
        <div class="col-12">
          <label class="form-label fw-bold">URL страницы (slug)</label>
          <input
            v-model="meta.slug"
            type="text"
            class="form-control"
            placeholder="url-stranicy"
            @input="onSlugInput"
          />
          <div class="form-text">
            Автоматически генерируется по названию, если не менять вручную.
          </div>
        </div>
        <div class="col-12">
          <label class="form-label fw-bold">Шаблон страницы</label>
          <select v-model="meta.baseTemplateId" class="form-select form-select-lg">
            <option :value="null">— Без шаблона —</option>
            <option v-for="tpl in pageTemplates" :key="tpl.id" :value="tpl.id">
              {{ tpl.title }}
            </option>
          </select>
        </div>
      </div>

      <div class="d-flex justify-content-start mt-4">
        <button class="btn btn-lg btn-success text-light px-2" @click="savePage">
          Создать страницу
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { shortcodesService } from '@/js/api/services/shortcodes'
import { slugify as translitSlugify } from 'transliteration'

const pageTemplates = ref([])

const meta = ref({
  title: '',
  slug: '',
  baseTemplateId: null,
})

const slugEdited = ref(false)

// Делаем slug
function makeSlug(text) {
  return translitSlugify(text, { lowercase: true, separator: '-' })
}

watch(
  () => meta.value.title,
  (newTitle) => {
    if (!slugEdited.value) {
      meta.value.slug = makeSlug(newTitle)
    }
  }
)

watch(
  () => meta.value.slug,
  (newSlug) => {
    if (newSlug === '') {
      slugEdited.value = false
      meta.value.slug = makeSlug(meta.value.title)
    }
  }
)

function onSlugInput() {
  slugEdited.value = true
}

onMounted(async () => {
  const ptRes = await shortcodesService.getPageTemplates()
  if (ptRes.success) pageTemplates.value = ptRes.data
})

const savePage = async () => {
  const payload = {
    title: meta.value.title,
    slug: meta.value.slug,
    base_template: meta.value.baseTemplateId,
  }

  try {
    await shortcodesService.createPage(payload)
    alert('Страница успешно создана!')
  } catch (e) {
    console.error(e)
    alert('Ошибка при создании страницы.')
  }
}
</script>

<style scoped>
.card {
  border-radius: 1.5rem;
  border: none;
}
.badge {
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.form-label {
  color: #495057;
}
.btn-success {
  font-weight: 500;
  font-size: 1.12rem;
  border-radius: 0.5rem;
}
</style>
