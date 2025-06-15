<template>
  <div class="row row-gap-4">
    <div id="1" class="col-12 col-md-6">
      <div  class="card">
        <h4  class="mb-3" >Значки по умолчанию</h4>
        <div class="d-flex gap-2 flex-wrap">
          <span class="badge text-bg-primary">Primary</span>
          <span class="badge text-bg-secondary">Secondary</span>
          <span class="badge text-bg-success">Success</span>
          <span class="badge text-bg-danger">Danger</span>
          <span class="badge text-bg-warning">Warning</span>
          <span class="badge text-bg-info">Info</span>
          <span class="badge text-bg-dark">Dark</span>
        </div>
      </div>
    </div>
    <div class="col-12 col-md-6" id="1">
      <div class="card">
        <h4 class="mb-3">Контурные значки</h4>
        <div class="d-flex gap-2 flex-wrap">
          <span class="badge border border-primary text-primary">Primary</span>
          <span class="badge border border-secondary text-secondary">Secondary</span>
          <span class="badge border border-success text-success">Success</span>
          <span class="badge border border-danger text-danger">Danger</span>
          <span class="badge border border-warning text-warning">Warning</span>
          <span class="badge border border-info text-info">Info</span>
          <span class="badge border border-dark text-dark">Dark</span>
        </div>
      </div>
    </div>
    <div class="col-12 col-md-6" id="2">
      <div class="card">
        <h4 class="mb-3">Таблетки по умолчанию</h4>
        <div class="d-flex gap-2 flex-wrap">
          <span class="badge rounded-pill text-bg-primary">Primary</span>
          <span class="badge rounded-pill text-bg-secondary">Secondary</span>
          <span class="badge rounded-pill text-bg-success">Success</span>
          <span class="badge rounded-pill text-bg-danger">Danger</span>
          <span class="badge rounded-pill text-bg-warning">Warning</span>
          <span class="badge rounded-pill text-bg-info">Info</span>
          <span class="badge rounded-pill text-bg-dark">Dark</span>
        </div>
      </div>
    </div>
    <div class="col-12 col-md-6" id="3">
      <div class="card">
        <h4 class="mb-3" >Контурные таблетки </h4>
        <div class="d-flex gap-2 flex-wrap">
          <span class="badge rounded-pill border border-primary text-primary">Primary</span>
          <span class="badge rounded-pill border border-secondary text-secondary">Secondary</span>
          <span class="badge rounded-pill border border-success text-success">Success</span>
          <span class="badge rounded-pill border border-danger text-danger">Danger</span>
          <span class="badge rounded-pill border border-warning text-warning">Warning</span>
          <span class="badge rounded-pill border border-info text-info">Info</span>
          <span class="badge rounded-pill border border-dark text-dark">Dark</span>
        </div>
      </div>
    </div>
    <div class="col-12 col-md-6">
      <div class="card">
        <h4 class="mb-3">Значки на кнопках</h4>
        <div class="d-flex gap-4 flex-wrap">
          <button type="button" class="btn btn-secondary position-relative">
            Входящие
            <span
              class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            >
              99+
              <span class="visually-hidden">непрочитанные сообщения</span>
            </span>
          </button>
          <button type="button" class="btn btn-secondary position-relative">
            Входящие
            <span
              class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success"
            >
              99+
              <span class="visually-hidden">непрочитанные сообщения</span>
            </span>
          </button>
          <button type="button" class="btn btn-secondary position-relative">
            Входящие
            <span
              class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning"
            >
              99+
              <span class="visually-hidden">непрочитанные сообщения</span>
            </span>
          </button>
          <button type="button" class="btn btn-secondary position-relative">
            Входящие
            <span
              class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-info"
            >
              99+
              <span class="visually-hidden">непрочитанные сообщения</span>
            </span>
          </button>
          <button type="button" class="btn btn-secondary position-relative">
            Входящие
            <span
              class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark"
            >
              99+
              <span class="visually-hidden">непрочитанные сообщения</span>
            </span>
          </button>
        </div>
      </div>
    </div>
    <div class="col-12 col-md-6">
      <div class="card">
        <h4 class="mb-3">Альтернативные значки</h4>
        <div class="d-flex gap-4 flex-wrap">
          <button type="button" class="btn btn-secondary position-relative">
            Входящие
            <span
              class="position-absolute top-0 start-100 translate-middle p-2 bg-danger border border-light rounded-circle"
            >
              <span class="visually-hidden">Новые уведомления</span>
            </span>
          </button>
          <button type="button" class="btn btn-secondary position-relative">
            Входящие
            <span
              class="position-absolute top-0 start-100 translate-middle p-2 bg-success border border-light rounded-circle"
            >
              <span class="visually-hidden">Новые уведомления</span>
            </span>
          </button>
          <button type="button" class="btn btn-secondary position-relative">
            Входящие
            <span
              class="position-absolute top-0 start-100 translate-middle p-2 bg-warning border border-light rounded-circle"
            >
              <span class="visually-hidden">Новые уведомления</span>
            </span>
          </button>
          <button type="button" class="btn btn-secondary position-relative">
            Входящие
            <span
              class="position-absolute top-0 start-100 translate-middle p-2 bg-info border border-light rounded-circle"
            >
              <span class="visually-hidden">Новые уведомления</span>
            </span>
          </button>
          <button type="button" class="btn btn-secondary position-relative">
            Входящие
            <span
              class="position-absolute top-0 start-100 translate-middle p-2 bg-dark border border-light rounded-circle"
            >
              <span class="visually-hidden">Новые уведомления</span>
            </span>
          </button>
        </div>
      </div>
    </div>
    <div class="col-12">
      <div class="card">
        <h4 class="mb-3">Значки в кнопках</h4>
        <div class="d-flex gap-4 flex-wrap">
          <button type="button" class="btn btn-secondary">
            Оповещения <span class="badge text-bg-primary">4</span>
          </button>
          <button type="button" class="btn btn-secondary">
            Оповещения <span class="badge text-bg-success">4</span>
          </button>
          <button type="button" class="btn btn-secondary">
            Оповещения <span class="badge text-bg-warning">4</span>
          </button>
          <button type="button" class="btn btn-secondary">
            Оповещения <span class="badge text-bg-info">4</span>
          </button>
          <button type="button" class="btn btn-secondary">
            Оповещения <span class="badge text-bg-dark">4</span>
          </button>
          <button type="button" class="btn btn-secondary">
            Оповещения <span class="badge text-bg-danger">4</span>
          </button>
          <button type="button" class="btn btn-secondary">
            Оповещения <span class="badge text-bg-indigo">4</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped lang="scss"></style>
