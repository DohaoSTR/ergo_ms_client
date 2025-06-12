<template>
  <div v-if="file">
    <!-- CSV preview -->
    <CsvPreview v-if="file.file_type === 'csv'" :file="file" :key="`csv-${file.id}`" />

    <!-- XLSX preview -->
    <XlsxPreview v-else-if="isXlsxFile(file)" :file="file" :key="`xlsx-${file.id || file.temp_path || file.name}`"/>

    <!-- TXT preview -->
    <TxtPreview v-else-if="file.file_type === 'txt'" :file="file" :key="`txt-${file.id}`" />

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
  if (file.originalFile && (file.originalFile instanceof File || file.originalFile instanceof Blob)) {
    return true
  }
  if (file.file_type === 'xlsx') {
    return true
  }
  return false
}
</script>
  
<style scoped></style>
  