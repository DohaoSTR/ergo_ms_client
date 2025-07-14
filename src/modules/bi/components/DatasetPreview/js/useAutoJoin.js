import { ref, watch } from 'vue'
import { autoJoinTables } from '@/modules/bi/components/DatasetPreview/js/autoJoin.js'

export function useAutoJoin(selectedTables) {
  const joins = ref([])

  watch(selectedTables, (newTables) => {
    joins.value = autoJoinTables(newTables)
  }, { immediate: true })

  return { joins }
}