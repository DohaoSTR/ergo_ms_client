<template >
    <form @submit.prevent="submitForm" novalidate>
        <div class="form-floating mb-3" v-auto-animate>
        <div class="d-flex justify-content-center align-items-center">
            <div class="card" style="width: 500px">
                <div class="scroll-container">
                <div v-for="skill in skills" :key="skill.id" :value="skill.name" id="skillslist">
                    <div class="form-check">
                    <input class="form-check-input" type="checkbox" :value="skill.name" id="flexCheckDefault" />
                    <label class="form-check-label" for="flexCheckDefault"> {{ skill.name }} </label>
                    </div>
                </div>
                </div>
                <br/>
                <button type="submit" class="btn btn-primary" :data-bs-dismiss="'modal'">Добавить навыки</button>
            </div>
        </div>
    </div>
    </form>
</template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { endpoints } from '@/js/api/endpoints';
  import { apiClient } from '@/js/api/manager';
  const skills = ref([]);
 const emits = defineEmits(['AddSkillTest'])

 const loadallskills = async()=>{
  try {
    const skillsResponse = await apiClient.get(endpoints.expert_system.getUserSkills);
    const userSkills = skillsResponse.data.map(item => item);
    const allSkillsResponse = await apiClient.get(endpoints.expert_system.skills);  
    skills.value = allSkillsResponse.data;
    for (let i=0; i< userSkills.length; i++ ){
      for( let j=0; j<skills.value.length;j++){
        if (userSkills[i].name == skills.value[j].name){
          skills.value.splice(j,1)
        }
      }
    }
  } catch (error) {
    console.error('Error fetching skills:', error);
  }
 }
  onMounted(async () => {
  await loadallskills()
});
  
  const submitForm = async () => {
    const skillslist = document.querySelectorAll('#skillslist');
    const skillsArray = [];
    skillslist.forEach(skill => {
      skill = skill.children[0].children[0];
      if (skill.checked) {
        skillsArray.push(skill.value);
      } 
    });
    emits('AddSkillTest', skillsArray)
    skills.value = skills.value.filter(skill => !skillsArray.includes(skill.name));
  };
defineExpose({loadallskills})
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