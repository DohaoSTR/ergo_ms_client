<script setup>
import CardAbout from '@/modules/cms/adp/user/account/CardAbout.vue'
</script>

<template>
  <div class="container-fluid p-0"> <!-- Убираем отступы по краям -->
    <div class="row no-gutters"> <!-- Убираем промежутки между колонками -->
      <div class="col-12"> <!-- Занимаем всю ширину -->
        <CardAbout class="full-page-card"/> <!-- Добавляем класс для стилей -->
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.full-page-card {
  width: 100%; /* Занимаем всю ширину */
}
</style>
