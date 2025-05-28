<template>
  <div class="page-creation min-vh-100 d-flex align-items-center">
    <div class="container py-5">
      <div class="fancy-title mx-auto">Выберите действие</div>

      <div class="row gx-4 gy-4">
        <div v-for="opt in options" :key="opt.title" class="col-12 col-md-6">
          <div class="option-card" @click="navigateTo(opt.route)">
            <div class="icon-wrapper me-4">
              <component :is="opt.icon" size="28" class="text-primary" />
            </div>
            <div class="content">
              <h3 class="option-title mb-1">{{ opt.title }}</h3>
              <p class="option-desc mb-0">{{ opt.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { FileText, Copy, Tag, Grid2x2 } from 'lucide-vue-next'

const router = useRouter()
const navigateTo = (route) => router.push(route)

const options = [
  {
    title: 'Создать страницу',
    description: 'Новая страница с нуля или из шаблона',
    route: '/shortcodes/create-page',
    icon: FileText,
  },
  {
    title: 'Создать шаблон страницы',
    description: 'Шаблон для повторного использования',
    route: '/shortcodes/create-template',
    icon: Copy,
  },
  {
    title: 'Управление категориями',
    description: 'Создание и редактирование категорий компонентов',
    route: '/shortcodes/categories-page',
    icon: Tag,
  },
  {
    title: 'Редактор шаблонов шорткодов',
    description: 'Создание и управление шаблонами шорткодов',
    route: '/shortcodes/templates',
    icon: Grid2x2,
  },
]
</script>

<style scoped>
.page-creation {
  background-color: #f4f6f9;
}

.fancy-title {
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: 2.75rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: #212529;
  text-align: center;
  margin-bottom: 3rem;
  position: relative;
  display: inline-block;
}
.fancy-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 50%;
  height: 4px;
  background-color: var(--bs-primary);
  border-radius: 2px;
}

.option-card {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border-left: 5px solid var(--bs-primary);
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    border-left-width 0.3s ease;
  cursor: pointer;
}
.option-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  border-left-width: 8px;
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  background-color: #eaf0fc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.04),
    0 2px 8px rgba(0, 0, 0, 0.06);
}

.option-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: #212529;
}
.option-desc {
  font-size: 0.95rem;
  color: #495057;
}
</style>
