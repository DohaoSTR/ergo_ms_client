<template>
  <div v-if="file">
    <!-- CSV preview -->
    <CsvPreview v-if="isCsvFile(file)" :file="file" :key="`csv-${file.id || file.temp_path || file.name}`" />

    <!-- XLSX preview -->
    <XlsxPreview v-else-if="isXlsxFile(file)" :file="file" :key="`xlsx-${file.id || file.temp_path || file.name}`"/>

    <!-- TXT preview -->
    <TxtPreview v-else-if="isTxtFile(file)" :file="file" :key="`txt-${file.id || file.temp_path || file.name}`" />

    <div v-else class="text-muted p-4">Формат файла не поддерживается для предпросмотра.</div>
  </div>
</template>

<script setup>
import CsvPreview from './FilePreview/CsvPreview.vue'
import XlsxPreview from './FilePreview/XlsxPreview.vue'
import TxtPreview from './FilePreview/TxtPreview.vue'

const props = defineProps({
  file: Object
})

function isXlsxFile(file) {
  if (!file) return false
  if (file.file_type === 'xlsx') return true
  if (file.name && file.name.toLowerCase().endsWith('.xlsx')) return true
  return false
}

function isTxtFile(file) {
  console.log('Preview type:', props.file?.file_type, props.file?.name)
  return file.file_type === 'txt' ||
    (file.name && file.name.toLowerCase().endsWith('.txt'))
}

function isCsvFile(file) {
  return file.file_type === 'csv' ||
    (file.name && file.name.toLowerCase().endsWith('.csv'))
}
</script>
  
<style scoped></style>
  