<script setup>
const { component } = defineProps({ component: Object })

const data = component.extra_data || {}
const src = data.src || 'https://image-placeholder.com/images/actual-size/600x400.png'
const alt = data.alt || ''
const cls = [
  ...(component.class_list || []),
  data.fluid ? 'img-fluid' : '',
  data.rounded ? 'rounded' : '',
]
const style = {
  width: data.width ? (typeof data.width === 'string' && data.width.endsWith('%') ? data.width : data.width + 'px') : '',
  height: data.height ? (typeof data.height === 'string' && data.height.endsWith('%') ? data.height : data.height + 'px') : '',
  objectFit: 'contain'
}
</script>

<template>
  <img :src="src" :alt="alt" :class="cls" :style="style" />
</template>
