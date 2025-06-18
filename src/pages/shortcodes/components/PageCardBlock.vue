<script setup>
import { computed } from 'vue'
import placeholder from '@/assets/placeholder.svg'

const props = defineProps({
    component: { type: Object, required: true }
})

const extra = computed(() => props.component.extra_data || {})
const title = computed(() => extra.value.title || 'Без названия')
const path = computed(() => extra.value.path || '#')
const img = computed(() => extra.value.image || placeholder)
const tags = computed(() =>
    Array.isArray(extra.value.tags) ? extra.value.tags : []
)

const cardClasses = computed(() => {
    const base = ['card', 'h-100', 'shadow-sm']
    const custom = Array.isArray(props.component.class_list)
        ? props.component.class_list
        : []
    return [...base, ...custom]
})
</script>

<template>
    <router-link :to="path" class="text-decoration-none">
        <div :class="cardClasses">
            <img :src="img" class="card-img-top" :alt="title" />

            <div class="card-body d-flex flex-column justify-content-center text-center">
                <h5 class="card-title mb-2">{{ title }}</h5>

                <!-- бейджи тегов -->
                <div v-if="tags.length" class="d-flex flex-wrap justify-content-center gap-1">
                    <span v-for="t in tags" :key="t.id || t" class="badge bg-primary">
                        {{ t.name || t }}
                    </span>
                </div>
            </div>
        </div>
    </router-link>
</template>

<style scoped>
.card-img-top {
    max-height: 180px;
    object-fit: cover;
}
</style>
