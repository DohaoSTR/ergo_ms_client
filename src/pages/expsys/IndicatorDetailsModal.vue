<template>
  <div v-if="currentCompetence" class="modal-overlay" @click.self="closeModal">
    <div class="competence-detail-window">
      <button @click="closeModal" class="close-button">×</button>
      <div class="window-container">
        <h3>Детали индикатора компетенции</h3>

        <!-- Предмет -->
        <div class="input-group">
          <label class="input-label">Предмет</label>
          <div class="readonly-field">{{ subjectName }}</div>
        </div>

        <!-- Название компетенции -->
        <div class="input-group">
          <label class="input-label">Название индикатора</label>
          <input type="text" v-model="currentCompetence.name" placeholder="Введите название" class="text-input">
        </div>

        <!-- Описание -->
        <div class="input-group">
          <label class="input-label">Описание</label>
          <textarea v-model="currentCompetence.description" rows="3" class="text-input" placeholder="Описание компетенции"></textarea>
        </div>

        <!-- Знания -->
        <div class="input-group">
          <label class="input-label">Знания</label>
          <textarea v-model="currentCompetence.knowledge" rows="3" class="text-input" placeholder="Что должен знать студент"></textarea>
        </div>

        <!-- Умения -->
        <div class="input-group">
          <label class="input-label">Умения</label>
          <textarea v-model="currentCompetence.ability" rows="3" class="text-input" placeholder="Что должен уметь студент"></textarea>
        </div>

        <!-- Навыки -->
        <div class="input-group">
          <label class="input-label">Навыки</label>
          <textarea v-model="currentCompetence.mastered" rows="3" class="text-input" placeholder="Какие навыки освоены"></textarea>
        </div>

        <!-- Кнопка сохранения -->
        <div class="action-buttons">
          <button class="action-button save-button" @click="saveCompetence">Сохранить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CompetenceDetailsModal',
  props: {
    competence: {
      type: Object,
      required: true
    },
    subjectName: {
      type: String,
      default: 'Не указано'
    }
  },
  data() {
    return {
      currentCompetence: { ...this.competence }
    };
  },
  watch: {
    competence(newVal) {
      this.currentCompetence = { ...newVal };
    }
  },
  methods: {
    saveCompetence() {
      this.$emit('update', this.currentCompetence);
      this.$emit('close');
    },
    closeModal() {
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);

  
  align-items: center;
  z-index: 1000;
}

.competence-detail-window {
  position: relative;
  width: 600px;
  max-width: 95%;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  padding: 24px;
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.close-button {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  transition: color 0.3s;
}

.close-button:hover {
  color: #000;
}

.window-container h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.input-group {
  margin-bottom: 16px;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #555;
}

.readonly-field {
  font-weight: 500;
  color: #333;
  background: #f9f9f9;
  border-radius: 8px;
  padding: 10px 12px;
  border: 1px solid #ddd;
  min-height: 40px;
}

.text-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #ccc;
  resize: vertical;
  min-height: 40px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
  outline: none;
}

.text-input:focus {
  border-color: #cb2c20;
  box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.2);
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.action-button {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.save-button {
  background-color: #cb2c20;
  color: white;
}

.save-button:hover {
  background-color: #cb2c20;
}
</style>
