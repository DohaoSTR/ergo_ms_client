<template>
  <div class="analysis-status">
    <div class="status-indicator" :class="statusClass">
      <component :is="statusIcon" class="status-icon" size="20" />
      <span class="status-text">{{ statusText }}</span>
    </div>
    
    <div v-if="showProgress && status === 'processing'" class="progress-container mt-2">
      <div class="progress">
        <div class="progress-bar progress-bar-striped progress-bar-animated" 
             role="progressbar" 
             style="width: 100%">
        </div>
      </div>
      <small class="text-muted">Обработка изображения...</small>
    </div>
    
    <div v-if="errorMessage" class="error-message mt-2">
      <div class="alert alert-danger small">
        <AlertTriangle class="me-1" size="16" />
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script>
import { Clock, Loader2, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-vue-next'

export default {
  name: 'AnalysisStatus',
  components: {
    Clock,
    Loader2,
    CheckCircle,
    AlertTriangle,
    HelpCircle
  },
  props: {
    status: {
      type: String,
      required: true,
      validator: value => ['pending', 'processing', 'completed', 'failed'].includes(value)
    },
    errorMessage: {
      type: String,
      default: ''
    },
    showProgress: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    statusClass() {
      const classes = {
        pending: 'status-pending',
        processing: 'status-processing',
        completed: 'status-completed',
        failed: 'status-failed'
      }
      return classes[this.status] || 'status-pending'
    },
    
    statusIcon() {
      const icons = {
        pending: 'Clock',
        processing: 'Loader2',
        completed: 'CheckCircle',
        failed: 'AlertTriangle'
      }
      return icons[this.status] || 'HelpCircle'
    },
    
    statusText() {
      const texts = {
        pending: 'Ожидает обработки',
        processing: 'Обрабатывается',
        completed: 'Завершен',
        failed: 'Ошибка'
      }
      return texts[this.status] || this.status
    }
  }
}
</script>

<style scoped>
.analysis-status {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
}

.status-pending {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-processing {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.status-completed {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-failed {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-icon {
  font-size: 1.1rem;
}

.status-text {
  font-size: 0.9rem;
}

.progress-container {
  width: 100%;
  max-width: 300px;
}

.error-message {
  width: 100%;
  max-width: 400px;
}

.progress {
  height: 0.5rem;
  background-color: #e9ecef;
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-bar {
  background-color: #007bff;
  transition: width 0.6s ease;
}
</style> 