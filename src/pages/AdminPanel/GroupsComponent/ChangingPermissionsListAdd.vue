<template>
    <div class="container mt-5">
      <div class="form-check">
        <input class="form-check-input" type="checkbox" value="" id="flexCheckChecked" checked v-model="changeothergroups" />
        <label class="form-check-label" for="flexCheckChecked"> Изменить права для других групп </label>
    </div>
      <div class="row">
        <div class="col-md-6">
          <h5>Разрешения категории</h5>
        </div>
        <div class="col-md-6">
          <h5>Установленные разрешения</h5>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <ul class="list-group">
            <li
              v-for="(item, index) in list1"
              :key="index"
              class="list-group-item"
              @click="moveItem(list1, list2, index)"
            >
              {{ item }}
            </li>
          </ul>
        </div>
        <div class="col-md-6">
          <ul class="list-group">
            <li
              v-for="(item, index) in list2"
              :key="index"
              class="list-group-item"
              @click="moveItem(list2, list1, index)"
            >
              {{ item }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watch, } from 'vue'
  import { GetPermissionsByCategory, AddGroupsPermissions} from '@/js/GroupsPolitics'
  
  const list2 = ref([])
  const list1 = ref([])
  const category = ref('')
  const changeothergroups = ref(false)
  const props = defineProps({
    category: { type: String, required: true },
  })
  
  const moveItem = (fromList, toList, index) => {
    const item = fromList.splice(index, 1)[0]
    toList.push(item)
  }
  
  const loadPermissions = async (prop) => {
    category.value = prop.category
    if(category.value.trim()){
      list1.value = await GetPermissionsByCategory(category.value)
      
    }
    list2.value = []
  }
  
  watch(props, async (newProps) => {
    await loadPermissions(newProps)
  
  })
  
  const emit = defineEmits(['changePermissions'])
  
  const changePermissions = async (group_name) => {
      let permissions = list2.value.map(i => i.id)
      await AddGroupsPermissions(group_name, list2.value, changeothergroups.value)
      list1.value =[]
      list2.value =[]
    }
  
  
  defineExpose({
    changePermissions,
  })
  </script>
  
  <style scoped>
  .list-group-item {
    cursor: pointer;
  }
  </style>