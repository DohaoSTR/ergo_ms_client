<template>
  <div class="card mb-4">
    <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
      <h4 class="mb-0">Личный кабинет студента</h4>
      <button class="btn btn-light btn-sm" @click="toggleEdit">
        {{ editMode ? 'Отменить' : 'Редактировать' }}
      </button>
    </div>

    <div class="card-body">
      <div v-if="apiError" class="alert alert-danger">{{ apiError }}</div>
      <ul class="nav nav-tabs mb-3" role="tablist">
        <li class="nav-item" v-for="tab in tabs" :key="tab.name">
          <button class="nav-link" :class="{ active: activeTab === tab.name }" @click="activeTab = tab.name"
            type="button" role="tab">
            {{ tab.label }}
          </button>
        </li>
      </ul>

      <div class="tab-content">
        <div class="tab-pane fade" :class="{ 'show active': activeTab === 'main' }" role="tabpanel">
          <dl class="row">
            <dt class="col-sm-3">Имя</dt>
            <dd class="col-sm-9">
              <span v-if="!editMode">{{ studentData.first_name }}</span>
              <input v-else v-model="form.first_name" class="form-control form-control-sm" />
            </dd>
            <dt class="col-sm-3">Фамилия</dt>
            <dd class="col-sm-9">
              <span v-if="!editMode">{{ studentData.last_name }}</span>
              <input v-else v-model="form.last_name" class="form-control form-control-sm" />
            </dd>
            <dt class="col-sm-3">Группа</dt>
            <dd class="col-sm-9">
              <span v-if="!editMode">{{ studentData.group_name || 'Не указана' }}</span>
              <input v-else v-model="form.group_name" class="form-control form-control-sm"
                placeholder="Укажите группу" />
            </dd>
            <dt class="col-sm-3">Профессия</dt>
            <dd class="col-sm-9">
              <span v-if="!studentData.role && !editMode" class="text-muted">Профессия не выбрана</span>
              <span v-else-if="studentData.role && !editMode" class="fw-bold text-success">
                {{ getRoleName(studentData.role) }}
              </span>
              <select
                v-else
                v-model="form.role"
                class="form-select form-select-sm"
                :disabled="roles.length === 0"
              >
                <option value="">Не выбрана</option>
                <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
              </select>
            </dd>
          </dl>
        </div>
  
        <div class="tab-pane fade" :class="{ 'show active': activeTab === 'experience' }" role="tabpanel">
          <div v-if="!editMode">
            <strong>Опыт в IT:</strong>
            {{ studentData.has_experience ? 'Есть' : 'Нет' }}
          </div>
          <div v-else class="form-check">
            <input class="form-check-input" type="checkbox" id="hasExperience" v-model="form.has_experience" />
            <label class="form-check-label" for="hasExperience">
              Есть опыт в IT
            </label>
          </div>
        </div>

        <div class="tab-pane fade" :class="{ 'show active': activeTab === 'contacts' }" role="tabpanel">
          <dl class="row">
            <dt class="col-sm-3">Email</dt>
            <dd class="col-sm-9">
              <span v-if="!editMode">{{ studentData.email || 'Не указано' }}</span>
              <input v-else v-model="form.email" type="email" class="form-control form-control-sm"
                placeholder="Введите email" />
            </dd>
            <dt class="col-sm-3">Телефон</dt>
            <dd class="col-sm-9">
              <span v-if="!editMode">{{ displayPhone(studentData.phone) || 'Не указано' }}</span>
              <input v-else v-model="form.phone" class="form-control form-control-sm" placeholder="Введите телефон" />
            </dd>
          </dl>
        </div>
      </div>

      <div class="mt-4">
        <h5>Навыки</h5>
        <table class="table table-bordered mt-2">
          <thead>
            <tr>
              <th>Название навыка</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in items" :key="index">
              <td>{{ item.name }}</td>
              <td>
                {{ item.status != 'unconfirmed' ? 'Подтверждён' : 'Не подтверждён' }}
              </td>
              <td>
                <button class="btn btn-sm btn-primary me-2" @click="gototest(item.name)">
                  Пройти тест
                </button>
                <button class="btn btn-sm btn-primary me-2" @click="gotoresult(item.skill_id)">
                  Получить результаты теста
                </button>
                <button class="btn btn-sm btn-danger" @click="DeleteSkill(item.id)">
                  Удалить
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="d-flex justify-content-end mt-2">
          <button class="btn btn-success text-light me-2" data-bs-toggle="modal" data-bs-target="#EditSkills">
            Добавить навык
          </button>
        </div>
      </div>

   
      <div class="mt-4">
        <h5>Мои отклики</h5>
        <table class="table table-bordered mt-2">
          <thead>
            <tr>
              <th>Вакансия</th>
              <th>Дата подачи</th>
              <th>Совпадение</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="app in myApplications" :key="app.id">
              <td>
  <router-link
    :to="{ name: 'VacancyDetail', params: { id: app.vacancy } }"
    class="fw-bold link-primary"
    style="text-decoration: underline"
  >
    {{ app.vacancy_title || `Вакансия №${app.vacancy}` }}
  </router-link>
