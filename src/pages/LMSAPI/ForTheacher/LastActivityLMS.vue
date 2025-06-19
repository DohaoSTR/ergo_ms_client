<template>
    <div class="activity-card">
      <div class="card-header">
        <h3 class="card-title">Последняя активность</h3>
      </div>
      <div class="card-body">
        <ul class="activity-list">
          <li v-for="(activity, index) in activities" :key="index" class="activity-item">
            <div :class="['activity-icon', getBgClassForType(activity.type)]">
              <i :class="getIconForType(activity.type)"></i>
            </div>
            <div class="activity-content">
              <p class="activity-title">{{ activity.title }}</p>
              <span class="activity-time">{{ activity.time }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  const props = defineProps({
    activities: {
      type: Array,
      required: true
    }
  })
  
  const getIconForType = (type) => {
    switch (type) {
      case 'enrollment':
        return 'fas fa-book'
      case 'test_completion':
        return 'fas fa-check-circle'
      case 'assignment':
        return 'fas fa-upload'
      case 'registration':
        return 'fas fa-user'
      default:
        return 'fas fa-info-circle'
    }
  }
  
  const getBgClassForType = (type) => {
    switch (type) {
      case 'enrollment':
        return 'bg-primary'
      case 'test_completion':
        return 'bg-secondary'
      case 'assignment':
        return 'bg-warning'
      case 'registration':
        return 'bg-danger'
      default:
        return 'bg-primary'
    }
  }
  </script>
  
  <style scoped>
  .activity-card {
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .card-header {
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .card-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
  }
  
  .card-body {
    padding: 0;
    flex-grow: 1;
  }
  
  .activity-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .activity-item {
    display: flex;
    padding: 16px 20px;
    border-bottom: 1px solid #f5f5f5;
    transition: background-color 0.2s;
  }
  
  .activity-item:last-child {
    border-bottom: none;
  }
  
  .activity-item:hover {
    background-color: #f9f9f9;
  }
  
  .activity-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    margin-right: 12px;
    flex-shrink: 0;
    font-size: 14px;
  }
  
  .bg-primary { background-color: #4285f4; }
  .bg-secondary { background-color: #aa66cc; }
  .bg-warning { background-color: #ffbb33; }
  .bg-danger { background-color: #ff4444; }
  
  .activity-content {
    flex-grow: 1;
    overflow: hidden;
  }
  
  .activity-title {
    margin: 0 0 4px 0;
    font-weight: 500;
    font-size: 0.95rem;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .activity-time {
    font-size: 0.8rem;
    color: #777;
    display: block;
  }
  
  /* Адаптивные стили */
  @media (max-width: 768px) {
    .activity-item {
      padding: 12px 16px;
    }
    
    .activity-icon {
      width: 32px;
      height: 32px;
      font-size: 12px;
    }
    
    .activity-title {
      font-size: 0.9rem;
    }
  }
  </style>
