<script setup>
import { ref } from 'vue'
import { Check, Crown, Flag, Languages, Link, Mail, Phone, UserRound } from 'lucide-vue-next'

const userAbout = ref({
  fullName: 'Иван Иванов',
  status: true,
  role: 'Разработчик',
  country: 'Россия',
  language: 'Русский',
})


const userContact = ref({
  phone: '+7 (123) 456-78-90',
  email: 'FbG8Z@example.com',
  website: 'ivanivanov.dev',
})
</script>

<template>
  <div class="card h-100">
    <h5 class="card-title mb-3">Информация</h5>
    <ul class="list-unstyled d-flex flex-column gap-2">
      <li class="d-flex align-items-center gap-1">
        <div class="icon-flex"><UserRound :size="20" /></div>
        <div class="d-flex gap-1">
          <span class="fw-bold">Полное имя:</span>
          {{ userAbout.fullName }}
        </div>
      </li>
      <li class="d-flex align-items-center gap-1">
        <div class="icon-flex"><Check :size="20" /></div>
        <div class="d-flex gap-1">
          <span class="fw-bold">Статус:</span>
          {{ userAbout.status ? 'Активен' : 'Не активен' }}
        </div>
      </li>
      <li class="d-flex align-items-center gap-1">
        <div class="icon-flex"><Crown :size="20" /></div>
        <div class="d-flex gap-1">
          <span class="fw-bold">Роль:</span>
          {{ userAbout.role }}
        </div>
      </li>
      <li class="d-flex align-items-center gap-1">
        <div class="icon-flex"><Flag :size="20" /></div>
        <div class="d-flex gap-1">
          <span class="fw-bold">Страна:</span>
          {{ userAbout.country }}
        </div>
      </li>
      <li class="d-flex align-items-center gap-1">
        <div class="icon-flex"><Languages :size="20" /></div>
        <div class="d-flex gap-1">
          <span class="fw-bold">Язык:</span>
          {{ userAbout.language }}
        </div>
      </li>
    </ul>
    <h5 class="card-title mb-3">Контакты</h5>
    <ul class="list-unstyled d-flex flex-column gap-2 mb-0">
      <li class="d-flex align-items-center gap-1">
        <div class="icon-flex"><Phone :size="20" /></div>
        <div class="d-flex gap-1">
          <span class="fw-bold">Телефон:</span>
          {{ userContact.phone }}
        </div>
      </li>
      <li class="d-flex align-items-center gap-1">
        <div class="icon-flex"><Mail :size="20" /></div>
        <div class="d-flex gap-1">
          <span class="fw-bold">Почта:</span>
          {{ userContact.email }}
        </div>
      </li>
      <li class="d-flex align-items-center gap-1">
        <div class="icon-flex"><Link :size="20" /></div>
        <div class="d-flex gap-1">
          <span class="fw-bold">Сайт:</span>
          <a :href="userContact.website">{{ userContact.website }}</a>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss"></style>
