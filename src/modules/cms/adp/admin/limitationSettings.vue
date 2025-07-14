<template>
    <div class="container-fluid mt-4">
      <div class="row justify-content-center">
        <div class="col-md-10">
          <div class="card shadow-sm">
            <div class="card-header bg-primary text-white">
              <h4 class="mb-0">Управление ограничениями</h4>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6 mb-4">
                  <h5>Список страниц</h5>
                  <table class="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th>Путь</th>
                        <th>Тип страницы</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(page, index) in pages" :key="index">
                        <td>{{ page.path }}</td>
                        <td>
                          <select
                            v-model="page.type"
                            class="form-select form-select-sm"
                            @change="onPageTypeChange(page)"
                          >
                            <option value="withoutliminations">Открытая</option>
                            <option value="closepage">Закрытая</option>
                            <option value="withliminations">С ограничениями</option>
                          </select>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
  
                <div class="col-md-6">
                  <h5>Компоненты</h5>
                  <form @submit.prevent="addComponent" class="mb-3">
                    <div class="mb-2">
                      <label for="pageSelect" class="form-label">Выберите страницу:</label>
                      <select id="pageSelect" v-model="newComponent.page_path" class="form-select">
                        <option v-for="page in ClosedOrWithLiminationsPages" :key="page.path" :value="page.path">
                          {{ page.path }}
                        </option>
                      </select>
                    </div>
                    <div class="mb-2">
                      <label for="componentId" class="form-label">ID компонента:</label>
                      <input
                        id="componentId"
                        type="text"
                        v-model="newComponent.id"
                        class="form-control"
                        required
                      />
                    </div>
                    <button type="submit" class="btn btn-primary">Добавить компонент</button>
                  </form>
  
                  <hr />
  
                  <table class="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th>Страница</th>
                        <th>ID Компонента</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in components" :key="index">
                        <td>{{ item.page_path }}</td>
                        <td>
                          <div v-if="editingIndex === index">
                            <input
                            type="text"
                            v-model="editingData"
                            class="form-control form-control-sm"
                            autofocus
                            @blur="saveEdit(index)"
                            @keyup.enter="saveEdit(index)"
                          />
                          </div>
                          <div v-else>
                            {{ item.id }}
                          </div>
                        </td>
                        <td>
                          <button
                            class="btn btn-sm btn-warning me-2"
                            @click="startEditing(index)"
                          >
                            Изменить
                          </button>
                          <button
                            class="btn btn-sm btn-danger"
                            @click="deleteComponent(index, item.page_path, item.id)"
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                      <tr v-if="components.length === 0">
                        <td colspan="3" class="text-center">Нет добавленных компонентов</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showErrorModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title text-danger">Ошибка</h5>
          <button type="button" class="btn-close" @click="closeModal()"></button>
        </div>
        <div class="modal-body">
          {{ errorMessage }}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal()">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
  </template>
  
  <script setup>
  import { ref, computed, reactive, onMounted } from 'vue';
  import { AddPageComponent, GetPageComponents, GetPages, PutPages, RemovePageComponent, UpdatePageComponent } from '@/modules/cms/adp/admin/js/GroupsPolitics';

  const editingIndex = ref(null);
  const editingData = ref(''); 
  const showErrorModal = ref(false)
  const errorMessage = ref('')
  const prevTypes = reactive({});
  const pages = ref([]);
  const components = ref([]);
onMounted(async()=>{
    let tmp = await GetPages()
    pages.value = tmp.pages 
    tmp = await GetPageComponents()
    components.value = tmp
    for (let page of pages.value){
        prevTypes[page.path] = page.type;
    }
})
function closeModal() {
          showErrorModal.value = false;
        }
  // Фильтруем страницы: только "Закрытые" и "С ограничениями"
  const ClosedOrWithLiminationsPages = computed(() => {
    return pages.value.filter(p => p.type !== 'withoutliminations');
  });
  
  // Список компонентов
  
  
  // Данные для формы
  const newComponent = ref({
    page_path: '',
    id: ''
  });

  // Функция добавления компонента
  async function addComponent() {
    if (newComponent.value.page_path && newComponent.value.id) {
      const existsIndex = components.value.findIndex(
        c => c.page_path === newComponent.value.page_path && c.id === newComponent.value.id
      );
  
      if (existsIndex > -1) {
        alert('Такой компонент уже существует на этой странице');
        return;
      }
      await AddPageComponent(newComponent.value.page_path, newComponent.value.id)
      components.value.push({ ...newComponent.value });
      newComponent.value.id = '';
    }
  }
  
  function startEditing(index) {
  if(editingIndex.value !== index ||editingIndex.value === null){
    editingIndex.value = index;
    editingData.value = components.value[index].id ; 
  }
  else{
      editingData.value = '';
      editingIndex.value = null
  }
// Сохраняем копию
}
  
  // Сохранить изменения при потере фокуса или Enter
  async function saveEdit(index) {
  if (editingIndex.value === null) return;

  const original = components.value[index];
  const updated = editingData.value;


  // Отправляем на сервер
  await UpdatePageComponent(original.page_path, original.id, updated); 

  components.value[index].id = updated;

  editingIndex.value = null;
  editingData.value = null;
}
  
  // Удаление компонента
  async function deleteComponent(index, path, compid) {
      const Response = await RemovePageComponent(path, compid)
      if(Response.message== 'Компонент успешно удален'){
        components.value.splice(index, 1);
      }
      else{
        errorMessage.value = Response.message
        showErrorModal.value = true
      }
  }
  
  async function onPageTypeChange(page) {
  // Проверяем попытку установить тип "Открытая"
  if (page.type === 'Открытая') {
    const hasComponents = components.value.some(component => component.page === page.path);

    if (hasComponents) {
      alert(`Невозможно сделать страницу "${page.path}" открытой, так как на ней есть компоненты.`);
      page.type = prevTypes[page.path];
      return;
    }
  }
  prevTypes[page.path] = page.type;
  await PutPages(page.path, page.type)
}
  </script>
  
  <style scoped>
  .card {
    border-radius: 0.5rem;
  }
  .form-select-sm {
    font-size: 0.875rem;
  }
  input.form-control-sm {
    height: calc(1.5em + 0.5rem + 2px);
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
  }
  </style>