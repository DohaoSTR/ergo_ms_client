import { apiClient } from '../manager';
import { endpoints } from '../endpoints';

import Cookies from 'js-cookie';
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
export const fetchCountTasksProject = async (projectId, countDone = null) => {
  if (!projectId && projectId !== 0) {
    throw new Error('ID проекта обязателен');
  }

  try {
    // Создаем объект параметров запроса
    const params = {
      project_id: projectId
    };
 var response=null;
    // Добавляем параметр count_done, если он указан
    if (countDone !== null) {
      params.count_done = countDone;
      response = await apiClient.get(endpoints.crm.projects.counttasks, {
       project_id: parseInt(projectId), count_done:countDone
    });
    }
    else
    {
       response = await apiClient.get(endpoints.crm.projects.counttasks, {
       project_id: parseInt(projectId) 
    });
    }

  

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    return {
      totalCount: response.data.tasks_count || 0,
      doneCount: response.data.done_count || 0,
      activeCount: response.data.active_count || 0,
      projectName: response.data.project_name || '',
      message: response.data.message || ''
    };

  } catch (error) {
    console.error('Ошибка в fetchCountTasksProject:', {
      error: error.message,
      response: error.response?.data || error.message
    });

    throw error;
  }
};
export const fetchUserProjects = async () => {
    try {
      const response = await apiClient.get(endpoints.crm.projects.allprojects, { user_id: parseInt(Cookies.get('userId')) })
      // Возвращаем массив проектов
      return response.data.data.map(project => ({
        id: project.id,
        name: project.name,
        dateofcreation: project.dateofcreation,
        creator_id: project.creator_id,
        user_id:project.user_id,
        icon: null,
        iconBackground: 'bg-gray',
        caption: project.description,
        date: { start: new Date(project.dateofcreation).getTime() / 1000, deadline: new Date(project.deadline).getTime() / 1000},
        hours: 0,
        tasks: { current: 0, all: 0 }
      }));
    } catch (error) {
      console.error('Ошибка при загрузке проектов:', error);
      return []; // Возвращаем пустой массив в случае ошибки
    }
};

export const fetchPersonalUserProjects = async () => {
  try {
    const response = await apiClient.get(endpoints.crm.projects.personalprojects, { user_id: parseInt(Cookies.get('userId')) })
    // Возвращаем массив проектов
    return response.data.data.map(project => ({
      id: project.id,
      name: project.name,
      dateofcreation: project.dateofcreation,
      creator_id: project.creator_id,
      user_id:project.user_id,
      icon: null,
      iconBackground: 'bg-gray',
      caption: project.description,
      date: { start: new Date(project.dateofcreation).getTime() / 1000, deadline: new Date(project.deadline).getTime() / 1000},
      hours: 0,
      tasks: { current: 0, all: 0 }
    }));
  } catch (error) {
    console.error('Ошибка при загрузке проектов:', error);
    return []; // Возвращаем пустой массив в случае ошибки
  }
};

export const createNewProject = async (projectData) => {
  try {
    const response = await apiClient.post(
      endpoints.crm.projects.addproject,
      projectData,
      true // Требуется авторизация
    )

    if (response.success) {
      return {
        success: true,
        project: {
          id: response.data.id,
          name: response.data.name,
          description: response.data.description,
          creator_id: response.data.creator_id,
          dateofcreation: response.data.dateofcreation,
          deadline: response.data.deadline
        }
      }
    } else {
      return { 
        success: false, 
        error: response.errors?.message || response.data?.message || 'Ошибка при создании проекта' 
      }
    }
  } catch (error) {
    console.error('Ошибка при создании проекта:', error)
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Неизвестная ошибка' 
    }
  }
}


export const fetchInvitedUserProjects = async () => {
  try {
    const response = await apiClient.get(endpoints.crm.projects.invitedprojects, { user_id: parseInt(Cookies.get('userId')) })
    // Возвращаем массив проектов
    return response.data.data.map(project => ({
      id: project.id,
      name: project.name,
      dateofcreation: project.dateofcreation,
      creator_id: project.creator_id,
      user_id:project.user_id,
      icon: null,
      iconBackground: 'bg-gray',
      caption: project.description,
      date: { start: new Date(project.dateofcreation).getTime() / 1000, deadline: new Date(project.deadline).getTime() / 1000},
      hours: 0,
      tasks: { current: 0, all: 0 }
    }));
  } catch (error) {
    console.error('Ошибка при загрузке проектов:', error);
    return []; // Возвращаем пустой массив в случае ошибки
  }
};



export const deleteProject = async (projectId) => {
  try {

     const deleteUrl = `${endpoints.crm.projects.delete_project.replace('{id}', projectId)}`;
    
    const response = await apiClient.delete(deleteUrl);
    if (!response.data) {
      throw new Error(response.errors?.message || 'Ошибка при удалении проекта');
    }

    return {
      success: true,
      message: response.data.message,
      deletedProjectId: projectId
    };
  } catch (error) {
    console.error('Delete Project Error:', error);
    
    // Улучшенная обработка ошибок
    let errorMessage = 'Не удалось удалить проект';
    if (error.response) {
      if (error.response.status === 404) {
        errorMessage = 'Проект не найден';
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      originalError: error
    };
  }
};

export const leaveProject = async (userId,projectId) => {
  try {

     const deleteUrl = `${endpoints.crm.projects.leave_project.replace('{id}', userId).replace('{project_id}',projectId)}/`;
    
    const response = await apiClient.delete(deleteUrl);
    if (!response.data) {
      throw new Error(response.errors?.message || 'Ошибка при выходе из проекта');
    }

    return {
      success: true,
      message: response.data.message,
      deletedProjectId: userId
    };
  } catch (error) {
    console.error('Delete Project Error:', error);
    
    // Улучшенная обработка ошибок
    let errorMessage = 'Не удалось покинуть проект';
    if (error.response) {
      if (error.response.status === 404) {
        errorMessage = 'Проект не найден';
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      originalError: error
    };
  }
};

export const fetchProjectUsers = async (projectId) => {
  try {
    const response = await apiClient.get(
      endpoints.crm.projects.usersproject.replace('{id}', projectId)
    );

    
    // Адаптируем под структуру вашего Python-кода
    if (response.data && response.data.success && response.data.users) {
      return response.data.users.map(user => ({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        isNew: user.is_new,
      }));
    }
    
    console.warn('Unexpected API response structure', response.data);
    return [];
    
  } catch (error) {
    console.error('Ошибка при загрузке участников проекта:', error);
    return [];
  }
};
