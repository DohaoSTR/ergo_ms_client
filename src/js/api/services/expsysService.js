// expsysService.js
import { apiClient } from '../manager';
import { endpoints } from '../endpoints';
import Cookies from 'js-cookie';

// expsysService.js
export const fetchSubjectCompetencies = async (subjectId) => {
  if (!subjectId) return [];
  try {
    const response = await apiClient.get(endpoints.expsys.subjects.allcompenencies, {
       subject_id: parseInt(subjectId)
    });

    if (!response.success) {
      throw new Error(response.errors?.message || 'Ошибка при загрузке компетенций');
    }

    return response.data.data.map(comp => ({
      id: comp.id,
      name: comp.name,
      description: comp.description,
      sat_coef: comp.sat_coef,
      subject_id: comp.subject_id,
      icon: 'award',
      iconBackground: 'bg-success',
      knowledge:comp.knowledge,
      ability:comp.ability,
      mastered:comp.mastered,
      stats: {
        courses: 0,
        students: 0
      }
    }));
  } catch (error) {
    console.error('Ошибка в fetchSubjectCompetencies:', error.message);
    throw error;
  }
};

export const fetchIndicatorsCompetencie = async (competenceId) => {
  if (!competenceId) return [];
  try {
    const response = await apiClient.get(endpoints.expsys.subjects.indicatorscompenencies, {
       competence_id: parseInt(competenceId)
    });

    if (!response.success) {
      throw new Error(response.errors?.message || 'Ошибка при загрузке индикаторов');
    }

    return response.data.data.map(ind => ({
      id: ind.id,
      name: ind.name,
      description: ind.description,
      sat_coef: ind.sat_coef,
      competence_id: ind.competence_id,
    }));
  } catch (error) {
    console.error('Ошибка в fetchIndicatorsCompetencie:', error.message);
    throw error;
  }
};

export const fetchIndicators = async () => {
  try {
    const response = await apiClient.get(endpoints.expsys.subjects.indicators);

    if (!response.success) {
      throw new Error(response.errors?.message || 'Ошибка при загрузке индикаторов');
    }

    return response.data.data.map(comp => ({
      id: comp.id,
      name: comp.name,
      description: comp.description,
      category:comp.category
    }));
  } catch (error) {
    console.error('Ошибка в fetchIndicators:', error.message);
    throw error;
  }
};

export const fetchCompetenceMastery = async (competenceId) => {
  try {
    const response = await apiClient.get(endpoints.expsys.subjects.information, {
      competence_id: competenceId
    });

    if (!response.success) {
      throw new Error(response.errors?.message || 'Ошибка при загрузке данных об освоении компетенции');
    }

    // Преобразуем данные в удобный формат
    return {
      competenceId: response.data.data.competence_id,
      competenceName: response.data.data.competence_name,
      indicatorsCount: response.data.data.indicators_count,
      averageMastery: response.data.data.average_mastery,
      students: response.data.data.students.map(student => ({
        studentId: student.student_id,
        studentFio: student.student_fio,
        totalMastery: student.total_mastery,
        subjects: student.subjects.map(subject => ({
          subjectId: subject.subject_id,
          subjectName: subject.subject_name,
          indicatorId: subject.indicator_id,
          indicatorName: subject.indicator_name,
          grade: subject.grade,
          masteryContribution: subject.mastery_contribution,
          gradeDate: subject.grade_date
        }))
      }))
    };
    
  } catch (error) {
    console.error('Ошибка в fetchCompetenceMastery:', error.message);
    throw error;
  }
};


export const fetchCompetencies = async () => {
  try {
    const response = await apiClient.get(endpoints.expsys.subjects.competencies, {
    });

    if (!response.success) {
      throw new Error(response.errors?.message || 'Ошибка при загрузке компетенций');
    }

    return response.data.data.map(comp => ({
      id: comp.id,
      name: comp.name,
      description: comp.description,
      category:comp.category,
    }));
  } catch (error) {
    console.error('Ошибка в fetchCompetencies:', error.message);
    throw error;
  }
};

export const fetchTeacherSubjects = async () => {
  try {
    const userId = Cookies.get('userId');

    if (!userId) {
      throw new Error('ID пользователя не найден в cookies');
    }

    const response = await apiClient.get(`${endpoints.expsys.subjects.allsubjects}?user_id=${userId}`);

    const responseData = response?.data;

    if (!responseData || !Array.isArray(responseData.data)) {
      console.error('Некорректный формат данных предметов:', responseData);
      return [];
    }

    return responseData.data.map(subject => ({
      id: subject.id,
      name: subject.name,
      description: subject.description,
      creationDate: subject.creationdate,
      lastUpdate: subject.lastupdate,
      teacherId: subject.teacher_id,
      icon: 'book',
      iconBackground: 'bg-blue',
      caption: subject.description?.substring(0, 100) || '',
      stats: {
        students: 0,
        lessons: 0,
        tasks: 0
      }
    }));
    
  } catch (error) {
    console.error('Ошибка при загрузке предметов:', error?.response?.data || error.message || error);
    return [];
  }
};

