<script setup>
import { toRefs, watch, ref } from 'vue'
const { component } = toRefs(defineProps({ component: Object }))

if (!component.value.extra_data) component.value.extra_data = {}

const text = ref(component.value.extra_data.text ?? 'Текстовый блок')

watch(text, () => {
    component.value.extra_data = { ...component.value.extra_data, text: text.value }
})
</script>

<template>
    <div>
        <label class="form-label fw-bold">Текст</label>
        <textarea v-model="text" rows="4" class="form-control form-control-sm" />
    </div>
</template>
