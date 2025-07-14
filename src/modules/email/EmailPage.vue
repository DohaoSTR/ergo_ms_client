<script setup>
import { ChevronLeft } from 'lucide-vue-next'

defineProps({
  emailData: { type: Object, required: true },
})

defineEmits(['toggleEmailPage'])
</script>

<template>
  <div class="d-flex align-items-center pb-2 border-bottom mb-3">
    <div class="email-header px-1 py-2 w-100" @click="$emit('toggleEmailPage')">
      <div class="email-header-hover rounded"></div>
      <div class="d-flex align-items-center gap-1">
        <ChevronLeft :size="22" />
        <h5 class="mb-0">{{ emailData.subject }}</h5>
      </div>
    </div>
  </div>

  <div class="bg-secondary-subtle rounded p-3">
    <div class="d-flex align-items-center gap-2 w-100 border-bottom pb-2">
      <img :src="emailData.image" alt="Image" class="rounded-circle" width="40" />
      <div class="d-flex flex-column">
        <h6 class="mb-0">{{ emailData.from }}</h6>
        <span class="small">{{ emailData.email }}</span>
      </div>
    </div>
    <div class="mt-2">
      <div class="fw-bold mb-1">{{ emailData.subject }}</div>
      <div class="lh-base">{{ emailData.text }}</div>
    </div>
  </div>

  <div class="mt-3">
    <div class="mb-3">
      <label for="exampleFormControlTextarea1" class="form-label fw-bold fs-5">Форма ответа</label>
      <textarea class="form-control" id="exampleFormControlTextarea1" rows="5"></textarea>
    </div>
    <div class="d-inline-flex gap-2">
      <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Отправить</button>
      <input class="form-control" type="file" id="formFile" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.email-header {
  cursor: pointer;
  position: relative;

  &:hover .email-header-hover {
    opacity: 1;
  }
}

.email-header-hover {
  position: absolute;
  top: 0;
  left: 0;
  width: 30%;
  height: 100%;
  opacity: 0;
  background-image: linear-gradient(to right, rgba(0, 0, 0, 0.1), transparent);
  transition: all 0.3s ease-in-out;
}
</style>
