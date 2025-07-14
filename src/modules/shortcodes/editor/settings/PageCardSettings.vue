<script setup>
import { toRefs, ref, watch } from 'vue'

const props = defineProps({
    component: {
        type: Object,
        required: true
    }
})

const { component } = toRefs(props)
if (!component.value.extra_data) component.value.extra_data = {}

const placeholder = ref(component.value.extra_data.placeholder_title ?? 'Новость')
const overrideUrl = ref(component.value.extra_data.path ?? '')

watch([placeholder, overrideUrl], () => {
    component.value.extra_data = {
        ...component.value.extra_data,
        placeholder_title: placeholder.value,
        path: overrideUrl.value
    }
})
</script>


<template>
    <div>
        <h6 class="fw-semibold mb-3">Настройки карточки</h6>

        <div class="mb-3">
            <label class="form-label fw-bold">Текст-заглушка</label>
            <input v-model="placeholder" class="form-control" />
        </div>

        <div class="mb-3">
            <label class="form-label fw-bold">URL (необязательно)</label>
            <input v-model="overrideUrl" class="form-control" placeholder="/my/page" />
            <small class="form-text text-muted">Если пусто — формируется автоматически</small>
        </div>
    </div>
</template>
