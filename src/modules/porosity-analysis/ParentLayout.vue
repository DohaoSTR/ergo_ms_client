<template>
  <div class="porosity-analysis-layout">
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PorosityAnalysisParentLayout'
}
</script>

<style scoped>
.porosity-analysis-layout {
  padding: 20px;
}
</style> 