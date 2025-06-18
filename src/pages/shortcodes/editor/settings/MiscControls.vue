<template>
  <div class="accordion-item">
    <h2 class="accordion-header" id="headingMisc">
      <button class="accordion-button collapsed bg-light text-dark" type="button" data-bs-toggle="collapse"
        data-bs-target="#collapseMisc" aria-expanded="false" aria-controls="collapseMisc">
        ⚙️ Прочие настройки
      </button>
    </h2>
    <div id="collapseMisc" class="accordion-collapse collapse" aria-labelledby="headingMisc"
      data-bs-parent="#settingsAccordion">
      <div class="accordion-body">
        <div class="form-check form-switch mb-3">
          <input class="form-check-input" type="checkbox" id="hideSwitch" v-model="isHidden" />
          <label class="form-check-label" for="hideSwitch">
            Скрыть компонент
          </label>
          <div v-if="isHidden" class="form-text text-muted">
            Компонент будет скрыт с помощью класса <code>d-none</code>.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { toRefs, computed } from 'vue'

const props = defineProps({ component: Object })
const { component } = toRefs(props)

// Компьютед-свойство для переключателя скрытия
const isHidden = computed({
  get: () => component.value.class_list?.includes('d-none') || false,
  set: (val) => {
    const classes = [...(component.value.class_list || [])]
    const idx = classes.indexOf('d-none')
    if (val && idx === -1) {
      classes.push('d-none')
    } else if (!val && idx !== -1) {
      classes.splice(idx, 1)
    }
    component.value.class_list = classes
  },
})
</script>

<style scoped>
.accordion-button {
  font-weight: 500;
}

.form-check-label {
  cursor: pointer;
}

.form-text code {
  background-color: #f8f9fa;
  padding: 0.1rem 0.2rem;
  border-radius: 0.2rem;
}
</style>
