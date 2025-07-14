<script setup>
import Cookies from 'js-cookie';
</script>

<template>
    <div class="image-upload-form">
        <h2>Загрузка карт</h2>
        <form @submit.prevent="submitForm">
            <div class="form-group">
                <label for="name">Название группы</label>
                <input type="text" name="name" id="name" v-model="groupName" @change="validateName">
                <p v-if="nameError" class="error-message">{{ nameError }}</p>
            </div>

            <div class="form-group">
                <label for="coords-string">Координаты в формате чч°мм'сс"N, чч°мм'сс"E → чч°мм'сс"N, чч°мм'сс"E</label>
                <input type="text" name="coords-string" id="coords-string" v-model="coordsString">
                <p v-if="coordsError" class="error-message">{{ coordsError }}</p>
            </div>

            <!-- Карта города -->
            <div class="form-group">
                <label for="city-map">Карта города (PNG, обязательное)</label>
                <input type="file" id="city-map" ref="cityMap" accept="image/png"
                    @change="handleFileChange('cityMap', $event)" required />
                <div v-if="previews.cityMap" class="image-preview">
                    <img :src="previews.cityMap" alt="Предпросмотр карты города" />
                    <button @click="removeImage('cityMap')" type="button">×</button>
                </div>
            </div>

            <!-- Карта зданий -->
            <div class="form-group">
                <label for="buildings-map">Карта зданий (PNG, обязательное)</label>
                <input type="file" id="buildings-map" ref="buildingsMap" accept="image/png"
                    @change="handleFileChange('buildingsMap', $event)" required />
                <div v-if="previews.buildingsMap" class="image-preview">
                    <img :src="previews.buildingsMap" alt="Предпросмотр карты зданий" />
                    <button @click="removeImage('buildingsMap')" type="button">×</button>
                </div>
            </div>

            <!-- Карта железных дорог (опционально) -->
            <div class="form-group">
                <label for="railways-map">Карта железных дорог (PNG, опционально)</label>
                <input type="file" id="railways-map" ref="railwaysMap" accept="image/png"
                    @change="handleFileChange('railwaysMap', $event)" />
                <div v-if="previews.railwaysMap" class="image-preview">
                    <img :src="previews.railwaysMap" alt="Предпросмотр карты железных дорог" />
                    <button @click="removeImage('railwaysMap')" type="button">×</button>
                </div>
            </div>

            <button type="submit" class="submit-btn" :disabled="isSubmitting">
                {{ isSubmitting ? 'Отправка...' : 'Отправить' }}
            </button>
            <div v-if="error" class="error-message">{{ error }}</div>
            <div v-if="success" class="success-message">{{ success }}</div>
        </form>
        <div class="help">
        <p>
            Карты можно загрузить с сайта <a href="https://print.get-map.org/">MyOSMatic</a>. Для создания карт 
            необходимо перейти во вкладку "<a href="https://print.get-map.org/new/">Создать карту</a>" сверху. Далее
            можно выбрать прямоугольник интересующего вас города. Первоначально лучше создать городскую карту.<br>
        </p>
        <ol>
            <li>
                После выбора прямоугольника необходимо кликнуть вперёд. 
                Макет необходимо выбрать "Full-page layout without index.". 
                Indexer можно оставить без изменений.
            </li>
            <li>
                Таблицу стилей для городской карты необходимо выбрать "OpenOrientationMap StreetO style" в группе "Orientation".
            </li>
            <li>
                Для городской карты слои оставляем пустые.
            </li>
            <li>
                Размер бумаги можно выбрать на своё усмотрение. Но советую оставлять изначальную пропорцию.
                Например если изначально размер был 400x420mm и вы захотели увеличить его в 1.5 раза,
                то лучше поставить 600x630, иначе будет анализироваться искажённая и не точная карта города.
            </li>
            <li>
                Можно не выставлять размер больше 1000mm, сервер всё равно уменьшит изображение в случае если оно окажется
                больше 7000px по ширине или высоте, по причинам производительности.
            </li>
            <li>
                Далее во вкладке "Отправить" необходимо ввести название карты и (опционально) адрес эл. почты.
                Выбираемый язык не имеет значения, так как на самой карте не будет никаких надписей.
                Для подтверждения генерации карты необходимо кликнуть на "Создать".
            </li>
            <li>
                Вас перенаправит на новую страницу где будет показываться прогресс генерации карты.
                После его завершения, вы можете скачать карту в формате PNG, именно этот файл необходимо
                загружать сюда.
            </li>
            <li>
                Также снизу в секции "Нагрузка карты" будет надпись с прямоугольной областью.
                Эту строку с координатами можно сразу скопировать.
            </li>
        </ol>

        <p>
            Далее описан процесс создания карты зданий и железнодорожной карты.
        </p>

        <ol>
            <li>
                После того, как закончилась отрисовка городской карты, необходимо кликнуть на кнопку "Reedit".
                Вас перенаправит на страницу создания новой карты с параметрами прямоугольника предыдущей.
            </li>
            <li>
                Макет оставляем тот же. Для карты зданий и железнодорожной карты необходимо выставить стиль
                "Empty basemap for overlay testing".
            </li>
            <li>
                Для карты зданий выбираем слой "Schwarzkarte Overlay - showing building polygons only" и генерируем карту.
                Для карты железных дорог необходимо выбрать слой "OpenRailwayMap rail signal overlay".
            </li>
            <li>
                Важно сгенерировать карту зданий и железных дорог отдельно. Один PNG файл для карты зданий, другой PNG файл
                для железных дорог. Если в городе железных дорог нет, их карту можно не загружать.
            </li>
        </ol>
    </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            files: {
                cityMap: null,
                buildingsMap: null,
                railwaysMap: null
            },
            previews: {
                cityMap: null,
                buildingsMap: null,
                railwaysMap: null
            },
            isSubmitting: false,
            error: null,
            success: null,
            groupName: '',
            nameError: '',
            coordsString: '',
            coordsError: ''
        }
    },
    methods: {
        validateName() {
            if (this.groupName.length < 4) {
                this.nameError = 'Имя должно быть больше 4 символов';
                return false;
            }

            if (!/^[a-zA-Zа-яА-Я0-9 ]+$/.test(this.groupName)) {
                this.nameError = 'Название группы может содержать только символы кириллицы/латиницы, цифры и пробелы';
                return false;
            }

            this.nameError = '';
            return true;
        },
        handleFileChange(field, event) {
            const file = event.target.files[0]
            if (!file) return

            // Проверка типа файла
            if (!file.type.match('image/png')) {
                this.error = 'Файл должен быть в формате PNG'
                event.target.value = ''
                return
            }

            this.files[field] = file

            // Создание превью
            const reader = new FileReader()
            reader.onload = (e) => {
                this.previews[field] = e.target.result
            }
            reader.readAsDataURL(file)
            this.error = null
        },
        removeImage(field) {
            this.files[field] = null
            this.previews[field] = null
            this.$refs[field].value = ''
        },
        async submitForm() {
            // Проверка обязательных полей
            if (!this.files.cityMap || !this.files.buildingsMap || !this.validateName()) {
                this.error = 'Пожалуйста, загрузите обязательные карты или введите корректное название группы'
                return
            }

            this.isSubmitting = true
            this.error = null
            this.success = null

            try {
                const formData = new FormData()

                formData.append('name', this.groupName)
                formData.append('coords-string', this.coordsString)

                // Добавляем файлы в FormData
                formData.append('city_map', this.files.cityMap)
                formData.append('buildings_map', this.files.buildingsMap)
                if (this.files.railwaysMap) {
                    formData.append('railways_map', this.files.railwaysMap)
                }

                const token = Cookies.get('token');

                // Отправка на сервер
                const response = await fetch('http://localhost:8000/api/cities_expansion/geoanalyzer/upload_maps', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    console.log(errorData)
                    throw new Error('Ошибка при отправке файлов: ' + errorData.error)
                }

                const data = await response.json()
                if (data['success'])
                    this.success = 'Карты успешно загружены!'
            } catch (err) {
                this.error = err.message || 'Произошла ошибка при отправке формы'
            } finally {
                this.isSubmitting = false
            }
        }
    }
}
</script>

