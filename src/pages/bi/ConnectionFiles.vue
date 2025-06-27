<template>
    <div class="layout">
        <aside class="sidebar">
            <div class="name">
                <div class="name_container">
                    <button @click="goToNewConnection" class="icon-button" title="Новое подключение">
                        <ArrowLeft class="icon" />
                    </button>
                    <img src="/src/assets/bi/icons/folder_windows_style.svg" class="icon_name" />
                    <div class="title">Файлы</div>
                </div>
            </div>

            <div class="file-upload-button">
                <div class="upload-button">
                    <button class="btn btn-outline-danger" @click="triggerFileUpload">
                        <Upload class="icon_upload" />Загрузить файл
                    </button>
                    <input type="file" ref="fileInput" accept=".csv,.xlsx,.txt" multiple @change="handleFileUpload"
                        style="display: none" />
                    <input type="file" ref="replaceInput" accept=".csv,.xlsx,.txt" style="display: none" @change="handleFileReplace" />
                </div>
            </div>

            <div class="file-list">
                <div v-if="tempUploadedFiles.length">
                    <div class="section-header">Новые файлы</div>
                    <FileItem v-for="file in tempUploadedFiles" :key="file.temp_path" :file="file" :isTemp="true"
                        :isActive="selectedFile === file" @select="selectFile" @tooltip-show="onIconHover"
                        @tooltip-hide="hideTooltipWithDelay" @delete="() => removeTempFile(file)"
                        @pick-sheets="openSheetPicker" />
                </div>
                <div v-if="uploadedFiles.length">
                    <div class="section-header">Загруженные ранее</div>
                    <FileItem v-for="file in uploadedFiles" :key="file.id" :file="file" :isTemp="false"
                        :isActive="selectedFile === file" @replace="replaceFile" @rename="renameFile"
                        @delete="deleteFile" @select="selectFile" @tooltip-show="onIconHover"
                        @tooltip-hide="hideTooltipWithDelay" @pick-sheets="openSheetPicker" />
                </div>
            </div>
        </aside>

        <header class="file_area_header">
            <div class="file_area_header_label"><Waypoints /><h4>{{ connectionName || '...' }}</h4></div>
            <div class="file_area_header_buttons">
                <button type="button" class="btn btn-secondary">Создать датасет</button>
                <button type="button" v-if="showSaveChangesButton" class="btn btn-success" @click="saveChanges">Сохранить изменения</button>
            </div>
        </header>
        <main class="file_area">
            <FilePreviewPanel v-if="selectedFile" :file="selectedFile" />
        </main>
    </div>

    <transition name="fade">
        <div v-show="showTooltip" :style="tooltipStyle" class="tooltip show">{{ tooltipText }}</div>
    </transition>

    <XlsxSheetPicker :visible="isSheetPickerVisible" :filename="currentUploadFile?.name || ''" :sheets="availableSheets" :currentSheet="sheetBeingEdited" @confirm="handleSheetSelection" @cancel="isSheetPickerVisible = false" />
</template>

<script setup>
import { watch, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Upload, Waypoints } from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import FileItem from './components/FileItem.vue'
import FilePreviewPanel from './components/FilePreviewPanel.vue'
import XlsxSheetPicker from './components/FilePreview/XlsxSheetPicker.vue'

import { useRedirectIfFileConnection } from '@/pages/bi/components/js/useRedirectIfFileConnection'
import { useFileUploader } from '@/pages/bi/components/js/useFileUploader'
import { useTooltip } from '@/pages/bi/components/js/useTooltip'
import { useFileList } from '@/pages/bi/components/js/useFileList'
import { useFileActions } from '@/pages/bi/components/js/useFileActions'

const router = useRouter()
const route = useRoute()

const fileInput = ref(null)
const replaceInput = ref(null)
const fileToReplace = ref(null)
const selectedFile = ref(null)
const sheetBeingEdited = ref(null)

const isSheetPickerVisible = ref(false)
const currentUploadFile = ref(null)
const availableSheets = ref([])
const uploadedFiles = ref([])           // загруженные из БД
const tempUploadedFiles = ref([])       // временно загруженные

const connectionId = ref(null)

useRedirectIfFileConnection()
const { tooltipText, tooltipStyle, showTooltip, onIconHover, hideTooltipWithDelay } = useTooltip()
const { removeTempFile, openSheetPicker, selectFile, loadUserFiles, getSheetNameFromFile } = useFileList(tempUploadedFiles, selectedFile, uploadedFiles, currentUploadFile, availableSheets, sheetBeingEdited, isSheetPickerVisible, connectionId)
const { uploadFile, uploadFileRaw, finalizeUploads, handleSheetSelection, handleFileUpload } = useFileUploader(tempUploadedFiles, selectedFile, isSheetPickerVisible, currentUploadFile, availableSheets, loadUserFiles, connectionId)
const { deleteFile, handleFileReplace, renameFile } = useFileActions(uploadedFiles, selectedFile, fileToReplace, loadUserFiles, connectionId)

function goToNewConnection() {
    router.push('/bi/connections/new/')
}

function triggerFileUpload() {
    fileInput.value?.click()
}

