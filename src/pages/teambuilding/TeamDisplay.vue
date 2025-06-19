<template>
    <div class="team-display-container">
      <h2>Сформированная команда</h2>
      <div v-if="team.length > 0" class="team-members">
        <div v-for="(member, index) in team" :key="index" class="team-member card mb-3">
          <div class="card-body">
            <h5 class="card-title">{{ member.name }}</h5>
            <p class="card-text"><strong>Опыт:</strong> {{ member.experience }}</p>
            <p class="card-text"><strong>Навыки:</strong> {{ member.skills.join(", ") }}</p>
            <p class="card-text">{{ member.description }}</p>
          </div>
        </div>
      </div>
      <div v-else class="alert alert-info">Команда не сформирована</div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      team: {
        type: Array,
        required: true,
      },
    },
  };
  </script>
  
  <style scoped>
  .team-display-container {
    max-width: 800px;
    margin: 20px auto;
    padding: 20px;
  }
  
  .team-member {
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #fff;
  }
  
  .card-title {
    color: #333;
  }
  
  .card-text {
    color: #555;
  }
  </style>
