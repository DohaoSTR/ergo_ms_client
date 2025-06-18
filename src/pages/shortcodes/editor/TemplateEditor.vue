<template>
  <div class="container py-4">
    <div class="card shadow-sm mb-4">
      <div class="card-header bg-danger text-white">
        <h2 class="mb-0">
          {{ isNew ? 'Новый шаблон' : 'Редактирование шаблона' }}
        </h2>
      </div>

      <div class="card-body">
        <form @submit.prevent="save">
          <div class="row g-3 mb-4">
            <div class="col-md-6">
              <label class="form-label">Название</label>
              <input v-model="form.name" class="form-control" required />
            </div>

            <div class="col-md-6">
              <label class="form-label">Тип компонента</label>
              <select v-model="form.component_type" class="form-select" required>
                <option v-for="cat in categories" :key="cat.id" :value="cat.name">
                  {{ cat.name }}
                </option>
              </select>
            </div>

            <div class="col-md-6">
              <label class="form-label">Иконка</label>
              <IconPicker v-model="form.icon_name" />
              <div class="mt-2" v-if="form.icon_name">
                <component :is="Icons[form.icon_name] || Icons.Box" class="me-1" />
                <code>{{ form.icon_name }}</code>
              </div>
            </div>

            <div class="col-md-6">
              <div class="form-check form-switch mb-2">
                <input
                  class="form-check-input"
                  type="checkbox"
                  v-model="form.is_active"
                  id="activeSwitch"
                />
                <label class="form-check-label" for="activeSwitch"> Активен </label>
              </div>
              <div class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  v-model="form.allow_children"
                  id="nestSwitch"
                />
                <label class="form-check-label" for="nestSwitch"> Разрешить вложенность </label>
              </div>
            </div>
          </div>

          <!-- JSON-поля -->
          <div class="mb-4">
            <label class="form-label">CSS-классы</label>
            <textarea v-model="classListJson" class="form-control code-editor" rows="3"></textarea>
            <div class="form-text">JSON-массив, например <code>["p-3","bg-light"]</code></div>
          </div>
          <div class="mb-4">
            <label class="form-label">Extra Data</label>
            <textarea v-model="extraDataJson" class="form-control code-editor" rows="5"></textarea>
            <div class="form-text">JSON-объект, например <code>{"text":"Купить"}</code></div>
          </div>

          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-success text-white">
              {{ isNew ? 'Создать' : 'Сохранить' }}
            </button>
            <button type="button" class="btn btn-outline-secondary" @click="cancel">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { shortcodesService } from '@/js/api/services/shortcodes'
import { categoryService } from '@/js/api/services/shortcodeCategoryService'
import * as Icons from 'lucide-vue-next'
import IconPicker from '../components/IconPicker.vue'

const route = useRoute()
const router = useRouter()
const rawId = route.params.id
const isNew = !rawId || rawId === 'new'
const id = isNew ? null : rawId

// Список категорий из API
const categories = ref([])

const form = ref({
  name: '',
  component_type: '',
  icon_name: '',
  is_active: true,
  allow_children: false,
  class_list: [],
  extra_data: {},
})

const classListJson = ref('[]')
const extraDataJson = ref('{}')

// Загрузка списка категорий
async function loadCategories() {
  const res = await categoryService.getCategories()
  if (res.success) {
    categories.value = res.data
    // по-умолчанию выбираем первый, если новый шаблон
    if (isNew && categories.value.length) {
      form.value.component_type = categories.value[0].name
    }
  } else {
    alert('Ошибка загрузки категорий: ' + JSON.stringify(res.errors))
  }
}

// Загрузка данных шаблона и категорий
async function load() {
  await loadCategories()
  if (!isNew) {
    const res = await shortcodesService.getTemplate(id)
    if (res.success) {
      Object.assign(form.value, res.data)
      classListJson.value = JSON.stringify(res.data.class_list || [], null, 2)
      extraDataJson.value = JSON.stringify(res.data.extra_data || {}, null, 2)
    } else {
      alert('Ошибка загрузки: ' + JSON.stringify(res.errors))
    }
  }
}

// Сохранение
async function save() {
  try {
    form.value.class_list = JSON.parse(classListJson.value)
    form.value.extra_data = JSON.parse(extraDataJson.value)
  } catch {
    return alert('Неверный JSON в полях')
  }

  const payload = { ...form.value }
  const res = isNew
    ? await shortcodesService.createTemplate(payload)
    : await shortcodesService.updateTemplate(id, payload)

  if (res.success) {
    router.push({ name: 'Templates' })
  } else {
    alert('Ошибка сохранения: ' + JSON.stringify(res.errors))
  }
}

function cancel() {
  router.push({ name: 'Templates' })
}

onMounted(load)
</script>

<style scoped>
.code-editor {
  font-family: Menlo, Consolas, monospace;
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  transition: background-color 0.2s, border-color 0.2s;
}
.code-editor:focus {
  background-color: #fff;
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}
</style>
