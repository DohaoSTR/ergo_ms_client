<template>
  <div class="modal-backdrop">
    <div class="modal-dialog">
      <div class="modal-content p-4">
        <button
          type="button"
          class="btn-close float-end"
          @click="close"
        ></button>
        <h4 class="mb-3">Регистрация профиля студента</h4>

        <div v-if="error" class="alert alert-danger">{{ error }}</div>

        <form @submit.prevent="onSubmit">
          <div class="mb-2">
            <label class="form-label">Имя</label>
            <input
              v-model="form.first_name"
              type="text"
              class="form-control"
              required
            />
          </div>

          <div class="mb-2">
            <label class="form-label">Фамилия</label>
            <input
              v-model="form.last_name"
              type="text"
              class="form-control"
              required
            />
          </div>

          <div class="mb-2">
            <label class="form-label">Email</label>
            <input
              v-model="form.email"
              type="email"
              class="form-control"
              required
            />
          </div>

          <div class="mb-2">
            <label class="form-label">Телефон</label>
            <input
              v-model="form.phone"
              type="tel"
              class="form-control"
              placeholder="+7 (___) ___-__-__"
              @focus="onPhoneFocus"
              @input="onPhoneInput"
              @blur="onPhoneBlur"
            />
          </div>
          <div class="mb-2">
            <label class="form-label">Учебная группа</label>
            <select
              v-model="form.study_group"
              class="form-select"
              required
            >
              <option disabled value="">Выберите группу</option>
              <option
                v-for="g in groups"
                :key="g.id"
                :value="g.id"
              >
                {{ g.name }}
              </option>
            </select>
          </div>
          <div class="form-check mb-3">
            <input
              class="form-check-input"
              type="checkbox"
              id="experienceCheck"
              v-model="form.has_experience"
            />
            <label class="form-check-label" for="experienceCheck">
              Есть опыт в IT
            </label>
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
  name: 'StudentRegister',
  data() {
    return {
      form: {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        study_group: null,
        has_experience: false
      },
      groups: [],
      loading: false,
      error: null
    }
  },
  async created() {
    const res = await apiClient.get(endpoints.expert_system.studyGroups)
    if (res.success) {
      this.groups = res.data
    }
  },
  methods: {
    close() {
      this.$router.back()
    },
    onPhoneFocus(e) {
      if (!this.form.phone.startsWith('+7')) {
        this.form.phone = '+7'
      }
      this.$nextTick(() => {
        e.target.setSelectionRange(this.form.phone.length, this.form.phone.length)
      })
    },
    onPhoneInput(e) {
      let val = e.target.value
      val = val.replace(/[^\d+]/g, '')
      if (!val.startsWith('+7')) {
        let digits = val.replace(/\D/g, '')
        if (digits.startsWith('7')) digits = digits.substr(1)
        val = '+7' + digits
      }

      this.form.phone = val
    },
    onPhoneBlur() {
      let digits = this.form.phone.replace(/\D/g, '')
      if (!digits) {
        this.form.phone = ''
        return
      }
      if (!digits.startsWith('7')) digits = '7' + digits
      digits = digits.substr(0, 11)

      let res = '+7'
      if (digits.length > 1)  res += ' (' + digits.substr(1, Math.min(3, digits.length - 1))
      if (digits.length >= 4) res += ') ' + digits.substr(4, Math.min(3, digits.length - 4))
      if (digits.length >= 7) res += '-' + digits.substr(7, Math.min(2, digits.length - 7))
      if (digits.length >= 9) res += '-' + digits.substr(9, Math.min(2, digits.length - 9))

      this.form.phone = res
    },

    async onSubmit() {
      this.error = null
      this.loading = true

      try {
        const resp = await apiClient.post(
          endpoints.expert_system.students,
          this.form
        )
        if (!resp.success) {
          const msg = typeof resp.errors === 'string'
            ? resp.errors
            : Object.values(resp.errors).flat().join(' ')
          throw new Error(msg)
        }
        console.log(this.form.has_experience)
        if(this.form.has_experience){
          this.$router.push({ name: 'Addstudentskills' })
        }
        else{
          this.$router.push({name:'Proforientation'})
        }
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