export const createSubject = async (subjectData) => {
    try {
        const response = await apiClient.post(
            endpoints.expsys.subjects.create,
            subjectData
        );


        if (response.success) {
            return response.data;
        }

        throw new Error(response.errors?.message || 'Ошибка при создании предмета');

    } catch (error) {
        console.error('Ошибка в createSubject:', {
            error: error.message,
            response: error.response?.data || error.message
        });

        let errorMessage = 'Не удалось создать предмет';

        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        throw new Error(errorMessage);
    }
};

export const createCompetence = async (competenceData) => {
    try {
        const response = await apiClient.post(
            endpoints.expsys.subjects.create_competencies,
            competenceData
        );


        if (response.success) {
            return response.data;
        }

        throw new Error(response.errors?.message || 'Ошибка при создании предмета');

    } catch (error) {
        console.error('Ошибка в createCompetence:', {
            error: error.message,
            response: error.response?.data || error.message
        });

        let errorMessage = 'Не удалось создать предмет';

        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        throw new Error(errorMessage);
    }
};

export const createIndicator = async (indicatorData) => {
    try {
        const response = await apiClient.post(
            endpoints.expsys.subjects.create_indicator,
            indicatorData
        );


        if (response.success) {
            return response.data;
        }

        throw new Error(response.errors?.message || 'Ошибка при создании индикатора');

    } catch (error) {
        console.error('Ошибка в createIndicator:', {
            error: error.message,
            response: error.response?.data || error.message
        });

        let errorMessage = 'Не удалось создать индикатор';

        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        throw new Error(errorMessage);
    }
};

export const fetchSubjectsCountByIndicator = async (indicatorId) => {
  if (!indicatorId && indicatorId !== 0) { // учитываем 0 как валидный ID
    throw new Error('ID индикатора обязателен');
  }

  try {
    const response = await apiClient.get(endpoints.expsys.subjects.countsubjectsind, {

        indicator_id: indicatorId // убираем parseInt, если не нужен
      
    });

    if (!response.success) {
      throw new Error(response.errors?.message || 'Ошибка при получении количества предметов');
    }

    return {
      count: response.data?.subjects_count || 0,
      indicatorName: response.data?.indicator_name || '',
      indicatorId: response.data?.indicator_id || indicatorId
    };

  } catch (error) {
    console.error('Ошибка в fetchSubjectsCountByIndicator:', {
      error: error.message,
      response: error.response?.data || error.message
    });

    throw error; // пробрасываем ошибку дальше
  }
};

