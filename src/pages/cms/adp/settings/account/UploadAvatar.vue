<script setup>
import { ref, onMounted } from 'vue'
import { RotateCcw, Upload } from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const avatarInput = ref(null)
const avatarUrl = ref('/src/assets/avatars/avatar-1.png')
const loading = ref(false)
const error = ref('')

async function fetchAvatar() {
  loading.value = true
  error.value = ''
  try {
    const resp = await apiClient.get(endpoints.userAvatars.list)
    if (resp.data.length && resp.data[0].image) {
      avatarUrl.value = resp.data[0].image
    } else {
      avatarUrl.value = '/src/assets/avatars/avatar-1.png'
    }
  } catch (e) {
    error.value = 'Ошибка загрузки аватара'
    avatarUrl.value = '/src/assets/avatars/avatar-1.png'
  } finally {
    loading.value = false
  }
}

const changeAvatar = async (event) => {
  const file = event.target.files[0]
  if (!file || !file.type.startsWith('image/')) {
    alert('Пожалуйста, выберите изображение!')
    return
  }
  avatarUrl.value = URL.createObjectURL(file)

  const formData = new FormData()
  formData.append('image', file)
  loading.value = true
  error.value = ''
  try {
    await apiClient.post(endpoints.userAvatars.create, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    await fetchAvatar()
  } catch (e) {
    error.value = 'Ошибка загрузки'
  } finally {
    loading.value = false
  }
}
async function cancelAvatarUpload() {
  try {
    const resp = await apiClient.get(endpoints.userAvatars.list)
    if (resp.data.length) {
      await apiClient.delete(endpoints.userAvatars.delete(resp.data[0].id))
    }
    avatarUrl.value = '/src/assets/avatars/avatar-1.png'
  } catch (e) {
    error.value = 'Ошибка сброса аватара'
  }
}

onMounted(fetchAvatar)
</script>

<template>
  <div>
    <img
      :src="avatarUrl"
      alt="Avatar"
      class="rounded-circle mb-2"
      style="width: 100px; height: 100px; object-fit: cover; border: 2px solid #eee"
    />
    <div class="button-wrapper">
      <label for="avatarFileInput" class="btn btn-sm btn-primary me-2 mb-2" tabindex="0">
        <span class="d-none d-sm-block">Загрузить фотографию</span>
        <span class="d-block d-sm-none"><Upload /></span>
        <input
          type="file"
          accept="image/png, image/jpeg"
          ref="avatarInput"
          @change="changeAvatar"
          id="avatarFileInput"
          style="display: none"
        />
      </label>
      <button
        type="button"
        class="btn btn-sm btn-secondary account-image-reset mb-2"
        @click="cancelAvatarUpload"
      >
        <span class="d-none d-sm-block">Сбросить</span>
        <span class="d-block d-sm-none"><RotateCcw /></span>
      </button>
    </div>
    <div class="text-muted" style="font-size: 15px">
      Рекомендуемый размер: 200x200. JPG, JPEG, PNG
    </div>
    <div v-if="error" class="alert alert-danger mt-2">{{ error }}</div>
    <div v-if="loading" class="text-primary mt-2">Загрузка...</div>
  </div>
</template>

