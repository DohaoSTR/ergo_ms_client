<template>
  <div class="container py-4">
    <div class="d-flex align-items-center mb-4">
      <h2 class="me-3">Редактор шаблона страницы</h2>
      <span class="badge bg-secondary">Только шаблон</span>
    </div>
    <div class="row g-3 mb-4">
      <div class="col-md-6">
        <label class="form-label">Название шаблона</label>
        <input
          v-model="meta.title"
          type="text"
          class="form-control"
          placeholder="Введите название"
        />
      </div>
      <div class="col-md-6">
        <label class="form-label">Категория</label>
        <select v-model="meta.categoryId" class="form-select">
          <option :value="null" disabled>— Выберите категорию —</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>
      </div>
      <div class="col-12">
        <label class="form-label">Описание</label>
        <textarea
          v-model="meta.description"
          class="form-control"
          rows="2"
          placeholder="Краткое описание шаблона"
        ></textarea>
      </div>
      <div class="col-md-6">
        <label class="form-label">Базовый шаблон</label>
        <select v-model="meta.baseTemplateId" class="form-select">
          <option :value="null">— Без базового —</option>
          <option v-for="tpl in pageTemplates" :key="tpl.id" :value="tpl.id">
            {{ tpl.title }}
          </option>
        </select>
      </div>
    </div>
    <button class="btn btn-success mt-3" @click="saveTemplate">Сохранить шаблон</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { shortcodesService } from '@/js/api/services/shortcodes'

const templates = ref([])
const categories = ref([])
const pageTemplates = ref([])
const tree = ref([])

// метаданные шаблона
const meta = ref({
  title: '',
  description: '',
  categoryId: null,
  baseTemplateId: null,
})

onMounted(async () => {
  const tplRes = await shortcodesService.getTemplates()
  if (tplRes.success) templates.value = tplRes.data

  const catRes = await shortcodesService.getCategories()
  if (catRes.success) categories.value = catRes.data

  const ptRes = await shortcodesService.getPageTemplates()
  if (ptRes.success) pageTemplates.value = ptRes.data
})

const saveTemplate = async () => {
  const payload = {
    title: meta.value.title,
    description: meta.value.description,
    category: meta.value.categoryId,
    base_template: meta.value.baseTemplateId,
    tree: tree.value,
  }

  try {
    await shortcodesService.createTemplate(payload)
    alert('Шаблон успешно сохранён!')
  } catch (e) {
    console.error(e)
    alert('Ошибка при сохранении шаблона.')
  }
}
</script>

<style scoped>
.badge {
  font-size: 0.8rem;
  text-transform: uppercase;
}
</style>
