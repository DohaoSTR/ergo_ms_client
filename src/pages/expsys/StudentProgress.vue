<template>
    <div class="student-progress">
      <div class="row mb-4">
        <div class="col">
          <h2>Прогресс освоения компетенций</h2>
          <div class="d-flex align-items-center mb-3">
            <label for="studentSelect" class="form-label me-2 mb-0">Студент:</label>
            <select id="studentSelect" class="form-select w-auto" v-model="selectedStudentId">
              <option v-for="student in students" :key="student.id" :value="student.id">
                {{ student.name }} ({{ student.group }})
              </option>
            </select>
          </div>
        </div>
      </div>
  
      <div class="row">
        <div class="col-md-6">
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0">Общий прогресс</h5>
            </div>
            <div class="card-body">
              <div class="mb-3" v-for="category in competenceCategories" :key="category.id">
                <h6>{{ category.name }}</h6>
                <div class="progress mb-2" style="height: 20px;">
                  <div class="progress-bar" 
                       :class="progressBarClass(getCategoryProgress(category.id))"
                       role="progressbar" 
                       :style="{width: getCategoryProgress(category.id) + '%'}"
                       :aria-valuenow="getCategoryProgress(category.id)"
                       aria-valuemin="0" 
                       aria-valuemax="100">
                    {{ getCategoryProgress(category.id) }}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Детали по компетенциям</h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Компетенция</th>
                      <th>Уровень</th>
                      <th>Прогресс</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="progress in studentProgress" :key="progress.competenceId">
                      <td>{{ getCompetenceName(progress.competenceId) }}</td>
                      <td>
                        <span class="badge" :class="levelBadgeClass(getCompetenceLevel(progress.competenceId))">
                          {{ getCompetenceLevel(progress.competenceId) }}
                        </span>
                      </td>
                      <td>
                        <div class="progress" style="height: 20px;">
                          <div class="progress-bar" 
                               :class="progressBarClass(progress.percentage)"
                               role="progressbar" 
                               :style="{width: progress.percentage + '%'}"
                               :aria-valuenow="progress.percentage"
                               aria-valuemin="0" 
                               aria-valuemax="100">
                            {{ progress.percentage }}%
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <div class="row mt-4">
        <div class="col">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Матрица компетенций (все студенты)</h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-bordered">
                  <thead>
                    <tr>
                      <th>Студент</th>
                      <th v-for="competence in competences" :key="competence.id">
                        {{ competence.name }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="student in students" :key="student.id">
                      <td>{{ student.name }}</td>
                      <td v-for="competence in competences" :key="competence.id"
                          :class="getCellClass(getStudentCompetenceProgress(student.id, competence.id))">
                        {{ getStudentCompetenceProgress(student.id, competence.id) }}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'StudentProgress',
    data() {
      return {
        selectedStudentId: 1,
        students: [
          { id: 1, name: 'Иванов Иван', group: 'ИВТ-101' },
          { id: 2, name: 'Петров Петр', group: 'ИВТ-101' },
          { id: 3, name: 'Сидорова Мария', group: 'ИВТ-102' }
        ],
        competences: [
          { id: 1, name: 'Программирование', level: 'начальный', category: 1 },
          { id: 2, name: 'Базы данных', level: 'средний', category: 1 },
          { id: 3, name: 'Алгоритмы', level: 'продвинутый', category: 1 },
          { id: 4, name: 'Математика', level: 'средний', category: 2 },
          { id: 5, name: 'Коммуникации', level: 'начальный', category: 3 }
        ],
        competenceCategories: [
          { id: 1, name: 'Профессиональные' },
          { id: 2, name: 'Общепрофессиональные' },
          { id: 3, name: 'Общеобразовательные' }
        ],
        progressData: [
          { studentId: 1, competenceId: 1, percentage: 80 },
          { studentId: 1, competenceId: 2, percentage: 65 },
          { studentId: 1, competenceId: 3, percentage: 40 },
          { studentId: 1, competenceId: 4, percentage: 90 },
          { studentId: 1, competenceId: 5, percentage: 75 },
          { studentId: 2, competenceId: 1, percentage: 95 },
          { studentId: 2, competenceId: 2, percentage: 70 },
          { studentId: 2, competenceId: 3, percentage: 60 },
          { studentId: 2, competenceId: 4, percentage: 85 },
          { studentId: 2, competenceId: 5, percentage: 55 },
          { studentId: 3, competenceId: 1, percentage: 70 },
          { studentId: 3, competenceId: 2, percentage: 45 },
          { studentId: 3, competenceId: 3, percentage: 30 },
          { studentId: 3, competenceId: 4, percentage: 95 },
          { studentId: 3, competenceId: 5, percentage: 80 }
        ]
      }
    },
    computed: {
      studentProgress() {
        return this.progressData.filter(p => p.studentId === this.selectedStudentId)
      }
    },
    methods: {
      getCompetenceName(id) {
        const competence = this.competences.find(c => c.id === id)
        return competence ? competence.name : ''
      },
      getCompetenceLevel(id) {
        const competence = this.competences.find(c => c.id === id)
        return competence ? competence.level : ''
      },
      levelBadgeClass(level) {
        return {
          'bg-primary': level === 'начальный',
          'bg-warning text-dark': level === 'средний',
          'bg-success': level === 'продвинутый'
        }
      },
      progressBarClass(percentage) {
        if (percentage >= 80) return 'bg-success'
        if (percentage >= 50) return 'bg-warning'
        return 'bg-danger'
      },
      getCategoryProgress(categoryId) {
        const categoryCompetences = this.competences.filter(c => c.category === categoryId)
        if (categoryCompetences.length === 0) return 0
        
        const studentProgress = this.progressData.filter(
          p => p.studentId === this.selectedStudentId && 
               categoryCompetences.some(c => c.id === p.competenceId)
        )
        
        if (studentProgress.length === 0) return 0
        
        const total = studentProgress.reduce((sum, p) => sum + p.percentage, 0)
        return Math.round(total / studentProgress.length)
      },
      getStudentCompetenceProgress(studentId, competenceId) {
        const progress = this.progressData.find(
          p => p.studentId === studentId && p.competenceId === competenceId
        )
        return progress ? progress.percentage : 0
      },
      getCellClass(percentage) {
        if (percentage >= 80) return 'table-success'
        if (percentage >= 50) return 'table-warning'
        return 'table-danger'
      }
    }
  }
  </script>
  
  <style scoped>
  .table th, .table td {
    vertical-align: middle;
    text-align: center;
  }
  </style>