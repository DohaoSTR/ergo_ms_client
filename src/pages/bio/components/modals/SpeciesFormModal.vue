<script setup>
import { ref, onMounted } from 'vue'
import { Plus, X, CircleAlert } from 'lucide-vue-next'
import { getSpecies } from '@/js/api/services/bio-index'
import ModalCenter from '@/pages/bio/components/modals/ModalCenter.vue'
import { handleApiError } from '@/pages/bio/js/bio-helpers'
import { tierOptions, abundanceOptions } from '@/pages/bio/js/bio-constants'

const props = defineProps({
  modalId: { type: String, required: true },
  existingDescriptions: { type: Array, default: () => [] },
  showAbundance: { type: Boolean, default: true },
})

const emit = defineEmits(['addSpecies'])

// Form state
const formItems = ref([createEmptyFormItem()])
const isLoading = ref(false)
const error = ref(null)
const searchResults = ref([])
const showDropdown = ref(Array(formItems.value.length).fill(false))
const searchQuery = ref(Array(formItems.value.length).fill(''))
const searchTimeout = ref(null)
const validationErrors = ref([])

// Helper function to create empty form item
function createEmptyFormItem() {
  return {
    title: '',
    author: '',
    tier: '',
    abundance: 'r',
    selectedSpecies: null,
  }
}

// Parse search input to extract title and author components
function parseSearchInput(input) {
  const words = input.trim().split(/\s+/)

  if (words.length <= 2) {
    // If 1-2 words, treat as title only
    return {
      title: input,
      author: '',
    }
  } else {
    // If more than 2 words, first 2 are title, rest is author
    return {
      title: words.slice(0, 2).join(' '),
      author: words.slice(2).join(' '),
    }
  }
}

// Search for species as user types
async function handleSearch(value, index) {
  searchQuery.value[index] = value
  showDropdown.value[index] = true
  formItems.value[index].selectedSpecies = null

  if (searchTimeout.value) clearTimeout(searchTimeout.value)

  if (!value || value.trim() === '') {
    searchResults.value[index] = []
    return
  }

  searchTimeout.value = setTimeout(async () => {
    try {
      isLoading.value = true

      // Parse input to extract title and author parts
      const { title, author } = parseSearchInput(value)

      // Send both title and author as separate parameters
      const params = {}
      if (title) params.title = title
      if (author) params.author = author

      const response = await getSpecies(params)

      if (response.success && response.data) {
        // Handle both results directly or inside a results object
        const data = response.data.results || response.data
        searchResults.value[index] = data.slice(0, 10) // Limit to 10 results

        // Автоматический выбор, если найден только один результат
        if (data.length === 1) {
          const result = data[0]
          const searchValue = searchQuery.value[index].trim().toLowerCase()
          const resultValue = `${result.title} ${result.author}`.toLowerCase()

          // Если поисковый запрос полностью соответствует найденному результату
          // или если пользователь ввел только название вида, и оно совпадает с найденным
          if (searchValue === resultValue || 
              (searchValue === result.title.toLowerCase() && !searchValue.includes(result.author.toLowerCase()))) {
            selectSpecies(result, index)
            return
          }
        }
      } else {
        searchResults.value[index] = []
        error.value = handleApiError(response, 'Ошибка при поиске видов')
      }
    } catch (err) {
      error.value = handleApiError(err, 'Ошибка при поиске видов')
      searchResults.value[index] = []
    } finally {
      isLoading.value = false
    }
  }, 500)
}

// Select a species from dropdown
function selectSpecies(species, index) {
  formItems.value[index].title = species.title
  formItems.value[index].author = species.author
  formItems.value[index].selectedSpecies = species
  searchQuery.value[index] = `${species.title} ${species.author}`
  showDropdown.value[index] = false
}

// Add another species form item
function addFormItem() {
  formItems.value.push(createEmptyFormItem())
  searchResults.value.push([])
  showDropdown.value.push(false)
  searchQuery.value.push('')
  validationErrors.value.push(null)

  // Add scrolling to the bottom of the form after adding a new item
  setTimeout(() => {
    const formContent = document.querySelector('.species-form-content')
    if (formContent) {
      formContent.scrollTop = formContent.scrollHeight
    }
  }, 10)
}

