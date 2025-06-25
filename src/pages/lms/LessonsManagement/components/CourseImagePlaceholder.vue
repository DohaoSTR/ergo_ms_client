<template>
  <div 
    class="course-image-placeholder d-flex align-items-center justify-content-center bg-primary text-white fw-bold"
    :style="{ width: width, height: height }"
  >
    {{ text }}
  </div>
</template>

<script setup>
defineProps({
  width: {
    type: String,
    default: '40px'
  },
  height: {
    type: String,
    default: '40px'
  },
  text: {
    type: String,
    default: '?'
  }
})
</script>

<style scoped>
.course-image-placeholder {
  border-radius: 0.375rem;
  font-size: 0.875rem;
  min-width: 40px;
  min-height: 40px;
  border: 2px solid #dee2e6;
}
</style> 