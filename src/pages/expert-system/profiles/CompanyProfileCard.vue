<template>
  <div class="card mb-4">
    <div
      class="card-header bg-success text-white d-flex justify-content-between align-items-center"
    >
      <h4 class="mb-0">Личный кабинет компании</h4>
      <button class="btn btn-light btn-sm" @click="toggleEdit">
        {{ editMode ? 'Отменить' : 'Редактировать' }}
      </button>
    </div>
    <div class="card-body">
      <div v-if="apiError" class="alert alert-danger">{{ apiError }}</div>
      <ul class="nav nav-tabs mb-3" role="tablist">
        <li class="nav-item" v-for="tab in tabs" :key="tab.name">
          <button
            class="nav-link"
            :class="{ active: activeTab === tab.name }"
            @click="activeTab = tab.name"
            type="button"
            role="tab"
          >
            {{ tab.label }}
          </button>
        </li>
      </ul>

      <div class="tab-content">
       
        <div
          class="tab-pane fade"
          :class="{ 'show active': activeTab === 'main' }"
          role="tabpanel"
        >
          <dl class="row">
            <dt class="col-sm-3">Название</dt>
            <dd class="col-sm-9">
              <span v-if="!editMode">{{ companyData.company_name }}</span>
              <input
                v-else
                v-model="form.company_name"
                class="form-control form-control-sm"
              />
            </dd>

            <dt class="col-sm-3">Описание</dt>
            <dd class="col-sm-9">
              <span v-if="!editMode">{{ companyData.description }}</span>
              <textarea
                v-else
                v-model="form.description"
                class="form-control form-control-sm"
                rows="3"
              ></textarea>
            </dd>
          </dl>
        </div>

    
        <div
          class="tab-pane fade"
          :class="{ 'show active': activeTab === 'contacts' }"
          role="tabpanel"
        >
          <dl class="row">
            <dt class="col-sm-3">Сайт</dt>
            <dd class="col-sm-9">
              <span v-if="!editMode">
                <a :href="companyData.website" target="_blank">
                  {{ companyData.website }}
                </a>
              </span>
              <input
                v-else
                v-model="form.website"
                type="url"
                class="form-control form-control-sm"
              />
            </dd>

            <dt class="col-sm-3">Контактное лицо</dt>
            <dd class="col-sm-9">
              <span v-if="!editMode">{{ companyData.contact_person }}</span>
              <input
                v-else
                v-model="form.contact_person"
                class="form-control form-control-sm"
              />
            </dd>

            <dt class="col-sm-3">E-mail</dt>
            <dd class="col-sm-9">
              <span v-if="!editMode">{{ companyData.contact_email }}</span>
              <input
                v-else
                v-model="form.contact_email"
                type="email"
                class="form-control form-control-sm"
              />
            </dd>
          </dl>
        </div>
      </div>

      
      <div v-if="editMode" class="mt-3 text-end">
        <button
          class="btn btn-success text-light fw-semibold"
          @click="saveProfile"
          :disabled="saving"
        >
          {{ saving ? 'Сохраняем...' : 'Сохранить' }}
        </button>
        <button class="btn btn-secondary" @click="cancelEdit" :disabled="saving">
          Отменить
        </button>
      </div>

      
      <div class="mt-5">
        <h5>Управление курсами</h5>
        <CompanyCourses @error="apiError = $event" />
      </div>

      
      <div class="mt-5">
        <h5>Управление вакансиями</h5>
        <CompanyVacancies @error="apiError = $event" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import CompanyCourses from '@/pages/expert-system/CompanyCourses.vue'
import CompanyVacancies from '@/pages/expert-system/CompanyVacancies.vue'

const props = defineProps({
  company: { type: Object, required: true }
})

const companyData = reactive({ ...props.company })
const form        = reactive({ ...props.company })

const editMode  = ref(false)
const activeTab = ref('main')
const saving    = ref(false)
const apiError  = ref(null)

const tabs = [
  { name: 'main',     label: 'Основное'  },
  { name: 'contacts', label: 'Контакты' }
]

function toggleEdit() {
  editMode.value = !editMode.value
  if (editMode.value) {
    Object.assign(form, companyData)
    apiError.value = null
  }
}

async function saveProfile() {
  apiError.value = null
  saving.value   = true

  try {
    const payload = {
      company_name:   form.company_name,
      description:    form.description,
      website:        form.website,
      contact_person: form.contact_person,
      contact_email:  form.contact_email
    }
    const url  = `${endpoints.expert_system.companies}${companyData.id}/`
    const resp = await apiClient.patch(url, payload)

    if (!resp.success) {
      throw new Error(
        typeof resp.errors === 'string'
          ? resp.errors
          : JSON.stringify(resp.errors)
      )
    }
    Object.assign(companyData, resp.data)
    editMode.value = false

  } catch (err) {
    apiError.value = err.message || 'Ошибка при сохранении профиля'
  } finally {
    saving.value = false
  }
}

function cancelEdit() {
  Object.assign(form, companyData)
  apiError.value = null
  editMode.value = false
}
</script>

<style scoped>
.nav-tabs .nav-link {
  cursor: pointer;
}
.card-header h4 {
  font-size: 1.25rem;
}
</style>
