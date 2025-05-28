import { apiClient } from '../manager';
import { endpoints } from '../endpoints';

export const CheckAccess = {
    async CheckAccesToPage(path) {
        const response = await apiClient.get(endpoints.cms.checkAccessToPage, {
            path,
        }, true);
        return response;
    },
    async CheckAccesToComponent(path, componentId) {
        const response = await apiClient.get(endpoints.cms.checkAccessToComponent, {
            path,
            componentId,
        }, true);
        return response;
    },
    async CheckAccesToAdminPanel() {
        const response = await apiClient.get(endpoints.cms.checkAccessToAdminPanel, {}, true);
        return response;
    },
    async AddGroupCategory(name, createGroup) {
        console.log(createGroup)
        const response = await apiClient.post(endpoints.cms.addGroupCategory, {
            category_name: name,
            create_admin_group: createGroup,
        }, true);
        return response;
    },
    async ChangeGroupCategory(name, newName) {
        const response = await apiClient.put(endpoints.cms.changeGroupCategory, {
            category_name: name,
            new_category_name: newName,
        }, true);
        return response;
    },
    async DeleteGroupCategory(name) {
        const response = await apiClient.delete(`${endpoints.cms.deleteGroupCategory}${name}/`, 
        {
          data:{ category_name: name}
        }, 
        true);
        return response;
    },
    async GetGroupCategories() {
        const response = await apiClient.get(endpoints.cms.getGroupCategories, {}, true);
        return response;
    },
    async GetGroups() 
    {
        const response = await apiClient.get(endpoints.cms.getGroups, {}, true);
        return response;
    },
    async AddGroup(name, category, level) {
        const response = await apiClient.post(endpoints.cms.addGroup, {
            group_name: name,
            category_name: category,
            level: level,
        }, true);
        return response;
    },
    async DeleteGroup(id) {
        const response = await apiClient.delete(`${endpoints.cms.deleteGroup}${id}/`, {}, true);
        return response;
    },
    async ChangeGroup(name, newName, category, level) {
        const response = await apiClient.put(endpoints.cms.changeGroup, {
            group_name: name,
            new_group_name: newName,
            category_name: category,
            level: level,
        }, true);
        return response;
    },

    async AddPermission(name, category, accession_type, path, component_id) {
        const response = await apiClient.post(endpoints.cms.addPermission, {
            permission_name: name,
            category_name: category,
            accession_type: accession_type,
            path: path,
            component_id: component_id,
        }, true);
        return response;
    },
    async DeletePermission(id) {
        const response = await apiClient.delete(`${endpoints.cms.deletePermission}${id}/`, {}, true);
        return response;
    },
    async ChangePermission(id, newName, newCategory, accession_type, path, component_id) {
        const response = await apiClient.put(endpoints.cms.changePermission, {
            permission_id: id,
            new_permission_name: newName,
            new_category_name: newCategory,
            accession_type: accession_type,
            path: path,
            component_id: component_id,
        }, true);
        return response;
    },
    async GetPermissions() {
        const response = await apiClient.get(endpoints.cms.getPermissions, {}, true);
        return response;
    },





    async AddUserPermission(username, permissionName) {
        const response = await apiClient.post(endpoints.cms.addUserPermission, {
            username: username,
            permissions_name: permissionName,
        }, true);
        return response;
    },
    async RemoveUserPermissions(username, permissionName) {
        const response = await apiClient.delete(endpoints.cms.removeUserPermission, {
            data: { username: username, permissions_name: permissionName },
        }, true);
        return response;
    },
    async AddUserGroups(username, groupName) {
        const response = await apiClient.post(endpoints.cms.addUserGroup, {
            username: username,
            groups_name: groupName,
        }, true);
        return response;
    },
    async RemoveUserGroups(username, groupName) {
        const response = await apiClient.delete(endpoints.cms.removeUserGroup, {
            data: { username: username, groups_name: groupName },
        }, true);
        return response;
    },
    async GetUserGroupsAndPermissions() {
        const response = await apiClient.get(endpoints.cms.getUserGroupsAndPermissions, {}, true);
        return response;
    },
    async GetUserGroups() {
        const response = await apiClient.get(endpoints.cms.getUserGroups, {}, true);
        return response;
    },
    async GetUserPermissions() {
        const response = await apiClient.get(endpoints.cms.getUserPermissions, {}, true);
        return response;
    },
    async GetPermissionsByCategory(category) {
        const response = await apiClient.get(endpoints.cms.getPermissionsByCategory, {
            category: category,
        }, true);
        return response;
    },
    async AddGroupsPermissions(groupName, permissionsName) {
        const response = await apiClient.post(endpoints.cms.addGroupsPermissions, {
            group_name: groupName,
            permissions_name: permissionsName,
        }, true);
        return response;
    },
    async RemoveGroupsPermissions(groupName, permissionsName) {
        const response = await apiClient.post(endpoints.cms.removeGroupsPermissions, {
             group_name: groupName,
             permissions_name: permissionsName
        }, true);
        return response;
    },
    async GetUserName() {
        const response = await apiClient.get(endpoints.cms.getUserName, {}, true);
        return response;
    },
}
