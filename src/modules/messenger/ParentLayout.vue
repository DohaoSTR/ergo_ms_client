<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import MessengerHeader from '@/modules/messenger/MessengerHeader.vue'
import MessengerLeft from '@/modules/messenger/MessengerLeft.vue'
import MessengerRight from '@/modules/messenger/MessengerRight.vue'
import MessengerContent from '@/modules/messenger/MessengerContent.vue'
import MessengerNavbar from '@/modules/messenger/MessengerNavbar.vue'

// Боковое левое и правое окно
const isLeftSideOpen = ref(false)
const toggleSideLeft = () => (isLeftSideOpen.value = !isLeftSideOpen.value)

const isRightSideOpen = ref(false)
const toggleRightSide = () => (isRightSideOpen.value = !isRightSideOpen.value)

// ==================================================

// Активный диалог
const activeDialog = ref(1)

const setActiveDialog = (dialogId) => {
  activeDialog.value = dialogId
  if (window.innerWidth < 992) toggleMessengerMenu()
}

// Свернуть правое окно при смене активного диалога
watch(
  () => activeDialog.value,
  () => (isRightSideOpen.value = false),
)

// ==================================================

// Статус активности пользователя
const userStatus = ref('online')
const choiceStatus = (status) => (userStatus.value = status)

// ==================================================

// Последние сообщения
const lastMessages = ref([
  { message: 'Хорошо)', date: '10:11' },
  { message: 'Сообщений пока нет', date: '' },
  { message: 'Сообщений пока нет', date: '' },
])

const changeLastMessage = (message) => {
  lastMessages.value[message.dialog - 1].message = message.text
  lastMessages.value[message.dialog - 1].date = message.date
}

// ==================================================

// Боковое основное меню
const isMessengerMenuOpen = ref(window.innerWidth >= 992)
const isOverlayVisible = ref(false)

// Переключение видимости меню
const toggleMessengerMenu = () => {
  isMessengerMenuOpen.value = !isMessengerMenuOpen.value
  isOverlayVisible.value = isMessengerMenuOpen.value
}

// Переключение видимости меню в зависимости от ширины экрана
const autoToggleMessengerMenu = () => {
  if (window.innerWidth >= 992) {
    isMessengerMenuOpen.value = true
    isOverlayVisible.value = false
  } else {
    isMessengerMenuOpen.value = false
    isOverlayVisible.value = false
  }
}

// Закрытие меню, нажатием на пустое место
const closeMessengerMenu = () => {
  if (isLeftSideOpen.value) isLeftSideOpen.value = false
  else if (isRightSideOpen.value) isRightSideOpen.value = false
  else toggleMessengerMenu()
}

// Инициализация
onMounted(() => window.addEventListener('resize', autoToggleMessengerMenu))
onBeforeUnmount(() => window.removeEventListener('resize', autoToggleMessengerMenu))
</script>

<template>
  <div class="messenger card p-0 overflow-hidden">
    <Transition name="slide">
      <div
        v-if="isMessengerMenuOpen"
        class="messenger-sidebar card shadow-none rounded-0 border-end"
      >
        <MessengerNavbar
          :activeDialog="activeDialog"
          :userStatus="userStatus"
          :lastMessage="lastMessages"
          @toggleMessengerMyInfo="toggleSideLeft"
          @openDialog="setActiveDialog"
        />
      </div>
    </Transition>

    <Transition name="slide">
      <div
        v-if="isLeftSideOpen"
        class="messenger-sidebar beautiful-scrollbar card shadow-none rounded-0 border-end"
      >
        <MessengerLeft
          :userStatus="userStatus"
          @toggleMessengerMyInfo="toggleSideLeft"
          @choiceStatus="choiceStatus"
        />
      </div>
    </Transition>

    <div class="messenger-content card shadow-none position-relative">
      <MessengerHeader
        :activeDialog="activeDialog"
        @toggleMessengerMenu="toggleMessengerMenu"
        @toggleMessengerBuddyInfo="toggleRightSide"
      />
      <MessengerContent :activeDialog="activeDialog" @changeLastMessage="changeLastMessage" />
      <Transition name="slide-right">
        <div
          v-if="isRightSideOpen"
          class="messenger-user-info beautiful-scrollbar card rounded-0 shadow-none border-start"
        >
          <MessengerRight
            :activeDialog="activeDialog"
            @toggleMessengerBuddyInfo="toggleRightSide"
          />
        </div>
      </Transition>
    </div>

    <div
      @click="closeMessengerMenu"
      class="layout-overlay"
      :class="{ active: isOverlayVisible || isLeftSideOpen || isRightSideOpen }"
    ></div>
  </div>
</template>

<style scoped lang="scss">
.messenger {
  height: 85dvh;
}

.messenger-content {
  padding-left: calc(20rem + 1rem);
  height: 85dvh;

  @media (width <= 991px) {
    padding-left: 1rem;
  }
}

@media (width <= 991px) {
  .messenger-content {
    padding-left: 1rem;
  }
}

// Левое боковое меню
.messenger-sidebar {
  position: absolute;
  top: 0;
  left: 0;
  width: 20rem;
  height: 100%;
  z-index: 11;

  @media (width <= 767px) {
    width: 100%;
  }
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

// Правое боковое меню
.messenger-user-info {
  position: absolute;
  top: 0;
  right: 0;
  width: 20rem;
  height: 100%;
  z-index: 11;

  @media (width <= 767px) {
    width: 100%;
  }
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform $transition;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}

.slide-right-enter-to,
.slide-right-leave-from {
  transform: translateX(0);
}
</style>
