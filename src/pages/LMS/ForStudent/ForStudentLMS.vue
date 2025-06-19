<script setup>
import GrapsInLearningLMS from './GrapsInLearningLMS.vue';
import StudentInfoLMS from './StudentInfoLMS.vue';
import StatsForStudentLMS from './StatsForStudentLMS.vue';
</script>
<template>
    <div class="dashboard-container">
        <div class="main-content">
        <StudentInfoLMS/>
        <StatsForStudentLMS/>
        </div>
    
        <div class="sidebar">
        <GrapsInLearningLMS/>
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