// Remove a species form item
function removeFormItem(index) {
  if (formItems.value.length > 1) {
    formItems.value.splice(index, 1)
    searchResults.value.splice(index, 1)
    showDropdown.value.splice(index, 1)
    searchQuery.value.splice(index, 1)
    validationErrors.value.splice(index, 1)
  }
}

// Validate the form
function validateForm() {
  validationErrors.value = formItems.value.map((item) => {
    if (!item.title || !item.author) {
      return 'Необходимо выбрать вид'
    }

    if (!item.selectedSpecies) {
      return 'Выберите вид из списка'
    }

    // Check for duplicate in current form
    const currentCombination = `${item.title}-${item.author}-${item.tier}`
    const hasDuplicateInForm =
      formItems.value.filter(
        (otherItem) =>
          otherItem !== item &&
          `${otherItem.title}-${otherItem.author}-${otherItem.tier}` === currentCombination,
      ).length > 0

    if (hasDuplicateInForm) {
      return 'Дублирующаяся комбинация вид-ярус'
    }

    // Check for duplicate in existing descriptions
    const hasDuplicateInExisting = props.existingDescriptions.some(
      (desc) => desc.title === item.title && desc.author === item.author && desc.tier === item.tier,
    )

    if (hasDuplicateInExisting) {
      return 'Этот вид на этом ярусе уже существует'
    }

    return null
  })

  return validationErrors.value.every((error) => error === null)
}

// Handle form submission
function submitForm() {
  error.value = null

  if (!validateForm()) {
    return
  }

  const speciesData = formItems.value.map((item) => {
    const data = {
      title: item.title,
      author: item.author,
      tier: item.tier,
    }

    if (props.showAbundance) {
      data.abundance = item.abundance
    }

    return data
  })

  emit('addSpecies', speciesData, (errorMessage) => {
    if (errorMessage) {
      error.value = errorMessage
    } else {
      resetForm()
    }
  })
}

// Reset the form
function resetForm() {
  formItems.value = [createEmptyFormItem()]
  searchResults.value = [[]]
  showDropdown.value = [false]
  searchQuery.value = ['']
  validationErrors.value = [null]
  error.value = null
}

// Handle click outside dropdown
function handleClickOutside(event, index) {
  const dropdown = document.getElementById(`speciesDropdown-${index}`)
  const input = document.getElementById(`speciesInput-${index}`)

  if (dropdown && input) {
    if (!dropdown.contains(event.target) && !input.contains(event.target)) {
      showDropdown.value[index] = false
    }
  }
}

// Register click outside event
onMounted(() => {
  document.addEventListener('click', (event) => {
    for (let i = 0; i < formItems.value.length; i++) {
      handleClickOutside(event, i)
    }
  })

  // Reset form when modal is hidden
  const modalEl = document.getElementById(props.modalId)
  if (modalEl) {
    modalEl.addEventListener('hidden.bs.modal', resetForm)
  }
})
</script>

