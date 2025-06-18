<template>
  <div class="course-layout">
    <div class="sidebar card">
      <div class="card-header green-header">Основы Python</div>
      <ul class="lesson-list">
        <li><button class="lesson-button" @click="loadContent('lesson1')">Урок 1: Знакомство с Python</button></li>
        <li><button class="lesson-button" @click="loadContent('test1')">Тестирование 1</button></li>
        <li><button class="lesson-button" @click="loadContent('lesson2')">Урок 2: Переменные и типы данных</button></li>
        <li><button class="lesson-button" @click="loadContent('test2')">Тестирование 2</button></li>
      </ul>
    </div>

    <div class="content card">
      <div class="card-header green-header">Теория / Тест</div>
      <div class="card-body scrollable">
        <h3>{{ current.title }}</h3>
        <div v-html="current.body"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CoursePage',
  data() {
    return {
      current: {
        title: 'Добро пожаловать!',
        body: '<p>Выберите урок или тестирование из списка слева, чтобы начать изучение.</p>',
      },
      content: {
        lesson1: {
          title: 'Урок 1: Знакомство с Python',
          body: `
            <p>Python — это высокоуровневый язык программирования, известный своей простотой и читаемостью. Он используется в веб-разработке, науке о данных, автоматизации, и многих других областях.</p>
            <p>В этом уроке вы узнаете:</p>
            <ul>
              <li>Что такое Python и где он используется</li>
              <li>Как установить Python</li>
              <li>Как запустить первую программу: <code>print("Hello, World!")</code></li>
            </ul>
            <pre><code>print("Hello, World!")
print("Python прост и мощен!")</code></pre>
          `
        },
        test1: {
          title: 'Тестирование 1: Основы Python',
          body: `
            <div class="question">
              <p>1. Что выведет следующий код?</p>
              <pre><code>print("Hello")</code></pre>
              <div class="options">
                <label><input type="radio" name="q1"> Hello</label>
                <label><input type="radio" name="q1"> hello</label>
                <label><input type="radio" name="q1"> Ошибка</label>
              </div>
            </div>

            <div class="question">
              <p>2. Python — это:</p>
              <div class="options">
                <label><input type="radio" name="q2"> Язык программирования</label>
                <label><input type="radio" name="q2"> Операционная система</label>
                <label><input type="radio" name="q2"> База данных</label>
              </div>
            </div>
          `
        },
        lesson2: {
          title: 'Урок 2: Переменные и типы данных',
          body: `
            <p>Переменные используются для хранения информации, которую можно использовать в программе. В Python не нужно указывать тип переменной при её создании.</p>
            <p>Примеры:</p>
            <pre><code>name = "Alice"
age = 25
is_student = True</code></pre>
            <p>Типы данных в Python:</p>
            <ul>
              <li><code>str</code> — строки</li>
              <li><code>int</code> — целые числа</li>
              <li><code>float</code> — числа с плавающей точкой</li>
              <li><code>bool</code> — логические значения</li>
            </ul>
          `
        },
        test2: {
          title: 'Тестирование 2: Переменные и типы данных',
          body: `
            <div class="question">
              <p>1. Какой тип данных у переменной <code>x = 5</code>?</p>
              <div class="options">
                <label><input type="radio" name="q3"> int</label>
                <label><input type="radio" name="q3"> str</label>
                <label><input type="radio" name="q3"> bool</label>
              </div>
            </div>

            <div class="question">
              <p>2. Как создать строковую переменную?</p>
              <div class="options">
                <label><input type="radio" name="q4"> name = "Bob"</label>
                <label><input type="radio" name="q4"> name = 25</label>
                <label><input type="radio" name="q4"> name = True</label>
              </div>
            </div>
          `
        }
      }
    }
  },
  methods: {
    loadContent(id) {
      this.current = this.content[id];
    }
  }
}
</script>

<style scoped>
    .course-layout {
        display: flex;
        height: 900px;
        box-sizing: border-box;
        background-color: #f3f4f6;
        gap: 10px;
        padding: 0;
        margin: 0;
    }

    .card {
        display: flex;
        flex-direction: column;
        border-radius: 12px;
        background-color: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        height: 100%;
        overflow: hidden;
    }

    .sidebar {
        max-width: 30%;
        min-width: 250px;
        padding: 0;
        margin: 0;
        flex: 0 0 30%;
        min-height: 0; /* для прокрутки flex */
        overflow: hidden; /* чтобы не уезжала */
    }

    .content {
        flex: 1;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
    }

    .card-header {
        padding: 15px 20px;
        font-weight: bold;
        color: white;
        font-size: 1.1rem;
        margin: 0;
        user-select: none;
    }

    /* Зеленая шапка у обеих частей */
        .green-header {
        background-color: #4caf50;
        border-top-left-radius: 12px;
        border-top-right-radius: 12px;
        width: 100%;
    }

    /* Лист уроков - прокручиваемый */
    .lesson-list {
        list-style: none;
        padding: 0;
        margin: 0;
        overflow-y: auto;
        flex-grow: 1;
    }

    /* Кнопки уроков */
    .lesson-button {
        display: block;
        width: 100%;
        padding: 15px 20px;
        background-color: #f9f9f9;
        border: none;
        border-top: 1px solid #ddd;
        font-weight: 500;
        text-align: left;
        transition: background-color 0.2s ease;
        cursor: pointer;
        border-radius: 0;
    }

    .lesson-button:hover {
        background-color: #ececec;
    }

    /* Контент справа с прокруткой */
    .card-body {
        overflow-y: auto;
        flex: 1;
        padding: 20px;
    }

    .scrollable {
        overflow-y: auto;
    }

    h3 {
        margin-top: 0;
    }

    pre {
        background-color: #eee;
        padding: 10px;
        border-radius: 6px;
        white-space: pre-wrap;
    }

    .question {
        margin-bottom: 20px;
    }

    .options label {
        display: block;
        margin-left: 10px;
    }
</style>
