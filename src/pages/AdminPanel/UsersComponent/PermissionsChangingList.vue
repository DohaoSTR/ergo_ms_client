<template>
    <div class="container mt-5">
        <div class="row">
        <div class="col-md-6">
          <h5>Все разрешения</h5>
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
  import { ref, onMounted, watch, } from 'vue';
  import { GetUserPermissions, AddUserPermission, RemoveUserPermissions } from '@/js/GroupsPolitics';
  const list2 = ref([])
  const list1 = ref([])
  const startlist1 = ref([])
  const props = defineProps({
    list: { type: Array, required: true },
    username: { type: String, required: true },
    user_id:{type: Number, required:true}
  })    
    const moveItem = (fromList, toList, index) => {
        const item = fromList.splice(index, 1)[0];
        toList.push(item);
      }
    onMounted(async ()=>{
      const permissions = await GetUserPermissions()
      list1.value = permissions
      list2.value = props.list
      startlist1.value = [...props.list]
      for (let i of list2.value) {
        for(let j of list1.value) {
          if(i === j) {
            list1.value.splice(list1.value.indexOf(j), 1);
          }
        }
      }
    })
    watch(props, async (newProps) => {
      const permissions = await GetUserPermissions()
      list2.value = newProps.list
      list1.value = permissions
      startlist1.value = [...newProps.list]
      for (let i of list2.value) {
        for(let j of list1.value) {
          if(i === j) {
            list1.value.splice(list1.value.indexOf(j), 1);
          }
        }
      }
    })
    const emit = defineEmits(['changePermissions'])

    const changePermissions = async () => {
      if(list2.value !== startlist1.value) 
      {
        const deletlist = []
        for(let i of startlist1.value) {
          if(!list2.value.includes(i)) {
            deletlist.push(i)
          }
        }
        if(deletlist.length > 0) 
        {
          await RemoveUserPermissions(props.user_id, deletlist)
        }
        const addlist = []
        for(let i of list2.value) {
          if(!startlist1.value.includes(i)) {
            addlist.push(i)
          }
        }
        if(addlist.length > 0) 
        {
          await AddUserPermission(props.username, addlist)
        }
      }
      emit('changePermissions')
  }

    defineExpose({
      changePermissions
    })
  </script>
  
  <style scoped>
  .list-group-item {
    cursor: pointer;
  }
  </style>
