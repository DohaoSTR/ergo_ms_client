import { apiClient } from '../../../js/api/manager'

/**
 * API для работы с вопросами
 */
export const questionsApi = {
  /**
   * Получить вопросы по тесту
   */
  async getQuestionsByTest(testId) {
    try {
      const response = await apiClient.get(`lms/questions/?test=${testId}`)
      return response.data.results || response.data
    } catch (error) {
      console.error('Ошибка получения вопросов:', error)
      throw error
    }
  },

  /**
   * Создать вопрос
   */
  async createQuestion(questionData) {
    try {
      const response = await apiClient.post('lms/questions/', questionData)
      return response.data
    } catch (error) {
      console.error('Ошибка создания вопроса:', error)
      throw error
    }
  },

  /**
   * Обновить вопрос
   */
  async updateQuestion(questionId, questionData) {
    try {
      const response = await apiClient.put(`lms/questions/${questionId}/`, questionData)
      return response.data
    } catch (error) {
      console.error('Ошибка обновления вопроса:', error)
      throw error
    }
  },

  /**
   * Удалить вопрос
   */
  async deleteQuestion(questionId) {
    try {
      await apiClient.delete(`lms/questions/${questionId}/`)
    } catch (error) {
      console.error('Ошибка удаления вопроса:', error)
      throw error
    }
  },

  /**
   * Получить вопрос по ID
   */
  async getQuestion(questionId) {
    try {
      const response = await apiClient.get(`lms/questions/${questionId}/`)
      return response.data
    } catch (error) {
      console.error('Ошибка получения вопроса:', error)
      throw error
    }
  }
}

/**
 * API для работы с ответами
 */
export const answersApi = {
  /**
   * Получить ответы по вопросу
   */
  async getAnswersByQuestion(questionId) {
    try {
      const response = await apiClient.get(`lms/answers/?question=${questionId}`)
      return response.data.results || response.data
    } catch (error) {
      console.error('Ошибка получения ответов:', error)
      throw error
    }
  },

  /**
   * Создать ответ
   */
  async createAnswer(answerData) {
    try {
      const response = await apiClient.post('lms/answers/', answerData)
      return response.data
    } catch (error) {
      console.error('Ошибка создания ответа:', error)
      throw error
    }
  },

  /**
   * Обновить ответ
   */
  async updateAnswer(answerId, answerData) {
    try {
      const response = await apiClient.put(`lms/answers/${answerId}/`, answerData)
      return response.data
    } catch (error) {
      console.error('Ошибка обновления ответа:', error)
      throw error
    }
  },

  /**
   * Удалить ответ
   */
  async deleteAnswer(answerId) {
    try {
      await apiClient.delete(`lms/answers/${answerId}/`)
    } catch (error) {
      console.error('Ошибка удаления ответа:', error)
      throw error
    }
  }
} 