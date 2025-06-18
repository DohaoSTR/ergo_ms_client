<script setup>
import { toRefs } from 'vue'

const props = defineProps({ component: Object })
const { component } = toRefs(props)

</script>

<template>
    <div>
        <div class="card-header py-2 d-flex align-items-center gap-2 bg-white border-0">
            <span class="fs-5">🖱</span>
            <span class="fw-semibold">Настройки кнопки</span>
        </div>
        <div class="card-body pt-3 pb-2">
            <!-- HTML-type -->
            <div class="mb-3">
                <label class="form-label mb-1 fw-semibold">HTML-type</label>
                <select v-model="component.extra_data.button_type" class="form-select">
                    <option value="button">button (по умолчанию)</option>
                    <option value="submit">submit (форма)</option>
                    <option value="reset">reset (сброс)</option>
                </select>
                <small class="text-muted">Как кнопка будет вести себя в формах</small>
            </div>
            <!-- Action -->
            <div class="mb-3">
                <label class="form-label mb-1 fw-semibold">Действие</label>
                <select v-model="component.extra_data.action" class="form-select">
                    <option value="">нет</option>
                    <option value="goToUrl">Перейти по ссылке goToUrl</option>
                </select>
                <small class="text-muted">
                    Например, <b>goToUrl</b> — переход по адресу. <b>emitEvent</b> — вызов события.
                </small>
            </div>
            <!-- Параметры для goToUrl -->
            <div v-if="component.extra_data.action === 'goToUrl'" class="mb-3">
                <label class="form-label mb-1 fw-semibold">Ссылка (href)</label>
                <input v-model="component.extra_data.href" class="form-control" placeholder="https://example.com" />
                <small class="text-muted">Полный адрес для перехода</small>
                <label class="form-label mb-1 mt-2 fw-semibold">Target</label>
                <select v-model="component.extra_data.target" class="form-select">
                    <option value="_blank">_blank — в новой вкладке</option>
                    <option value="_self">_self — в текущей вкладке</option>
                </select>
            </div>
        </div>
    </div>
</template>

<style scoped>
.settings-card {
    border-radius: 1.2rem;
    background: #fcfcfd;
}

.card-header {
    background: transparent !important;
}

.btn.border-dark {
    box-shadow: 0 0 0 2px #0d0d0d33;
}
</style>
