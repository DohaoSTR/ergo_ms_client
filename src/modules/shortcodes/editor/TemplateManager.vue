<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="m-0">Шаблоны компонентов</h2>
      <button class="btn btn-primary" @click="createNew">+ Новый шаблон</button>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status"></div>
    </div>

    <div v-else class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
      <div v-for="tpl in templates" :key="tpl.id" class="col">
        <div class="card h-100 shadow-sm">
          <div class="card-header bg-primary text-muted">
            <small class="text-light fw-bold">ID: {{ tpl.id }}</small>
          </div>
          <div class="card-body d-flex flex-column">
            <div class="d-flex align-items-center mb-2">
              <h5 class="card-title mb-0 me-2">{{ tpl.name }}</h5>
              <component :is="Icons[tpl.icon_name] || Icons.Box" />
            </div>
            <h6 class="card-subtitle mb-3 text-capitalize">{{ tpl.component_type }}</h6>
            <div class="mb-3">
              <span :class="['badge', tpl.is_active ? 'bg-success' : 'bg-danger']">
                {{ tpl.is_active ? 'Активен' : 'Не активен' }}
              </span>
            </div>
            <div class="mt-auto d-flex justify-content-between">
              <button class="btn btn-sm btn-outline-primary" @click="editTemplate(tpl.id)">
                ✏️ Редактировать
              </button>
              <button class="btn btn-sm btn-outline-danger" @click="removeTemplate(tpl.id)">
                🗑️ Удалить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { shortcodesService } from '@/modules/cms/js/shortcodes'
import * as Icons from 'lucide-vue-next'

const router = useRouter()
const templates = ref([])
const loading = ref(true)

async function load() {
  loading.value = true
  const res = await shortcodesService.getTemplates()
  if (res.success) templates.value = res.data
  loading.value = false
}

function editTemplate(id) {
  router.push({ name: 'TemplateEditor', params: { id } })
}

async function removeTemplate(id) {
  if (!confirm('Удалить шаблон?')) return
  const res = await shortcodesService.deleteTemplate(id)
  if (res.success) load()
  else alert('Ошибка: ' + JSON.stringify(res.errors))
}

function createNew() {
  router.push({ name: 'TemplateEditor', params: { id: 'new' } })
}

onMounted(load)
</script>

<style scoped>
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
</style>
