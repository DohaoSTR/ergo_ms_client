import { apiClient } from '../manager';
import { endpoints } from '../endpoints';
import Cookies from 'js-cookie';

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Offcanvas } from 'bootstrap/dist/js/bootstrap.bundle.min.js'

export const useKanbanStore = defineStore('kanbanStore', () => {
  const toast = useToast()
  const columns = ref([])
  const editableTask = ref(null)
  const isLoading = ref(false)
  const currentUserId = ref(null)

  // Инициализация - получаем ID пользователя из кук
  const initialize = () => {
    currentUserId.value = parseInt(Cookies.get('userId')) || null
    if (!currentUserId.value) {
      toast.error('Пользователь не авторизован')
    }
  }

  // Получение всех задач текущего пользователя
  const getAllTasks = () => {
    if (!currentUserId.value) return []
    return columns.value.flatMap(column => 
      column.cards.filter(card => card.user_id === currentUserId.value)
    )
  }

  // Получение задачи по ID (только если она принадлежит текущему пользователю)
  const getTaskById = (id) => {
    const task = getAllTasks().find(task => task.id === id)
    if (!task) {
      toast.error('Задача не найдена или у вас нет доступа')
    }
    return task
  }

  // Генерация следующего ID
  const getNextTaskId = () => {
    const allTasks = getAllTasks()
    return allTasks.length > 0 ? Math.max(...allTasks.map(t => t.id)) + 1 : 1
  }
  const fetchSubtasks = async (parentTaskId) => {
    if (!parentTaskId) return [];
    
    isLoading.value = true;
    try {
      const response = await apiClient.get(endpoints.crm.tasks.sectionTasks, { 
        parenttask_id: parseInt(parentTaskId) 
      });
      
      if (!response.success) {
        throw new Error('Ошибка при загрузке подзадач');
      }
      
      const data = response.data;
      
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Некорректный формат данных от API');
      }
      
      // Собираем все подзадачи из всех секций в один массив
      const allSubtasks = data.data.flatMap(section => 
        section.cards.map(task => ({
          id: task.id,
          title: task.title,
          priority: task.priority,
          description: task.description || '',
          is_completed: task.is_completed || false,
          parenttask_id: parentTaskId,
          section_id: section.id,
          user_id: task.user_id,
          deadline: task.deadline || null
        }))
      );
      
      return allSubtasks;
    } catch (error) {
      toast.error('Ошибка при загрузке подзадач: ' + error.message);
      return [];
    } finally {
      isLoading.value = false;
    }
  };
  // Загрузка данных с сервера только для текущего пользователя
  const fetchColumns = async (project_id) => {
    if (!project_id) return;
  
    isLoading.value = true;
    try {
      const response = await apiClient.get(endpoints.crm.tasks.sectionTasks, { 
        project_id: parseInt(project_id) 
      });
      
      if (!response.success) {
        throw new Error('Ошибка при загрузке данных');
      }
    
      const data = response.data;
      
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Некорректный формат данных от API');
      }
  
      // Формируем структуру колонок с задачами и подзадачами
      columns.value = data.data.map(section => ({
        id: section.id,
        title: section.title,
        cards: section.cards.map(task => ({
          id: task.id,
          title: task.title,
          priority: task.priority,
          description: task.description || '',
          isdone: task.isdone || false,
          assignee_id: task.assignee_id || null,
          deadline: task.deadline || null,
          project_id: task.project_id,
          parenttask_id: task.parenttask_id,
          subtasks: task.subtasks.map(subtask => ({
            id: subtask.id,
            title: subtask.text || subtask.title,
            priority: subtask.priority,
            description: subtask.description || '',
            is_completed: subtask.isdone || false,
            user_id: subtask.user_id,
            deadline: subtask.deadline || null
          })),
          section_id:section.id,
          image: task.image,
          attachments: task.attachments,
          comments: task.description,
        }))
      }));
  
    } catch (error) {
      toast.error('Ошибка при загрузке данных: ' + error.message);
    } finally {
      isLoading.value = false;
    }
  };
  // Выбор задачи (только если она принадлежит пользователю)
  const setSelectedTask = (task) => {
    
    editableTask.value = task
    const bsOffcanvas = new Offcanvas('#kanbanCanvas')
    bsOffcanvas.show()
  }

  // Очистка выбранной задачи
  const cleanSelectedTask = () => (editableTask.value = null)

  // Создание нового раздела
  const addSection = async (sectionData) => {
    if (!currentUserId.value) {
      toast.error('Необходимо авторизоваться');
      return null;
    }
  
    isLoading.value = true;
    
    try {
      const requestData = {
        section_name: sectionData.section_name,
        project_id: sectionData.project_id || 1
      };
  
      // 1. Делаем запрос
      const response = await apiClient.post(
        endpoints.crm.tasks.add_section,
        requestData,
        true
      );
  
      // 2. Анализируем ответ сервера (безопасно)
      const responseData = response?.data || response;
      
      // 3. Пытаемся извлечь ID раздела (все возможные варианты)
      const sectionId = responseData?.id 
                      || responseData?.data?.id 
                      || responseData?.result?.id 
                      || responseData?.item?.id;
  
      // 4. Пытаемся извлечь название раздела
      const sectionName = responseData?.name 
                        || responseData?.section_name 
                        || responseData?.data?.name 
                        || sectionData.section_name;
  
      // 6. Создаем новую секцию
      const newSection = {
        id: sectionId,
        title: sectionName,
        cards: []
      };
  
      // 7. Обновляем список секций
      columns.value = [...columns.value, newSection];
      
      // 8. Уведомление об успехе
      toast.success(`Раздел "${sectionName}" успешно создан!`);
      return newSection;
  
    } catch (error) {
      console.error('Ошибка создания раздела:', {
        error: error.message,
        response: error.response?.data
      });
      
      // 9. Улучшенная обработка ошибок
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         error.message || 
                         'Ошибка при создании раздела';
      
      toast.error(errorMessage.includes('Network Error') 
        ? 'Проблемы с соединением' 
        : errorMessage);
      
      return null;
    } finally {
      isLoading.value = false;
    }
  };
