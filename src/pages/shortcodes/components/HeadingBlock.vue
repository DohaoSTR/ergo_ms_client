<script setup>
import { computed } from 'vue'

const props = defineProps({ component: Object })

/* extra_data: { level: 1-6, text: '...' } */
const extra = computed(() => props.component.extra_data || {})
const level = computed(() => Math.min(Math.max(+extra.value.level || 1, 1), 6))
const tagName = computed(() => `h${level.value}`)
const text = computed(() => extra.value.text || 'Заголовок')
</script>

<template>
    <component :is="tagName" :class="props.component.class_list">
        {{ text }}
    </component>
</template>
