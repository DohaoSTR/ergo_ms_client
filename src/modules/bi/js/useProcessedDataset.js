import { computed } from 'vue'

export default function useProcessedDataset(datasetRef, fieldsRef) {
  return computed(() => {
    const rows   = datasetRef.value || []

    const xField = fieldsRef.value.x?.[0]
    const yList  = fieldsRef.value.y   || []
    const sortBy = fieldsRef.value.sort?.[0]

    if (sortBy) {
      rows.sort((a, b) => {
        const A = a[sortBy.name]
        const B = b[sortBy.name]
        return A === B ? 0 : A > B ? 1 : -1
      })
    }
    return rows
  })
}