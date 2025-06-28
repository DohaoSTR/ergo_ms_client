<script setup>
import { ref } from 'vue'
import { MaskInput } from 'vue-3-mask'

import UploadAvatar from '@/pages/cms/adp/settings/account/UploadAvatar.vue'

const userInfo = ref({
  image: '/src/assets/avatars/avatar-1.png',
  firstName: 'Иван ',
  lastName: 'Иванов',
  email: 'ivan@ivanov.com',
  location: 'Москва',
  registration: 'Апрель 2021',
})
</script>

<template>
  <div class="card mb-4">
    <div class="d-flex align-items-start align-items-sm-center gap-3 pb-2 border-bottom mb-3">
      <UploadAvatar />
    </div>
    <div class="row g-3">
      <div class="col-md-6 fv-plugins-icon-container">
        <label for="firstName" class="form-label mb-1">Имя</label>
        <input
          class="form-control"
          type="text"
          id="firstName"
          name="firstName"
          :value="userInfo.firstName"
        />
      </div>
      <div class="col-md-6 fv-plugins-icon-container fv-plugins-bootstrap5-row-valid">
        <label for="lastName" class="form-label mb-1">Фамилия</label>
        <input
          class="form-control"
          type="text"
          name="lastName"
          id="lastName"
          :value="userInfo.lastName"
        />
      </div>
      <div class="col-md-6">
        <label for="email " class="form-label mb-1">Почта</label>
        <input
          class="form-control"
          type="text"
          id="email"
          name="email"
          :value="userInfo.email"
          placeholder="example@site.com"
        />
      </div>
      <div class="col-md-6">
        <label for="organization" class="form-label mb-1">Организация</label>
        <input
          type="text"
          class="form-control"
          id="organization"
          name="organization"
          placeholder="Организация"
        />
      </div>
      <div class="col-md-6">
        <label for="phoneNumber" class="form-label mb-1">Номер телефона</label>
        <div class="input-group input-group-merge">
          <span class="input-group-text">+7</span>
          <MaskInput
            mask="(###) ###-##-##"
            type="text"
            id="phoneNumber"
            name="phoneNumber"
            class="form-control"
            placeholder="(123) 456-78-90"
          />
        </div>
      </div>
      <div class="col-md-6">
        <label for="address" class="form-label mb-1">Адрес</label>
        <input type="text" class="form-control" id="address" name="address" placeholder="Адрес" />
      </div>
      <div class="col-md-6">
        <label for="state" class="form-label mb-1">Город</label>
        <input class="form-control" type="text" id="state" name="state" placeholder="Город" />
      </div>
      <div class="col-md-6">
        <label for="zipCode" class="form-label">Zip-код</label>
        <MaskInput
          mask="######"
          type="text"
          class="form-control"
          id="zipCode"
          name="zipCode"
          placeholder="231465"
        />
      </div>
      <div class="col-md-6">
        <label for="country" class="form-label mb-1">Страна</label>
        <div class="position-relative">
          <select
            id="country"
            class="form-select"
            data-select2-id="country"
            tabindex="-1"
            aria-hidden="true"
          >
            <option value="" selected>Выбрать</option>
            <option value="Australia">Австралия</option>
            <option value="Bangladesh">Бангладеш</option>
            <option value="Belarus">Беларусь</option>
            <option value="Brazil">Бразилия</option>
            <option value="Canada">Канада</option>
            <option value="China">Китай</option>
            <option value="France">Франция</option>
            <option value="Germany">Германия</option>
            <option value="India">Индия</option>
            <option value="Indonesia">Индонезия</option>
            <option value="Israel">Израиль</option>
            <option value="Italy">Италия</option>
            <option value="Japan">Япония</option>
            <option value="Korea">Южная Корея</option>
            <option value="Russia">Российская Федерация</option>
            <option value="South Africa">ЮАР</option>
            <option value="Thailand">Таиланд</option>
            <option value="Turkey">Турция</option>
            <option value="Ukraine">Украина</option>
            <option value="United Arab Emirates">ОАЭ</option>
            <option value="United Kingdom">Великобритания</option>
            <option value="United States">Соединенные Штаты</option>
          </select>
        </div>
      </div>
      <div class="col-md-6">
        <label for="language" class="form-label mb-1">Язык</label>
        <div class="position-relative">
          <select
            id="language"
            class="select2 form-select select2-hidden-accessible"
            data-select2-id="language"
            tabindex="-1"
            aria-hidden="true"
          >
            <option value="" selected>Выбрать</option>
            <option value="en">Русский</option>
            <option value="ru">Английский</option>
            <option value="de">Немецкий</option>
            <option value="pt">Португальский</option>
          </select>
        </div>
      </div>
      <div class="col-md-6">
        <label for="timeZones" class="form-label mb-1">Часовой пояс</label>
        <div class="position-relative">
          <select
            id="timeZones"
            class="form-select"
            data-select2-id="timeZones"
            tabindex="-1"
            aria-hidden="true"
          >
            <option value="" selected>Выбрать</option>
            <option value="0">(GMT+0) Международное время</option>
            <option value="3">(GMT+3) Москва</option>
            <option value="4">(GMT+4) Самара</option>
            <option value="5">(GMT+5) Екатеринбург</option>
            <option value="6">(GMT+6) Омск</option>
            <option value="7">(GMT+7) Красноярск</option>
            <option value="7">(GMT+7) Новосибирск</option>
            <option value="8">(GMT+8) Иркутск</option>
            <option value="9">(GMT+9) Чита</option>
            <option value="10">(GMT+10) Владивосток</option>
            <option value="11">(GMT+11) Магадан</option>
            <option value="11">(GMT+11) Южно-Сахалинск</option>
            <option value="12">(GMT+12) Анадыр</option>
            <option value="12">(GMT+12) Петропавловск-Камчатский</option>
          </select>
        </div>
      </div>
      <div class="col-md-6">
        <label for="currency" class="form-label mb-1">Валюта</label>
        <div class="position-relative">
          <select
            id="currency"
            class="select2 form-select select2-hidden-accessible"
            data-select2-id="currency"
            tabindex="-1"
            aria-hidden="true"
          >
            <option value="" selected>Выбрать</option>
            <option value="usd">USD</option>
            <option value="euro">Euro</option>
            <option value="pound">RUB</option>
            <option value="bitcoin">Bitcoin</option>
          </select>
        </div>
      </div>
    </div>
    <div class="mt-3">
      <button type="submit" class="btn btn-primary me-2">Сохранить</button>
      <button type="reset" class="btn btn-secondary">Отменить</button>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
