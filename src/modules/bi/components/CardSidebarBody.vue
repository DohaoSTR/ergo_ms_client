<script setup>

const props = defineProps({
  icon: { type: [Object, String, Function], required: true },
  icolor: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  targetPage: { type: String, required: true }
})

const emit = defineEmits(['open'])

const triggerSidebar = () => {
  emit('open', props.targetPage)
}
</script>

<template>
  <div class="card-body">
    <div class="card-icon">
      <component class="mb-3 card-icon-accent" :style="{ color: icolor }" :is="icon" :size="35" />
    </div>
    <div class="card-title">
      <h5 class="mb-3">{{ title }}</h5>
    </div>
    <div class="card-description">
      <p class="mb-3">{{ description }}</p>
    </div>
    <div class="card-button">
      <button class="btn btn-primary" @click="triggerSidebar">Открыть</button>
    </div>
  </div>
</template>

<style scoped>
.card-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 12pt;
  box-sizing: border-box;
}
.card-icon{
  display: flex;
  justify-content: center;
  align-items: center;
}
.card-description {
  flex: 1 1 auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
}
.card-button {
  display: flex;
  justify-content: center;
}
</style>
