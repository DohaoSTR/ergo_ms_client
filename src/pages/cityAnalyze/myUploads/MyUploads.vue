<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Cookies from 'js-cookie';

const groups = ref([]);
const loading = ref(true);
const error = ref(null);
const fileUrls = ref({}); // Храним URL'ы файлов
let group_info = {}

const fetchGroups = async () => {
  try {
    group_info = {}
    const token = Cookies.get('token');
    const response = await fetch('http://localhost:8000/api/cities_expansion/get_my_groups/', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Не авторизован. Пожалуйста, войдите в систему.');
      }
      throw new Error('Ошибка при загрузке групп');
    }

    groups.value = await response.json();
    for (const group of groups.value) {
      group_info[group.id] = ref(null);
    }
    // Предзагружаем изображения для каждой группы
    await preloadImages();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const preloadImages = async () => {
  const token = Cookies.get('token');

  for (const group of groups.value) {
    if (group.files && group.files.length) {
      for (const file of group.files) {
        if (file.name.match(/\.(jpeg|jpg|gif|png)$/)) {
          try {
            const response = await fetch(`http://localhost:8000/api/cities_expansion/get_file/?id=${file.id}`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });

            if (response.ok) {
              const blob = await response.blob();
              fileUrls.value[file.id] = URL.createObjectURL(blob);
            }
          } catch (err) {
            console.error(`Ошибка загрузки файла ${file.id}:`, err);
          }
        }
      }
    }
  }
};

const deleteGroup = async (id) => {
  try {
    const token = Cookies.get('token');

    if (!id) {
      throw new Error('Необходим ID группы.');
    }

    const response = await fetch(`http://localhost:8000/api/cities_expansion/delete_group/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.log('Произошла ошибка при удалении группы');
      return;
    }

    fetchGroups();
  } catch (err) {
    console.log(err);
  }
}

const startAnalysis = async (groupId) => {
  try {
    const token = Cookies.get('token');
    // Блокируем кнопку
    let group = groups.value.find(g => g.id === groupId);
    if (group) {
      group.isAnalysisLoading = true;
    }

    const kValue = group?.kValue || 2;

    const response = await fetch(
      `http://localhost:8000/api/cities_expansion/geoanalyzer/perform_analysis?group_id=${groupId}&k=${kValue}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Неизвестная ошибка');
    }

    // Скрываем кнопку после успешного запуска
    group = groups.value.find(g => g.id === groupId);
    if (group) {
      group.analysisStarted = true;
    }

  } catch (error) {
    let group = groups.value.find(g => g.id === groupId);
    if (group) {
      group.isAnalysisLoading = false;
    }
  }
}

onMounted(() => {
  fetchGroups();
});

// Очищаем объектные URL при уничтожении компонента
onUnmounted(() => {
  Object.values(fileUrls.value).forEach(url => URL.revokeObjectURL(url));
});
</script>

<template>
  <div class="my-uploads">
    <h1>Мои загрузки</h1>

    <div v-if="loading" class="loading">Загрузка...</div>

    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="!loading && !error">
      <div v-for="group in groups" :key="group.id" class="group">
        <h2>{{ group.name }}</h2>
        <div class="group-details">
          <p v-if="group.details.coords">{{ group.details.coords }}</p>
        </div>
        <div v-if="group.files && group.files.length" class="files-list">
          <div v-for="file in group.files" :key="file.id" class="file-item">
            <img v-if="file.name.match(/\.(jpeg|jpg|gif|png)$/) && fileUrls[file.id]" :src="fileUrls[file.id]"
              :alt="file.name" class="uploaded-image" />
            <div v-else-if="file.name.match(/\.(jpeg|jpg|gif|png)$/)" class="image-loading">
              Загрузка изображения...
            </div>
            <div v-else class="file-name">{{ file.name }}</div>
          </div>
        </div>

        <div v-else class="no-files">В этой группе нет файлов</div>
        <div class='group-buttons'>
          <button class="delete" @click="deleteGroup(group.id)">Удалить группу файлов</button>
          <input v-if="!group.isAnalysisLoading" type="number" name="k" id="k" placeholder="Количество кластеров для анализа" min="2" max="100" v-model="group.kValue">
          <button v-if="group.details.coords && !group.analysisStarted" class="analysis"
            @click="startAnalysis(group.id)" :disabled="group.isAnalysisLoading">
            <span v-if="!group.isAnalysisLoading">Провести анализ</span>
            <span v-else>Запуск...</span>
          </button>
        </div>
        <div v-if="group_info[group.id]" class="group_info">{{ group_info[group.id] }}</div>
      </div>

      <div v-if="groups.length === 0" class="no-groups">У вас нет ни одной группы с файлами</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.my-uploads {
  padding: 20px;


  .group-buttons {
    margin: 20px 0 0 0;

    input {
      width: 100%;
      height: 40px;
      padding: 10px 20px;
      border-radius: 10px;
      font-weight: 900;
      font-size: large;
    }

    button {
      margin: 15px 0;
      width: 100%;
      height: 30px;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .delete {
      background: #e74c3c;
      color: white;


      &:hover {
        background: #c0392b;
      }
    }

    .analysis {
      background: #3498db;
      color: white;

      &:hover {
        background: #2980b9;
      }
    }
  }

  h1 {
    margin-bottom: 20px;
  }

  .loading,
  .error {
    padding: 20px;
    text-align: center;
  }

  .error {
    color: red;
  }

  .group {
    margin-bottom: 30px;
    padding: 15px;
    border: 1px solid #eee;
    border-radius: 5px;

    .group-details {
      margin: 10px 0;
    }

    h2 {
      margin-bottom: 15px;
      color: #AAA;
    }

    .files-list {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;

      .file-item {
        .uploaded-image {
          max-width: 200px;
          max-height: 200px;
          border: 1px solid #ddd;
          border-radius: 4px;
          transition: transform 0.2s;

          &:hover {
            transform: scale(1.05);
          }
        }

        .image-loading {
          width: 200px;
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
          color: #666;
          font-size: 0.9em;
        }

        .file-name {
          padding: 10px;
          background: #f5f5f5;
          border-radius: 4px;
        }
      }
    }

    .no-files {
      color: #999;
      font-style: italic;
    }
  }

  .no-groups {
    color: #999;
    text-align: center;
    padding: 40px 0;
  }
}
</style>