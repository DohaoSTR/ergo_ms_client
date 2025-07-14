<script setup>
import { Check, CheckCheck, Mic, Paperclip, SendHorizontal } from 'lucide-vue-next'
import { nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps({
  activeDialog: { type: Number, required: true },
})

const emits = defineEmits(['changeLastMessage'])

// Данные диалога
const dialogContainer = ref(null)
const formContainer = ref(null)

const messageInput = ref(null)
const inputDiv = ref(null)

// Функция для обновления значения
const updateMessageInput = () => {
  messageInput.value = inputDiv.value.innerText.trim()
}

// Отправка сообщения
const sendMessage = async () => {
  if (messageInput.value.trim() === '') return

  const currentDialogIndex = props.activeDialog - 1
  const currentDialog = dialog.value[currentDialogIndex]
  const lastMessageBlock = currentDialog[currentDialog.length - 1]

  lastMessageBlock.messages.push({
    id: Date.now(),
    text: messageInput.value,
    date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    viewed: false,
  })

  emits('changeLastMessage', {
    dialog: props.activeDialog,
    text: lastMessageBlock.messages[lastMessageBlock.messages.length - 1].text,
    date: lastMessageBlock.messages[lastMessageBlock.messages.length - 1].date,
  })
  messageInput.value = ''
  inputDiv.value.innerText = ''

  await nextTick()
  const offset = formContainer.value?.offsetHeight || 0
  scrollToBottom(offset)
}

// Прокрутка вниз
const scrollToBottom = (offset) => {
  if (dialogContainer.value) {
    dialogContainer.value.scrollTop = dialogContainer.value.scrollHeight - offset
  }
}

// Изменение значений при смене диалога
watch(
  () => props.activeDialog,
  () => {
    inputDiv.value.innerText = ''
    nextTick(() => {
      const offset = formContainer.value?.offsetHeight || 0
      scrollToBottom(offset)
    })
  },
)

// Прокрутка вниз при загрузке
onMounted(() => {
  nextTick(() => {
    const offset = formContainer.value?.offsetHeight || 0
    scrollToBottom(offset)
  })
})

// Пользователи
const user = ref([
  { id: 1, name: 'Иван Иванов', image: '/src/assets/avatars/avatar-1.png' },
  { id: 2, name: 'Алиса Михайлова', image: '/src/assets/avatars/avatar-12.png' },
])

// Диалоги
const dialog = ref([
  [
    {
      userId: 1,
      type: 'right',
      messages: [
        {
          id: 1,
          text: 'Привет!',
          date: '10:05',
          viewed: true,
        },
        {
          id: 2,
          text: 'Как продвигается работа над сайтом?',
          date: '10:06',
          viewed: true,
        },
      ],
    },
    {
      userId: 2,
      type: 'left',
      messages: [
        {
          id: 3,
          text: 'Привет!',
          date: '10:08',
        },
        {
          id: 4,
          text: 'Всё хорошо',
          date: '10:08',
        },
        {
          id: 5,
          text: 'Как раз сейчас разрабатываю дизайн для мессенджера',
          date: '10:08',
        },
      ],
    },
    {
      userId: 1,
      type: 'right',
      messages: [
        {
          id: 6,
          text: 'Отлично!',
          date: '10:09',
          viewed: true,
        },
        {
          id: 7,
          text: 'А ты уже сделала дизайн корпоративной почты?',
          date: '10:09',
          viewed: true,
        },
      ],
    },
    {
      userId: 2,
      type: 'left',
      messages: [
        {
          id: 8,
          text: 'Да, буквально перед тем, как ты мне написал',
          date: '10:09',
        },
        {
          id: 9,
          text: 'Я её доделала и отправила на проверку',
          date: '10:10',
        },
      ],
    },
    {
      userId: 1,
      type: 'right',
      messages: [
        {
          id: 10,
          text: 'О, супер! Пойду проверю',
          date: '10:10',
          viewed: true,
        },
      ],
    },
    {
      userId: 2,
      type: 'left',
      messages: [
        {
          id: 10,
          text: 'Хорошо)',
          date: '10:11',
        },
      ],
    },
    {
      userId: 1,
      type: 'right',
      messages: [],
    },
  ],
  [
    {
      userId: 1,
      type: 'right',
      messages: [],
    },
  ],
  [
    {
      userId: 1,
      type: 'right',
      messages: [],
    },
  ],
])
</script>

<template>
  <div ref="dialogContainer" class="dialog">
    <ul class="list-unstyled me-2 mb-0">
      <li v-for="message in dialog[activeDialog - 1]" :key="message" class="message">
        <div
          v-if="message.messages.length > 0"
          class="d-flex overflow-hidden py-3"
          :class="message.type === 'right' ? 'justify-content-end' : 'justify-content-start'"
        >
          <ul
            class="list-unstyled d-inline-flex flex-column gap-2 mb-0"
            :class="
              message.type === 'right' ? 'align-items-end order-0' : 'align-items-start order-1'
            "
            style="max-width: 70%"
          >
            <li v-for="(msg, index) in message.messages" :key="msg.id" class="message-fade">
              <div
                class="d-flex flex-column rounded px-2 py-1 mb-0 text-break"
                :class="message.type === 'right' ? 'bg-primary text-white' : 'bg-secondary-subtle'"
              >
                <span v-if="index === 0" class="small lh-sm me-3">
                  {{ user[message.userId - 1].name }}
                </span>
                {{ msg.text }}
                <small class="lh-sm text-end" style="font-size: 12px">
                  {{ msg.date }}
                  <component
                    v-if="message.type === 'right'"
                    :is="msg.viewed ? CheckCheck : Check"
                    :size="13"
                    class="ms-1"
                  />
                </small>
              </div>
            </li>
          </ul>

          <div
            class="d-none d-sm-block avatar avatar-fade"
            :class="message.type === 'right' ? 'ms-2' : 'me-2'"
          >
            <img
              :src="user[message.userId - 1].image"
              :alt="user[message.userId - 1].name"
              class="rounded-circle"
            />
          </div>
        </div>
      </li>
    </ul>
  </div>

  <div ref="formContainer" class="d-flex align-items-center gap-2 mt-auto p-2 form-control">
    <div
      ref="inputDiv"
      class="message-input border-0 beautiful-scrollbar bg-transparent w-100"
      contenteditable="true"
      style="
        outline: none;
        overflow-y: hidden;
        white-space: pre-wrap;
        min-height: 1em;
        max-height: 6em;
      "
      @input="updateMessageInput"
      @keydown.enter.exact.prevent="sendMessage"
    ></div>
    <div class="d-flex gap-2">
      <Paperclip class="hover-section" :size="22" />
      <Mic class="hover-section" :size="22" />
    </div>

    <button class="btn btn-sm btn-primary" @click="sendMessage">
      <SendHorizontal :size="22" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.dialog {
  overflow-y: auto;
  scrollbar-width: thin;
}

@keyframes messageFadeAnimation {
  0% {
    opacity: 0;
    transform: translateX(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes avatarFadeAnimation {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

// Анимация появления сообщения и аватара
.message-fade {
  animation: messageFadeAnimation 0.3s ease-in-out forwards;
}
.avatar-fade {
  animation: avatarFadeAnimation 0.3s ease-in-out forwards;
}

// Стилизация поля ввода
.message-input {
  &::before {
    content: 'Написать сообщение...';
    color: #6c757d;
    pointer-events: none;
    display: block;
  }

  &:focus::before {
    content: '';
  }

  &:not(:empty)::before {
    content: '';
  }
}
</style>
