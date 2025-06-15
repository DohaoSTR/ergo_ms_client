import { CheckAccess } from './api/services/cms';
import router from './routers';
import Cookies from 'js-cookie';
export const checkAccessToPage = async (path) => {
    if(Cookies.get('token')!= null){
        if(path.includes('AdminPanel')){
        let b = await CheckAccessToAdminPanel()
        if(!b.access_to_panel){
            router.push('/:pathMatch(.*)*');
        }
        else if( path == '/AdminPanel/CategoriesPanel'& !b.access_to_category){
            router.push('/:pathMatch(.*)*');
        }
        }
        else{
            const response = await CheckAccess.CheckAccesToPage(path);
            if(response.status!= 401){
                const accessed = response.data.access;
                if(!accessed) 
                    {
                        router.push('/:pathMatch(.*)*');
                    }
            }
        }
    }
}

export const CheckAccessToComponents = async (path) => {
    if(Cookies.get('token')!= null){
        const response = await CheckAccess.CheckAccesToComponent(path);
        if(response.status != 401){
            const accesses = response.data;
            for (let acc of accesses){
                if(!acc.write){
                    const element = document.getElementById(acc.component)
                    element.style.pointerEvents = 'none'
                    element.style.userSelect = 'none';
                    element.style.webkitUserSelect ='none'
                    element.style.MozUserSelect ='none'
                    element.style.msUserSelect ='none'
                }
                if(!acc.read){
                    const element = document.getElementById(acc.component)
                    element.remove();
                }
            }
            
            return response;
        }
    }
}

export const CheckAccessToAdminPanel = async () => {
    const response = await CheckAccess.CheckAccesToAdminPanel();
    return response.data;
}

export const AddGroupCategory = async (name, createGroup) => {
    const response = await CheckAccess.AddGroupCategory(name, createGroup);
    return response.data;
}

export const ChangeGroupCategory = async (name, newName) => {
    const response = await CheckAccess.ChangeGroupCategory(name, newName);
    return response.data;
}

export const DeleteGroupCategory = async (name) => {
    const response = await CheckAccess.DeleteGroupCategory(name);
    return response.data;
}

export const GetGroupCategories = async () => {
    const response = await CheckAccess.GetGroupCategories();
    return response.data.categories;
}

export const GetGroups = async () => {
    const response = await CheckAccess.GetGroups();
    return response.data.groups;
}

export const AddGroup = async (name, category, level) => {
    const response = await CheckAccess.AddGroup(name, category, level);
    return response.data;
}

export const DeleteGroup = async (name) => {
    const response = await CheckAccess.DeleteGroup(name);
    return response.data;
}

export const ChangeGroup = async (name, newName, category, level) => {
    const response = await CheckAccess.ChangeGroup(name, newName, category, level);
    return response.data;
}

export const AddPermission = async (name, mark, category, accession_type, path, component_id) => {
    const response = await CheckAccess.AddPermission(name, mark, category, accession_type, path, component_id);
    return response.data;
}

export const DeletePermission = async (name) => {
    const response = await CheckAccess.DeletePermission(name);
    return response.data;
}

export const ChangePermission = async (name, newName, newMark, newCategory, accession_type, path, component_id) => {
    const response = await CheckAccess.ChangePermission(name, newName, newMark, newCategory, accession_type, path, component_id);
    return response.data;
}
export const GetUserGroupsAndPermissions = async () => {
    const response = await CheckAccess.GetUserGroupsAndPermissions();
    return response.data.users;
}

export const GetPermissions = async () => {
    const response = await CheckAccess.GetPermissions();
    return response.data.permissions;
}

export const AddUserPermission = async (username, permissionName) => {
    const response = await CheckAccess.AddUserPermission(username, permissionName);
    return response.data;
}

export const RemoveUserPermissions = async (username, permissionName) => {
    const response = await CheckAccess.RemoveUserPermissions(username, permissionName);
    return response.data;
}

export const AddUserGroups = async (username, groupName) => {
    const response = await CheckAccess.AddUserGroups(username, groupName);
    return response.data;
}

export const RemoveUserGroups = async (username, groupName) => {
    const response = await CheckAccess.RemoveUserGroups(username, groupName);
    return response.data;
}

export const GetUserGroups = async () => {
    const response = await CheckAccess.GetUserGroups();
    return response.data.groups;
}

export const GetUserPermissions = async () => {
    const response = await CheckAccess.GetUserPermissions();
    return response.data.permissions;
}

export const GetPermissionsByCategory = async (category) => {
    const response = await CheckAccess.GetPermissionsByCategory(category);
    return response.data.permissions;
}

export const AddGroupsPermissions = async (groupName, permissionsName, changeothergroups) => {
    const response = await CheckAccess.AddGroupsPermissions(groupName, permissionsName, changeothergroups);
    return response.data;
}

export const RemoveGroupsPermissions = async (groupName, permissionsName, changeothergroups) => {
    const response = await CheckAccess.RemoveGroupsPermissions(groupName, permissionsName, changeothergroups);
    return response.data;
}

export const GetPages = async () => {
    const response = await CheckAccess.GetPages();
    return response.data;
}
export const PutPages = async (path, type) => {
    const response = await CheckAccess.PutPages(path, type);
    return response.data;
}

export const AddPageComponent = async (path, componentId) => {
    const response = await CheckAccess.AddPageComponent(path, componentId);
    return response.data;
}

export const RemovePageComponent = async (path, componentId) => {
    const response = await CheckAccess.RemovePageComponent(path, componentId);
    return response.data;
}

export const UpdatePageComponent = async (path, oldComponentId, newComponentId) => {
    const response = await CheckAccess.UpdatePageComponent(path, oldComponentId, newComponentId);
    return response.data;
}

export const GetPageComponents = async () => {
    const response = await CheckAccess.GetPageComponents();
    return response.data.components;
}

export const GetClosedPages = async () => {
    const response = await CheckAccess.GetClosedPages();
    return response.data.pages;
}

export const GetClosedPagesForUser = async () => {
    const response = await CheckAccess.GetClosedPagesForUser();
    return response.data.pages;
}