// Создание новой задачи
const createTask = async (taskData) => {
  if (!currentUserId.value) {
    toast.error('Необходимо авторизоваться')
    return null
  }

  isLoading.value = true
  try {
    if (!taskData.text || !taskData.section_id) {
      throw new Error('Не указаны обязательные поля (text и section_id)')
    }

    const requestData = {
      text: taskData.text,
      section_id: taskData.section_id,
      description: taskData.description || null,
      deadline: taskData.deadline || null,
      priority: taskData.priority || 1,
      user_id: currentUserId.value,
      isdone: taskData.isdone || false,
      dateofcreation: new Date().toISOString()
    }

    await apiClient.post(endpoints.crm.tasks.add_task, requestData)

    // Проверяем структуру ответа

  } catch (error) {
    console.error('Ошибка при создании задачи:', error)
    toast.error(error.message || 'Ошибка при создании задачи')
    throw error
  } finally {
    isLoading.value = false
  }
}

// Создание подзадачи

  // Обновление информации о задаче
  const updateTask = async (info) => {
    if (!currentUserId.value) {
      toast.error('Необходимо авторизоваться')
      return
    }

    try {
      // Проверяем, что задача принадлежит пользователю

      const response = await fetch(`http://localhost:8000/api/crm/tasks/task-update/${info.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': Cookies.get('csrftoken') || '',
        },
        body: JSON.stringify({
          ...info,
          user_id: currentUserId.value
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const updatedTask = data.data || data

      // Обновляем задачу в хранилище
      columns.value.forEach(column => {
        const taskIndex = column.cards.findIndex(t => t.id === info.id)
        if (taskIndex !== -1) {
          column.cards[taskIndex] = {
            ...column.cards[taskIndex],
            ...updatedTask
          }
        }
      })

      toast.success('Задача обновлена!')
      return updatedTask
    } catch (error) {
      toast.error(`Ошибка при обновлении задачи: ${error.message}`)
      throw error
    }
  }
  const createSubtask = async (subtaskData) => {
  try {
    // Проверяем обязательные поля
    const requiredFields = ['text', 'section_id', 'parenttask_id', 'user_id'];
    const missingFields = requiredFields.filter(field => !subtaskData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
    }

    // Формируем данные для запроса
    const requestData = {
      text: subtaskData.text,
      section_id: subtaskData.section_id,
      parenttask_id: subtaskData.parenttask_id,
      user_id: subtaskData.user_id,
      description: subtaskData.description || '',
      deadline: subtaskData.deadline || new Date().toISOString(),
      priority: subtaskData.priority || 0,
      isdone: subtaskData.isdone || false
    };

    // Отправляем запрос на сервер
    const response = await apiClient.post(
      endpoints.crm.tasks.add_subtask,
      requestData
    );

    // Обрабатываем ответ
    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data?.message || 'Не удалось создать подзадачу');
    }
  } catch (error) {
    console.error('Ошибка при создании подзадачи:', error);
    
    // Формируем понятное сообщение об ошибке
    let errorMessage = 'Ошибка при создании подзадачи';
    if (error.response) {
      // Ошибка от сервера
      errorMessage = error.response.data?.message || 
                    error.response.data?.error || 
                    `Ошибка сервера: ${error.response.status}`;
    } else if (error.message) {
      // Ошибка валидации или другая клиентская ошибка
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

  
// Удаление задачи
const deleteTask = async (taskId) => {
  if (!currentUserId.value) {
    toast.error('Необходимо авторизоваться');
    return { success: false };
  }

  isLoading.value = true;
  try {
    // Формируем URL с учетом нового формата эндпоинта
    const deleteUrl = `${endpoints.crm.tasks.delete_task.replace('{id}', taskId)}`;
    
    const response = await apiClient.delete(deleteUrl);

    if (!response.data) {
      throw new Error(response.errors?.message || 'Ошибка при удалении задачи');
    }

    // Обновляем локальное состояние - удаляем задачу и все её подзадачи
    const deletedTaskIds = response.data.deleted_tasks || [taskId];
    
    columns.value = columns.value.map(column => ({
      ...column,
      cards: column.cards.filter(card => !deletedTaskIds.includes(card.id))
    }));

    return { 
      success: true, 
      deletedIds: deletedTaskIds 
    };
  } catch (error) {
    console.error('Delete Task Error:', error);
    toast.error(error.message || 'Не удалось удалить задачу');
    return { success: false, error: error.message };
  } finally {
    isLoading.value = false;
  }
};

const deleteSection = async (sectionId) => {
  if (!currentUserId.value) {
    toast.error('Необходимо авторизоваться');
    return { success: false };
  }

  isLoading.value = true;
  try {
    // Формируем URL для удаления раздела
    const deleteUrl = `${endpoints.crm.tasks.delete_section.replace('{id}', sectionId)}`;
    
    const response = await apiClient.delete(deleteUrl);

    if (!response.data) {
      throw new Error(response.errors?.message || 'Ошибка при удалении раздела');
    }

    // Обновляем локальное состояние - удаляем раздел и все его задачи
    const deletedSectionId = response.data.deleted_section_id;
    const deletedTaskIds = response.data.deleted_tasks || [];
    
    // Удаляем все задачи этого раздела из колонок
    columns.value = columns.value.map(column => ({
      ...column,
      cards: column.cards.filter(card => !deletedTaskIds.includes(card.id))
    }));

    return { 
      success: true, 
      deletedSectionId: deletedSectionId,
      deletedTaskIds: deletedTaskIds
    };
  } catch (error) {
    console.error('Delete Section Error:', error);
    toast.error(error.message || 'Не удалось удалить раздел');
    return { success: false, error: error.message };
  } finally {
    isLoading.value = false;
  }
};

const toggleTask = async (taskId) => {
  try {
     await apiClient.post(
      `${endpoints.crm.tasks.toggle_task.replace('{id}', taskId)}`
    );
    return { success: true };
  } catch (error) {
    console.error('Toggle task error:', error);
    toast.error(error.message || 'Не удалось изменить статус задачи');
    return { success: false };
  }
}


const updatesTask = async (taskId, updatedData) => {
  try {
    const response = await apiClient.post(
      `${endpoints.crm.tasks.update_task.replace('{id}', taskId)}`,
      updatedData
    )
    
    return { 
      success: true,
      updatedTask: response.data.task
    }
  } catch (error) {
    console.error('Update task error:', error)
    toast.error(error.response?.data?.message || 'Не удалось обновить задачу')
    return { success: false }
  }
}
 const fetchTaskAssignee = async (taskId) => {
  try {
    const response = await apiClient.get(
      endpoints.crm.tasks.assignee_task.replace('{id}', taskId)
    );

    
    if (response.data && response.data.success && response.data.assignee) {
      return {
        id: response.data.assignee.id,
        firstName: response.data.assignee.first_name,
        lastName: response.data.assignee.last_name,
        taskStatus: response.data.status, // 'done' или 'in_progress'
        taskId: response.data.task_id,
        taskText: response.data.task_text
      };
    }
    
    console.warn('Unexpected API response structure', response.data);
    return null;
    
  } catch (error) {
    console.error('Error fetching task assignee:', error);
    throw new Error('Не удалось получить исполнителя задачи');
  }
};

const updatesSection = async (sectionId, updatedData) => {
  try {
    const response = await apiClient.post(
      `${endpoints.crm.tasks.update_section.replace('{id}', sectionId)}`,
      updatedData
    )
    
    return { 
      success: true,
      updatedTask: response.data.task
    }
  } catch (error) {
    console.error('Update task error:', error)
    toast.error(error.response?.data?.message || 'Не удалось обновить раздел')
    return { success: false }
  }
}
  // Инициализация при создании хранилища
  initialize()

  return {
    columns,
    editableTask,
    isLoading,
    currentUserId,
    addSection,
    createTask,
    getAllTasks,
    getTaskById,
    getNextTaskId,
    setSelectedTask,
    cleanSelectedTask,
    updateTask,
    fetchColumns,
    fetchSubtasks,
    deleteTask,
    createSubtask,
    deleteSection,
    toggleTask,
    updatesTask,
    updatesSection,
    fetchTaskAssignee
  }
})
