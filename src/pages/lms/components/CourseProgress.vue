<script setup>
import { computed } from 'vue'
import { CheckCircle, Circle } from 'lucide-vue-next'

const props = defineProps({
  progress: {
    type: Number,
    required: true,
    validator: (value) => value >= 0 && value <= 100
  },
  showPercentage: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  variant: {
    type: String,
    default: 'primary'
  }
})

const progressClass = computed(() => {
  const classes = ['progress-custom']
  classes.push(`progress-${props.size}`)
  return classes.join(' ')
})

const barClass = computed(() => {
  return `progress-bar bg-${props.variant}`
})

const progressText = computed(() => {
  if (props.progress === 100) return 'Завершено'
  return `${props.progress}%`
})
</script>

<template>
  <div class="course-progress">
    <div v-if="showPercentage" class="d-flex justify-content-between align-items-center mb-2">
      <span class="progress-label">Прогресс</span>
      <span class="progress-text fw-bold">{{ progressText }}</span>
    </div>
    
    <div :class="progressClass">
      <div 
        :class="barClass"
        role="progressbar" 
        :style="`width: ${progress}%`"
        :aria-valuenow="progress"
        aria-valuemin="0" 
        aria-valuemax="100"
      >
        <CheckCircle v-if="progress === 100" :size="16" class="completion-icon" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.progress-custom {
  background-color: var(--bs-gray-200);
  border-radius: 0.5rem;
  overflow: hidden;
}

.progress-sm {
  height: 6px;
}

.progress-md {
  height: 10px;
}

.progress-lg {
  height: 14px;
}

.progress-bar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.25rem;
  transition: width 0.6s ease;
}

.completion-icon {
  color: white;
}

.progress-label {
  font-size: 0.875rem;
  color: var(--bs-gray-600);
}

.progress-text {
  font-size: 0.875rem;
}
</style> 