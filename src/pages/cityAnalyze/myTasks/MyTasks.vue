<script setup>
import Cookies from 'js-cookie';
</script>
<template>
  <div class="tasks-container">
    <h1>Мои задачи</h1>
    
    <!-- FINISHED tasks -->
    <div v-if="finishedTasks.length > 0" class="task-section">
      <h2 class="task-section-title success">Завершённые задачи</h2>
      <div class="task-list">
        <div v-for="task in finishedTasks" :key="task.id" class="task-card success">
          <div class="task-header">
            <span class="task-id">#{{ task.id }}</span>
            <span class="task-date">{{ formatDate(task.date) }}</span>
            <span class="task-status">{{ task.status }}</span>
          </div>
          <div class="task-description">
            {{ task.status_description }}
          </div>
          <div class="task-actions">
            <router-link :to="{ name: 'CityAnalyzeTask', params: { id: task.id } }" class="btn btn-details">Посмотреть подробнее</router-link>
          </div>
        </div>
      </div>
    </div>
    
    <!-- RUNNING tasks -->
    <div v-if="runningTasks.length > 0" class="task-section">
      <h2 class="task-section-title running">Выполняющиеся задачи</h2>
      <div class="task-list">
        <div v-for="task in runningTasks" :key="task.id" class="task-card running">
          <div class="task-header">
            <span class="task-id">#{{ task.id }}</span>
            <span class="task-date">{{ formatDate(task.date) }}</span>
            <span class="task-status">{{ task.status }}</span>
          </div>
          <div class="task-description">
            {{ task.status_description }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- FAILED tasks with toggle -->
    <div v-if="failedTasks.length > 0" class="task-section">
      <div class="task-section-header">
        <h2 class="task-section-title error">Задачи с ошибкой</h2>
        <button @click="toggleFailedTasks" class="btn btn-toggle">
          {{ showFailedTasks ? 'Скрыть' : 'Показать' }}
        </button>
      </div>
      <div v-if="showFailedTasks" class="task-list">
        <div v-for="task in failedTasks" :key="task.id" class="task-card error">
          <div class="task-header">
            <span class="task-id">#{{ task.id }}</span>
            <span class="task-date">{{ formatDate(task.date) }}</span>
            <span class="task-status">{{ task.status }}</span>
          </div>
          <div class="task-description">
            {{ task.status_description }}
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="isLoading" class="loading">Загрузка...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<script>
export default {
  name: 'UserTasks',
  data() {
    return {
      tasks: [],
      isLoading: false,
      error: null,
      showFailedTasks: true,
      pollingInterval: null
    }
  },
  computed: {
    finishedTasks() {
      return this.tasks
        .filter(task => task.status === 'FINISHED')
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    },
    runningTasks() {
      return this.tasks
        .filter(task => task.status === 'RUNNING')
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    },
    failedTasks() {
      return this.tasks
        .filter(task => task.status === 'FAILED')
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    },
    runningTaskIds() {
      return this.runningTasks.map(task => task.id)
    }
  },
  created() {
    this.fetchTasks()
  },
  mounted() {
    this.startPolling()
  },
  beforeDestroy() {
    this.stopPolling()
  },
  methods: {
    async fetchTasks() {
      this.isLoading = true
      this.error = null
      try {
        const token = Cookies.get('token');

        const response = await fetch('http://localhost:8000/api/cities_expansion/get_my_tasks/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Необходима авторизация')
          }
          throw new Error('Ошибка при загрузке задач')
        }
        
        this.tasks = await response.json()
      } catch (err) {
        this.error = err.message
      } finally {
        this.isLoading = false
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleString()
    },
    toggleFailedTasks() {
      this.showFailedTasks = !this.showFailedTasks
    },
    async fetchTaskStatus(taskId) {
      try {
        const token = Cookies.get('token');

        const response = await fetch(
          `http://localhost:8000/api/cities_expansion/geoanalyzer/task_status?task_id=${taskId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )
        
        if (!response.ok) throw new Error('Ошибка при проверке статуса задачи')
        
        return await response.json()
      } catch (err) {
        console.error(`Ошибка при проверке статуса задачи ${taskId}:`, err)
        return null
      }
    },
    async checkRunningTasks() {
      if (this.runningTaskIds.length === 0) return
      
      const updates = await Promise.all(
        this.runningTaskIds.map(async taskId => {
          return await this.fetchTaskStatus(taskId)
        })
      )

      this.tasks = this.tasks.map(task => {
        const update = updates.find(u => u && u.task_id === task.id)
        return update ? { ...task, ...update } : task
      })
    },

    startPolling() {
      this.pollingInterval = setInterval(() => {
        this.checkRunningTasks()
      }, 10000)
    },

    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval)
        this.pollingInterval = null
      }
    }
  }
}
</script>

<style scoped lang="scss">
.tasks-container {
  padding: 20px;

  h1 {
    margin-bottom: 20px;
  }

  .loading, .error-message {
    padding: 20px;
    text-align: center;
  }

  .error-message {
    color: #e74c3c;
  }

  .task-section {
    margin-bottom: 30px;
    padding: 15px;
    border: 1px solid #eee;
    border-radius: 5px;

    .task-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    h2 {
      margin-bottom: 0;
      color: #AAA;
    }

    .task-list {
      display: flex;
      flex-direction: column;
      gap: 15px;

      .task-card {
        padding: 15px;
        border-radius: 5px;
        border: 1px solid #eee;
        transition: all 0.2s;

        &:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .task-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-weight: bold;

          .task-id {
            color: #b8b3b3;
          }

          .task-date {
            color: #b8b3b3;
          }

          .task-status {
            text-transform: capitalize;
          }
        }

        .task-description {
          margin-bottom: 10px;
          color: #b8b3b3;
        }

        .task-actions {
          margin-top: 10px;
        }
      }

      .task-card.success {
        border-left: 4px solid #2ecc71;
        background-color: rgba(46, 204, 113, 0.05);

        .task-status {
          color: #27ae60;
        }
      }

      .task-card.running {
        border-left: 4px solid #3498db;
        background-color: rgba(52, 152, 219, 0.05);

        .task-status {
          color: #2980b9;
        }
      }

      .task-card.error {
        border-left: 4px solid #e74c3c;
        background-color: rgba(231, 76, 60, 0.05);

        .task-status {
          color: #c0392b;
        }
      }
    }
  }

  .btn {
    margin: 5px 0;
    padding: 8px 15px;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &-details {
      background: #3498db;
      color: white;
      text-decoration: none;

      &:hover {
        background: #2980b9;
      }
    }

    &-toggle {
      background: #f5f5f5;
      color: #333;

      &:hover {
        background: #e0e0e0;
      }
    }
  }
}
</style>