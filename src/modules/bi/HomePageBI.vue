<script setup>
import { ref } from 'vue'
import { Plug, Database, BarChart3, LayoutDashboard } from 'lucide-vue-next'
import { isDatasetSidebarOpen, currentSidebarPage } from '@/modules/bi/js/useSidebarStore'
import CardSidebarBody from '@/modules/bi/components/CardSidebarBody.vue'
import StorageSidebar from '@/modules/bi/components/StorageSidebar.vue'
import BILogo from '@/modules/bi/components/BILogo.vue'

const openSidebar = (page) => {
  currentSidebarPage.value   = page
  isDatasetSidebarOpen.value = true
}
</script>

<template>
  <div class="homepage-bi space-y-12">
    <div class="logo" style="display: flex;">
      <BILogo class="bi-logo" style="height: 64px;" />
    </div>

    <!-- Баннер -->
    <div class="banner-wrapper mt-5">
      <div class="banner-content">
        <h2 class="text-2xl font-bold">Тариф PRO+ открывает дополнительные возможности</h2>
        <p class="text-sm text-zinc-300 mt-2">
          Статистика использования, стилизация UI, безопасное встраивание,<br>
          SLA, приоритетная поддержка и другие преимущества.
        </p>
        <div class="buttons mt-5 d-flex gap-3">
          <button class="btn btn-danger" @click="() => openSidebar('datasets')">Открыть датасеты</button>
          <button class="btn btn-outline-danger">Узнать больше</button>
        </div>
      </div>
    </div>

    <!-- Карточки -->
    <div style="margin-top: 30px; display: flex; gap: 20px; justify-content: center;">
      <div class="card-section">
        <CardSidebarBody
          :icon="Plug"
          icolor="rgb(var(--bs-info-rgb))"
          title="Подключения"
          targetPage="connections"
          description="Добавляйте внешние источники данных, выполняйте синхронизацию и объединяйте данные из разных систем."
          @open="() => openSidebar('connections')"
        />
      </div>
      <div class="card-section">
        <CardSidebarBody
          :icon="Database"
          icolor="rgb(var(--bs-primary-rgb))"
          title="Датасеты"
          targetPage="datasets"
          description="Создавайте и управляйте моделями данных с вычисляемыми полями, фильтрами и структурой для анализа."
          @open="() => openSidebar('datasets')"
        />
      </div>
      <div class="card-section">
        <CardSidebarBody
          :icon="BarChart3"
          icolor="rgb(var(--bs-warning-rgb))"
          title="Чарты"
          targetPage="charts"
          description="Создавайте графики, таблицы и визуальные представления данных для эффективного анализа и принятия решений."
          @open="() => openSidebar('charts')"
        />
      </div>
      <div class="card-section">
        <CardSidebarBody
          :icon="LayoutDashboard"
          icolor="rgb(var(--bs-success-rgb))"
          title="Дашборды"
          targetPage="dashboards"
          description="Создавайте интерактивные дашборды и объединяйте графики на одной странице для мониторинга и анализа данных."
          @open="() => openSidebar('dashboards')"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.banner-wrapper {
  height: 260px;
  border-radius: 10px;
  background-image: linear-gradient(to right, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0)), url('/src/assets/carousel/photo-3.png');
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.banner-content {
  padding-left: 30px;
  color: #f2f2f2;
  max-width: 560px;
}

.card-section {
  box-shadow: none;
  border-radius: 15px;
  background-color: var(--color-primary-background);
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
}
@media (max-width: 900px) {
  .card-section { width: 100%; min-width: 0; }
  .homepage-bi > div[style*="display: flex"] { flex-direction: column; gap: 22px !important; }
}
</style>

