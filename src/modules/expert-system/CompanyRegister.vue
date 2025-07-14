<template>
  <div class="modal-backdrop">
    <div class="modal-dialog">
      <div class="modal-content p-4">
        <button
          type="button"
          class="btn-close float-end"
          @click="close"
        ></button>
        <h4 class="mb-3">Регистрация профиля компании</h4>

        <div v-if="error" class="alert alert-danger">{{ error }}</div>

        <form @submit.prevent="onSubmit">
          <div class="mb-2">
            <label class="form-label">Название компании</label>
            <input
              v-model="form.company_name"
              type="text"
              class="form-control"
              required
            />
          </div>

          <div class="mb-2">
            <label class="form-label">Описание</label>
            <textarea
              v-model="form.description"
              class="form-control"
              rows="3"
              required
            ></textarea>
          </div>

          <div class="mb-2">
            <label class="form-label">Сайт</label>
            <input
              v-model="form.website"
              type="url"
              class="form-control"
              placeholder="https://example.com"
              required
            />
          </div>

          <div class="mb-2">
            <label class="form-label">Контактное лицо</label>
            <input
              v-model="form.contact_person"
              type="text"
              class="form-control"
              required
            />
          </div>

          <div class="mb-2">
            <label class="form-label">E-mail для связи</label>
            <input
              v-model="form.contact_email"
              type="email"
              class="form-control"
              required
            />
          </div>

          <button
            type="submit"
            class="btn btn-primary w-100"
            :disabled="loading"
          >
            {{ loading ? 'Сохраняем...' : 'Сохранить профиль' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

export default {
  name: 'CompanyRegister',
  data() {
    return {
      form: {
        company_name: '',
        description: '',
        website: '',
        contact_person: '',
        contact_email: ''
      },
      loading: false,
      error: null
    }
  },
  methods: {
    close() {
      this.$router.back()
    },
    async onSubmit() {
      this.error = null
      this.loading = true

      try {
        const resp = await apiClient.post(
          endpoints.expert_system.companies,
          this.form
        )
        if (!resp.success) {
          const msg = typeof resp.errors === 'string'
            ? resp.errors
            : Object.values(resp.errors).flat().join(' ')
          throw new Error(msg)
        }
        this.close()
      } catch (err) {
        this.error = err.message || 'Ошибка при сохранении профиля'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-dialog {
  background: #fff;
  border-radius: .5rem;
  max-width: 420px;
  width: 100%;
}
</style>
