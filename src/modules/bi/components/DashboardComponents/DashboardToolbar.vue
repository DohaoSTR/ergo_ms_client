<template>
    <div class="dashboard-toolbar">
        <div class="button" 
             draggable="true"
             @dragstart="handleDragStart($event, 'Чарт')"
             @dragend="handleDragEnd">
            <div class="button-icon"><ChartColumn :size="16" /></div>
            <div class="button-text">Чарт</div>
        </div>  
        <div class="button" 
             draggable="true"
             @dragstart="handleDragStart($event, 'Селектор')"
             @dragend="handleDragEnd">
            <div class="button-icon"><Settings2 :size="16" /></div>
            <div class="button-text">Селектор</div>
        </div>  
        <div class="button" 
             draggable="true"
             @dragstart="handleDragStart($event, 'Текст')"
             @dragend="handleDragEnd">
            <div class="button-icon"><Text :size="16" /></div>
            <div class="button-text">Текст</div>
        </div>
        <div class="button" 
             draggable="true"
             @dragstart="handleDragStart($event, 'Заголовок')"
             @dragend="handleDragEnd">
            <div class="button-icon"><Heading :size="16" /></div>
            <div class="button-text">Заголовок</div>
        </div>
    </div>
</template>

<script setup>
import { ChartColumn, Settings2, Text, Heading } from 'lucide-vue-next'

const emit = defineEmits(['drag-start', 'drag-end'])

const handleDragStart = (event, itemType) => {
    event.dataTransfer.setData('text/plain', itemType)
    event.dataTransfer.effectAllowed = 'copy'
    
    const dragImage = new Image()
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs='
    event.dataTransfer.setDragImage(dragImage, 0, 0)
    
    event.target.classList.add('dragging')
    
    emit('drag-start', itemType)
}

const handleDragEnd = (event) => {
    event.target.classList.remove('dragging')
    
    emit('drag-end')
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
    border-radius: 5px;
    
    &:hover{
        background-color: var(--color-hover-background);
        cursor: grab;
    }
    
    &:active {
        cursor: grabbing;
    }
    
    &.dragging {
        opacity: 0.5;
        transform: scale(0.95);
        background-color: var(--color-hover-background);
    }
}
</style>