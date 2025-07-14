<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { shortcodesService } from '@/modules/cms/js/shortcodes'

const { component } = defineProps({ component: Object })

const route = useRoute()
const router = useRouter()
const pages = ref([])
const cats = ref([])

const mode = component.extra_data?.mode === 'v' ? 'v' : 'h'

const load = async () => {
  const [pg, ct] = await Promise.all([
    shortcodesService.getPages(),
    shortcodesService.getCategories(),
  ])
  pages.value = pg.data || []
  cats.value = ct.data || []
}

const currentPage = computed(() =>
  pages.value.find(
    (p) => p.full_url.replace(/^\/|\/$/g, '') === route.fullPath.replace(/^\/|\/$/g, '')
  )
)
const currentCat = computed(() => currentPage.value?.category?.id)
const subCats = computed(() => cats.value.filter((c) => c.parent === currentCat.value))

const linkForCat = (cat) => {
  const p = pages.value.find((p) => p.category?.id === cat.id)
  return p ? p.full_url : `/${cat.slug}/`
}

const items = computed(() => subCats.value.map((c) => ({ title: c.name, href: linkForCat(c) })))

/* —— preview, когда данных ещё нет —— */
const previewItems = [
  { title: 'Раздел 1', href: '#' },
  { title: 'Раздел 2', href: '#' },
  { title: 'Раздел 3', href: '#' },
]
const viewItems = computed(() => (items.value.length ? items.value : previewItems))
const isPreview = computed(() => items.value.length === 0)

const go = (href) => router.push(href)
onMounted(load)
</script>

<template>
  <nav>
    <ul
      :class="[
        mode === 'h' ? 'nav nav-pills justify-content-center flex-wrap gap-2' : 'list-group',
      ]"
    >
      <li
        v-for="it in viewItems"
        :key="it.href + it.title"
        :class="mode === 'h' ? 'nav-item' : 'list-group-item p-0 border-0'"
      >
        <a
          class="nav-link"
          :class="mode === 'v' && 'py-2 px-3'"
          href="#"
          @click.prevent="go(it.href)"
        >
          {{ it.title }}
        </a>
      </li>
    </ul>

    <div v-if="isPreview" class="text-muted small mt-2 text-center">
      Предпросмотр меню — реальные подкатегории появятся на сайте
    </div>
  </nav>
</template>
