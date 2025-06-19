<script setup>
import { ref, onMounted, watch, } from 'vue'
import GroupsChangingLists from './GroupChangingLists.vue'
import PermissionsChangingList from './PermissionsChangingList.vue'
const emit = defineEmits(['changeUserGroupsAndPermissions'])

const groupsChangingListsRef = ref(null);
const permissionsChangingListsRef = ref(null);

const user = ref('')
const groups = ref([])
const permissions = ref([])
const user_id = ref(0)
const props = defineProps({
  row: { type: Object, required: true },
})
watch(props, (newProps) => {
  user_id.value = props.row.user_id
  user.value = newProps.row.user
  groups.value = [...newProps.row.groups]
  permissions.value = [...newProps.row.permissions]
})

const submitForm = async () => {
    groupsChangingListsRef.value.changeGroups()
    permissionsChangingListsRef.value.changePermissions()
  }
const changes = async () => {
  emit('changeUserGroupsAndPermissions')
}

onMounted(() => {
  user_id.value = props.row.user_id
  groups.value = [...props.row.groups]
  permissions.value = [...props.row.permissions]
  user.value = props.row.user

})
</script>

<template>
  <form @submit.prevent="submitForm" novalidate>
    <h3>Пользователь: {{ user }}</h3>
   <GroupsChangingLists :list="groups" @changeGroups="changes" :username="user" :user_id="user_id" ref="groupsChangingListsRef" />
   <br />
   <PermissionsChangingList :list="permissions" :username="user" @changePermissions="changes" :user_id="user_id" ref="permissionsChangingListsRef" />
    <div class="mt-3 text-end">
      <button type="submit" class="btn btn-primary"  data-bs-dismiss="modal">
        Изменить
      </button>
    </div>
  </form>
</template>
