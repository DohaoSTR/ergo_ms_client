<script setup>
const props = defineProps({
  component: { type: Object, required: true },
})

function handleClick() {
  const data = props.component.extra_data || {}
  if (data.action === 'goToUrl' && data.href) {
    window.open(data.href, data.target || '_blank')
  }
}
</script>

<template>
  <button
    :class="['btn', 'btn-' + (component.extra_data.variant || 'primary'), ...component.class_list]"
    @click="handleClick"
    :type="component.extra_data.button_type || 'button'"
  >
    {{ component.extra_data.text || component.template_name || 'Кнопка' }}
  </button>
</template>
