<script setup>
import { ref } from 'vue'
import { Ban, Clock, Image, Mail, Phone, Star, Tag, Trash2 } from 'lucide-vue-next'

defineProps({
  activeDialog: { type: Number, required: true, default: 1 },
})

defineEmits(['toggleMessengerBuddyInfo'])

const user = ref([
  {
    image: '/src/assets/avatars/avatar-12.png',
    name: 'Алиса Михайлова',
    status: 'в сети',
    about: 'Я веб-дизайнер. Занимаюсь фронтенд-разработкой.',
    info: {
      email: 'alice.mihailovna@ya.ru',
      phone: '+7 564 924 15 90',
      clock: '10:00 - 18:00',
    },
  },
  {
    image: '/src/assets/avatars/avatar-21.png',
    name: 'Игорь Петров',
    status: 'был(а) недавно',
    about: 'Пишу логику, разбираюсь в алгоритмах. Моя сфера - бэкенд.',
    info: {
      email: 'igor.petrov@gmail.com',
      phone: '+7 987 604 32 90',
      clock: '12:00 - 20:00',
    },
  },
  {
    image: '/src/assets/avatars/avatar-26.png',
    name: 'Ваня Ломоносов',
    status: 'был(а) недавно',
    about: 'Делаю комплексные проекты. Пишу дизайн, логику, алгоритмы. Fullstack.',
    info: {
      email: 'vanya.lomonosov@gmail.com',
      phone: '+7 349 351 34 89',
      clock: '14:00 - 22:00',
    },
  },
])

const actions = ref([
  { icon: Tag, name: 'Отметить как' },
  { icon: Star, name: 'В избранное' },
  { icon: Image, name: 'Общие файлы' },
  { icon: Trash2, name: 'Удалить контакт' },
  { icon: Ban, name: 'Заблокировать контакт' },
])
</script>

<template>
  <div class="mb-3 text-end w-100">
    <button type="button" class="btn btn-close" @click="$emit('toggleMessengerBuddyInfo')"></button>
  </div>

  <div class="d-flex flex-column align-items-center">
    <img
      :src="user[activeDialog - 1].image"
      :alt="user[activeDialog - 1].name"
      class="rounded-circle"
      width="100"
      height="100"
    />
    <h5 class="mt-2 mb-1">{{ user[activeDialog - 1].name }}</h5>
    <div :class="user[activeDialog - 1].status === 'в сети' ? 'text-success' : 'text-muted'">
      {{ user[activeDialog - 1].status }}
    </div>
  </div>

  <div class="py-3">
    <h6 class="mb-1">Описание</h6>
    <p class="text-muted mb-0 lh-sm" style="font-size: 0.9375rem">
      {{ user[activeDialog - 1].about }}
    </p>
  </div>

  <div class="pb-3">
    <h6 class="mb-2">Информация</h6>
    <ul class="list-unstyled mb-0">
      <li
        class="rounded p-2 bg-secondary-subtle border border-secondary text-secondary-emphasis mb-2"
      >
        <div class="d-flex align-items-center gap-2">
          <Mail :size="21" />
          <span class="lh-sm">{{ user[activeDialog - 1].info.email }}</span>
        </div>
      </li>
      <li
        class="rounded p-2 bg-secondary-subtle border border-secondary text-secondary-emphasis mb-2"
      >
        <div class="d-flex align-items-center gap-2">
          <Phone :size="21" />
          <span class="lh-sm">{{ user[activeDialog - 1].info.phone }}</span>
        </div>
      </li>
      <li class="rounded p-2 bg-secondary-subtle border border-secondary text-secondary-emphasis">
        <div class="d-flex align-items-center gap-2">
          <Clock :size="21" />
          <span class="lh-sm">{{ user[activeDialog - 1].info.clock }}</span>
        </div>
      </li>
    </ul>
  </div>

  <div class="pb-3">
    <h6 class="mb-1">Опции</h6>
    <ul class="list-unstyled mb-0">
      <li v-for="(action, index) in actions" :key="index" class="hover-section rounded p-2">
        <div class="d-flex align-items-center gap-2">
          <component :is="action.icon" :size="21" />
          <span>{{ action.name }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss"></style>
