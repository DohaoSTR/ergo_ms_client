<template>
  <div class="project-reports">
    <!-- Красивый градиентный заголовок -->
    <div class="hero-section">
      <div class="container-fluid">
        <div class="row">
          <div class="col-12">
            <div class="hero-content">
              <div class="hero-text">
                <h1 class="hero-title">
                  <i class="fas fa-chart-bar mr-3"></i>
                  Отчеты и аналитика
                </h1>
                <p class="hero-subtitle">Аналитические отчеты и статистика по стратегическим проектам</p>
              </div>
            </div>
            
            <nav aria-label="breadcrumb" class="hero-breadcrumb">
              <ol class="breadcrumb">
                <li class="breadcrumb-item"><router-link to="/">Главная</router-link></li>
                <li class="breadcrumb-item"><router-link to="/crm">CRM</router-link></li>
                <li class="breadcrumb-item">
                  <router-link to="/crm/strategic-projects">Стратегические проекты</router-link>
                </li>
                <li class="breadcrumb-item active">Отчеты</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <div class="empty-state">
            <div class="empty-icon">
              <i class="fas fa-chart-bar"></i>
            </div>
            <h4 class="empty-title">Модуль отчетов</h4>
            <p class="empty-text">Функциональность отчетов и аналитики будет добавлена в следующих версиях</p>
            <router-link to="/crm/strategic-projects" class="btn btn-primary">
              <i class="fas fa-arrow-left mr-2"></i>
              Вернуться к проектам
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProjectReports'
}
</script>

<style scoped>
.project-reports {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem 0 2rem;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 2;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.hero-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0.5rem 0 0;
}

.hero-breadcrumb {
  margin-top: 2rem;
}

.hero-breadcrumb .breadcrumb {
  background: rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  backdrop-filter: blur(10px);
}

.hero-breadcrumb .breadcrumb-item a {
  color: rgba(255,255,255,0.8);
  text-decoration: none;
}

.hero-breadcrumb .breadcrumb-item.active {
  color: rgba(255,255,255,0.9);
}

.empty-state {
  text-align: center;
  padding: 5rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.empty-icon {
  width: 100px;
  height: 100px;
  margin: 0 auto 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: white;
}

.empty-title {
  font-size: 2rem;
  font-weight: 600;
  color: #2d3436;
  margin-bottom: 1rem;
}

.empty-text {
  font-size: 1.1rem;
  color: #6c757d;
  margin-bottom: 2rem;
}

.btn-primary {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  border-radius: 8px;
}
</style>