<script setup>
import { computed, ref, watch } from 'vue'

import EmailList from '@/modules/email/EmailList.vue'
import EmailActions from '@/modules/email/EmailActions.vue'
import EmailPage from '@/modules/email/EmailPage.vue'

const props = defineProps({
  activeCategory: { type: String, default: 'inbox' },
})

// ==================================================

// Открытие письма
const emailIsOpened = ref(false)
const openedEmail = ref({})

// Переключение открытия письма (с информацией о письме)
const toggleEmailPage = (email) => {
  openedEmail.value = email
  emailIsOpened.value = !emailIsOpened.value
}

// ==================================================

// Выбранные письма
const selectedEmails = ref(new Set())

// Сброса выделений при смене категории
watch(
  () => props.activeCategory,
  () => selectedEmails.value.clear(),
)

// Выделение всех писем
const toggleAllSelection = () => {
  const filteredEmailsIds = filteredEmails.value.map((email) => email.id)

  if (selectedEmails.value.size === filteredEmailsIds.length) {
    selectedEmails.value.clear()
  } else {
    filteredEmailsIds.forEach((id) => selectedEmails.value.add(id))
  }
}

// Выделение конкретного писем
const toggleSelection = (index) => {
  if (selectedEmails.value.has(index)) selectedEmails.value.delete(index)
  else selectedEmails.value.add(index)
}

// Отметка писем
const markEmail = (index) => {
  const email = emails.value.find((e) => e.id === index)
  if (email) email.marked = !email.marked
}

// Удаление писем
const deleteEmail = () => {
  emails.value.forEach((e) => {
    if (selectedEmails.value.has(e.id)) e.trash = true
  })
  selectedEmails.value.clear()
}

// Восстановление писем
const recoverEmail = () => {
  emails.value.forEach((e) => {
    if (selectedEmails.value.has(e.id)) e.trash = false
  })
  selectedEmails.value.clear()
}

// Пометка как спам
const spamEmail = () => {
  emails.value.forEach((e) => {
    if (selectedEmails.value.has(e.id)) e.spam = true
  })
  selectedEmails.value.clear()
}

// Пометка как не спам
const noSpamEmail = () => {
  emails.value.forEach((e) => {
    if (selectedEmails.value.has(e.id)) e.spam = false
  })
  selectedEmails.value.clear()
}

// ==================================================

