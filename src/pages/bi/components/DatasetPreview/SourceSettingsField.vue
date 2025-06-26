<template>
    <div class="field-body">
        <div class="body-table">
            <div class="table-row">
                <div class="table-row-label">Источник</div>
                <select class="table-row-select select-1 form-select form-select-sm" id="smallSelect">
                    <option selected>Откройте это меню выбора</option>
                    <option value="1">Один</option>
                    <option value="2">Два</option>
                    <option value="3">Три</option>
                </select>
            </div>
            <div class="table-row">
                <div class="table-row-label">Поле источника</div>
                <select class="table-row-select select-1 form-select form-select-sm" id="smallSelect">
                    <option selected>Откройте это меню выбора</option>
                    <option value="1">Один</option>
                    <option value="2">Два</option>
                    <option value="3">Три</option>
                </select>
            </div>
            <div class="table-row">
                <div class="table-row-label">Тип поля</div>
                <select class="table-row-select select-2 form-select form-select-sm" id="smallSelect">
                    <option selected>Откройте это меню выбора</option>
                    <option value="1">Один</option>
                    <option value="2">Два</option>
                    <option value="3">Три</option>
                </select>
            </div>
            <div class="table-row">
                <div class="table-row-label">Агрегация</div>
                <select class="table-row-select select-2 form-select form-select-sm" id="smallSelect">
                    <option selected>Откройте это меню выбора</option>
                    <option value="1">Один</option>
                    <option value="2">Два</option>
                    <option value="3">Три</option>
                </select>
            </div>
        </div>
    </div>
</template>

<script setup>
    
</script>

<style scoped lang="scss">
.field-body{
    width: 100%;
    height: 100%;
    overflow-y: auto;
    padding: 20px 32px 0;
}

.body-table{
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.table-row{
    display: flex;
    align-items: center;
}

.table-row-label{
    flex: 0 0 150px;
    color: var(--color-primary-text);
    font-size: 0.9rem;
}

.table-row-select {
  background: transparent !important;
  color: var(--color-primary-text) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: 5px !important;
  padding: 0.25rem 0.5rem !important;
  transition: background-color 0.2s ease, border-color 0.2s ease !important;
  appearance: none !important;
}

.table-row-select:hover,
.table-row-select:focus {
  background-color: var(--color-hover-background) !important;
  border-color: var(--color-border) !important;
  outline: none !important;
}

.table-row-select::-ms-expand {
  display: none !important;
}

.select-1{
    max-width: 580px;
}

.select-2{
    max-width: 260px;
}
</style>