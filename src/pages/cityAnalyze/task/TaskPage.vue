<script setup>
import Cookies from 'js-cookie';
import { ref, onMounted } from 'vue'

const loading = ref(true);
const error = ref(null);
const taskData = ref({});
const images = ref({});
const imageErrors = ref({});
const expandedImages = ref({});
const failedToLoadImages = ref(false);

const props = defineProps({
    id: {
        type: String,
        required: true
    }
});

const fetchTaskStatus = async () => {
    try {
        const token = Cookies.get('token');

        const response = await fetch(
            `http://localhost:8000/api/cities_expansion/geoanalyzer/task_status?task_id=${props.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Task not found');
            } else if (response.status === 500) {
                throw new Error('Server error');
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }

        taskData.value = await response.json();

        // If task is finished, fetch images
        if (taskData.value.status === 'FINISHED' && taskData.value.result) {
            await fetchResultImages();
        }

        if (failedToLoadImages.value) {
            console.log('Failed to load images. Need to delete task.')
        }
    } catch (err) {
        console.error('Error fetching task status:', err);
        error.value = err.message;
    } finally {
        loading.value = false;
    }
};

const fetchResultImages = async () => {
    // Fetch masks if they exist
    if (taskData.value.result.masks_ids) {
        for (const id of taskData.value.result.masks_ids) {
            await fetchImage(id, 'mask');
        }
    }

    // Fetch KDE plots if they exist
    if (taskData.value.result.kde_plots_ids) {
        for (const id of taskData.value.result.kde_plots_ids) {
            await fetchImage(id, 'kde');
        }
    }

    if (!taskData.value.result.kde_plots_ids && !taskData.value.result.masks_ids) {
        console.log('Has no results, needs deletion');
    }
};

const fetchImage = async (id, type) => {
    const key = `${type}-${id}`;

    try {
        const token = Cookies.get('token');


        const response = await fetch(
            `http://localhost:8000/api/cities_expansion/get_file/?id=${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            let errorMsg = 'Failed to load image';
            if (response.status === 403) errorMsg = 'Нет доступа к файлу';
            if (response.status === 404) errorMsg = 'Файл не найден';
            if (response.status === 500) errorMsg = 'Ошибка сервера';

            failedToLoadImages.value = true;

            imageErrors.value[key] = errorMsg;
            return;
        }

        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        images.value[key] = imageUrl;
    } catch (err) {
        console.error(`Error fetching image ${id}:`, err);
        imageErrors.value[key] = err.message;
    }
};

const toggleImage = (key) => {
    expandedImages.value[key] = !expandedImages.value[key];

    // If image is being shown for the first time and hasn't been loaded yet
    if (expandedImages.value[key] && !images.value[key] && !imageErrors.value[key]) {
        const parts = key.split('-');
        const type = parts[0];
        const id = parts[1];
        fetchImage(id, type);
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
};

onMounted(() => {
    fetchTaskStatus();
})

</script>
<template>
    <div class="task-details-container">
        <h1>Task Details</h1>
        <div v-if="loading" class="loading">Загружаем информацию о задаче..</div>

        <div v-else-if="error" class="error-message">
            <p>Error: {{ error }}</p>
        </div>

        <div v-else>
            <div class="task-info">
                <p v-if="taskData.status_description"><strong>Статус:</strong> {{
                    taskData.status_description }}</p>
                <p><strong>Создана:</strong> {{ formatDate(taskData.date) }}</p>
            </div>

            <div v-if="taskData.status === 'FINISHED' && taskData.result" class="results-container">

                <div v-if="taskData.result.infra_score" class="score-container">
                    <h2 v-if="taskData.result.infra_score">
                        <span class="label">Рейтинг инфраструктуры:</span>
                        <span class="score">{{ (taskData.result.infra_score * 100).toFixed(1) }}</span> / 100
                    </h2>
                    <h2 v-if="taskData.result.green_score">
                        <span class="label">Рейтинг зелёных зон:</span>
                        <span class="score">{{ (taskData.result.green_score * 100).toFixed(1) }}</span> / 100
                    </h2>
                    <h2 v-if="taskData.result.living_score">
                        <span class="label">Рейтинг жилищного пространства:</span>
                        <span class="score">{{ (taskData.result.living_score * 100).toFixed(1) }}</span> / 100
                    </h2>
                </div>

                <!-- Masks section -->
                <div v-if="taskData.result.masks_ids && taskData.result.masks_ids.length" class="images-section">
                    <h2>Маски</h2>
                    <div class="images-grid">
                        <div v-for="id in taskData.result.masks_ids" :key="'mask-' + id" class="image-container">
                            <div class="image-toggle" @click="toggleImage('mask-' + id)">
                                {{ expandedImages['mask-' + id] ? 'Спрятать' : 'Показать' }} маску {{ id }}
                            </div>
                            <img v-if="expandedImages['mask-' + id] && images['mask-' + id]" :src="images['mask-' + id]"
                                :alt="'Маска ' + id" class="result-image" />
                            <div v-else-if="expandedImages['mask-' + id] && imageErrors['mask-' + id]"
                                class="image-error">
                                Error loading image: {{ imageErrors['mask-' + id] }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- KDE Plots section -->
                <div v-if="taskData.result.kde_plots_ids && taskData.result.kde_plots_ids.length"
                    class="images-section">
                    <h2>Графики</h2>
                    <div class="images-grid">
                        <div v-for="id in taskData.result.kde_plots_ids" :key="'kde-' + id" class="image-container">
                            <div class="image-toggle" @click="toggleImage('kde-' + id)">
                                {{ expandedImages['kde-' + id] ? 'Спрятать' : 'Показать' }} график {{ id }}
                            </div>
                            <img v-if="expandedImages['kde-' + id] && images['kde-' + id]" :src="images['kde-' + id]"
                                :alt="'График ' + id" class="result-image" />
                            <div v-else-if="expandedImages['kde-' + id] && imageErrors['kde-' + id]"
                                class="image-error">
                                Error loading image: {{ imageErrors['kde-' + id] }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else class="no-results">
                <p>Задача не завершена или нет результатов</p>
            </div>
        </div>
    </div>
</template>

<script>
import { ref } from 'vue';

export default {
    props: {
        id: {
            type: String,
            required: true
        }
    },
};
</script>

<style scoped>

.score-container {
    margin: 50px 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.score-container h2 {
    display: flex;
    gap: 10px;
}
.label {
    flex: 1;
}
.score {
    width: 70px;
    text-align: left;
    text-decoration: underline;
}

.task-details-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.loading,
.error-message {
    padding: 20px;
    text-align: center;
    font-size: 1.2em;
}

.error-message {
    color: #d32f2f;
}

.task-info {
    background-color: #303030;
    padding: 15px;
    border-radius: 5px;
    margin-bottom: 20px;
}

.results-container {
    margin-top: 30px;
}

.images-section {
    margin-bottom: 40px;
}

.images-grid {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-top: 15px;
}

.image-container {
    border: 1px solid #ddd;
    border-radius: 5px;
    overflow: hidden;
}

.image-toggle {
    padding: 10px;
    background-color: #525151;
    cursor: pointer;
    text-align: center;
    font-weight: bold;
}

.image-toggle:hover {
    background-color: #636363;
}

.result-image {
    width: 100%;
    height: auto;
    display: block;
}

.image-error {
    padding: 15px;
    color: #d32f2f;
    text-align: center;
}

.no-results {
    padding: 20px;
    text-align: center;
    font-style: italic;
    color: #c7c7c7;
}
</style>