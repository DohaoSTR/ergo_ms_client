<script setup>
import { Star } from 'lucide-vue-next'

defineProps({
  emails: { type: Array, required: true },
  selectedEmails: { type: Set, required: true },
})

defineEmits(['toggleSelectionEmail', 'toggleEmailPage', 'markEmail'])
</script>

<template>
  <ul class="list-unstyled beautiful-scrollbar" v-auto-animate>
    <li v-if="emails.length === 0" class="fs-4 fw-bold text-center">Письма не найдены</li>
    <li
      v-for="email in emails"
      :key="email.id"
      class="f rounded px-3 py-2 bg-secondary-subtle d-flex align-items-center gap-1 mb-2 me-2"
    >
      <div class="form-check mb-0">
        <input
          class="form-check-input"
          type="checkbox"
          :id="`checkbox-${email.id}`"
          :checked="selectedEmails.has(email.id)"
          @click="$emit('toggleSelectionEmail', email.id)"
        />
        <label class="form-check-label" :for="`checkbox-${email.id}`"></label>
      </div>
      <div
        class="markEmail d-none d-lg-inline-flex rounded-circle p-1"
        @click="$emit('markEmail', email.id)"
      >
        <Star
          :size="19"
          :class="email.marked ? 'text-warning' : 'var(--bs-secondary-text-emphasis)'"
        />
      </div>
      <div
        class="d-flex align-items-center flex-grow-1 text-truncate gap-2"
        @click="$emit('toggleEmailPage', email)"
        style="cursor: pointer"
      >
        <img
          :src="email.image"
          alt="Аватар"
          class="d-none d-lg-block rounded-circle"
          style="width: 40px; height: 40px"
        />
        <div class="d-flex flex-column flex-grow-1 text-truncate">
          <div class="d-flex justify-content-between">
            <span class="fw-bold text-truncate">{{ email.from }}</span>
            <span class="text-muted small">12:34</span>
          </div>
          <div class="d-flex flex-column flex-lg-row align-items-lg-center gap-1 gap-lg-2 lh-sm">
            <span class="fw-bold text-truncate flex-shrink-0" style="font-size: 14px">
              {{ email.subject }}
            </span>
            <span class="text-truncate" style="font-size: 13px"> {{ email.text }} }} </span>
          </div>

          <div class="mt-1 d-flex gap-2" v-auto-animate>
            <span
              v-if="email.inbox"
              class="rounded bg-info"
              style="width: 10px; height: 10px"
            ></span>
            <span
              v-if="email.sent"
              class="rounded bg-success"
              style="width: 10px; height: 10px"
            ></span>
            <span
              v-if="email.marked"
              class="rounded bg-warning"
              style="width: 10px; height: 10px"
            ></span>
            <span
              v-if="email.spam"
              class="rounded bg-danger"
              style="width: 10px; height: 10px"
            ></span>
          </div>
        </div>
      </div>
    </li>
  </ul>
</template>

<style scoped lang="scss">
ul {
  scrollbar-width: thin;
}

.markEmail {
  cursor: pointer;
  transition: background-color $transition;

  &:hover {
    background-color: var(--color-hover-background);
  }
}
</style>
