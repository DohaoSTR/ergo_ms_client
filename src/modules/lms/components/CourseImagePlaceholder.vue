<template>
  <div class="course-image-placeholder" :style="{ width: width, height: height }">
    <div class="placeholder-content">
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        class="placeholder-icon"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21,15 16,10 5,21"/>
      </svg>
      <span class="placeholder-text">{{ text }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CourseImagePlaceholder',
  props: {
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: '200px'
    },
    text: {
      type: String,
      default: 'Курс'
    }
  }
}
</script>

<style scoped>
.course-image-placeholder {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  min-width: 40px;
  min-height: 40px;
}

/* Красивый градиент для маленьких плейсхолдеров */
.course-image-placeholder[style*="40px"] {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  border-radius: 8px;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
}

/* Для маленьких размеров показываем только текст */
.course-image-placeholder[style*="40px"] .placeholder-content {
  padding: 4px;
  gap: 0;
}

.course-image-placeholder[style*="40px"] .placeholder-icon {
  display: none;
}

.course-image-placeholder[style*="40px"] .placeholder-text {
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  opacity: 1;
  color: white;
}

.placeholder-icon {
  width: 48px;
  height: 48px;
  opacity: 0.5;
}

.placeholder-text {
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  opacity: 0.7;
}

/* Для больших размеров (по умолчанию) */
.course-image-placeholder:not([style*="40px"]) .placeholder-content {
  padding: 20px;
  gap: 8px;
}
</style> 