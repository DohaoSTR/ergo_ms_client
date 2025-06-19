<script setup>
import LastActivityLMS from './LastActivityLMS.vue';
import TheacherInfoLMS from './TheacherInfoLMS.vue';
import StatsForTheacherLMS from './StatsForTheacherLMS.vue';
</script>
<template>
    <div class="dashboard-container">
        <div class="main-content">
        <TheacherInfoLMS/>
        <StatsForTheacherLMS/>
        </div>
    
        <div class="sidebar">
        <LastActivityLMS/>
        </div>
    </div>
</template>
<style>
    .dashboard-container {
        display: flex;
        width: 100%;
    }

    .main-content {
        flex: 1;
        min-width: 0;
        width: 100%;
        display: flex;
        flex-direction: column;
    }
    .sidebar {
        position: relative;
        
    }

    
</style>