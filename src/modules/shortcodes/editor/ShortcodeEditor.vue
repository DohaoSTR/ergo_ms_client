<template>
  <div class="row">
    <!-- Палитра компонентов -->
    <div class="col-4">
      <ComponentPalette />
    </div>

    <!-- Редактор -->
    <div class="col-8">
      <EditorCanvas v-model="canvasComponents" @open-settings="openSettings" />
    </div>

    <!-- Предпросмотр -->
    <div class="col-12">
      <PreviewCanvas :components="canvasComponents" />
    </div>

    <!-- Offcanvas настроек -->
    <div
      class="offcanvas offcanvas-end"
      tabindex="-1"
      id="componentSettings"
      :class="{ show: isOpen }"
      :style="{ visibility: isOpen ? 'visible' : 'hidden' }"
      @click.self="closeSettings"
    >
      <div class="offcanvas-header">
        <h5 class="offcanvas-title">Настройки: {{ selectedComponent?.template_name || '—' }}</h5>
        <button type="button" class="btn-close" @click="closeSettings"></button>
      </div>

      <div class="offcanvas-body">
        <ComponentSettings v-if="selectedComponent" :component="selectedComponent" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { selectedComponent } from '../js/shortcodeStore'
import ComponentPalette from './ComponentPalette.vue'
import EditorCanvas from './EditorCanvas.vue'
import ComponentSettings from './ComponentSettings.vue'
import PreviewCanvas from './PreviewCanvas.vue'

const canvasComponents = ref([])
const isOpen = ref(false)

function openSettings(component) {
  selectedComponent.value = component
  isOpen.value = true
}

function closeSettings() {
  selectedComponent.value = null
  isOpen.value = false
}
</script>
