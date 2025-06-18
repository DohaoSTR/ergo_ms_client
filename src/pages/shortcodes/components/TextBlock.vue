<script setup>
import { computed } from 'vue'

const { component } = defineProps({
    component: { type: Object, required: true }
})

const extra = computed(() => component.extra_data ?? {})
const classes = computed(() =>
    Array.isArray(component.class_list) ? component.class_list : []
)

const textContent = computed(() => extra.value.text || 'Текстовый блок')

/*Нужно ли рендерить как raw-HTML?
– если поставили extra_data.html = true
– или в строке явно есть HTML-теги  */
const isHtml = computed(() =>
    extra.value.html === true ||
    /<\/?[a-z][\s\S]*>/i.test(textContent.value)
)
</script>

<template>
    <!-- plain-text вариант -->
    <p v-if="!isHtml" :class="classes" class="text-block">
        {{ textContent }}
    </p>

    <!-- html-вариант  -->
    <p v-else :class="classes" class="text-block" v-html="textContent" />
</template>

<style scoped>
.text-block {
    margin: 0;
    white-space: pre-line;
}
</style>
