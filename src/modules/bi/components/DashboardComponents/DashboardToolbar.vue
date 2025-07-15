<template>
    <div class="dashboard-toolbar">
        <div class="button" 
             draggable="true"
             @dragstart="handleDragStart($event, 'Чарт')">
            <div class="button-icon"><ChartColumn :size="16" /></div>
            <div class="button-text">Чарт</div>
        </div>  
        <div class="button" 
             draggable="true"
             @dragstart="handleDragStart($event, 'Селектор')">
            <div class="button-icon"><Settings2 :size="16" /></div>
            <div class="button-text">Селектор</div>
        </div>  
        <div class="button" 
             draggable="true"
             @dragstart="handleDragStart($event, 'Текст')">
            <div class="button-icon"><Text :size="16" /></div>
            <div class="button-text">Текст</div>
        </div>
        <div class="button" 
             draggable="true"
             @dragstart="handleDragStart($event, 'Заголовок')">
            <div class="button-icon"><Heading :size="16" /></div>
            <div class="button-text">Заголовок</div>
        </div>
    </div>
</template>

<script setup>
import { ChartColumn, Settings2, Text, Heading } from 'lucide-vue-next'

// Обработчик начала перетаскивания
const handleDragStart = (event, itemType) => {
    event.dataTransfer.setData('text/plain', itemType)
    event.dataTransfer.effectAllowed = 'copy'
    
    // Добавляем визуальный эффект при перетаскивании
    event.target.style.opacity = '0.5'
    
    // Восстанавливаем прозрачность после завершения перетаскивания
    setTimeout(() => {
        event.target.style.opacity = '1'
    }, 0)
}
</script>

<style scoped lang="scss">
.dashboard-toolbar{
    display: flex;
    justify-content: center;
    align-items: center;
    height: 88px;
    background-color: var(--color-primary-background);
    padding: 10px;
    border-radius: 6px;
}
.button{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100px;
    height: 100%;
    transition: all 0.2s ease;
}
.button:hover{
    background-color: var(--color-hover-background);
    cursor: grab;
    border-radius: 5px;
}
.button:active {
    cursor: grabbing;
}
</style>