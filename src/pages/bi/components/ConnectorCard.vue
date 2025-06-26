<template>
  <div class="card" @click="handleClick">
    <a class="a_link">
      <img :src="icon" class="card-icon" />
      <div class="card_title">{{ name }}</div>
    </a>
  </div>
</template>
  
  <script setup>
  import { useRouter } from 'vue-router'
  
  const props = defineProps({
    name: String,
    icon: [String, Object],
    type: String
  })
  
  const router = useRouter()
  
  function handleClick() {
    router.push(`/bi/connections/new/${props.type}`)
  }
  </script>
  
<style scoped>
  .card {
    width: 163px;
    height: 114px;
    background-color: transparent;
    border-radius: 12px;
    cursor: pointer;
    padding: 12px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    transition: background 0.2s;
    border: 1px solid var(--color-border);
  }
  
   .card:hover {
     background-color: var(--color-hover-background);
   }
  
  .card-icon {
    width: 56px;
    height: 56px;
    margin-bottom: 8px;
    color: var(--color-primary-text);
  }
  
  .card_title {
    font-size: 14px;
    color: var(--color-primary-text);
  }

  .a_link{
    padding-top: 15px;
    padding-bottom: 15px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-decoration: none;
  }
</style>