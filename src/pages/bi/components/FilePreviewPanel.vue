<template>
  <div v-if="file">
    <CsvPreview v-if="file.file_type === 'csv'" :file="file" :key="`csv-${file.id}`" />
    <XlsxPreview v-else-if="file.file_type === 'xlsx' && (file.isReady === undefined || file.isReady === true)" :file="file" :key="`xlsx-${file.id}`"/>
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
  </script>
  
<style scoped>
  .preview-panel {
    background-color: #1e1f22;
    border-left: 1px solid #4e5058;
    height: 100%;
    padding: 1rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 1rem;
    margin-bottom: 1rem;
    color: #fff;
  }
  
  .file-ext {
    font-size: 0.85rem;
    color: #b5bac1;
    margin-left: 1rem;
  }
  
  .preview-table {
    width: 100%;
    border-collapse: collapse;
    color: #e4e4e7;
    font-size: 0.875rem;
  }
  
  .preview-table th,
  .preview-table td {
    padding: 6px 10px;
    border: 1px solid #3e3f45;
    text-align: left;
  }
  
  .panel-footer {
    margin-top: auto;
    display: flex;
    justify-content: flex-end;
    padding-top: 1rem;
  }
  
  .btn-create {
    background-color: #ef4444;
    color: #fff;
    padding: 8px 12px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .btn-create:hover {
    background-color: #dc2626;
  }
</style>
  