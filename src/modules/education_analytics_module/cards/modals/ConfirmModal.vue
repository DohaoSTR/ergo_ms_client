<template>
  <div v-if="show" class="modal-overlay" @click.stop>
    <div class="modal-content confirm-modal" @click.stop>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <div class="changes-table">
        <table>
          <thead>
            <tr>
              <th>Поле</th>
              <th>Старое значение</th>
              <th>Новое значение</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="change in changes" :key="change.field">
              <td>{{ change.field }}</td>
              <td>
                <span v-if="Array.isArray(change.oldValue)">{{ change.oldValue.join(', ') }}</span>
                <span v-else>{{ change.oldValue }}</span>
              </td>
              <td>
                <span v-if="Array.isArray(change.newValue)">{{ change.newValue.join(', ') }}</span>
                <span v-else>{{ change.newValue }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="modal-actions">
        <button class="confirm-btn" @click="$emit('confirm')">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Сохранить
        </button>
        <button class="cancel-btn" @click="$emit('cancel')">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Отмена
        </button>
      </div>
    </div>
  </div>
</template>
<script setup>
defineProps({
  show: Boolean,
  title: String,
  message: String,
  changes: Array
});
defineEmits(['confirm', 'cancel']);
</script>
<style scoped>
/* Стилизация модального окна */
</style>
