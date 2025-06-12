<template>
  <div class="container py-4">
    <StudentProfileCard
      v-if="student"
      :student="student"
    />
    <CompanyProfileCard
      v-else-if="company"
      :company="company"
    />
    <NoProfile v-else />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

import StudentProfileCard from '@/pages/expert-system/profiles/StudentProfileCard.vue'
import CompanyProfileCard from '@/pages/expert-system/profiles/CompanyProfileCard.vue'
import NoProfile from '@/pages/expert-system/profiles/NoProfile.vue'

const student = ref(null)
const company = ref(null)

onMounted(async () => {
  const stu = await apiClient.get(endpoints.expert_system.studentsMe)
  if (stu.success) {
    student.value = stu.data
    return
  }
  const comp = await apiClient.get(endpoints.expert_system.companiesMe)
  if (comp.success) {
    company.value = comp.data
  }
})
</script>
