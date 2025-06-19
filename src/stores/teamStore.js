// store.js
import { createStore } from "vue";

const store = createStore({
  state: {
    team: [],
    membersPool: [
      {
        id: 1,
        name: "Иван Иванов",
        experience: "5 лет",
        skills: ["JavaScript", "Vue.js", "Node.js"],
        description: "Опытный фронтенд-разработчик.",
      },
      {
        id: 2,
        name: "Мария Петрова",
        experience: "3 года",
        skills: ["UI/UX Design", "Figma", "Adobe XD"],
        description: "Дизайнер интерфейсов.",
      },
      {
        id: 3,
        name: "Алексей Смирнов",
        experience: "4 года",
        skills: ["Python", "Django", "Data Analysis"],
        description: "Бэкенд-разработчик и аналитик.",
      },
      {
        id: 4,
        name: "Елена Кузнецова",
        experience: "2 года",
        skills: ["HTML", "CSS", "JavaScript"],
        description: "Веб-разработчик.",
      },
    ],
  },
  mutations: {
    SET_TEAM(state, team) {
      state.team = team;
    },
  },
  actions: {
    generateTeam({ commit, state }, {  specialization, teamSize }) {
      // Логика формирования команды (примерная)
      const filteredMembers = state.membersPool.filter((member) =>
        member.skills.some((skill) => skill.toLowerCase().includes(specialization))
      );

      const team = filteredMembers.slice(0, teamSize);
      commit("SET_TEAM", team);
      return team;
    },
  },
});

export default store;
