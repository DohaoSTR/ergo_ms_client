<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

import EmailNavBar from '@/modules/email/EmailNavBar.vue'
import EmailHeader from '@/modules/email/EmailHeader.vue'
import EmailContent from '@/modules/email/EmailContent.vue'
import ModalCenter from '@/components/ModalCenter.vue'

const isEmailMenuOpen = ref(window.innerWidth >= 992)
const isOverlayVisible = ref(false)

// Переключение видимости меню
const toggleEmailMenu = () => {
  isEmailMenuOpen.value = !isEmailMenuOpen.value
  isOverlayVisible.value = isEmailMenuOpen.value
}

// Переключение видимости меню в зависимости от ширины экрана
const autoToggleEmailMenu = () => {
  if (window.innerWidth >= 992) {
    isEmailMenuOpen.value = true
    isOverlayVisible.value = false
  } else {
    isEmailMenuOpen.value = false
    isOverlayVisible.value = false
  }
}

// Закрытие меню, нажатием на пустое место
const closeEmailMenu = () => {
  isEmailMenuOpen.value = false
  isOverlayVisible.value = false
}

// Инициализация
onMounted(() => window.addEventListener('resize', autoToggleEmailMenu))
onBeforeUnmount(() => window.removeEventListener('resize', autoToggleEmailMenu))

// =================================================

// Активная категория
const activeCategory = ref('inbox')

// Обработчик изменения категории
const handleCategoryChange = (category) => {
  activeCategory.value = category
}
</script>

<template>
  <div class="card p-0 overflow-hidden">
    <Transition name="slide">
      <div
        v-if="isEmailMenuOpen"
        class="email-sidebar card shadow-none rounded-0 border-end"
        :class="{ collapsed: !isEmailMenuOpen }"
      >
        <EmailNavBar :activeCategory="activeCategory" @changeEmailCategory="handleCategoryChange" />
      </div>
    </Transition>

    <ModalCenter title="Написать сообщение" modal-id="sendEmail">
      <div class="mb-2">Кому:</div>
      <select class="form-select">
        <option selected></option>
        <option value="1">ivan.petrov@example.com</option>
        <option value="2">olga.smirnova@mail.ru</option>
        <option value="3">alexander.kuznetsov@gmail.com</option>
        <option value="4">natalia.ivanova@yahoo.com</option>
        <option value="5">dmitri.sokolov@hotmail.com</option>
        <option value="6">ekaterina.andreeva@yandex.ru</option>
        <option value="7">sergei.nikolaev@rambler.ru</option>
        <option value="8">elena.kuzmina@outlook.com</option>
        <option value="9">andrei.voronin@inbox.ru</option>
        <option value="10">tatiana.orlova@bk.ru</option>
      </select>
      <div class="my-2">
        <label for="subject" class="form-label">Заголовок:</label>
        <input type="text" class="form-control" id="subject" placeholder="Заголовок" />
      </div>
      <div class="mb-2">Текст письма:</div>
      <textarea class="form-control" aria-label="С текстовым полем"></textarea>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Отправить</button>
      </div>
    </ModalCenter>

    <div class="email-content card shadow-none position-relative">
      <EmailHeader @toggleEmailMenu="toggleEmailMenu" />
      <EmailContent :activeCategory="activeCategory" />
    </div>

    <div @click="closeEmailMenu" class="layout-overlay" :class="{ active: isOverlayVisible }"></div>
  </div>
</template>

<style lang="scss" scoped>
.email-sidebar {
  position: absolute;
  top: 0;
  left: 0;
  width: 16.25rem;
  height: 100%;
  z-index: 11;
}

.slide-enter-active,
.slide-leave-active {
  transition: all $transition;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
}

.email-content {
  padding-left: calc(16.25rem + 1.2rem);
  height: 85dvh;
}

@media (width <= 991px) {
  .email-content {
    padding-left: 1.2rem;
  }
}
</style>
