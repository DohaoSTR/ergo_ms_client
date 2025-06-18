<script setup>
import { 
    UsersIcon,
    ListIcon,
    SquarePenIcon,
 } from 'lucide-vue-next';
import router from '@/js/routers';
const goToPage=()=>{
    router.push({
        name:'Lesson'
    })
}
</script>


<template>

        <h3>Мои курсы</h3>
        <div class="course-grid">
            <!-- Курс 1 -->
            <div class="course-card">
                <div class="course-image" style="background-color: #2ecc71;"></div>
                <div class="course-content">
                    <h3 class="course-title">Основы Python</h3>
                    <p class="course-description">Базовый курс для начинающих по программированию на языке Python. Изучение основных конструкций, синтаксиса и стандартной библиотеки.</p>
                    <div class="course-meta">
                        <div class="course-stats">
                            <div class="course-stat">
                                <UsersIcon :size="18" />
                                <i class="fas fa-users"></i> 45
                            </div>
                            <div class="course-stat">
                                <ListIcon :size="20"/>
                                <i class="fas fa-list"></i> 12 уроков
                            </div>
                        </div>
                        <div class="course-level">Начальный</div>
                    </div>
                    <div class="course-actions">
                        <button class="btn btn-primary" @click="goToPage()">
                            Перейти к курсу
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Курс 2 -->
            <div class="course-card">
                <div class="course-image" style="background-color: #f1c40f;"></div>
                <div class="course-content">
                    <h3 class="course-title">Веб-разработка</h3>
                    <p class="course-description">Полный курс по HTML, CSS и JavaScript. Создание современных адаптивных веб-сайтов с использованием популярных фреймворков.</p>
                    <div class="course-meta">
                        <div class="course-stats">
                            <div class="course-stat">
                                <UsersIcon :size="18" />
                                <i class="fas fa-users"></i> 38
                            </div>
                            <div class="course-stat">
                                <ListIcon :size="20"/>
                                <i class="fas fa-list"></i> 20 уроков
                            </div>
                        </div>
                        <div class="course-level">Средний</div>
                    </div>
                    <div class="course-actions">
                        <a href="course-detail.html" class="btn btn-primary">Перейти к курсу</a>
                        
                    </div>
                </div>
            </div>
            
            <!-- Курс 3 -->
            <div class="course-card">
                <div class="course-image" style="background-color: #e74c3c;"></div>
                <div class="course-content">
                    <h3 class="course-title">Машинное обучение</h3>
                    <p class="course-description">Теория и практика машинного обучения. Работа с библиотеками scikit-learn, TensorFlow и Python для анализа данных.</p>
                    <div class="course-meta">
                        <div class="course-stats">
                            <div class="course-stat">
                                <UsersIcon :size="18" />
                                <i class="fas fa-users"></i> 27
                            </div>
                            <div class="course-stat">
                                <ListIcon :size="20"/>
                                <i class="fas fa-list"></i> 15 уроков
                            </div>
                        </div>
                        <div class="course-level">Продвинутый</div>
                    </div>
                    <div class="course-actions">
                        <a href="course-detail.html" class="btn btn-primary">Перейти к курсу</a>
                        
                    </div>
                </div>
            </div>
            
            <!-- Курс 4 -->
            <div class="course-card">
                <div class="course-image" style="background-color: #f1c40f;"></div>
                <div class="course-content">
                    <h3 class="course-title">Linux администрирование</h3>
                    <p class="course-description">Основы работы с Linux системами, настройка серверов, безопасность и автоматизация задач администрирования.</p>
                    <div class="course-meta">
                        <div class="course-stats">
                            <div class="course-stat">
                                <UsersIcon :size="18" />
                                <i class="fas fa-users"></i> 22
                            </div>
                            <div class="course-stat">
                                <ListIcon :size="20"/>
                                <i class="fas fa-list"></i> 18 уроков
                            </div>
                        </div>
                        <div class="course-level">Средний</div>
                    </div>
                    <div class="course-actions">
                        <a class="btn btn-primary">Перейти к курсу</a>
                        
                    </div>
                </div>
            </div>
        </div>

</template>
<style>
        /* Основные стили */
        * {
            
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        :root {
            --primary: #3498db;
            --primary-dark: #2980b9;
            --secondary: #2ecc71;
            --dark: #34495e;
            --light: #ecf0f1;
            --danger: #e74c3c;
            --warning: #f39c12;
            --gray: #95a5a6;
            --sidebar-width: 250px;
        }
        
        .icon{
            position: relative;
            margin-top: -3px;
        }
        
        
        /* Courses grid */
        .course-grid {
            display: grid;
            width: 100%;
            grid-template-columns: repeat(auto-fill, minmax(305px, 1fr));
            gap: 15px;
        }
        
        .course-card {
            
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        
        
        .course-image {
            height: 30px;
            background-color: #e1e5ea;
            background-size: cover;
            background-position: center;
        }
        
        .course-content {
            padding: 20px;
        }
        
        .course-title {
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 10px;
            color: var(--dark);
        }
        
        .course-description {
            font-size: 14px;
            height: calc(14px * 4 * 1.5);
            color: #666;
            margin-bottom: 15px;
            line-height: 1.5;
        }
        
        .course-meta {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            color: var(--gray);
            margin-bottom: 15px;
        }
        
        .course-stats {
            display: flex;
            gap: 15px;
        }
        
        .course-stat {
            display: flex;
            align-items: center;
        }
        
        .course-stat i {
            margin-right: 5px;
            font-size: 14px;
        }
        
        .course-actions {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
        }
        
        /* Pagination */
        .pagination {
            display: flex;
            justify-content: center;
            margin-top: 30px;
        }
        
        .pagination-item {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 5px;
            border-radius: 4px;
            border: 1px solid #ddd;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .pagination-item:hover {
            background-color: #f5f5f5;
        }
        
        .pagination-item.active {
            background-color: var(--primary);
            color: white;
            border-color: var(--primary);
        }
        
        /* Responsive */
        @media (max-width: 992px) {
            .sidebar {
                transform: translateX(-100%);
            }
            
            .main-content {
                margin-left: 0;
            }
            
            .sidebar.active {
                transform: translateX(0);
            }
        }
        
        @media (max-width: 768px) {
            .course-grid {
                grid-template-columns: 1fr;
            }
            
            .filter-section {
                flex-direction: column;
                gap: 15px;
            }
            
            .filter-options {
                width: 100%;
                overflow-x: auto;
                padding-bottom: 10px;
            }
        }
        
        /* Toggle sidebar button */
        .toggle-sidebar {
            display: none;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            padding: 0 15px;
        }
        
        @media (max-width: 992px) {
            .toggle-sidebar {
                display: block;
            }
        }
    </style>