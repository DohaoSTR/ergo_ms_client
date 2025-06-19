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
import { GetPermissionsByCategory, AddGroupsPermissions, RemoveGroupsPermissions } from '@/js/GroupsPolitics'

const list2 = ref([])
const list1 = ref([])
const startlist1 = ref([])
const category = ref('')
const group_name = ref('')
const group_id = ref(0)
const changeothergroups = ref(false)
const props = defineProps({
  list: { type: Array, required: true },
  group_name: { type: String, required: true },
  category: { type: String, required: true },
  group_id:{type:Number, required:true}
})

const moveItem = (fromList, toList, index) => {
  const item = fromList.splice(index, 1)[0]
  toList.push(item)
}

const loadPermissions = async (prop) => {
  if(group_id.value!= prop.group_id )
{
  category.value = prop.category
  group_name.value = prop.group_name
  list2.value = [...props.list]
  const permissions = await GetPermissionsByCategory(category.value)
  list1.value = permissions
  startlist1.value = [...props.list]
  group_id.value = prop.group_id
  for (let i of list2.value) {
    for (let j of list1.value) {
      if (i === j) {
        list1.value.splice(list1.value.indexOf(j), 1)
      }
    }
  }
} 
else{
  category.value = prop.category
  group_name.value = prop.group_name
  list2.value = []
  const permissions = await GetPermissionsByCategory(category.value)
  list1.value = permissions
}
}

watch(props, async (newProps) => {
  await loadPermissions(newProps)
})


const emit = defineEmits(['changePermissions'])

const changePermissions = async () => {
  if (list2.value !== startlist1.value) {
    const deletlist = []
    for (let i of startlist1.value) {
      if (!list2.value.includes(i)) {
        deletlist.push(i)
      }
    }
    if (deletlist.length > 0) {
      await RemoveGroupsPermissions(group_name.value, deletlist, changeothergroups.value)
    }
    const addlist = []
    for (let i of list2.value) {
      if (!startlist1.value.includes(i)) {
        addlist.push(i)
      }
    }
    if (addlist.length > 0) {
      await AddGroupsPermissions(group_name.value, addlist, changeothergroups.value)
    }
  }
  group_id.value =0
  emit('changePermissions')
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