function replaceFile(file) {
    if (file.file_type === 'xlsx' && file.pendingSheets?.length) {
        currentUploadFile.value = file
        availableSheets.value = file.pendingSheets
        sheetBeingEdited.value = getSheetNameFromFile(file.name)
        isSheetPickerVisible.value = true
    } else {
        fileToReplace.value = file
        replaceInput.value?.click()
    }
}

async function loadConnectionFiles() {
  const connectionId = route.params.pk
  if (!connectionId) {
    console.error('connectionId отсутствует в маршруте')
    return
  }

  const res = await apiClient.get(`bi_analysis/bi_datasets/connection/${connectionId}/files/`)
  
  if (res.success) {
    uploadedFiles.value = res.data
  } else {
    console.error('Ошибка загрузки файлов подключения:', res.errors || res)
  }
}

const showSaveChangesButton = computed(() => {
    return selectedFile.value?.originalFile != null
})

async function saveChanges() {
  if (!tempUploadedFiles.value.length) {
    alert('Нет новых файлов для сохранения.')
    return
  }

  try {
    await finalizeUploads(connectionId.value)
    alert('Файлы успешно сохранены.')
    await loadUserFiles(connectionId.value)
  } catch (err) {
    console.error('Ошибка при сохранении файлов:', err)
    alert('Не удалось сохранить файлы.')
  }
}

const connectionName = ref('')

async function loadConnectionInfo() {
  const connectionId = route.params.pk
  if (!connectionId) return

  const res = await apiClient.get(`bi_analysis/bi_connections/${connectionId}/`)
  if (res.success && res.data?.name) {
    connectionName.value = res.data.name
  }
}

watch(() => route.params.pk || route.params.connectionId, async (newPk) => {
  if (newPk) {
    connectionId.value = Number(newPk)

    await loadConnectionInfo()
    await loadConnectionFiles()
  }
}, { immediate: true })
</script>

<style scoped>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

.tooltip {
    position: absolute;
    background: var(--color-primary-background);
    color: var(--color-primary-text);
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 0.85rem;
    white-space: nowrap;
    z-index: auto;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    pointer-events: none;
    opacity: 0;
    transform: translateY(-5px) translateX(-50%);
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.tooltip.show {
    opacity: 1;
    transform: translateY(0) translateX(-50%);
}

html,
body {
    height: 100%;
    color: var(--color-primary-text);
}

.layout {
    display: grid;
    border-radius: 12px;
    border: 1px solid var(--color-border);
    grid-template-columns: 260px 1fr;
    grid-template-rows: 56px 1fr;
    grid-template-areas:
        "sidebar header"
        "sidebar chat";
    height: 85vh;
    background-color: transparent;
}

.sidebar {
    grid-area: sidebar;
    background-color: transparent;
    padding: 1rem;
    background-color: var(--color-primary-background);
    border-top-left-radius: 12px;
}

.file_area_header {
    position: relative;
    grid-area: header;
    background-color: var(--color-primary-background);
    display: flex;
    gap: 20px;
    height: 61px;
    align-items: center;
    padding: 0 1rem;
    border-top-right-radius: 12px;
    border-bottom: 1px solid var(--color-border);
}

.file_area_header_buttons {
    display: flex;
    justify-content: flex-end;
    margin-left: auto;
    gap: 10px;
}

.file_area {
    grid-area: chat;
    background-color: var(--color-secondary-background);
    padding: 1rem;
    overflow-y: auto;
}

.icon-button {
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: background 0.2s ease;
    border-radius: 6px;
    margin-right: 10px;
}

.icon-button:hover {
    background-color: var(--color-hover-background);
}

.icon {
    width: 18px;
    height: 18px;
    color: var(--color-primary-text);
}

.icon_name {
    width: 32px;
    height: 32px;
    margin-right: 5px;
}

.icon_upload {
    width: 16px;
    height: 16px;
    margin-right: 8px;
    vertical-align: middle;
}

.title {
    font-weight: bolder;
}

.name {
    font-size: 1.2rem;
    margin-inline: -1rem;
    padding-inline: 1rem;
    border-bottom: 1px solid var(--color-border);
}

.name_container {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding-bottom: 0.75rem;
}

.file-list {
    list-style: none;
    line-height: 1.8;
    font-size: 0.95rem;
    color: var(--color-secondary-text);
    padding-top: 5px;
}

.file-upload-button {
    position: relative;
    margin-top: 20px;
    margin-bottom: 20px;
}

.file-upload-button::after {
    content: '';
    position: absolute;
    bottom: -20px;
    left: 0;
    right: 0;
    height: 1px;
    background-color: var(--color-border);
}

.btn-outline-danger {
    width: 100%;
    height: 2rem;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.section-header {
    margin-top: 10px;
    margin-bottom: 10px;
    font-weight: bold;
}

.btn-success {
    width: 13rem;
    height: 2rem;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary-text);
}

.btn-outline-success {
    width: 13rem;
    height: 2rem;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.btn-secondary {
    width: 10rem;
    height: 2rem;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary-text);
}

.file_area_header_label{
    display: flex;
    align-items: center;
    gap: 5px;
}
</style>