// Список писем
const emails = ref([
  {
    id: 1,
    from: 'Иван Иванов',
    to: 'Петр Петров',
    image: '/src/assets/avatars/avatar-1.png',
    email: 'petr.petrov@mail.ru',
    subject: 'Важная информация по проекту',
    text: 'Привет! Не забудь, что срок сдачи проекта наступает через два дня. Нужно сделать финальную проверку и отправить отчёт.',
    date: '12:34',
    inbox: false,
    sent: true,
    draft: false,
    marked: true,
    spam: false,
    trash: false,
  },
  {
    id: 2,
    from: 'Марина Смирнова',
    to: 'Петр Петров',
    image: '/src/assets/avatars/avatar-12.png',
    email: 'marina.smirnova@mail.ru',
    subject: 'Вопрос по техническим вопросам',
    text: 'Привет! У меня возник вопрос по настройке базы данных. Можешь подсказать, как лучше организовать индексацию?',
    date: '12:34',
    inbox: true,
    sent: false,
    draft: false,
    marked: false,
    spam: false,
    trash: false,
  },
  {
    id: 3,
    from: 'Ольга Петрова',
    to: 'Петр Петров',
    image: '/src/assets/avatars/avatar-17.png',
    email: 'olga.petrova@rambler.ru',
    subject: 'Напоминание о встрече',
    text: 'Напоминаю, что встреча с клиентом в 14:00. Пожалуйста, подготовь необходимые документы.',
    date: '12:34',
    inbox: true,
    sent: false,
    draft: false,
    marked: true,
    spam: false,
    trash: false,
  },
  {
    id: 4,
    from: 'Игорь Волков',
    to: 'Петр Петров',
    image: '/src/assets/avatars/avatar-13.png',
    email: 'igor.volkov@gmail.com',
    subject: 'Пожелания на праздники',
    text: 'Поздравляю с наступающими праздниками! Пусть Новый год принесет удачу и успех в каждом деле!',
    date: '12:34',
    inbox: true,
    sent: false,
    draft: false,
    marked: false,
    spam: true,
    trash: false,
  },
  {
    id: 5,
    from: 'Виктория Кузнецова',
    to: 'Петр Петров',
    image: '/src/assets/avatars/avatar-19.png',
    email: 'victoria.kuznetsova@mail.ru',
    subject: 'Обновление задачи',
    text: 'Задача обновлена. Проверь последние изменения и подтверди, что всё в порядке.',
    date: '12:34',
    inbox: true,
    sent: false,
    draft: false,
    marked: false,
    spam: false,
    trash: false,
  },
  {
    id: 6,
    from: 'Артём Фёдоров',
    to: 'Петр Петров',
    image: '/src/assets/avatars/avatar-14.png',
    email: 'artem.fedorov@ya.ru',
    subject: 'Новый отчёт по проекту',
    text: 'Вышел новый отчёт по проекту, посмотри и дай свои комментарии до конца дня.',
    date: '12:34',
    inbox: true,
    sent: false,
    draft: false,
    marked: false,
    spam: false,
    trash: false,
  },
  {
    id: 7,
    from: 'Елена Миронова',
    to: 'Петр Петров',
    image: '/src/assets/avatars/avatar-22.png',
    email: 'elena.mironova@ya.ru',
    subject: 'Информация о митинге',
    text: 'Напоминаю о митинге с командой на 16:00. Пожалуйста, будь готова обсудить текущие вопросы.',
    date: '12:34',
    inbox: true,
    sent: false,
    draft: false,
    marked: false,
    spam: true,
    trash: false,
  },
  {
    id: 8,
    from: 'Андрей Соловьёв',
    to: 'Петр Петров',
    image: '/src/assets/avatars/avatar-21.png',
    email: 'andrey.solovev@gmail.com',
    subject: 'Техническое обновление',
    text: 'Мы обновили систему. Проверь работоспособность всех сервисов после изменений.',
    date: '12:34',
    inbox: true,
    sent: false,
    draft: false,
    marked: true,
    spam: false,
    trash: false,
  },
  {
    id: 9,
    from: 'Ирина Дубровина',
    to: 'Петр Петров',
    image: '/src/assets/avatars/avatar-23.png',
    email: 'irina.dubrovina@rambler.ru',
    subject: 'Запрос на отпуск',
    text: 'Хочу взять отпуск с 25 декабря. Подтверди, если всё в порядке.',
    date: '12:34',
    inbox: true,
    sent: false,
    draft: false,
    marked: false,
    spam: false,
    trash: false,
  },
  {
    id: 10,
    from: 'Павел Морозов',
    to: 'Петр Петров',
    image: '/src/assets/avatars/avatar-24.png',
    email: 'pavel.morozov@ya.ru',
    subject: 'Отчёт по финансам',
    text: 'Прикладываю отчёт по финансам за последний квартал. Прочти и сообщи, если есть замечания.',
    date: '12:34',
    inbox: true,
    sent: false,
    draft: false,
    marked: true,
    spam: false,
    trash: false,
  },
])

// Фильтрация писем на основе активной категории
const filteredEmails = computed(() => {
  return emails.value.filter((email) => {
    if (email.trash) {
      return props.activeCategory === 'trash'
    }
    if (email.spam) {
      return props.activeCategory === 'spam'
    }

    switch (props.activeCategory) {
      case 'inbox':
        return email.inbox
      case 'sent':
        return email.sent
      case 'drafts':
        return email.draft
      case 'marked':
        return email.marked
      case 'spam':
        return false
      case 'trash':
        return false
      default:
        return true
    }
  })
})
</script>

<template>
  <EmailActions
    :emails="filteredEmails"
    :selectedEmails="selectedEmails"
    :activeCategory="activeCategory"
    @toggleSelectAllEmail="toggleAllSelection"
    @deleteEmail="deleteEmail"
    @recoverEmail="recoverEmail"
    @spamEmail="spamEmail"
    @noSpamEmail="noSpamEmail"
  />
  <EmailList
    :emails="filteredEmails"
    :selectedEmails="selectedEmails"
    @toggleSelectionEmail="toggleSelection"
    @markEmail="markEmail"
    @toggleEmailPage="toggleEmailPage"
  />
  <Transition name="slide">
    <div
      v-if="emailIsOpened"
      class="email-page card shadow-none"
      :class="{ collapsed: !openedEmail }"
    >
      <EmailPage :emailData="openedEmail" @toggleEmailPage="toggleEmailPage" />
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.email-page {
  position: absolute;
  top: 0;
  right: 0;
  width: calc(100% - 16.25rem);
  height: 100%;

  @media (width <= 991px) {
    width: 100%;
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.6s ease-in-out;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
}
</style>
