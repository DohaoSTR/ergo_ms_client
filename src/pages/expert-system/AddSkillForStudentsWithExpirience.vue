<template>
  <div class="d-flex justify-content-center align-items-center" style="height: 70vh; margin-top: 65px">
    <div class="card" style="width: 500px">
      <div class="auth__title mb-4 fs-3 fw-bold text-center no-select">Укажите навыки, которыми вы владеете</div>
      <div class="scroll-container">
        <div v-for="skill in skills" :key="skill.id" :value="skill.name" id="skillslist">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" :value="skill.name" id="flexCheckDefault" />
            <label class="form-check-label" for="flexCheckDefault"> {{ skill.name }} </label>
          </div>
        </div>
      </div>
      <br/>
      <button class="btn btn-primary" @click="addUserSkill">Добавить навыки</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { endpoints } from '@/js/api/endpoints';
import { apiClient } from '@/js/api/manager';
import router from '@/js/routers';
const skills = ref([]);

onMounted(async () => {
  const response = await apiClient.get(endpoints.expert_system.skills,)
  skills.value = response.data;
});

const addUserSkill = async () => {
  const skillslist = document.querySelectorAll('#skillslist');
  const skillsArray = [];
  skillslist.forEach(skill => {
    skill = skill.children[0].children[0];
    if (skill.checked) {
      skillsArray.push(skill.value);
    }
  });
await apiClient.post(endpoints.expert_system.setUserSkills, {Skills:skillsArray}) 
router.push({name:'ChoiceRole'})
};
</script>

<style lang="scss" scoped>
.scroll-container {
  height: 600px;
  overflow-y: scroll;
  border: 1px solid #ddd;
  padding: 10px;
}
.scroll-container::-webkit-scrollbar {
  width: 12px;
}
.scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.scroll-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 6px;
}
.scroll-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
