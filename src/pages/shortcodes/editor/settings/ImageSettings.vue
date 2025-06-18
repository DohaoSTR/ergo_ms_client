<template>
    <div>
        <h6 class="fw-semibold mb-3">Настройки изображения</h6>

        <!-- Превью -->
        <div class="mb-3 d-flex justify-content-center">
            <img :src="previewSrc" :style="previewStyle" :alt="component.extra_data.alt" />
        </div>

        <!-- Fluid -->
        <div class="form-check form-switch mb-3">
            <input class="form-check-input" type="checkbox" id="imgFluid" v-model="isFluid" />
            <label class="form-check-label" for="imgFluid">
                Подстраивать под ширину контейнера
            </label>
        </div>

        <!-- Размеры -->
        <div class="row g-2 mb-3">
            <div class="col-md-6">
                <label class="form-label">Ширина (px / %)</label>
                <input v-model="width" class="form-control" placeholder="300 или 100%" :disabled="isFluid" />
            </div>
            <div class="col-md-6">
                <label class="form-label">Высота (px / %)</label>
                <input v-model="height" class="form-control" placeholder="180 или auto" :disabled="isFluid" />
            </div>
        </div>

        <!-- URL и Alt -->
        <div class="mb-3">
            <label class="form-label">URL</label>
            <input v-model="component.extra_data.src" class="form-control" />
        </div>
        <div class="mb-4">
            <label class="form-label">Alt-текст</label>
            <input v-model="component.extra_data.alt" class="form-control" />
        </div>

        <!-- Drag’n’drop -->
        <div class="border rounded p-4 text-center bg-light" @drop.prevent="uploadFile" @dragover.prevent>
            <p class="mb-2">Перетащите файл сюда или</p>
            <input v-model="altName" class="form-control mb-2" placeholder="Альтернативное название" />
            <button class="btn btn-primary" @click="fileInput.click()">
                Выбрать файл
            </button>
            <input ref="fileInput" type="file" class="d-none" @change="uploadFile" />
        </div>

        <div v-if="uploading" class="alert alert-info py-2 mt-3">Загрузка…</div>
        <div v-if="error" class="alert alert-danger py-2 mt-3">
            {{ error }}
        </div>
    </div>
</template>

<script setup>
import { ref, computed, toRefs, watch } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const props = defineProps({ component: Object })
const { component } = toRefs(props)

// Инициализируем
if (!component.value.extra_data) component.value.extra_data = {}

const width = ref(component.value.extra_data.width || '')
const height = ref(component.value.extra_data.height || '')

const isFluid = computed({
    get: () =>
        component.value.class_list?.includes('img-fluid') || false,
    set(val) {
        let list = Array.isArray(component.value.class_list)
            ? [...component.value.class_list]
            : []
        const idx = list.indexOf('img-fluid')
        if (val && idx === -1) list.push('img-fluid')
        if (!val && idx !== -1) list.splice(idx, 1)
        component.value.class_list = list
    },
})

watch(width, w => (component.value.extra_data.width = w))
watch(height, h => (component.value.extra_data.height = h))
watch(
    () => component.value.extra_data.width,
    w => (width.value = w)
)
watch(
    () => component.value.extra_data.height,
    h => (height.value = h)
)

const altName = ref('')
const uploading = ref(false)
const error = ref(null)
const fileInput = ref(null)

function normalizeUrl(raw = '') {
    if (!raw) return ''
    const base = apiClient.baseUrl.replace(/\/+$/, '')
    return raw.startsWith('http')
        ? raw
        : `${base}/${raw.replace(/^\/+/, '')}`
}

async function uploadFile(e) {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0]
    if (!file) return

    const fd = new FormData()
    fd.append('file', file)
    if (altName.value) fd.append('alt_name', altName.value)

    uploading.value = true
    error.value = null
    try {
        const { data } = await apiClient.post(endpoints.file, fd, false)
        component.value.extra_data.src = normalizeUrl(data.url || data.file)
        component.value.extra_data.alt = data.alt_name || altName.value
        altName.value = ''
    } catch (err) {
        console.error(err)
        error.value = 'Ошибка загрузки'
    } finally {
        uploading.value = false
    }
}

const previewSrc = computed(() =>
    normalizeUrl(component.value.extra_data.src) ||
    'https://via.placeholder.com/240x140?text=preview'
)
const previewStyle = computed(() => ({
    maxHeight: '180px',
    width: isFluid.value
        ? '100%'
        : width.value
            ? (width.value.toString().endsWith('%')
                ? width.value
                : width.value + 'px')
            : 'auto',
    height: isFluid.value
        ? 'auto'
        : height.value
            ? (height.value.toString().endsWith('%')
                ? height.value
                : height.value + 'px')
            : 'auto',
    border: '1px solid #ddd',
    borderRadius: '8px',
    objectFit: 'contain',
    background: '#f9f9fa'
}))
</script>
