<template>
  <div class="container py-4">
    <div class="d-flex align-items-center mb-4">
      <h2 class="me-3">Редактор шаблона компонента</h2>
      <span class="badge bg-secondary">Шаблон компонента</span>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-md-6">
        <label class="form-label">Название компонента</label>
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
          placeholder="Краткое описание компонента"
        ></textarea>
      </div>
      <div class="col-md-6">
        <label class="form-label">Тип компонента</label>
        <select v-model="meta.componentType" class="form-select">
          <option :value="null" disabled>— Выберите тип —</option>
          <option value="button">Button</option>
          <option value="container">Container</option>
          <option value="header">Header</option>
          <option value="footer">Footer</option>
          <option value="navigation">Navigation</option>
          <option value="card">Card</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label">Иконка</label>
        <select v-model="meta.iconName" class="form-select">
          <option :value="null" disabled>— Выберите иконку —</option>
          <option value="Layout">Layout</option>
          <option value="Button">Button</option>
          <option value="Type">Text</option>
          <option value="Box">Box</option>
          <option value="Menu">Menu</option>
          <option value="Grid">Grid</option>
        </select>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header bg-light">
        <strong>Редактор HTML/CSS</strong>
      </div>
      <div class="card-body">
        <div class="mb-3">
          <label class="form-label">HTML шаблон</label>
          <textarea
            v-model="content.html"
            class="form-control font-monospace"
            rows="10"
            placeholder="<div>Содержимое компонента</div>"
          ></textarea>
        </div>
        <div class="mb-3">
          <label class="form-label">CSS стили</label>
          <textarea
            v-model="content.css"
            class="form-control font-monospace"
            rows="6"
            placeholder=".component { color: blue; }"
          ></textarea>
        </div>
      </div>
    </div>

    <button class="btn btn-success mt-3" @click="saveTemplate">Сохранить шаблон</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { shortcodesService } from '@/js/api/services/shortcodes'

const categories = ref([])
const meta = ref({
  title: '',
  description: '',
  categoryId: null,
  componentType: null,
  iconName: null,
})

const content = ref({
  html: '',
  css: '',
})

onMounted(async () => {
  const catRes = await shortcodesService.getCategories()
  if (catRes.success) categories.value = catRes.data
})

const saveTemplate = async () => {
  const payload = {
    name: meta.value.title,
    description: meta.value.description,
    category_id: meta.value.categoryId,
    component_type: meta.value.componentType,
    icon_name: meta.value.iconName,
    content: {
      html: content.value.html,
      css: content.value.css,
    },
    is_active: true,
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
