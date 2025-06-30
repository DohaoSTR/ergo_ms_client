<template>
  <div class="test-drag-drop">
    <h3>Тест Drag and Drop</h3>
    
    <div class="test-container">
      <div class="test-column">
        <h4>Колонка 1</h4>
        <div class="drop-zone" 
             @drop.prevent="onDrop($event, 'col1')"
             @dragover.prevent="onDragOver($event, 'col1')"
             @dragenter.prevent="onDragEnter($event, 'col1')"
             @dragleave.prevent="onDragLeave($event, 'col1')"
             :class="{ 'drag-over': dragOverColumn === 'col1' }">
          <div class="test-item"
               v-for="item in column1"
               :key="item.id"
               :draggable="true"
               @dragstart="onDragStart($event, item)">
            {{ item.name }}
          </div>
        </div>
      </div>
      
      <div class="test-column">
        <h4>Колонка 2</h4>
        <div class="drop-zone" 
             @drop.prevent="onDrop($event, 'col2')"
             @dragover.prevent="onDragOver($event, 'col2')"
             @dragenter.prevent="onDragEnter($event, 'col2')"
             @dragleave.prevent="onDragLeave($event, 'col2')"
             :class="{ 'drag-over': dragOverColumn === 'col2' }">
          <div class="test-item"
               v-for="item in column2"
               :key="item.id"
               :draggable="true"
               @dragstart="onDragStart($event, item)">
            {{ item.name }}
          </div>
        </div>
      </div>
    </div>
    
    <div class="logs">
      <h4>Логи:</h4>
      <pre>{{ logs }}</pre>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TestDragDrop',
  data() {
    return {
      column1: [
        { id: 1, name: 'Задача 1' },
        { id: 2, name: 'Задача 2' }
      ],
      column2: [
        { id: 3, name: 'Задача 3' },
        { id: 4, name: 'Задача 4' }
      ],
      draggedItem: null,
      dragOverColumn: null,
      logs: ''
    }
  },
  methods: {
    log(message) {
      this.logs += `${new Date().toLocaleTimeString()}: ${message}\n`
      console.log(message)
    },
    
    onDragStart(event, item) {
      this.log(`Drag start: ${item.name}`)
      this.draggedItem = item
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', item.id)
    },
    
    onDragOver(event, column) {
      this.log(`Drag over: ${column}`)
      event.preventDefault()
    },
    
    onDragEnter(event, column) {
      this.log(`Drag enter: ${column}`)
      this.dragOverColumn = column
    },
    
    onDragLeave(event, column) {
      this.log(`Drag leave: ${column}`)
      this.dragOverColumn = null
    },
    
    onDrop(event, column) {
      this.log(`Drop: ${column}`)
      event.preventDefault()
      
      if (!this.draggedItem) return
      
      // Удаляем из старой колонки
      const index1 = this.column1.findIndex(item => item.id === this.draggedItem.id)
      const index2 = this.column2.findIndex(item => item.id === this.draggedItem.id)
      
      if (index1 !== -1) this.column1.splice(index1, 1)
      if (index2 !== -1) this.column2.splice(index2, 1)
      
      // Добавляем в новую
      if (column === 'col1') {
        this.column1.push(this.draggedItem)
      } else {
        this.column2.push(this.draggedItem)
      }
      
      this.draggedItem = null
      this.dragOverColumn = null
    }
  }
}
</script>

<style scoped>
.test-drag-drop {
  padding: 20px;
}

.test-container {
  display: flex;
  gap: 20px;
}

.test-column {
  flex: 1;
}

.drop-zone {
  min-height: 200px;
  background: #f5f5f5;
  border: 2px dashed #ccc;
  padding: 10px;
  border-radius: 5px;
}

.drop-zone.drag-over {
  background: #e0e0e0;
  border-color: #007bff;
}

.test-item {
  background: white;
  border: 1px solid #ddd;
  padding: 10px;
  margin-bottom: 10px;
  cursor: grab;
  border-radius: 3px;
}

.test-item:active {
  cursor: grabbing;
}

.logs {
  margin-top: 20px;
}

pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 5px;
  max-height: 200px;
  overflow-y: auto;
}
</style> 