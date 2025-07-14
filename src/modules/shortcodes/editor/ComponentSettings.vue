<script setup>
import { toRefs } from 'vue'
import ImageSettings from './settings/ImageSettings.vue'
import VisualStyles from './settings/VisualStyles.vue'
import SpacingControls from './settings/SpacingControls.vue'
import MiscControls from './settings/MiscControls.vue'
import ButtonSettings from './settings/ButtonSettings.vue'
import GridSettings from './settings/GridSettings.vue'
import PageCardSettings from './settings/PageCardSettings.vue'

const props = defineProps({ component: Object })
const { component } = toRefs(props)
</script>

<template>
  <div class="settings-canvas">
    <section class="settings-section mb-4">
      <div class="section-header mb-3">
        <span class="section-icon">📝</span>
        <span class="section-title">Контент</span>
      </div>
      <div class="mb-3">
        <label class="form-label fw-bold">Название</label>
        <input v-model="component.template_name" class="form-control" />
      </div>
      <div>
        <label class="form-label fw-bold">Текст</label>
        <input v-model="component.extra_data.text" class="form-control" />
      </div>
    </section>

    <section v-if="component.component_type === 'Heading'">
      <HeadingSettings :component="component" />
    </section>

    <section v-if="component.component_type === 'Text'">
      <TextSettings :component="component" />
    </section>

    <section v-if="component.component_type === 'Button'" class="settings-section mb-4">
      <ButtonSettings :component="component" />
    </section>

    <section v-if="component.component_type === 'Image'" class="settings-section mb-4">
      <ImageSettings :component="component" />
    </section>

    <section v-if="component.component_type === 'Grid'" class="settings-section mb-4">
      <GridSettings :component="component" />
    </section>

    <section v-if="component.component_type === 'PageCard'" class="settings-section mb-4">
      <PageCardSettings :component="component" />
    </section>

    <section class="settings-section mb-4">
      <div class="section-header mb-3">
        <span class="section-icon">🎨</span>
        <span class="section-title">Внешний вид</span>
      </div>
      <VisualStyles :component="component" />
      <SpacingControls :component="component" />
    </section>

    <section class="settings-section mb-4">
      <div class="section-header mb-3">
      </div>
      <MiscControls :component="component" />
    </section>

    <div class="alert alert-secondary mt-4 small rounded-4 shadow-sm p-2">
      <div class="mb-1 text-muted" style="font-size: 13px">class_list:</div>
      <code>{{ component.class_list }}</code>
    </div>
  </div>
</template>
