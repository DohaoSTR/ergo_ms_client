<script setup>
import { useRouter } from 'vue-router'
import { Tag, Hash } from 'lucide-vue-next'

const router = useRouter()
const goToCategories = () => router.push({ name: 'PageCategoriesManager' })
const goToTags = () => router.push({ name: 'TagsManager' })
</script>

<template>
  <div class="categories-card min-vh-100 d-flex align-items-center">
    <div class="container pt-1">
      <div class="fancy-title mx-auto">Управление категориями и тегами</div>
      <div class="main-card mx-auto">
        <div class="main-card-header"></div>
        <div class="row gx-5 gy-5 mt-1 align-items-stretch">
          <div class="col-12 col-md-6 d-flex">
            <div class="section-card border-success flex-grow-1" @click="goToCategories">
              <component :is="Tag" size="40" class="section-icon text-success" />
              <div class="section-content">
                <div class="section-title">Менеджер категорий</div>
                <div class="section-desc">Создавайте, редактируйте и удаляйте категории</div>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-6 d-flex">
            <div class="section-card border-hash flex-grow-1" @click="goToTags">
              <span class="main-card-icon bg-hash" style="padding: 0.7rem 0.7rem; margin-right: 1.7rem;">
                <component :is="Hash" size="28" class="section-icon text-hash" style="margin-right:0;" />
              </span>
              <div class="section-content">
                <div class="section-title">Менеджер тегов</div>
                <div class="section-desc">Управляйте тегами для быстрого поиска</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fancy-title {
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: 2.5rem;
  font-weight: 700;
  color: #212529;
  text-align: center;
  margin-bottom: 3.5rem;
  position: relative;
  display: inline-block;
}
.fancy-title::after {
  content: '';
  position: absolute;
  bottom: -14px;
  left: 47%;
  transform: translateX(-50%);
  width: 90%;
  height: 3px;
  border-radius: 4px;
}
.main-card-header {
  display: flex;
  align-items: center;
  margin-bottom: 2.5rem;
}
.main-card-icon {
  background: #eaf0fc;
  border-radius: 50%;
  margin-right: 1.7rem;
  padding: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bg-hash {
  background: #fff2e1 !important;
}
.text-hash {
  color: #ff9800 !important;
}
.section-card {
  display: flex;
  align-items: center;
  padding: 3.5rem 3rem;
  min-height: 250px;
  border-radius: 2.2rem;
  box-shadow: 0 6px 24px rgba(50,80,180,0.07);
  cursor: pointer;
  transition:
    box-shadow 0.22s,
    transform 0.22s,
    border-color 0.22s,
    background 0.22s;
  border: 5px solid #f7b045;
  margin-bottom: 2.2rem;
  position: relative;
  z-index: 1;
  height: 100%;
  background: transparent;
}
.section-card:hover {
  box-shadow: 0 12px 36px rgba(30,80,180,0.19);
  transform: translateY(-6px) scale(1.05);
  border-color: #fff !important;
  background: #fff;
}

.border-success {
  border-color: #4CAF50 !important;
}
.border-hash {
  border-color: #ff9800 !important;
}

.section-icon {
  margin-right: 2rem;
  font-size: 2.5rem;
}
.section-title {
  font-size: 1.7rem;
  font-weight: 700;
  color: #253152;
  margin-bottom: 0.6rem;
}
.section-desc {
  font-size: 1.25rem;
  color: #627083;
  margin-top: 0.4rem;
}
.section-content {
  flex: 1;
}
</style>
