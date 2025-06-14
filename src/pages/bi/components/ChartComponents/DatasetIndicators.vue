<template>
  <div v-if="!props.dataset" class="fields-placeholder">
    <div class="alert alert-info info-box">
      <CircleAlert :size="40" class="me-1" />
      Прежде чем увидеть содержимое, добавьте датасет
    </div>
  </div>

  <div v-else class="h-100">
    <ul v-if="!loading" class="fields-list">
      <li v-for="f in fields" :key="f.id" class="field-item">
        <span class="field-icon">
            <component :is="typeIcon[f.type] || Type" size="16" />
        </span>
        <span class="field-name">{{ f.name }}</span>
        <span class="field-type">({{ f.type }})</span>
      </li>

      <li v-if="!fields.length" class="field-empty">
        <i>Показатели не найдены</i>
      </li>
    </ul>

    <ul v-else class="fields-list">
      <li v-for="n in 4" :key="n" class="field-item loading">
        <div class="skeleton-icon" />
        <div class="skeleton-text" />
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Type, CircleAlert, Calendar, Hash, CheckCircle } from 'lucide-vue-next'
import chartService from '@/js/api/services/bi/chartService.js'

const props   = defineProps({ dataset: Object })
const fields  = ref([])
const loading = ref(false)

 const typeIcon = {
   string : Type,
   number : Hash,
   date   : Calendar,
   boolean: CheckCircle
 }

/* перезапускаемся при смене датасета */
watch(
  () => props.dataset?.id,
  id => { id ? fetchColumns(id) : fields.value = [] },
  { immediate: true }
)

async function fetchColumns (datasetId) {
  loading.value = true
  try {
    const { data } = await chartService.getColumns(datasetId)

    /* data.columns = [{name, type, pg_type}]  */
    if (Array.isArray(data?.columns)) {
      fields.value = data.columns.map((c, i) => ({
        id   : 'col_' + i,
        name : c.name || c,
        type : c.type || 'string'
      }))
    } else {
      fields.value = []
    }
  } catch {
    fields.value = []
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.info-box       { height:100%; display:flex; justify-content:center; align-items:center; flex-direction:column; gap:10px; }
.fields-list    { list-style:none; margin:0; padding:0; overflow-y:auto; display:flex; flex-direction:column; gap:6px; height:100%; }
.field-item     { display:flex; align-items:center; gap:10px; padding:6px 8px; border-radius:6px; font-size:14px; color:var(--color-primary-text); transition:background .2s; }
.field-item:hover { background:var(--color-hover-background); }
.field-icon     { color:var(--color-accent); }
.field-name     { font-weight:500; flex:1 1 0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.field-type     { color:#bbb; font-size:13px; }
.field-empty    { display:flex; justify-content:center; color:var(--color-secondary-text); padding:24px 0; }

.loading        { pointer-events:none; background:transparent!important; }
.skeleton-icon,
.skeleton-text  { background:var(--color-secondary-text); border-radius:4px; animation:shimmer 1.3s ease-in-out infinite; }
.skeleton-icon  { width:16px; height:16px; }
.skeleton-text  { width:120px; height:14px; margin-left:10px; }
@keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:1} }
</style>
