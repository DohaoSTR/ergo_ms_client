<template>
    <div class="team-form-container">
      <h2>Сформировать команду</h2>
      <form @submit.prevent="generateTeam">
        <div class="mb-3">
          <label for="taskType" class="form-label">Тип задачи</label>
          <select class="form-select" id="taskType" v-model="selectedTaskType">
            <option value="olympiad">Олимпиада</option>
            <option value="conference">Конференция</option>
            <option value="lab">Лабораторная работа</option>
            <option value="project">Проект</option>
          </select>
        </div>
  
        <div class="mb-3">
          <label for="specialization" class="form-label">Специализация</label>
          <select class="form-select" id="specialization" v-model="selectedSpecialization">
            <option value="programming">Программирование</option>
            <option value="design">Дизайн</option>
            <option value="web">Веб-программирование</option>
            <option value="data">Анализ данных</option>
          </select>
        </div>
  
        <div class="mb-3">
          <label for="teamSize" class="form-label">Количество людей в команде</label>
          <input
            type="number"
            class="form-control"
            id="teamSize"
            v-model.number="teamSize"
            min="1"
            max="10"
          />
        </div>
  
        <button type="submit" class="btn btn-primary">Сформировать команду</button>
      </form>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        selectedTaskType: "olympiad",
        selectedSpecialization: "programming",
        teamSize: 3,
      };
    },
    methods: {
      generateTeam() {
        const team = this.$store.dispatch("generateTeam", {
          taskType: this.selectedTaskType,
          specialization: this.selectedSpecialization,
          teamSize: this.teamSize,
        });
        this.$emit("team-generated", team);
      },
    },
  };
  </script>
  
  <style scoped>
  .team-form-container {
    max-width: 500px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #f9f9f9;
  }
  </style>