</td>
              <td>
                {{ formatDate(app.applied_at) }}
              </td>
              <td>
                {{ app.match_score ?? 0 }}%
              </td>
              <td>
                <router-link
                  :to="{ name: 'VacancyDetail', params: { id: app.vacancy } }"
                  class="btn btn-sm btn-outline-primary"
                >Подробнее</router-link>
              </td>
            </tr>
            <tr v-if="myApplications.length === 0">
              <td colspan="4" class="text-center text-muted">Нет откликов</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="editMode" class="mt-3 text-end">
        <button class="btn btn-success text-light me-2" @click="saveProfile" :disabled="saving">
          {{ saving ? 'Сохраняем...' : 'Сохранить' }}
        </button>
        <button class="btn btn-secondary" @click="cancelEdit" :disabled="saving">
          Отменить
        </button>
      </div>
    </div>
  </div>
  
  <ModalCenter title="Добавление новых умений" modalId="EditSkills">
    <AddSkillModal @AddSkillTest="AddSkills" ref="addSkillModalRef" />
  </ModalCenter>
  <div v-if="testnotexist" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header bg-danger text-white">
          <h5 class="modal-title">Ошибка</h5>
          <button type="button" class="btn-close btn-close-white" @click="testnotexist = false"></button>
        </div>
        <div class="modal-body">
          Теста по выбранному навыку не существует
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="testnotexist = false">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
  <div v-if="testresultnotexist" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header bg-danger text-white">
          <h5 class="modal-title">Ошибка</h5>
          <button type="button" class="btn-close btn-close-white" @click="testresultnotexist = false"></button>
        </div>
        <div class="modal-body">
          {{ testresulterrortest }}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="testresultnotexist = false">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import ModalCenter from '@/components/ModalCenter.vue'
import AddSkillModal from './StudentProfileComponents/AddSkillModal.vue'
import router from '@/js/routers'
import { displayPhone } from '@/js/utils/phoneUtils.js'

const addSkillModalRef = ref(null);

const items = ref([])
const addskilllist = ref([])
const deleteskillliest = ref([])
const testnotexist = ref(false)
const testresultnotexist = ref(false)
const testresulterrortest = ref('')
const roles = ref([])

const myApplications = ref([])
const loadingApplications = ref(false)

const props = defineProps({
  student: { type: Object, required: true }
})

const studentData = reactive({ ...props.student })
const form = reactive({ ...props.student })

const editMode = ref(false)
const activeTab = ref('main')
const saving = ref(false)
const apiError = ref(null)

const tabs = [
  { name: 'main', label: 'Основное' },
  { name: 'experience', label: 'Опыт' },
  { name: 'contacts', label: 'Контакты' }
]

async function loadskills() {
  try {
    const response = await apiClient.get(endpoints.expert_system.getUserSkills)
    items.value = response.data
  } catch (error) {
    console.error('Ошибка загрузки навыков:', error)
  }
}
async function loadRoles() {
  const resp = await apiClient.get(endpoints.expert_system.roles)
  if (resp.success) roles.value = resp.data
}

