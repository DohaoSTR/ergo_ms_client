<script setup>
import { toRefs, watch, ref } from 'vue'
const { component } = toRefs(defineProps({ component: Object }))

if (!component.value.extra_data) component.value.extra_data = {}

const lvl = ref(component.value.extra_data.level ?? 2)
const text = ref(component.value.extra_data.text ?? 'Заголовок')

watch([lvl, text], () => {
    component.value.extra_data = {
        ...component.value.extra_data,
        level: lvl.value, text: text.value
    }
})
</script>

<template>
    <div>
        <label class="form-label fw-bold">Уровень</label>
        <select v-model.number="lvl" class="form-select form-select-sm mb-3">
            <option v-for="n in 6" :key="n" :value="n">H{{ n }}</option>
        </select>

        <label class="form-label fw-bold">Текст</label>
        <input v-model="text" class="form-control form-control-sm" />
    </div>
</template>
