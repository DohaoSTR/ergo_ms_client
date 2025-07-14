<template>
  <div>
    <button class="btn btn-success text-light btn-sm me-2" @click="openModal">
      Редактировать
    </button>

    <Teleport to="body">
      <div
        v-if="show"
        class="modal fade show d-block"
        tabindex="-1"
        @click.self="close"
      >
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content border-success">
            <div class="modal-header bg-success text-white">
              <h5 class="modal-title">Редактировать вакансию</h5>
              <button
                type="button"
                class="btn-close btn-close-white"
                @click="close"
                aria-label="Закрыть"
              />
            </div>
            <div class="modal-body p-4">
              <div v-if="error" class="alert alert-danger">{{ error }}</div>
              <form @submit.prevent="onSubmit">
                <div class="row g-3">
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input
                        v-model="form.title"
                        type="text"
                        class="form-control"
                        placeholder="Заголовок"
                        required
                      />
                      <label>Заголовок</label>
                    </div>
                  </div>

                  <div class="col-md-6">
                    <div class="form-floating">
                      <textarea
                        v-model="form.description"
                        class="form-control"
                        style="height: 100px"
                        placeholder="Описание"
                        required
                      ></textarea>
                      <label>Описание</label>
                    </div>
                  </div>

                  <div class="col-12 col-md-6">
                    <div class="input-group">
                      <span class="input-group-text bg-white border-success">🔍</span>
                      <input
                        v-model="searchTerm"
                        type="text"
                        class="form-control border-success"
                        placeholder="Поиск навыков"
                      />
                    </div>
                  </div>

                  <div class="col-12 col-md-6">
                    <div class="card h-100 border-success">
                      <div class="card-header bg-light">Выберите навыки</div>
                      <div class="card-body p-2 skills-list">
                        <div v-if="filteredSkills.length">
                          <div
                            v-for="skill in filteredSkills"
                            :key="skill.id"
                            class="form-check mb-1"
                          >
                            <input
                              class="form-check-input"
                              type="checkbox"
                              :value="skill.id"
                              v-model="form.required_skills"
                            />
                            <label class="form-check-label">
                              {{ skill.name }}
                            </label>
                          </div>
                        </div>
                        <div v-else class="text-muted small">
                          Навыки не найдены.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mt-4 text-end">
                  <button
                    type="submit"
                    class="btn btn-success text-light fw-semibold"
                    :disabled="loading"
                  >
                    {{ loading ? 'Сохраняем...' : 'Сохранить' }}
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="close"
                    :disabled="loading"
                  >
                    Отменить
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const emit = defineEmits(['updated', 'error'])
const props = defineProps({
  vacancy: { type: Object, required: true }
})

const show = ref(false)
const loading = ref(false)
const error = ref(null)
const searchTerm = ref('')
const form = reactive({
  title: '',
  description: '',
  required_skills: []
})
const skills = ref([])

function openModal() {
  Object.assign(form, {
    title: props.vacancy.title,
    description: props.vacancy.description,
    required_skills: props.vacancy.required_skills_info.map(s => s.id)
  })
  searchTerm.value = ''
  error.value = null
  show.value = true
}

function close() {
  show.value = false
}

onMounted(async () => {
  try {
    const res = await apiClient.get(endpoints.expert_system.skills)
    if (!res.success) throw new Error(JSON.stringify(res.errors))
    skills.value = res.data
  } catch (err) {
    emit('error', err.message || 'Не удалось загрузить навыки')
  }
})

const filteredSkills = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return skills.value
  return skills.value.filter(s => s.name.toLowerCase().includes(term))
})

async function onSubmit() {
  error.value = null
  loading.value = true
  try {
    const payload = {
      title: form.title,
      description: form.description,
      required_skills: form.required_skills
    }
    const res = await apiClient.patch(
      `${endpoints.expert_system.vacancies}${props.vacancy.id}/`,
      payload
    )
    if (!res.success) throw new Error(JSON.stringify(res.errors))
    emit('updated')
    close()
  } catch (err) {
    error.value = err.message || 'Ошибка обновления'
    emit('error', err.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-dialog {
  max-width: 800px;
}
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.skills-list {
  max-height: 200px;
  overflow-y: auto;
}
.card-header {
  font-weight: 600;
}
.btn-close-white {
  filter: invert(1);
}
</style>
