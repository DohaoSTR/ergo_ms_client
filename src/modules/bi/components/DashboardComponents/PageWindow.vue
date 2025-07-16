<template>
    <div class="page-window-overlay" @click="handleOverlayClick">
        <div class="page-window" @click.stop>
            <div class="page-window-header">
                <h3>Страницы дашборда</h3>
                <button class="close-button" @click="$emit('close')">
                    <X size="20" />
                </button>
            </div>
            
            <div class="page-window-content">
                <div class="pages-list">
                    <div v-for="(page, index) in pages" :key="index" class="page-item">
                        <div class="page-info">
                            <input 
                                v-model="page.name" 
                                class="page-name-input"
                                :placeholder="`Страница ${index + 1}`"
                            />
                        </div>
                        <button 
                            v-if="pages.length > 1"
                            class="delete-page-btn" 
                            @click="deletePage(index)"
                            title="Удалить страницу"
                        >
                            <Trash2 size="16" />
                        </button>
                    </div>
                </div>
                
                <button class="add-page-btn" @click="addPage">
                    <Plus size="16" />
                    Добавить страницу
                </button>
            </div>
            
            <div class="page-window-footer">
                <button class="btn btn-secondary" @click="$emit('close')">Отмена</button>
                <button class="btn btn-primary" @click="applyChanges">Применить</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { X, Plus, Trash2 } from 'lucide-vue-next'

const props = defineProps({
    modelValue: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits(['update:modelValue', 'close'])

const pages = ref([])

onMounted(() => {
    // Инициализируем с существующими страницами или создаем первую
    if (props.modelValue.length > 0) {
        pages.value = [...props.modelValue]
    } else {
        pages.value = [{ name: 'Страница 1' }]
    }
})

const addPage = () => {
    const newPageNumber = pages.value.length + 1
    pages.value.push({ name: `Страница ${newPageNumber}` })
}

const deletePage = (index) => {
    if (pages.value.length > 1) {
        pages.value.splice(index, 1)
        // Переименовываем оставшиеся страницы
        pages.value.forEach((page, idx) => {
            if (!page.name || page.name.startsWith('Страница ')) {
                page.name = `Страница ${idx + 1}`
            }
        })
    }
}

const applyChanges = () => {
    emit('update:modelValue', pages.value)
    emit('close')
}

const handleOverlayClick = () => {
    emit('close')
}
</script>

<style scoped lang="scss">
.page-window-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.page-window {
    background: var(--color-primary-background);
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    width: 450px;
    height: 446px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.page-window-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--color-border);
    
    h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--color-text-primary);
    }
}

.close-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    color: var(--color-text-secondary);
    transition: all 0.2s ease;
    
    &:hover {
        background-color: var(--color-hover-background);
        color: var(--color-text-primary);
    }
}

.page-window-content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
}

.pages-list {
    margin-bottom: 20px;
}

.page-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    margin-bottom: 8px;
    background: var(--color-background);
    
    &:last-child {
        margin-bottom: 0;
    }
}

.page-info {
    flex: 1;
}

.page-name-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-primary-background);
    color: var(--color-text-primary);
    font-size: 14px;
    
    &:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
    }
}

.delete-page-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px;
    border-radius: 4px;
    color: var(--color-danger);
    transition: all 0.2s ease;
    
    &:hover {
        background-color: rgba(var(--color-danger-rgb), 0.1);
    }
}

.add-page-btn {
    width: 100%;
    padding: 12px;
    border: 2px dashed var(--color-border);
    border-radius: 8px;
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--color-text-secondary);
    font-size: 14px;
    transition: all 0.2s ease;
    
    &:hover {
        border-color: var(--color-primary);
        color: var(--color-primary);
        background-color: rgba(var(--color-primary-rgb), 0.05);
    }
}

.page-window-footer {
    display: flex;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid var(--color-border);
    justify-content: flex-end;
}
</style> 