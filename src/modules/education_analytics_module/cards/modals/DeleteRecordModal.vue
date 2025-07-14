<template>
  <div class="modal-mask" v-if="show">
    <div class="modal-wrapper">
      <div class="modal-container border border-2 border-danger">
        <div class="modal-header bg-danger text-white rounded-top">
          <slot name="header">
            <h5 class="mb-0">Подтверждение удаления</h5>
          </slot>
        </div>
        <div class="modal-body">
          <slot name="body">
            <p>Вы действительно хотите удалить эту запись? Это действие нельзя отменить.</p>
            <div v-if="row" class="record-details">
              <p class="record-id">ID: {{ row.id }}</p>
              <div v-for="(value, key) in getDisplayedDetails()" :key="key" class="record-field">
                <strong>{{ key }}:</strong> {{ formatValue(value) }}
              </div>
            </div>
          </slot>
        </div>
        <div class="modal-footer d-flex justify-content-end gap-2">
          <button class="btn btn-danger" @click="$emit('confirm')">Удалить</button>
          <button class="btn btn-secondary" @click="$emit('cancel')">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  show: Boolean,
  row: Object,
  isDark: Boolean
})

// Определяем какие поля показывать в модальном окне для подтверждения
const getDisplayedDetails = () => {
  if (!props.row) return {};

  // Выбираем только нужные поля для отображения
  const result = {};
  const keysToShow = ['name', 'title', 'code', 'description'].filter(key => key in props.row);

  // Если нет подходящих полей, берем первые 2-3 поля из объекта
  if (keysToShow.length === 0) {
    const allKeys = Object.keys(props.row).filter(key => key !== 'id');
    const displayKeys = allKeys.slice(0, Math.min(3, allKeys.length));
    displayKeys.forEach(key => {
      result[key] = props.row[key];
    });
  } else {
    keysToShow.forEach(key => {
      result[key] = props.row[key];
    });
  }

  return result;
};

// Форматирование значений для отображения
const formatValue = (value) => {
  if (value === null || value === undefined) return '-';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
};

defineEmits(['confirm', 'cancel'])
</script>

<style scoped>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  /* animation: modal-fade-in 0.25s; */
}
.modal-wrapper {
  width: 100%;
  max-width: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
.modal-container {
  border-radius: 14px;
  box-shadow: 0 6px 32px rgba(220,53,69,0.18), 0 1.5px 6px rgba(0,0,0,0.08);
  padding: 0 0 18px 0;
  overflow: hidden;
  transition: background 0.2s, color 0.2s;
  background: var(--color-secondary-background, #fff);
  color: var(--color-primary-text, #222);
  min-width: 320px;
  max-width: 400px;
  width: 100%;
  margin: 0 auto;
  position: relative;
}
.modal-header {
  padding: 18px 24px 12px 24px;
  background: var(--color-danger, #dc3545);
  color: #fff;
  border-radius: 14px 14px 0 0;
  box-shadow: 0 2px 8px rgba(220,53,69,0.08);
}
.modal-header h5 {
  margin: 0;
  font-weight: 700;
  letter-spacing: 0.01em;
}
.modal-body {
  padding: 18px 24px 0 24px;
  font-size: 1.08em;
}
.record-details {
  margin-top: 12px;
  padding: 10px;
  background: rgba(220,53,69,0.05);
  border-radius: 8px;
  border: 1px solid rgba(220,53,69,0.1);
}
.record-id {
  font-weight: bold;
  color: var(--color-danger, #dc3545);
  margin-bottom: 8px;
}
.record-field {
  margin-bottom: 5px;
}
.modal-footer {
  margin-top: 18px;
  padding: 0 24px 14px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.btn-danger {
  border-radius: 0.5rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(220,53,69,0.08);
  transition: background 0.2s, box-shadow 0.2s;
  background: var(--color-accent, #dc3545);
  border: none;
  color: #fff;
  padding: 8px 18px;
}
.btn-danger:hover, .btn-danger:focus {
  background: var(--color-accent, #dc3545);
  opacity: 0.85;
  box-shadow: 0 4px 16px rgba(220,53,69,0.18);
}
.btn-secondary {
  border-radius: 0.5rem;
  font-weight: 600;
  background: var(--color-secondary-background, #f8f9fa);
  color: var(--color-primary-text, #222);
  border: 1px solid var(--color-border, #ddd);
  transition: background 0.2s, box-shadow 0.2s;
  padding: 8px 18px;
}
.btn-secondary:hover, .btn-secondary:focus {
  background: var(--color-hover-background, #ececec);
  color: var(--color-primary-text, #222);
}
</style>
