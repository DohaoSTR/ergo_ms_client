<script setup>
import CardInfo from '@/pages/dashboard/analytics/cards/CardInfo.vue'
import CardOrders from '@/pages/dashboard/analytics/cards/CardOrders.vue'
import CardSales from '@/pages/dashboard/analytics/cards/CardSales.vue'
import CardTotalRevenue from '@/pages/dashboard/analytics/cards/CardTotalRevenue.vue'
import CardPayments from '@/pages/dashboard/analytics/cards/CardPayments.vue'
import CardRevenue from '@/pages/dashboard/analytics/cards/CardRevenue.vue'
import CardProfileReport from '@/pages/dashboard/analytics/cards/CardProfileReport.vue'
import CardOrderStatistics from '@/pages/dashboard/analytics/cards/CardOrderStatistics.vue'
import CardFinanceTab from '@/pages/dashboard/analytics/cards/CardFinanceTab.vue'
import CardTransactions from '@/pages/dashboard/analytics/cards/CardTransactions.vue'
</script>

<template>
  <div class="row">
    <div class="col-xxl-8 mb-4 order-0"><CardInfo /></div>
    <div class="col-xxl-4 col-lg-12 col-md-4 order-1">
      <div class="row">
        <div class="col-lg-6 col-md-12 col-6 mb-4"><CardOrders /></div>
        <div class="col-lg-6 col-md-12 col-6 mb-4"><CardSales /></div>
      </div>
    </div>
    <div class="col-12 col-xxl-8 order-2 order-md-3 order-xxl-2 mb-4"><CardTotalRevenue /></div>
    <div class="col-12 col-md-8 col-lg-12 col-xxl-4 order-3 order-md-2">
      <div class="row">
        <div class="col-6 mb-4"><CardPayments /></div>
        <div class="col-6 mb-4"><CardRevenue /></div>
        <div class="col-12 mb-4"><CardProfileReport /></div>
      </div>
    </div>
  </div>
  <div class="row">
    <div class="col-md-6 col-lg-4 col-xl-4 order-0 mb-4"><CardOrderStatistics /></div>
    <div class="col-md-6 col-lg-4 order-1 mb-4"><CardFinanceTab /></div>
    <div class="col-md-6 col-lg-4 order-2 mb-4"><CardTransactions /></div>
  </div>
  
</template>

<style lang="scss" scoped></style>
