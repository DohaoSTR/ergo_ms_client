<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount, defineProps, defineEmits } from 'vue'

const props = defineProps({
  // Значение выбранного элемента
  value: {
    type: [String, Number, null],
    default: null,
  },

  // Список опций для выбора
  options: {
    type: Array,
    required: true,
  },

  // Поле значения в опциях
  valueField: {
    type: String,
    default: 'value',
  },

  // Поле метки в опциях
  labelField: {
    type: String,
    default: 'label',
  },

  // Текст для отображения, если значение не выбрано
  placeholder: {
    type: String,
    default: '',
  },

  // Отключен ли дропдаун
  disabled: {
    type: Boolean,
    default: false,
  },

  // Проверять границы родительского контейнера при позиционировании
  checkContainerBounds: {
    type: Boolean,
    default: false,
  },

  // Классы родительских контейнеров для проверки границ
  containerClasses: {
    type: Array,
    default: () => ['bootstrap-table-container', 'table-responsive'],
  },

  // Добавлять ли пустую опцию в выпадающий список
  showEmptyOption: {
    type: Boolean,
    default: false,
  },

  // Текст для пустой опции
  emptyOptionLabel: {
    type: String,
    default: 'Не выбран',
  },

  // Отображать ли значение вместо метки в кнопке выбора
  displayValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:value', 'change'])

const isOpen = ref(false)
const dropdownElement = ref(null)
const dropdownMenuRef = ref(null)

// Получить метку для отображения выбранного значения
const selectedLabel = computed(() => {
  if (props.value === null || props.value === undefined) {
    return props.placeholder
  }

  const selectedOption = props.options.find((option) => option[props.valueField] === props.value)

  if (props.displayValue && props.value !== null) {
    return props.value
  }

  return selectedOption ? selectedOption[props.labelField] : props.placeholder
})

// Обработчик события wheel (скролла) для дропдаун-меню
const handleDropdownWheel = (event) => {
  if (!isOpen.value || !dropdownMenuRef.value) return

  const menu = dropdownMenuRef.value
  const { deltaY, deltaX } = event
  const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } = menu

  // Проверяем направление скролла и возможность скроллировать
  const isScrollingDown = deltaY > 0
  const isScrollingUp = deltaY < 0
  const isScrollingRight = deltaX > 0
  const isScrollingLeft = deltaX < 0

  const canScrollDown = scrollTop < scrollHeight - clientHeight
  const canScrollUp = scrollTop > 0
  const canScrollRight = scrollLeft < scrollWidth - clientWidth
  const canScrollLeft = scrollLeft > 0

  // Если скроллим вверх/вниз и можем скроллировать в этом направлении
  if (
    (isScrollingDown && canScrollDown) ||
    (isScrollingUp && canScrollUp) ||
    (isScrollingRight && canScrollRight) ||
    (isScrollingLeft && canScrollLeft)
  ) {
    event.stopPropagation()
  }
}

// Открыть/закрыть дропдаун
const toggleDropdown = () => {
  if (props.disabled) return

  isOpen.value = !isOpen.value

  if (isOpen.value) {
    nextTick(() => {
      const menuEl = dropdownElement.value?.querySelector('.dropdown-menu')
      if (!menuEl) return

      const rect = dropdownElement.value.getBoundingClientRect()
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      const bottomSpace = windowHeight - rect.bottom
      const rightSpace = windowWidth - rect.right
      const menuHeight = menuEl.offsetHeight
      const menuWidth = menuEl.offsetWidth

      if (props.checkContainerBounds) {
        let container = null
        let parentNode = dropdownElement.value.parentNode

        while (parentNode) {
          if (parentNode.classList) {
            const hasContainerClass = props.containerClasses.some((className) =>
              parentNode.classList.contains(className),
            )

            if (hasContainerClass) {
              container = parentNode
              break
            }
          }
          parentNode = parentNode.parentNode
        }

        if (container) {
          const containerRect = container.getBoundingClientRect()
          const containerBottomSpace = containerRect.bottom - rect.bottom
          const containerRightSpace = containerRect.right - rect.right
          const containerTopSpace = rect.top - containerRect.top

          const containerVisibleVertical =
            containerRect.top >= 0 && containerRect.bottom <= windowHeight
          const containerVisibleHorizontal =
            containerRect.left >= 0 && containerRect.right <= windowWidth

          if (containerVisibleVertical) {
            if (containerTopSpace < menuHeight) {
              menuEl.style.top = '100%'
              menuEl.style.bottom = 'auto'
            } else if (containerBottomSpace < menuHeight) {
              menuEl.style.top = 'auto'
              menuEl.style.bottom = '100%'
            } else {
              menuEl.style.top = '100%'
              menuEl.style.bottom = 'auto'
            }
          } else {
            if (bottomSpace < menuHeight) {
              menuEl.style.top = 'auto'
              menuEl.style.bottom = '100%'
            } else {
              menuEl.style.top = '100%'
              menuEl.style.bottom = 'auto'
            }
          }

          if (containerVisibleHorizontal) {
            if (containerRightSpace < menuWidth) {
              menuEl.style.right = '0'
              menuEl.style.left = 'auto'
            } else {
              menuEl.style.left = '0'
              menuEl.style.right = 'auto'
            }
          } else {
            if (rightSpace < menuWidth) {
              menuEl.style.right = '0'
              menuEl.style.left = 'auto'
            } else {
              menuEl.style.left = '0'
              menuEl.style.right = 'auto'
            }
          }

          return
        }
      }

      if (bottomSpace < menuHeight) {
        menuEl.style.top = 'auto'
        menuEl.style.bottom = '100%'
      } else {
        menuEl.style.top = '100%'
        menuEl.style.bottom = 'auto'
      }

      if (rightSpace < menuWidth) {
        menuEl.style.right = '0'
        menuEl.style.left = 'auto'
      } else {
        menuEl.style.left = '0'
        menuEl.style.right = 'auto'
      }
    })
  }
}

// Обработчик выбора опции
const selectOption = (option) => {
  const value = option[props.valueField]
  emit('update:value', value)
  emit('change', value)
  isOpen.value = false
}

// Обработчик клика вне дропдауна
const handleClickOutside = (event) => {
  if (dropdownElement.value && !dropdownElement.value.contains(event.target) && isOpen.value) {
    isOpen.value = false
  }
}

// Очистка значения
const clearValue = () => {
  emit('update:value', null)
  emit('change', null)
  isOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="dropdownElement" class="custom-dropdown" :class="{ disabled: disabled }">
    <div class="dropdown-toggle" @click="toggleDropdown">
      <div class="dropdown-toggle-content">
        <span>{{ selectedLabel }}</span>
        <slot name="toggle-icon">
          <div class="dropdown-icon"></div>
        </slot>
      </div>
    </div>

    <div
      ref="dropdownMenuRef"
      class="dropdown-menu"
      :class="{ show: isOpen }"
      @wheel="handleDropdownWheel"
    >
      <a
        v-if="showEmptyOption"
        class="dropdown-item"
        href="#"
        :class="{ active: value === null }"
        @click.prevent="clearValue"
      >
        {{ emptyOptionLabel || placeholder }}
      </a>
      <a
        v-for="option in options"
        :key="option[valueField]"
        class="dropdown-item"
        href="#"
        :class="{ active: value === option[valueField] }"
        @click.prevent="selectOption(option)"
      >
        {{ option[labelField] }}
      </a>

      <slot name="menu-items"></slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.custom-dropdown {
  position: relative;
  width: 100%;
  height: 100%;

  &.disabled {
    opacity: 0.7;
    pointer-events: none;
  }

  .dropdown-toggle {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    width: 100%;
    min-height: 100%;
    padding: 0.5rem;
    cursor: pointer;
    background-color: transparent;
    transition: all 0.2s;
    border: 1px solid transparent;
    box-sizing: border-box;

    .dropdown-toggle-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      min-height: 24px;

      span {
        display: flex;
        align-items: center;
        min-height: 24px;
      }
    }

    &:hover {
      background-color: var(--color-hover-background);
    }

    &::after {
      content: none !important; /* Отключаем стрелку Bootstrap */
    }

    .dropdown-icon {
      width: 10px;
      height: 10px;
      position: relative;
      margin-left: 8px;
      flex-shrink: 0;

      &::after {
        content: '';
        display: inline-block;
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 4px solid var(--color-secondary-text);
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
    }
  }

  .dropdown-menu {
    position: absolute;
    z-index: 1050;
    display: none;
    min-width: 10rem;
    padding: 0.5rem 0;
    margin: 0.125rem 0 0;
    font-size: 1rem;
    text-align: left;
    list-style: none;
    background-color: var(--color-primary-background);
    background-clip: padding-box;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    max-height: 200px;
    overflow-y: auto;
    width: 100%;

    /* Анимация появления */
    &.show {
      display: block;
      animation: fade-in 0.1s ease-in-out;
    }

    .dropdown-item {
      display: block;
      width: 100%;
      padding: 0.25rem 1rem;
      clear: both;
      font-weight: 400;
      color: var(--color-primary-text);
      text-align: inherit;
      text-decoration: none;
      white-space: nowrap;
      background-color: transparent;
      border: 0;

      &:hover,
      &:focus {
        color: var(--color-primary-text);
        text-decoration: none;
        background-color: var(--color-hover-background);
      }

      &.active {
        color: #fff;
        text-decoration: none;
        background-color: var(--bs-primary);
      }
    }
  }
}

/* Анимация для появления дропдаунов */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
