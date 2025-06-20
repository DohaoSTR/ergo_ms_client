<script setup>
import { ref, onMounted } from 'vue'
import { Settings, Users, BookOpen, Plus, Edit, BarChart } from 'lucide-vue-next'
import RoleGuard from '../components/RoleGuard.vue'

const teachingCourses = ref([])
const selectedTab = ref('courses')

const tabs = [
  { value: 'courses', label: 'Мои курсы', icon: BookOpen },
  { value: 'students', label: 'Студенты', icon: Users },
  { value: 'analytics', label: 'Аналитика', icon: BarChart }
]

function fetchTeachingData() {
  teachingCourses.value = [
    {
      id: 1,
      title: 'Основы веб-разработки',
      studentsCount: 156,
      lessonsCount: 24,
      averageGrade: 4.2,
      status: 'active'
    },
    {
      id: 2,
      title: 'JavaScript продвинутый',
      studentsCount: 89,
      lessonsCount: 18,
      averageGrade: 4.5,
      status: 'active'
    }
  ]
}

function createCourse() {
  console.log('Создать новый курс')
}

function editCourse(course) {
  console.log('Редактировать курс:', course.id)
}

onMounted(fetchTeachingData)
</script>

<template>
  <RoleGuard 
    :roles="['teacher', 'admin']"
    fallback-message="Доступ к разделу преподавания имеют только преподаватели и администраторы"
  >
    <div class="teaching-view">
    <div class="row mb-4">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <h3 class="mb-0">Преподавание</h3>
          <button @click="createCourse" class="btn btn-primary">
            <Plus :size="18" class="me-2" />
            Создать курс
          </button>
        </div>
      </div>
    </div>

    <!-- Табы -->
    <div class="nav nav-pills mb-4">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="selectedTab = tab.value"
        :class="`nav-link ${selectedTab === tab.value ? 'active' : ''}`"
      >
        <component :is="tab.icon" :size="18" class="me-2" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Мои курсы -->
    <div v-if="selectedTab === 'courses'">
      <div class="row">
        <div v-for="course in teachingCourses" :key="course.id" class="col-lg-6 mb-4">
          <div class="card course-card">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-3">
                <h6>{{ course.title }}</h6>
                <button @click="editCourse(course)" class="btn btn-sm btn-outline-primary">
                  <Edit :size="16" />
                </button>
              </div>
              
              <div class="course-stats">
                <div class="row">
                  <div class="col-4 text-center">
                    <div class="fw-bold">{{ course.studentsCount }}</div>
                    <small class="text-muted">Студентов</small>
                  </div>
                  <div class="col-4 text-center">
                    <div class="fw-bold">{{ course.lessonsCount }}</div>
                    <small class="text-muted">Уроков</small>
                  </div>
                  <div class="col-4 text-center">
                    <div class="fw-bold">{{ course.averageGrade }}</div>
                    <small class="text-muted">Ср. оценка</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Студенты -->
    <div v-else-if="selectedTab === 'students'">
      <div class="text-center py-5">
        <Users :size="48" class="text-muted mb-3" />
        <h5 class="text-muted">Управление студентами</h5>
        <p class="text-muted">Здесь будет список всех студентов</p>
      </div>
    </div>

    <!-- Аналитика -->
    <div v-else-if="selectedTab === 'analytics'">
      <div class="text-center py-5">
        <BarChart :size="48" class="text-muted mb-3" />
        <h5 class="text-muted">Аналитика курсов</h5>
        <p class="text-muted">Статистика и отчеты по вашим курсам</p>
      </div>
    </div>
  </div>
  </RoleGuard>
</template>

<style scoped>
.nav-link.active {
  background-color: var(--bs-primary);
}

.course-card {
  transition: box-shadow 0.2s;
}

.course-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.course-stats {
  border-top: 1px solid var(--bs-border-color);
  padding-top: 1rem;
}
</style> 