export const deleteSubject = async (subjectId) => {
  try {

     const deleteUrl = `${endpoints.expsys.subjects.delete_subject.replace('{id}', subjectId)}`;
    
    const response = await apiClient.delete(deleteUrl);
    if (!response.data) {
      throw new Error(response.errors?.message || 'Ошибка при удалении проекта');
    }

    return {
      success: true,
      message: response.data.message,
      deletedProjectId: subjectId
    };
  } catch (error) {
    console.error('Delete Subject Error:', error);
    
    // Улучшенная обработка ошибок
    let errorMessage = 'Не удалось удалить предмет';
    if (error.response) {
      if (error.response.status === 404) {
        errorMessage = 'Предмет не найден';
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

export const deleteCompetence = async (competenceId) => {
  try {

     const deleteUrl = `${endpoints.expsys.subjects.delete_competence.replace('{id}', competenceId)}`;
    
    const response = await apiClient.delete(deleteUrl);
    if (!response.data) {
      throw new Error(response.errors?.message || 'Ошибка при удалении компетенции');
    }

    return {
      success: true,
      message: response.data.message,
      deletedProjectId: competenceId
    };
  } catch (error) {
    console.error('Delete Subject Error:', error);
    
    // Улучшенная обработка ошибок
    let errorMessage = 'Не удалось удалить компетенцию';
    if (error.response) {
      if (error.response.status === 404) {
        errorMessage = 'Компетенция не найдена';
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

export const deleteIndicator = async (indicatorId) => {
  try {

     const deleteUrl = `${endpoints.expsys.subjects.delete_indicator.replace('{id}', indicatorId)}`;
    
    const response = await apiClient.delete(deleteUrl);
    if (!response.data) {
      throw new Error(response.errors?.message || 'Ошибка при удалении компетенции');
    }

    return {
      success: true,
      message: response.data.message,
      deletedProjectId: indicatorId
    };
  } catch (error) {
    console.error('Delete Indicator Error:', error);
    
    // Улучшенная обработка ошибок
    let errorMessage = 'Не удалось удалить индикатор';
    if (error.response) {
      if (error.response.status === 404) {
        errorMessage = 'Индикатор не найден';
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

export const updateSubject = async (subjectId, updateData) => {
  try {
    // Заменяем {id} в URL на реальный ID предмета
    const url = endpoints.expsys.subjects.update_subject.replace('{id}', subjectId)
    
    const response = await apiClient.post(url, updateData)

    if (!response.success) {
      throw new Error(response.errors?.message || 'Ошибка при обновлении предмета')
    }

    // Возвращаем обновленные данные предмета
    return {
      id: response.data.subject.id,
      name: response.data.subject.name,
      description: response.data.subject.description,
      creationDate: response.data.subject.creationdate,
      lastUpdate: response.data.subject.lastupdate,
      teacher: response.data.subject.teacher
    }
    
  } catch (error) {
    console.error('Ошибка в updateSubject:', error.message)
    throw error
  }
}

export const updateCompetence = async (competenceId, updateData) => {
  try {
    // Заменяем {id} в URL на реальный ID компетенции
    const url = endpoints.expsys.subjects.update_competence.replace('{id}', competenceId)
    
    const response = await apiClient.post(url, updateData)

    if (!response.success) {
      throw new Error(response.errors?.message || 'Ошибка при обновлении компетенции')
    }

    // Возвращаем обновленные данные компетенции
    return {
      id: response.data.competence.id,
      name: response.data.competence.name,
      description: response.data.competence.description,
      category: response.data.competence.category
    }
    
  } catch (error) {
    console.error('Ошибка в updateCompetence:', error.message)
    throw error
  }
}

export const updateIndicator = async (indicatorId, updateData) => {
  try {
    // Заменяем {id} в URL на реальный ID индикатора
    const url = endpoints.expsys.subjects.update_indicator.replace('{id}', indicatorId)
    
    const response = await apiClient.post(url, updateData)

    if (!response.success) {
      throw new Error(response.errors?.message || 'Ошибка при обновлении индикатора')
    }

    // Возвращаем обновленные данные индикатора
    return {
      id: response.data.indicator.id,
      name: response.data.indicator.name,
      description: response.data.indicator.description,
      category:response.data.indicator.category
    }
    
  } catch (error) {
    console.error('Ошибка в updateIndicator:', error.message)
    throw error
  }
}

export const fetchStudentsCountBySubject = async (subjectId) => {
  if (!subjectId && subjectId !== 0) { // учитываем 0 как валидный ID
    throw new Error('ID предмета обязателен');
  }

  try {
    const response = await apiClient.get(endpoints.expsys.subjects.countsstudents, {
        subject_id: subjectId
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Ошибка при получении количества студентов');
    }

    return {
      count: response.data.data?.student_count || 0,
      subjectName: response.data.data?.subject_name || '',
      subjectId: response.data.data?.subject_id || subjectId,
      teacherName: response.data.data?.teacher_name || ''
    };

  } catch (error) {
    console.error('Ошибка в fetchStudentsCountBySubject:', {
      error: error.message,
      response: error.response?.data || error.message
    });

    throw error; // пробрасываем ошибку дальше
  }
};

export const fetchLessonsCountBySubject = async (subjectId) => {
  if (!subjectId && subjectId !== 0) { // учитываем 0 как валидный ID
    throw new Error('ID предмета обязателен');
  }

  try {
    const response = await apiClient.get(endpoints.expsys.subjects.countslessons, {
      
        subject_id: subjectId
      
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Ошибка при получении количества уроков');
    }

    return {
      count: response.data.data?.lesson_count || 0,
      subjectName: response.data.data?.subject_name || '',
      subjectId: response.data.data?.subject_id || subjectId,
      teacherName: response.data.data?.teacher_name || ''
    };

  } catch (error) {
    console.error('Ошибка в fetchLessonsCountBySubject:', {
      error: error.message,
      response: error.response?.data || error.message
    });

    throw error; // пробрасываем ошибку дальше
  }
};

export const fetchTestsCountBySubject = async (subjectId) => {
  if (!subjectId && subjectId !== 0) { // учитываем 0 как валидный ID
    throw new Error('ID предмета обязателен');
  }

  try {
    const response = await apiClient.get(endpoints.expsys.subjects.countstests, {
        subject_id: subjectId
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Ошибка при получении количества тестов');
    }

    return {
      count: response.data.data?.test_count || 0,
      subjectName: response.data.data?.subject_name || '',
      subjectId: response.data.data?.subject_id || subjectId,
      teacherName: response.data.data?.teacher_name || ''
    };

  } catch (error) {
    console.error('Ошибка в fetchTestsCountBySubject:', {
      error: error.message,
      response: error.response?.data || error.message
    });

    throw error; // пробрасываем ошибку дальше
  }
};
