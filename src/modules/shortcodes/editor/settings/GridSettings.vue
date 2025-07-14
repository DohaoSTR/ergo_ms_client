<script setup>
import { toRefs, ref, computed, onMounted, watch } from 'vue'
import CategoryTree from '../CategoryTree.vue'
import { shortcodesService } from '@/js/api/services/shortcodes'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const props = defineProps({ component: Object })
const { component } = toRefs(props)
if (!component.value.extra_data) component.value.extra_data = {}

const cols = ref(component.value.extra_data.cols ?? 3)
const limit = ref(component.value.extra_data.limit ?? 6)
const categoryId = ref(component.value.extra_data.category_id ?? null)
const templateId = ref(component.value.extra_data.template_id ?? null)

const templates = ref([])
const loadTemplates = async () => {
    const r = await shortcodesService.getTemplates()
    if (r.success)
        templates.value = (r.data || []).filter(t => t.component_type === 'PageCard')
}

const categories = ref([])
const categorySearch = ref('')
const selectedPath = ref([])
const buildTree = list => {
    const m = {}, roots = []
    list.forEach(i => m[i.id] = { ...i, children: [] })
    list.forEach(i => i.parent ? m[i.parent]?.children.push(m[i.id]) : roots.push(m[i.id]))
    return roots
}
const fetchCategories = async () => {
    const r = await apiClient.get(endpoints.categories.list)
    categories.value = buildTree(Array.isArray(r.data) ? r.data : r.data.results || [])
}
onMounted(() => { fetchCategories(); loadTemplates() })

const filterTree = (n, q) => n.map(c => {
    const hit = c.name.toLowerCase().includes(q)
    const kids = c.children ? filterTree(c.children, q) : []
    return hit || kids.length ? { ...c, children: kids } : null
}).filter(Boolean)
const filteredCategories = computed(() => categorySearch.value.trim()
    ? filterTree(categories.value, categorySearch.value.trim().toLowerCase())
    : categories.value)

function handleSelect({ category, path }) {
    categoryId.value = category.id
    selectedPath.value = path.concat([{ id: category.id, name: category.name }])
}
function resetCategory() {
    categoryId.value = null
    selectedPath.value = []
}

watch([cols, limit, categoryId, templateId], () => {
    component.value.extra_data = {
        ...component.value.extra_data,
        cols: cols.value,
        limit: limit.value,
        category_id: categoryId.value,
        template_id: templateId.value,
    }
})
</script>

<template>
    <div>
        <div class="mb-3">
            <label class="form-label fw-bold">Кол-во колонок</label>
            <input v-model.number="cols" type="number" min="1" class="form-control form-control-sm" />
        </div>

        <div class="mb-3">
            <label class="form-label fw-bold">Карточек в авто-секции</label>
            <input v-model.number="limit" type="number" min="1" class="form-control form-control-sm" />
        </div>

        <!-- выбор шаблона карточки -->
        <div class="mb-3">
            <label class="form-label fw-bold">Шаблон PageCard</label>
            <select v-model="templateId" class="form-select form-select-sm">
                <option :value="null">Стандартный PageCardBlock</option>
                <option v-for="t in templates" :key="t.id" :value="t.id">
                    {{ t.name }} (id={{ t.id }})
                </option>
            </select>
        </div>

        <!-- Категория -->
        <div class="mb-3">
            <label class="form-label fw-bold">Категория авто-страниц</label>

            <input v-model="categorySearch" type="text" class="form-control form-control-sm mb-2"
                placeholder="Поиск…" />

            <div class="border rounded bg-light p-2" style="max-height:260px;overflow:auto">
                <CategoryTree :categories="filteredCategories" :selectedPath="selectedPath" @select="handleSelect" />
            </div>

            <div v-if="categoryId" class="form-text mt-1">
                Выбрано: <b>{{selectedPath.map(p => p.name).join(' → ')}}</b>
                <button class="btn btn-link btn-sm text-danger p-0 ms-2" @click="resetCategory">×</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.form-label {
    font-weight: 600;
}
</style>
