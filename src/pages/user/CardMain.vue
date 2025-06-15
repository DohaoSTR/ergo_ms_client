<script setup>
import { ref, onMounted } from 'vue'
import { Briefcase, Calendar, MapPin } from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const userInfo = ref({
  image: '/src/assets/avatars/avatar-1.png',
  username: 'Иван Иванов',
  profession: 'UX Дизайнер',
  location: 'Москва',
  registration: 'Апрель 2021',
})

async function fetchAvatar() {
  try {
    const resp = await apiClient.get(endpoints.userAvatars.list)
    if (resp.data.length && resp.data[0].image) {
      userInfo.value.image = resp.data[0].image
    } else {
      userInfo.value.image = '/src/assets/avatars/avatar-1.png'
    }
  } catch {
    userInfo.value.image = '/src/assets/avatars/avatar-1.png'
  }
}

onMounted(fetchAvatar)
</script>


<template>
  <div class="profile__cover col-12">
    <img src="@/assets/profile-cover.png" alt="Profile Cover" />
  </div>
  <div class="profile__basic basic card col-12">
    <div class="row px-0 px-lg-3">
      <div class="col-12 col-xxl-2 col-lg-3">
        <div class="basic__avatar avatar rounded-circle overflow-hidden mx-auto">
          <img :src="userInfo.image" :alt="userInfo.username" />
        </div>
      </div>
      <div class="col-12 col-xxl-10 col-lg-9">
        <div
          class="basic__user d-flex flex-column flex-md-row align-items-md-center justify-content-start justify-content-md-between"
        >
          <div class="basic__data d-flex flex-column gap-2 text-center text-md-start">
            <h3 class="basic__username">{{ userInfo.username }}</h3>
            <div class="basic__about">
              <ul
                class="list-unstyled mb-3 mb-lg-0 d-flex align-items-center flex-wrap justify-content-lg-start justify-content-center gap-3"
              >
                <li class="d-flex align-items-center gap-2">
                  <div class="icon-flex text-muted"><Briefcase :size="22" /></div>
                  <div class="text-muted">{{ userInfo.profession }}</div>
                </li>
                <li class="d-flex align-items-center gap-2">
                  <div class="icon-flex text-muted"><MapPin :size="22" /></div>
                  <div class="text-muted">{{ userInfo.location }}</div>
                </li>
                <li class="d-flex align-items-center gap-2">
                  <div class="icon-flex text-muted"><Calendar :size="22" /></div>
                  <div class="text-muted">{{ userInfo.registration }}</div>
                </li>
              </ul>
            </div>
          </div>
          <div class="basic__button text-center text-md-end">
            <button class="btn btn-primary">Подписан</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.profile__cover img {
  width: 100%;
  height: 200px;
  object-fit: cover;

  @media (width <= 992px) {
    height: 180px;
  }
  @media (width <= 575px) {
    height: 120px;
  }
}

.basic {
  position: relative;
  min-height: 150px;
  height: auto;

  @media (width <= 992px) {
    height: 200px;
  }
  @media (width <= 767px) {
    height: 250px;
  }
  @media (width <= 575px) {
    height: 220px;
  }
  @media (width <= 415px) {
    height: 260px;
  }

  & .row {
    position: absolute;
    top: -50px;
    left: 12px;

    width: 100%;
  }
}

.basic__avatar {
  width: 180px;
  height: 180px;

  @media (width <= 992px) {
    width: 150px;
    height: 150px;
  }
  @media (width <= 575px) {
    width: 120px;
    height: 120px;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.basic__user {
  margin-top: 85px;

  @media (width >= 1400px) {
    padding-left: 3%;
  }

  @media (width <= 992px) {
    margin-top: 16px;
  }
}
</style>
