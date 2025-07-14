<template>
  <button 
    @click="handleDownload" 
    :class="buttonClass"
    :disabled="isDownloading"
    :title="title"
  >
    <Download v-if="!isDownloading" :size="iconSize" />
    <div v-else class="spinner-border spinner-border-sm" role="status"></div>
    <span v-if="showText" class="ms-1">
      {{ isDownloading ? 'Скачивание...' : buttonText }}
    </span>
  </button>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Download } from 'lucide-vue-next'
import { downloadResource } from '@/modules/cms/filemanager/js/resourceDownload'

const props = defineProps({
  resource: {
    type: Object,
    required: true
  },
  variant: {
    type: String,
    default: 'outline-success', // outline-success, success, primary, etc.
    validator: (value) => ['outline-success', 'success', 'outline-primary', 'primary', 'outline-secondary', 'secondary'].includes(value)
  },
  size: {
    type: String,
    default: 'sm', // sm, md, lg
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  showText: {
    type: Boolean,
    default: false
  },
  buttonText: {
    type: String,
    default: 'Скачать'
  },
  customClass: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['downloadStart', 'downloadSuccess', 'downloadError'])

const isDownloading = ref(false)

const buttonClass = computed(() => {
  const baseClasses = ['btn']
  
  // Размер кнопки
  if (props.size === 'sm') {
    baseClasses.push('btn-sm')
  } else if (props.size === 'lg') {
    baseClasses.push('btn-lg')
  }
  
  // Вариант кнопки
  baseClasses.push(`btn-${props.variant}`)
  
  // Кастомные классы
  if (props.customClass) {
    baseClasses.push(props.customClass)
  }
  
  return baseClasses.join(' ')
})

const iconSize = computed(() => {
  switch (props.size) {
    case 'lg': return 20
    case 'md': return 16
    case 'sm': 
    default: return 14
  }
})

const title = computed(() => {
  if (isDownloading.value) {
    return 'Скачивание...'
  }
  return `Скачать ${props.resource.name || 'ресурс'}`
})

const handleDownload = async () => {
  if (isDownloading.value) return
  
  isDownloading.value = true
  emit('downloadStart', props.resource)
  
  try {
    const success = await downloadResource(
      props.resource,
      (resource) => {
        emit('downloadSuccess', resource)
      },
      (errorMsg) => {
        emit('downloadError', errorMsg, props.resource)
      }
    )
  } finally {
    isDownloading.value = false
  }
}
</script>

<style scoped>
.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}

.btn {
  cursor: pointer !important;
  position: relative;
}

.btn:hover {
  cursor: pointer !important;
}

.btn:disabled {
  cursor: not-allowed !important;
  pointer-events: all; /* Разрешаем события для показа курсора not-allowed */
}

/* Все дочерние элементы кнопки не должны перехватывать события мыши */
.btn * {
  pointer-events: none !important;
  cursor: inherit !important;
}

/* Иконки внутри кнопки */
.btn svg {
  cursor: pointer !important;
  pointer-events: none !important;
}

/* Текст внутри кнопки */
.btn span {
  cursor: pointer !important;
  pointer-events: none !important;
}

/* Спиннер во время загрузки */
.btn .spinner-border {
  cursor: not-allowed !important;
  pointer-events: none !important;
}

/* Обеспечиваем что весь контент кнопки наследует курсор */
.btn:not(:disabled) *,
.btn:not(:disabled) svg,
.btn:not(:disabled) span {
  cursor: pointer !important;
}

.btn:disabled *,
.btn:disabled svg,
.btn:disabled span,
.btn:disabled .spinner-border {
  cursor: not-allowed !important;
}
</style> 