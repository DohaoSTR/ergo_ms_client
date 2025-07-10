<script setup>
import { defineEmits, defineProps, computed } from 'vue'
import ModalCenter from '@/pages/bio/components/modals/ModalCenter.vue'
import { getZoneTypeTranslation } from '@/pages/bio/js/bio-helpers'

const props = defineProps({
  modalId: {
    type: String,
    required: true
  },
  duplicateSites: {
    type: Array,
    required: true,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  selectedSitesCount: {
    type: Number,
    default: 0
  }
})

// Вычисляем количество новых площадок (не дубликатов)
const newSitesCount = computed(() => {
  return props.selectedSitesCount - props.duplicateSites.length
})

// Проверяем, все ли выбранные площадки дублируются
const allSitesAreDuplicates = computed(() => {
  return props.duplicateSites.length === props.selectedSitesCount
})

const emit = defineEmits(['replaceAndAdd', 'skipDuplicates', 'cancel'])

const handleReplaceAndAdd = () => {
  emit('replaceAndAdd')
}

const handleSkipDuplicates = () => {
  emit('skipDuplicates')
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <ModalCenter :modalId="modalId" title="Дублирующиеся площадки" :showFooter="true">
    <div class="duplicate-sites-container">
      <!-- Информационное сообщение вверху -->
      <div class="alert alert-secondary mb-3">
        <p class="mb-0" v-if="allSitesAreDuplicates">
          Все выбранные площадки уже существуют в сводном анализе.
          Пожалуйста, выберите действие:
        </p>
        <p class="mb-0" v-else>
          Некоторые из выбранных площадок уже существуют в сводном анализе.
          Пожалуйста, выберите действие:
        </p>
      </div>

      <!-- Блок со статистикой -->
      <div class="mb-3">
        <h6 class="text-muted mb-3">Информация</h6>
        <div class="sites-summary">
          <div class="sites-summary-item">
            <div class="summary-value">{{ selectedSitesCount }}</div>
            <div class="summary-label">Выбрано площадок</div>
          </div>
          <div class="sites-summary-item">
            <div class="summary-value">{{ duplicateSites.length }}</div>
            <div class="summary-label">Дублируются</div>
          </div>
          <div class="sites-summary-item" v-if="newSitesCount > 0">
            <div class="summary-value">{{ newSitesCount }}</div>
            <div class="summary-label">Новых площадок</div>
          </div>
        </div>
      </div>

      <!-- Список дублирующихся площадок -->
      <div>
        <h6 class="text-muted mb-3">Дублирующиеся площадки</h6>
        <div class="duplicate-sites-list">
          <div 
            v-for="site in duplicateSites" 
            :key="site.id" 
            class="duplicate-site-item"
          >
            <span class="site-number">№{{ site.site_number }}</span>
            <span class="site-zone">{{ site.zone_type_translated || getZoneTypeTranslation(site.zone_type) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <button
        type="button"
        class="btn btn-outline-danger"
        @click="handleReplaceAndAdd"
        :disabled="loading"
      >
        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
        Заменить существующие
      </button>
      
      <button
        v-if="newSitesCount > 0"
        type="button"
        class="btn btn-primary"
        @click="handleSkipDuplicates"
        :disabled="loading"
      >
        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
        Добавить только новые
      </button>
      
      <button
        type="button"
        class="btn btn-secondary"
        @click="handleCancel"
        :disabled="loading"
        data-bs-dismiss="modal"
      >
        Отмена
      </button>
    </template>
  </ModalCenter>
</template>

<style scoped lang="scss">
.duplicate-sites-container {
  overflow-y: auto;
}

.sites-summary {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--bs-border-color);
  padding-bottom: 1rem;
}

.sites-summary-item {
  .summary-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--bs-body-color);
  }
  
  .summary-label {
    font-size: 0.875rem;
    color: var(--bs-secondary-color);
  }
}

.duplicate-sites-list {
  border: 1px solid var(--bs-border-color);
  border-radius: 0.375rem;
}

.duplicate-site-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--bs-border-color);
  
  &:last-child {
    border-bottom: 0;
  }
  
  .site-number {
    font-weight: 600;
    margin-right: 1rem;
  }
  
  .site-zone {
    color: var(--bs-secondary-color);
  }
}
</style>