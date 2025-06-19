<template>
    <div class="development-plan">
      <div class="row mb-4">
        <div class="col">
          <h2>Индивидуальный план развития</h2>
          <div class="d-flex align-items-center mb-3">
            <label for="planStudentSelect" class="form-label me-2 mb-0">Студент:</label>
            <select id="planStudentSelect" class="form-select w-auto" v-model="selectedStudentId">
              <option v-for="student in students" :key="student.id" :value="student.id">
                {{ student.name }} ({{ student.group }})
              </option>
            </select>
          </div>
        </div>
      </div>
  
      <div class="row">
        <div class="col-md-8">
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0">Рекомендации по развитию</h5>
            </div>
            <div class="card-body">
              <div v-if="recommendations.length === 0" class="text-muted">
                Нет рекомендаций для данного студента
              </div>
              <div v-else>
                <div v-for="(recommendation, index) in recommendations" :key="index" class="mb-4">
                  <h6>
                    <span class="badge me-2" :class="levelBadgeClass(recommendation.level)">
                      {{ recommendation.level }}
                    </span>
                    {{ recommendation.competence }}
                  </h6>
                  <p>{{ recommendation.description }}</p>
                  
                  <div class="mb-3">
                    <div class="d-flex justify-content-between mb-1">
                      <small>Прогресс: {{ recommendation.currentProgress }}%</small>
                      <small>Цель: {{ recommendation.targetProgress }}%</small>
                    </div>
                    <div class="progress" style="height: 10px;">
                      <div class="progress-bar" 
                           :class="progressBarClass(recommendation.currentProgress)"
                           role="progressbar" 
                           :style="{width: recommendation.currentProgress + '%'}"
                           aria-valuemin="0" 
                           aria-valuemax="100">
                      </div>
                    </div>
                  </div>
                  
                  <div class="resources mb-3">
                    <h6 class="text-muted">Рекомендуемые ресурсы:</h6>
                    <ul class="list-unstyled">
                      <li v-for="(resource, resIndex) in recommendation.resources" :key="resIndex">
                        <a :href="resource.url" target="_blank">{{ resource.title }}</a>
                        <span class="text-muted small"> - {{ resource.type }}</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div class="tasks">
                    <h6 class="text-muted">Задания:</h6>
                    <div class="table-responsive">
                      <table class="table table-sm">
                        <thead>
                          <tr>
                            <th>Задание</th>
                            <th>Срок</th>
                            <th>Статус</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(task, taskIndex) in recommendation.tasks" :key="taskIndex"
                              :class="{'table-success': task.completed, 'table-light': !task.completed}">
                            <td>{{ task.description }}</td>
                            <td>{{ task.deadline }}</td>
                            <td>
                              <span class="badge" :class="task.completed ? 'bg-success' : 'bg-secondary'">
                                {{ task.completed ? 'Выполнено' : 'В процессе' }}
                              </span>
                            </td>
                            <td class="text-end">
                              <button v-if="!task.completed" 
                                      class="btn btn-sm btn-outline-success"
                                      @click="completeTask(index, taskIndex)">
                                Завершить
                              </button>
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
        </div>
        
        <div class="col-md-4">
          <div class="card mb-4">
            <div class="card-header bg-success text-white">
              <h5 class="card-title mb-0">Обратная связь</h5>
            </div>
            <div class="card-body">
              <div v-if="feedbacks.length === 0" class="text-muted">
                Нет отзывов от преподавателей
              </div>
              <div v-else>
                <div v-for="(feedback, index) in feedbacks" :key="index" class="mb-3 pb-3 border-bottom">
                  <div class="d-flex justify-content-between">
                    <strong>{{ feedback.teacher }}</strong>
                    <small class="text-muted">{{ feedback.date }}</small>
                  </div>
                  <p class="mb-1">{{ feedback.comment }}</p>
                  <div v-if="feedback.recommendation" class="small text-muted">
                    Рекомендация: {{ feedback.recommendation }}
                  </div>
                </div>
              </div>
              
              <div class="mt-4">
                <h6 class="text-muted">Добавить отзыв</h6>
                <form @submit.prevent="addFeedback">
                  <div class="mb-3">
                    <textarea class="form-control" v-model="newFeedback.comment" rows="3" 
                              placeholder="Ваш комментарий..." required></textarea>
                  </div>
                  <div class="mb-3">
                    <input type="text" class="form-control" v-model="newFeedback.recommendation"
                           placeholder="Рекомендация (необязательно)">
                  </div>
                  <button type="submit" class="btn btn-success">Отправить</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'DevelopmentPlan',
    data() {
      return {
        selectedStudentId: 1,
        students: [
          { id: 1, name: 'Иванов Иван', group: 'ИВТ-101' },
          { id: 2, name: 'Петров Петр', group: 'ИВТ-101' },
          { id: 3, name: 'Сидорова Мария', group: 'ИВТ-102' }
        ],
        recommendations: [
          {
            competence: 'Программирование на Python',
            level: 'начальный',
            description: 'Необходимо улучшить понимание основных концепций программирования',
            currentProgress: 60,
            targetProgress: 85,
            resources: [
              { title: 'Python для начинающих', type: 'онлайн-курс', url: '#' },
              { title: 'Изучаем Python', type: 'книга', url: '#' }
            ],
            tasks: [
              { description: 'Решить 10 задач на Codewars', deadline: '15.06.2023', completed: false },
              { description: 'Создать простой калькулятор', deadline: '20.06.2023', completed: true }
            ]
          },
          {
            competence: 'Работа с базами данных',
            level: 'средний',
            description: 'Требуется больше практики с SQL-запросами',
            currentProgress: 45,
            targetProgress: 75,
            resources: [
              { title: 'SQL за 3 дня', type: 'видеокурс', url: '#' },
              { title: 'Практикум по SQL', type: 'вебинар', url: '#' }
            ],
            tasks: [
              { description: 'Спроектировать БД для блога', deadline: '25.06.2023', completed: false },
              { description: 'Написать 5 сложных SQL-запросов', deadline: '30.06.2023', completed: false }
            ]
          }
        ],
        feedbacks: [
          {
            teacher: 'Преподаватель Петрова',
            date: '10.05.2023',
            comment: 'Иван показывает хороший прогресс в программировании, но нужно больше практики с алгоритмами.',
            recommendation: 'Решать больше задач на алгоритмы'
          },
          {
            teacher: 'Преподаватель Сидоров',
            date: '05.05.2023',
            comment: 'Нужно улучшить понимание нормализации БД.',
            recommendation: 'Изучить 3NF на практических примерах'
          }
        ],
        newFeedback: {
          comment: '',
          recommendation: ''
        }
      }
    },
    methods: {
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
      completeTask(recommendationIndex, taskIndex) {
        this.recommendations[recommendationIndex].tasks[taskIndex].completed = true
        // Здесь можно добавить логику обновления прогресса
        this.recommendations[recommendationIndex].currentProgress += 10
      },
      addFeedback() {
        this.feedbacks.unshift({
          teacher: 'Текущий преподаватель',
          date: new Date().toLocaleDateString(),
          comment: this.newFeedback.comment,
          recommendation: this.newFeedback.recommendation
        })
        this.newFeedback.comment = ''
        this.newFeedback.recommendation = ''
      }
    }
  }
  </script>
  
  <style scoped>
  .resources li {
    margin-bottom: 0.5rem;
  }
  </style>
