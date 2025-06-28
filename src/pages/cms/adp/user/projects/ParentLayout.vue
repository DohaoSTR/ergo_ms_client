<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { 
  fetchUserProjects, 
  fetchPersonalUserProjects, 
  fetchInvitedUserProjects,
  fetchCountTasksProject
} from '@/js/api/services/projectsService.js'
import CardProject from '@/pages/cms/adp/user/projects/CardProject.vue'

const route = useRoute()
const userProjects = ref([])

const loadProjects = async () => {
  try {
    let projects;
    if (route.name === 'Projects') {
      projects = await fetchUserProjects();
    } else if (route.name === 'PersonalProjects') {
      projects = await fetchPersonalUserProjects(); 
    } else if (route.name === 'InvitedProjects') {
      projects = await fetchInvitedUserProjects();
    }

    // Добавляем статистику задач к каждому проекту
    userProjects.value = await Promise.all(projects.map(async project => {
      try {
        const tasksStats = await fetchCountTasksProject(project.id);
        return {
          ...project,
          tasks: {
            all: tasksStats.totalCount,
            current: tasksStats.doneCount,
            active: tasksStats.activeCount
          }
        };
      } catch (error) {
        console.error(`Ошибка загрузки задач для проекта ${project.id}:`, error);
        return {
          ...project,
          tasks: {
            all: 0,
            current: 0,
            active: 0
          }
        };
      }
    }));

  } catch (error) {
    console.error('Ошибка загрузки проектов:', error);
  }
};

const handleProjectDeleted = (projectId) => {
  userProjects.value = userProjects.value.filter(project => project.id !== projectId)
  loadProjects()
}

const handleProjectLeaved = (userId) => {
  userProjects.value = userProjects.value.filter(project => project.userId !== userId)
  loadProjects()
}

onMounted(loadProjects)
watch(() => route.name, loadProjects)

const openKanbanBoard = (projectId, projectName) => {
  const url = `/kanban?project_id=${projectId}&project_name=${encodeURIComponent(projectName)}`;
  window.open(url, '_blank');
}
</script>

<template>
  <div class="row" v-auto-animate>
    <div
      v-for="(project, index) in userProjects"
      :key="index"
      class="col-12 col-sm-6 col-lg-4 mb-4"
    >
      <CardProject
        :project_id="project.id"
        :icon="project.icon"
        :icon-background="project.iconBackground"
        :title="project.name"
        :caption="project.caption"
        :date="project.date"
        :hours="project.hours"
        :tasks="project.tasks"
        :project_name="project.name"
        :deadline="project.deadline"
        :user_id="project.userId"
        :is-invited="route.name === 'InvitedProjects'"
        :is-all="route.name === 'Projects'"
        @projectDeleted="handleProjectDeleted"
        @projectLeaved="handleProjectLeaved"
        @viewTasks="(projectId) => openKanbanBoard(projectId, project.name)" 
      />
    </div>
  </div>
</template>

<style scoped lang="scss"></style>