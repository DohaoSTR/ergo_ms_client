<template>
  <BaseModal
    :show="show"
    :title="editing ? 'Редактировать форум' : 'Создать форум'"
    :loading="loading"
    size="lg"
    @close="$emit('close')"
    @confirm="handleSave"
  >
    <template #icon>
      <MessageSquare :size="20" class="text-secondary" />
    </template>

    <form @submit.prevent="handleSave">
      <div class="mb-3">
        <label class="form-label">Название форума *</label>
        <input 
          v-model="form.name" 
          type="text" 
          class="form-control" 
          :class="{ 'is-invalid': validationErrors.name }"
          required
          placeholder="Введите название форума"
        />
        <div v-if="validationErrors.name" class="invalid-feedback">
          {{ validationErrors.name }}
        </div>
      </div>
      
      <div class="mb-3">
        <label class="form-label">Описание</label>
        <textarea 
          v-model="form.description" 
          class="form-control" 
          rows="3"
          placeholder="Описание форума"
        ></textarea>
      </div>

      <div class="row">
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Тема *</label>
            <select 
              v-model="form.theme" 
              class="form-select"
              :class="{ 'is-invalid': validationErrors.theme }"
              required
            >
              <option value="">Выберите тему</option>
              <option v-for="theme in themes" :key="theme.id" :value="theme.id">
                {{ theme.name }}
              </option>
            </select>
            <div v-if="validationErrors.theme" class="invalid-feedback">
              {{ validationErrors.theme }}
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Тип форума</label>
            <select v-model="form.forum_type" class="form-select">
              <option value="general">Общий</option>
              <option value="q_and_a">Вопросы и ответы</option>
              <option value="single_discussion">Одна дискуссия</option>
              <option value="news">Новости</option>
              <option value="social">Социальный</option>
            </select>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Максимальное количество вложений</label>
            <input 
              v-model="form.max_attachments" 
              type="number" 
              class="form-control"
              min="0"
              placeholder="5"
            />
          </div>
        </div>
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Максимальный размер файла (MB)</label>
            <input 
              v-model="form.max_attachment_size_mb" 
              type="number" 
              class="form-control"
              min="1"
              placeholder="10"
            />
          </div>
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-md-6">
          <div class="form-check">
            <input 
              v-model="form.is_moderated" 
              class="form-check-input" 
              type="checkbox" 
              id="isModerated"
            />
            <label class="form-check-label" for="isModerated">
              Модерируемый форум
            </label>
            <div class="form-text">Сообщения требуют одобрения перед публикацией</div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-check">
            <input 
              v-model="form.allow_anonymous" 
              class="form-check-input" 
              type="checkbox" 
              id="allowAnonymous"
            />
            <label class="form-check-label" for="allowAnonymous">
              Разрешить анонимные сообщения
            </label>
          </div>
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-md-6">
          <div class="form-check">
            <input 
              v-model="form.allow_attachments" 
              class="form-check-input" 
              type="checkbox" 
              id="allowAttachments"
            />
            <label class="form-check-label" for="allowAttachments">
              Разрешить вложения
            </label>
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-check">
            <input 
              v-model="form.track_read_posts" 
              class="form-check-input" 
              type="checkbox" 
              id="trackReadPosts"
            />
            <label class="form-check-label" for="trackReadPosts">
              Отслеживать прочитанные сообщения
            </label>
          </div>
        </div>
      </div>

      <div class="mb-3">
        <div class="form-check">
          <input 
            v-model="form.force_subscribe" 
            class="form-check-input" 
            type="checkbox" 
            id="forceSubscribe"
          />
          <label class="form-check-label" for="forceSubscribe">
            Принудительная подписка на уведомления
          </label>
          <div class="form-text">Все участники курса будут автоматически подписаны</div>
        </div>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { MessageSquare } from 'lucide-vue-next'
import BaseModal from '../BaseModal.vue'

const props = defineProps({
  show: Boolean,
  editing: Boolean,
  forumData: Object,
  themes: Array,
  courses: Array,
  loading: Boolean
})

const emit = defineEmits(['close', 'save'])

const form = ref({
  name: '',
  description: '',
  forum_type: 'general',
  theme: null,
  is_moderated: false,
  allow_anonymous: false,
  allow_attachments: true,
  max_attachments: 5,
  max_attachment_size_mb: 10,
  track_read_posts: true,
  force_subscribe: false
})

const validationErrors = ref({})

function resetForm() {
  form.value = {
    name: '',
    description: '',
    forum_type: 'general',
    theme: null,
    is_moderated: false,
    allow_anonymous: false,
    allow_attachments: true,
    max_attachments: 5,
    max_attachment_size_mb: 10,
    track_read_posts: true,
    force_subscribe: false
  }
  validationErrors.value = {}
}

function handleSave() {
  validationErrors.value = {}
  
  const errors = {}
  
  if (!form.value.name?.trim()) {
    errors.name = 'Название форума обязательно'
  }
  
  if (!form.value.theme) {
    errors.theme = 'Выберите тему'
  }

  if (Object.keys(errors).length > 0) {
    validationErrors.value = errors
    return
  }

  // Подготавливаем данные для отправки
  const forumData = {
    name: form.value.name?.trim(),
    description: form.value.description?.trim() || 'Описание форума',
    forum_type: form.value.forum_type || 'general',
    theme: form.value.theme,
    is_moderated: Boolean(form.value.is_moderated),
    allow_anonymous: Boolean(form.value.allow_anonymous),
    allow_attachments: Boolean(form.value.allow_attachments),
    max_attachments: form.value.max_attachments || 5,
    max_attachment_size: (form.value.max_attachment_size_mb || 10) * 1024 * 1024,
    track_read_posts: Boolean(form.value.track_read_posts),
    force_subscribe: Boolean(form.value.force_subscribe)
  }

  emit('save', forumData, validationErrors)
}

watch(() => props.forumData, (newData) => {
  if (newData && Object.keys(newData).length > 0) {
    if (props.editing) {
      let themeId = newData.theme
      if (typeof themeId === 'object' && themeId?.id) {
        themeId = themeId.id
      }
      
      form.value = {
        name: newData.name || '',
        description: newData.description || '',
        forum_type: newData.forum_type || 'general',
        theme: themeId,
        is_moderated: newData.is_moderated || false,
        allow_anonymous: newData.allow_anonymous || false,
        allow_attachments: newData.allow_attachments !== undefined ? newData.allow_attachments : true,
        max_attachments: newData.max_attachments || 5,
        max_attachment_size_mb: newData.max_attachment_size ? Math.round(newData.max_attachment_size / (1024 * 1024)) : 10,
        track_read_posts: newData.track_read_posts !== undefined ? newData.track_read_posts : true,
        force_subscribe: newData.force_subscribe || false
      }
    } else {
      // Для создания нового форума с предустановленными значениями
      form.value = {
        name: '',
        description: '',
        forum_type: 'general',
        theme: newData.theme || null,
        is_moderated: false,
        allow_anonymous: false,
        allow_attachments: true,
        max_attachments: 5,
        max_attachment_size_mb: 10,
        track_read_posts: true,
        force_subscribe: false
      }
    }
  } else if (!props.editing) {
    resetForm()
  }
}, { immediate: true })

watch(() => props.show, (newShow) => {
  if (!newShow) {
    validationErrors.value = {}
  }
})
</script> 