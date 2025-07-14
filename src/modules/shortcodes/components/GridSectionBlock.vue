<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import RecursiveRenderer from '../editor/RecursiveRenderer.vue'
import PageCardBlock from '../components/PageCardBlock.vue'
import { shortcodesService } from '@/modules/cms/js/shortcodes'

const props = defineProps({ component: Object })
const node = computed(() => props.component ?? { extra_data: {}, children: [] })
const childrenList = computed(() => Array.isArray(node.value.children)
    ? node.value.children : [])

const cols = computed(() => node.value.extra_data?.cols ?? 3)
const limit = computed(() => node.value.extra_data?.limit ?? 6)
const categoryId = computed(() => node.value.extra_data?.category_id ?? null)
const templateId = computed(() => node.value.extra_data?.template_id ?? null)

const autoCards = ref([])
const cardTpl = ref(null)

async function loadTemplate() {
    cardTpl.value = null
    if (!templateId.value) return
    const r = await shortcodesService.getTemplate(templateId.value)
    if (r.success) cardTpl.value = r.data
}

async function fetchLatest() {
    autoCards.value = []
    if (!categoryId.value) return
    const { success, data } = await shortcodesService.getLatestPages(
        categoryId.value, limit.value)
    if (success) autoCards.value = data
}

onMounted(() => { fetchLatest(); loadTemplate() })
watch([categoryId, limit], fetchLatest)
watch(templateId, loadTemplate)

const makeCardComponent = (p) => {
    if (!cardTpl.value) {
        return {
            component_type: 'PageCard',
            uid: `auto-${p.id}`,
            extra_data: {
                title: p.name,
                path: p.full_url,
                image: p.preview_image,
                tags: p.tags,
            }
        }
    }
    return {
        template: cardTpl.value.id,
        template_name: cardTpl.value.name,
        component_type: cardTpl.value.component_type,
        uid: `auto-${p.id}`,
        class_list: cardTpl.value.class_list,
        allow_children: cardTpl.value.allow_children,
        icon_name: cardTpl.value.icon_name,
        extra_data: {
            ...cardTpl.value.extra_data,
            title: p.name,
            path: p.full_url,
            image: p.preview_image,
            tags: p.tags,
        },
        children: [],
    }
}
</script>

<template>
    <section class="container my-4">
        <div :class="`row row-cols-1 row-cols-md-${cols} g-4`">
            <!-- вручную вложенные -->
            <div v-for="child in childrenList" :key="child.uid || child.id" class="col">
                <RecursiveRenderer :component="child" />
            </div>

            <!-- авто-страницы -->
            <div v-for="p in autoCards" :key="`auto-${p.id}`" class="col">
                <template v-if="cardTpl">
                    <RecursiveRenderer :component="makeCardComponent(p)" />
                </template>
                <template v-else>
                    <PageCardBlock :component="makeCardComponent(p)" />
                </template>
            </div>
        </div>
    </section>
</template>

<style scoped>
.card-img-top {
    max-height: 180px;
    object-fit: cover;
}
</style>
