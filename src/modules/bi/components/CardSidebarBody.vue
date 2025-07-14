<script setup>

const props = defineProps({
  icon: { type: [Object, String, Function], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  targetPage: { type: String, required: true }
})

const emit = defineEmits(['open'])

const triggerSidebar = () => {
  emit('open', props.targetPage)
}
</script>

<template>
  <div class="d-flex flex-column align-items-center justify-content-center text-center">
    <component class="mb-4 text-secondary-emphasis" :is="icon" :size="35" />
    <h5 class="mb-3">{{ title }}</h5>
    <p class="mb-4">{{ description }}</p>
    <button class="btn btn-primary mt-auto" @click="triggerSidebar">Открыть</button>
  </div>
</template>

<style scoped></style>
