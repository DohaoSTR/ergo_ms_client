<template>
  <div 
    class="default-avatar"
    :class="[
      `default-avatar--${size}`,
      { 'default-avatar--clickable': clickable }
    ]"
    :title="title"
  >
    <User :size="iconSize" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { User } from 'lucide-vue-next'

const props = defineProps({
  size: {
    type: String,
    default: 'medium', // small, medium, large
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  clickable: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Пользователь'
  }
})

const iconSize = computed(() => {
  const sizes = {
    small: 16,
    medium: 20,
    large: 48
  }
  return sizes[props.size]
})
</script>

<style scoped lang="scss">
.default-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  color: #1976d2;
  border: 2px solid rgba($color: #1976d2, $alpha: 0.2);
  transition: all 0.2s ease;
  user-select: none;
  
  &--small {
    width: 32px;
    height: 32px;
    border-width: 1px;
  }
  
  &--medium {
    width: 40px;
    height: 40px;
  }
  
  &--large {
    width: 120px;
    height: 120px;
    border-width: 3px;
  }
  
  &--clickable {
    cursor: pointer;
    
    &:hover {
      transform: scale(1.05);
      border-color: rgba($color: #1976d2, $alpha: 0.4);
      box-shadow: 0 4px 16px rgba($color: #1976d2, $alpha: 0.15);
      background: linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%);
    }
  }
}
</style> 