<template>
    <div class="app-container">
      <TeamForm @team-generated="updateTeam" />
      <TeamDisplay :team="team" />
    </div>
  </template>
  
  <script>
  import TeamForm from '@/pages/teambuilding/TeamForm.vue';
  import TeamDisplay from '@/pages/teambuilding/TeamDisplay.vue';
  
  export default {
    components: {
      TeamForm,
      TeamDisplay,
    },
    data() {
      return {
        team: [],
      };
    },
    methods: {
      updateTeam(team) {
        this.team = team;
      },
    },
  };
  </script>
  
  <style>
  .app-container {
    padding: 20px;
    font-family: Arial, sans-serif;
  }
  </style>