<script setup>
import { Search } from 'lucide-vue-next'
import { ref } from 'vue'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'

defineProps({
  activeDialog: { type: Number, required: true },
  userStatus: { type: String, required: true, default: 'online' },
  lastMessage: { type: Object, required: true },
})

defineEmits(['toggleMessengerMyInfo', 'openDialog'])

const chatsList = ref([
  { id: 1, image: '/src/assets/avatars/avatar-12.png', name: 'Алиса Михайловна', status: true },
  { id: 2, image: '/src/assets/avatars/avatar-21.png', name: 'Игорь Петров', status: false },
  { id: 3, image: '/src/assets/avatars/avatar-26.png', name: 'Ваня Ломоносов', status: false },
])

const contactsList = ref([
  { id: 1, image: '/src/assets/avatars/avatar-42.png', name: 'Ульяна Мирова', online: false },
  { id: 2, image: '/src/assets/avatars/avatar-28.png', name: 'Владимир Быков', online: false },
  { id: 3, image: '/src/assets/avatars/avatar-18.png', name: 'Аким Смирнов', online: true },
  { id: 4, image: '/src/assets/avatars/avatar-31.png', name: 'Михаил Самойлов', online: false },
  { id: 5, image: '/src/assets/avatars/avatar-29.png', name: 'Инна Некрасова', online: true },
  { id: 6, image: '/src/assets/avatars/avatar-17.png', name: 'Василиса Иванова', online: true },
  { id: 7, image: '/src/assets/avatars/avatar-20.png', name: 'Вадим Ушаков', online: false },
  { id: 9, image: '/src/assets/avatars/avatar-9.png', name: 'Эля Орлова', online: true },
  { id: 10, image: '/src/assets/avatars/avatar-43.png', name: 'Ирина Смирнова', online: true },
])
</script>

<template>
  <div class="d-flex align-items-center gap-2 pb-2 border-bottom">
    <div class="d-block">
      <div class="avatar" :class="`avatar-${userStatus}`">
        <img
          src="/src/assets/avatars/avatar-1.png"
          alt="Иван Иванов"
          class="rounded-circle"
          width="40"
          height="40"
          @click="$emit('toggleMessengerMyInfo')"
          style="cursor: pointer"
        />
      </div>
    </div>

    <div class="d-flex form-control align-items-center gap-2 w-100">
      <Search :size="20" color="var(--bs-secondary-text-emphasis)" />
      <input
        type="text"
        placeholder="Поиск..."
        class="border-0 bg-transparent w-100"
        style="outline: none"
      />
    </div>
  </div>

  <PerfectScrollbar>
    <div class="mt-2">
      <h5 class="fw-bold my-2">Чаты</h5>
      <ul class="list-unstyled mb-0">
        <li
          v-for="chat in chatsList"
          :key="chat.id"
          class="hover-section rounded p-2"
          :class="activeDialog === chat.id ? 'bg-secondary-subtle' : ''"
          @click="$emit('openDialog', chat.id)"
        >
          <div class="d-flex align-items-center gap-2">
            <div class="d-block">
              <div class="avatar" :class="`avatar-${chat.status ? 'online' : 'offline'}`">
                <img :src="chat.image" :alt="chat.name" class="rounded-circle" width="40" />
              </div>
            </div>

            <div class="d-flex flex-column text-truncate w-100">
              <div class="d-flex justify-content-between lh-sm">
                <span class="fw-bold">{{ chat.name }}</span>
                <span class="text-muted small">{{ lastMessage[chat.id - 1].date }}</span>
              </div>
              <span class="text-muted small text-truncate">
                {{ lastMessage[chat.id - 1].message }}
              </span>
            </div>
          </div>
        </li>
      </ul>

      <h5 class="fw-bold my-2">Контакты</h5>
      <ul class="list-unstyled mb-0">
        <li v-for="contact in contactsList" :key="contact.id" class="hover-section rounded p-2">
          <div class="d-flex align-items-center gap-2">
            <img :src="contact.image" :alt="contact.name" class="rounded-circle" width="40" />
            <div class="d-flex flex-column w-100 lh-sm">
              <span class="fw-bold">{{ contact.name }}</span>
              <span class="text-muted small">{{
                contact.online ? 'в сети' : 'был(а) недавно'
              }}</span>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </PerfectScrollbar>
</template>

<style scoped lang="scss">
.dialogs {
  overflow-y: auto;
  scrollbar-width: thin;
}

.hover-section:hover .avatar-online::after,
.hover-section:hover .avatar-offline::after,
.hover-section.bg-secondary-subtle .avatar-online::after,
.hover-section.bg-secondary-subtle .avatar-offline::after {
  box-shadow: 0 0 0 2px var(--color-secondary-background);
}
</style>
