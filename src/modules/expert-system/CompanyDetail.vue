<template>
  <div class="company-detail">
    <div class="d-flex align-items-center mb-5">
      <button class="btn btn-outline-secondary me-3 rounded-circle d-flex align-items-center justify-content-center"
        @click="$router.back()" aria-label="Назад" style="width: 50px; height: 50px;">
        <ArrowLeftCircle class="text-primary" />
      </button>
      <h4 class="text-primary fw-bold mb-0">Назад</h4>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="text-center my-5 py-5">
      <div class="mb-3">
        <Loader />
      </div>
      <h5 class="text-muted">Загружаем информацию о компании...</h5>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="alert alert-danger d-flex align-items-center" role="alert">
      <AlertTriangle class="me-2" />
      <div class="fw-medium">{{ error }}</div>
    </div>

    <!-- Основной контент -->
    <div v-else class="container px-0">
      <!-- Баннер компании -->
      <div class="company-banner mb-4 p-4 rounded-4 position-relative overflow-hidden">
        <div class="position-relative z-1">
          <h2 class="h3 title-block mb-3 text-white">{{ company.company_name }}</h2>
        </div>
      </div>

      <!-- Основные разделы -->
      <div class="row g-4">
        <!-- Описание -->
        <div class="col-md-8">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body p-4">
              <div class="d-flex align-items-center mb-3">
                <div class="icon-box bg-primary bg-opacity-10 text-primary me-3">
                  <FileText :size="30" />
                </div>
                <h5 class="mb-0 title-block">О компании</h5>
              </div>
              <p class="card-text bg-light p-3 rounded-3">{{ company.description || 'Нет описания' }}</p>
            </div>
          </div>
        </div>

        <!-- Контакты -->
        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body p-4">
              <div class="d-flex align-items-center mb-3">
                <div class="icon-box bg-primary bg-opacity-10 text-primary me-3">
                  <Phone :size="30" />
                </div>
                <h5 class="mb-0 fw-semibold">Контакты</h5>
              </div>
              <ul class="list-unstyled mt-3">
                <li v-if="company.contact_person" class="mb-2">
                  <i class="bi bi-telephone"></i>Контактное лицо: {{ company.contact_person }}
                </li>
                <li v-if="company.contact_email" class="mb-2">
                  Почта:
                  <a :href="`mailto:${company.contact_email}`" class="text-decoration-none text-primary"
                    target="_blank">
                    {{ company.contact_email }}
                  </a>
                </li>
                <li v-if="company.website">
                  Сайт:
                  <a :href="company.website" target="_blank" class="text-decoration-none text-primary">
                    {{ company.website }}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Вакансии компании -->
      <div class="card border-0 shadow-sm mt-4">
        <div class="card-body p-4">
          <div class="d-flex align-items-center mb-3">
            <div class="icon-box bg-primary bg-opacity-10 text-primary me-3">
              <Briefcase :size="30" />
            </div>
            <h5 class="mb-0 fw-semibold">Открытые вакансии</h5>
          </div>

          <div v-if="!company.vacancies?.length" class="text-muted fst-italic py-3">
            Вакансии не найдены
          </div>

          <div v-else class="row g-3 mt-1">
            <div v-for="vacancy in company.vacancies" :key="vacancy.id" class="col-md-6">
              <div class="card border-0 shadow-sm h-100">
                <div class="card-body p-3">
                  <h6 class="card-title fw-bold mb-1">{{ vacancy.title }}</h6>
                  <p class="card-text text-muted small mb-2">
                    {{ vacancy.description || 'Описание не указано' }}
                  </p>
                  <div class="d-flex justify-content-between align-items-center">
                    <router-link :to="`/vacancy/${vacancy.id}`" class="btn btn-outline-primary btn-sm">
                      Подробнее
                    </router-link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Кнопка поделиться -->
      <div class="d-flex flex-column flex-md-row gap-3 pt-4">
        <button class="btn btn-outline-primary px-4 py-3 d-flex align-items-center justify-content-center flex-grow-1"
          @click="shareCompany">
          <ExternalLink class="me-2" width="18" height="18" />
          <span class="fw-medium">Поделиться</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import {
  ArrowLeftCircle, Loader, AlertTriangle,
  Briefcase, FileText,
  Phone, ExternalLink
} from 'lucide-vue-next'

const route = useRoute()

const company = ref(null)
const loading = ref(true)
const error = ref(null)

async function fetchCompany() {
  loading.value = true
  error.value = null

  try {
    const res = await apiClient.get(
      endpoints.expert_system.companies + route.params.id
    )

    if (!res.success) throw new Error(JSON.stringify(res.errors))

    company.value = {
      ...res.data,
      vacancies: res.data.vacancies || []
    }
  } catch (err) {
    error.value = 'Не удалось загрузить данные компании'
    console.error('Ошибка загрузки компании:', err)
  } finally {
    loading.value = false
  }
}

function shareCompany() {
  if (navigator.share) {
    navigator.share({
      title: company.value.name,
      text: `Интересная компания: ${company.value.name}`,
      url: window.location.href
    }).catch(console.error)
  } else {
    navigator.clipboard.writeText(window.location.href)
      .then(() => alert('Ссылка скопирована в буфер обмена'))
      .catch(() => alert('Не удалось скопировать ссылку'))
  }
}

onMounted(() => {
  fetchCompany()
})
</script>

<style scoped>
.title-block {
  font-weight: bold;
}

.company-banner {
  background: linear-gradient(135deg, #ff0011 0%, #42aaff 100%);
  box-shadow: 0 0.5rem 1.5rem rgba(13, 110, 253, 0.3);
}

.icon-box {
  width: 40px;
  height: 40px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-outline-primary:hover {
  box-shadow: 0 0.5rem 1.5rem rgba(167, 167, 167, 0.4);
}
</style>