async function loadApplications() {
  loadingApplications.value = true
  try {
    const response = await apiClient.get(endpoints.expert_system.applications + '?my=1')
    if (response.success) {
      myApplications.value = response.data
    } else if (Array.isArray(response)) {
      // fallback для прямого массива
      myApplications.value = response
    } else {
      myApplications.value = []
    }
  } catch (error) {
    myApplications.value = []
  } finally {
    loadingApplications.value = false
  }
}

onMounted(async () => {
  await loadskills()
  await loadRoles()
  await loadApplications()
})

const gototest = async (skill) => {
  const response = await apiClient.get(endpoints.expert_system.getTestIdBySkill, { skill: skill })
  let testid = response.data.id
  if (testid == null) {
    testnotexist.value = true
  }
  else {
    router.push({ name: 'TestPage', params: { id: testid } })
  }
}
const gotoresult = async (skillid) => {
  let response= null;
  try{
    response= await apiClient.get(endpoints.expert_system.getTestResultBySkillId, { id: skillid })
    router.push({ name: 'TestResult', params: { id: response.data.id } })
  }
  catch{
    testresulterrortest.value = (response.message)
    testresultnotexist.value = true
  }

}
function toggleEdit() {
  editMode.value = !editMode.value
  if (editMode.value) {
    Object.assign(form, studentData)
    apiError.value = null
  }
}

function getRoleName(roleId) {
  const role = roles.value.find(r => r.id === roleId)
  return role ? role.name : 'Не выбрана'
}

async function AddSkills(skills) {
  await apiClient.post(endpoints.expert_system.setUserSkills, { Skills: skills })
  await loadskills()
}

async function DeleteSkill(id) {
  let index = items.value.findIndex(item => item.id == id)
  let deletedskill = items.value[index].name
  items.value.splice(index, 1)
  console.log(id)
  console.log(await apiClient.delete(endpoints.expert_system.deleteTestResultBySkill, {skill_id:id}))
  let url = `${endpoints.expert_system.userSkills}${id}/`
  const resp = await apiClient.delete(url)
  if (!resp.success) {
    throw new Error(
      typeof resp.errors === 'string'
        ? resp.errors
        : JSON.stringify(resp.errors)
    )
  }
  await addSkillModalRef.value.loadallskills()
}

async function saveProfile() {
  apiError.value = null
  saving.value = true

  try {
    const payload = {
      first_name: form.first_name,
      last_name: form.last_name,
      has_experience: form.has_experience,
      email: form.email,
      phone: form.phone,
      ...(form.study_group ? { study_group: form.study_group } : {}),
      ...(form.role ? { role: form.role } : {})
    }
    const url = `${endpoints.expert_system.students}${studentData.id}/`
    const resp = await apiClient.patch(url, payload)

    if (!resp.success) {
      throw new Error(
        typeof resp.errors === 'string'
          ? resp.errors
          : JSON.stringify(resp.errors)
      )
    }

    if (deleteskillliest.value.length > 0) {
      await apiClient.delete(`${endpoints.expert_system.deleteSkill}`, {
        data: { skill_ids: deleteskillliest.value }
      })
    }

    if (addskilllist.value.length > 0) {
      await apiClient.post(`${endpoints.expert_system.addSkill}`, {
        skill_ids: addskilllist.value
      })
    }

    Object.assign(studentData, resp.data)
    const updatedSkills = await apiClient.get(endpoints.expert_system.getUserSkills)
    items.value = updatedSkills.data

    editMode.value = false
    addskilllist.value = []
    deleteskillliest.value = []

  } catch (err) {
    apiError.value = err.message || 'Ошибка при сохранении профиля'
  } finally {
    saving.value = false
  }
}

function cancelEdit() {
  Object.assign(form, studentData)
  apiError.value = null
  editMode.value = false
}

function formatDate(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString().slice(0, 5)
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