<template>
  <ModalCenter :modalId="modalId" title="Добавление видов">
    <div class="species-form d-flex flex-column">
      <div v-if="error" class="alert alert-danger mb-3">
        <div class="d-flex align-items-center gap-2">
          <CircleAlert :size="20" />
          <span>{{ error }}</span>
        </div>
      </div>

      <div class="species-form-content flex-grow-1 overflow-auto">
        <form @submit.prevent="submitForm">
          <div
            v-for="(item, index) in formItems"
            :key="index"
            class="species-item mb-3 p-3 border rounded"
          >
            <div class="d-flex justify-content-between mb-2">
              <h6 class="mb-0">Вид #{{ index + 1 }}</h6>
              <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                @click="removeFormItem(index)"
                :disabled="formItems.length === 1"
              >
                <X :size="16" />
              </button>
            </div>

            <!-- Species autocomplete -->
            <div class="mb-3 position-relative">
              <label for="speciesInput" class="form-label">Название вида и автор *</label>
              <input
                type="text"
                autocomplete="off"
                class="form-control"
                :class="{ 'is-invalid': validationErrors[index] }"
                :id="`speciesInput-${index}`"
                v-model="searchQuery[index]"
                @input="handleSearch(searchQuery[index], index)"
                @focus="showDropdown[index] = true"
                placeholder="Например: Quercus robur L."
              />
              <div
                v-if="
                  showDropdown[index] && searchResults[index] && searchResults[index].length > 0
                "
                :id="`speciesDropdown-${index}`"
                class="species-dropdown"
              >
                <div v-if="isLoading" class="dropdown-item text-center">
                  <div class="spinner-border spinner-border-sm" role="status">
                    <span class="visually-hidden">Загрузка...</span>
                  </div>
                </div>
                <a
                  v-for="result in searchResults[index]"
                  :key="`${result.title}-${result.author}`"
                  class="dropdown-item"
                  href="#"
                  @click.prevent="selectSpecies(result, index)"
                >
                  <span class="species-title">{{ result.title }}</span>
                  <span class="species-author">{{ result.author }}</span>
                </a>
              </div>
              <div v-if="validationErrors[index]" class="invalid-feedback">
                {{ validationErrors[index] }}
              </div>
            </div>

            <!-- Selected species info -->
            <div v-if="item.selectedSpecies" class="mb-3 selected-species p-2 rounded small">
              <div class="species-title"><strong>Вид:</strong> {{ item.title }}</div>
              <div class="species-author"><strong>Автор:</strong> {{ item.author }}</div>
            </div>

            <div class="row">
              <!-- Tier dropdown -->
              <div class="col-md-6 mb-3">
                <label for="tierSelect" class="form-label">Ярус</label>
                <select class="form-select" :id="`tierSelect-${index}`" v-model="item.tier">
                  <option v-for="option in tierOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>

              <!-- Abundance dropdown - отображаем только если showAbundance = true -->
              <div v-if="showAbundance" class="col-md-6 mb-3">
                <label for="abundanceSelect" class="form-label">Балл обилия *</label>
                <select
                  class="form-select"
                  :id="`abundanceSelect-${index}`"
                  v-model="item.abundance"
                  required
                >
                  <option
                    v-for="option in abundanceOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer with buttons -->
      <div class="modal-footer-sticky pt-2">
        <div class="d-flex justify-content-between align-items-center w-100">
          <button type="button" class="btn btn-outline-secondary" @click="addFormItem">
            <Plus :size="16" class="me-1" /> Добавить еще вид
          </button>

          <div>
            <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">
              Отмена
            </button>
            <button type="submit" class="btn btn-primary" @click="submitForm">Добавить</button>
          </div>
        </div>
      </div>
    </div>
  </ModalCenter>
</template>

<style scoped lang="scss">
.species-form {
  max-height: calc(100vh - 200px);
  position: relative;
}

.species-form-content {
  padding-bottom: 10px;
}

.modal-footer-sticky {
  position: sticky;
  bottom: 0;
  border-top: 1px solid var(--bs-border-color);
  padding-top: 15px;
  z-index: 5;
}

.species-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  background-color: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius);
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);

  .dropdown-item {
    padding: 0.5rem 1rem;
    text-decoration: none;
    color: var(--bs-body-color);
    display: block;

    &:hover {
      background-color: var(--bs-tertiary-bg);
    }

    &.active {
      background-color: var(--bs-primary);
      color: var(--bs-white);
    }

    .species-title {
      font-weight: 500;
    }

    .species-author {
      color: var(--bs-secondary-color);
      margin-left: 0.5rem;
    }
  }
}

.species-item {
  background-color: var(--bs-tertiary-bg);
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--bs-secondary-bg);
  }
}

.selected-species {
  border-left: 3px solid var(--bs-primary);
  background-color: var(--bs-secondary-bg);

  .species-title {
    margin-right: auto;
  }

  .species-author {
    white-space: nowrap;
  }
}

.form-select {
  cursor: pointer;
}
</style>
