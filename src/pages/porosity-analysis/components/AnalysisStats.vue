<template>
  <div class="analysis-stats">
    <div class="row">
      <div class="col-md-3 col-sm-6 mb-3">
        <div class="stat-card stat-pending">
          <div class="stat-icon">
            <Clock size="24" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.pending || 0 }}</div>
            <div class="stat-label">Ожидающие</div>
          </div>
        </div>
      </div>
      
      <div class="col-md-3 col-sm-6 mb-3">
        <div class="stat-card stat-processing">
          <div class="stat-icon">
            <Loader2 size="24" class="fa-spin" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.processing || 0 }}</div>
            <div class="stat-label">Обрабатываются</div>
          </div>
        </div>
      </div>
      
      <div class="col-md-3 col-sm-6 mb-3">
        <div class="stat-card stat-completed">
          <div class="stat-icon">
            <CheckCircle size="24" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.completed || 0 }}</div>
            <div class="stat-label">Завершенные</div>
          </div>
        </div>
      </div>
      
      <div class="col-md-3 col-sm-6 mb-3">
        <div class="stat-card stat-failed">
          <div class="stat-icon">
            <AlertTriangle size="24" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.failed || 0 }}</div>
            <div class="stat-label">Ошибки</div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="showDetails" class="row mt-4">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h6 class="card-title mb-0">
              <TrendingUp class="me-2" size="20" />
              Общая статистика
            </h6>
          </div>
          <div class="card-body">
            <div class="detail-item">
              <span class="detail-label">Всего анализов:</span>
              <span class="detail-value">{{ totalAnalyses }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Успешных:</span>
              <span class="detail-value">{{ successRate }}%</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Средняя пористость:</span>
              <span class="detail-value">{{ averagePorosity }}%</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Среднее количество пор:</span>
              <span class="detail-value">{{ averagePores }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h6 class="card-title mb-0">
              <Calendar class="me-2" size="20" />
              Активность
            </h6>
          </div>
          <div class="card-body">
            <div class="detail-item">
              <span class="detail-label">За сегодня:</span>
              <span class="detail-value">{{ stats.today || 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">За неделю:</span>
              <span class="detail-value">{{ stats.week || 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">За месяц:</span>
              <span class="detail-value">{{ stats.month || 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Последний анализ:</span>
              <span class="detail-value">{{ lastAnalysisDate }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Clock, Loader2, CheckCircle, AlertTriangle, TrendingUp, Calendar } from 'lucide-vue-next'

export default {
  name: 'AnalysisStats',
  components: {
    Clock,
    Loader2,
    CheckCircle,
    AlertTriangle,
    TrendingUp,
    Calendar
  },
  props: {
    stats: {
      type: Object,
      default: () => ({
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        today: 0,
        week: 0,
        month: 0,
        average_porosity: 0,
        average_pores: 0,
        last_analysis: null
      })
    },
    showDetails: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    totalAnalyses() {
      return this.stats.pending + this.stats.processing + this.stats.completed + this.stats.failed
    },
    
    successRate() {
      if (this.totalAnalyses === 0) return 0
      return Math.round((this.stats.completed / this.totalAnalyses) * 100)
    },
    
    averagePorosity() {
      return this.stats.average_porosity?.toFixed(2) || '0.00'
    },
    
    averagePores() {
      return this.stats.average_pores?.toFixed(0) || '0'
    },
    
    lastAnalysisDate() {
      if (!this.stats.last_analysis) return 'Нет данных'
      const date = new Date(this.stats.last_analysis)
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.analysis-stats {
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  border-radius: 15px;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: none;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.15);
}

.stat-pending {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
}

.stat-processing {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.stat-completed {
  background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%);
}

.stat-failed {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
}

.stat-icon {
  font-size: 2.5rem;
  margin-right: 1.5rem;
  width: 3.5rem;
  text-align: center;
  opacity: 0.8;
}

.stat-pending .stat-icon {
  color: #ff6b35;
}

.stat-processing .stat-icon {
  color: #4ecdc4;
}

.stat-completed .stat-icon {
  color: #45b7d1;
}

.stat-failed .stat-icon {
  color: #ff6b6b;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.stat-label {
  font-size: 0.9rem;
  color: #34495e;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #ecf0f1;
  transition: background-color 0.2s ease;
}

.detail-item:hover {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 600;
  color: #2c3e50;
}

.detail-value {
  font-weight: 700;
  color: #3498db;
  font-size: 1.1rem;
}

.card {
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 15px;
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 15px 15px 0 0;
  border: none;
}

.card-body {
  padding: 1.5rem;
}
</style> 