<style scoped lang="scss">
.image-upload-form {
    max-width: 800px;
    margin: 2rem auto;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

    h2 {
        text-align: center;
        margin-bottom: 1.5rem;
        font-size: 2rem;
        font-weight: 600;
    }

    .form-group {
        margin-bottom: 1.5rem;

        label {
            display: block;
            margin-bottom: 0.5rem;
            color: #AAA;
            font-weight: 500;
            font-size: 1rem;
        }

        input[type="text"] {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 1rem;
            transition: border-color 0.3s;

            &:focus {
                border-color: #3498db;
                outline: none;
                box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
            }
        }

        input[type="file"] {
            width: 100%;
            padding: 0.5rem;
            border: 1px dashed #bdc3c7;
            border-radius: 6px;
            background: #f8f9fa;
            transition: all 0.3s;

            &:hover {
                border-color: #3498db;
                background: #eaf4fd;
            }

            &::file-selector-button {
                padding: 0.5rem 1rem;
                background: #3498db;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.2s;

                &:hover {
                    background: #2980b9;
                }
            }
        }
    }

    .image-preview {
        margin-top: 1rem;
        position: relative;
        display: inline-block;

        img {
            max-width: 100%;
            max-height: 300px;
            border-radius: 6px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            border: 1px solid #eee;
        }

        button {
            position: absolute;
            top: -10px;
            right: -10px;
            width: 28px;
            height: 28px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 50%;
            font-size: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;

            &:hover {
                background: #c0392b;
                transform: scale(1.1);
            }
        }
    }

    .submit-btn {
        width: 100%;
        padding: 0.75rem;
        background: linear-gradient(135deg, #3498db, #2c3e50);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s;
        margin-top: 1rem;

        &:hover:not(:disabled) {
            background: linear-gradient(135deg, #2980b9, #1a252f);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(41, 128, 185, 0.3);
        }

        &:disabled {
            background: #95a5a6;
            cursor: not-allowed;
            opacity: 0.7;
        }
    }

    .error-message {
        color: #e74c3c;
        margin-top: 1rem;
        padding: 0.75rem;
        background: #fdecea;
        border-radius: 6px;
        border-left: 4px solid #e74c3c;
    }

    .success-message {
        color: #27ae60;
        margin-top: 1rem;
        padding: 0.75rem;
        background: #e8f8f0;
        border-radius: 6px;
        border-left: 4px solid #27ae60;
    }
}

.help {
    
    background-color: #e7e7e7;
    border-radius: 20px;

    margin-top: 50px;
    padding: 30px;

    * {
        text-align: justify;
        font-size: large;
        color: #1a252f;
    }
}
</style>