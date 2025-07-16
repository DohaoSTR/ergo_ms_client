<script setup>
import GenericListPage from '@/modules/bi/components/GenericListPage.vue'
import { getListConfig } from '@/modules/bi/js/listConfigs.js'

const config = getListConfig('connections')
</script>

<template>
  <GenericListPage :config="config" />
</template>