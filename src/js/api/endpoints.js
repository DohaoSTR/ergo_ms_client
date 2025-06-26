export const endpoints = {
    auth: {
        login: 'cms/adp/authorization/',
        validateRegistration: 'cms/adp/validate_registration/',
        sendCode: 'cms/adp/send_code/',
        verifyCode: 'cms/adp/verify_code/',
        registration: 'cms/adp/registration/',
        protected: 'cms/adp/protected/',
    },
    crm: {
        monthlyStats: 'crm/stats/monthly/',
        priorityStats: 'crm/stats/priority/',
        sectionStats: 'crm/stats/sections/',
        projectCompletionStats: 'crm/stats/project-completion/',
        userProductivityStats: 'crm/stats/user-productivity/',
        deadlineAnalysis: 'crm/stats/deadline-analysis/',
        taskCreationTrend: 'crm/stats/task-creation-trend/',
        projectTimelineStats: 'crm/stats/project-timeline/',
        calendarActivityStats: 'crm/stats/calendar-activity/',
        taskComplexityStats: 'crm/stats/task-complexity/',
        tasks: {
            sectionTasks: 'crm/tasks/section-tasks/',
            add_task:'crm/tasks/task-new/',
            add_section:'crm/tasks/section-new/',
            delete_task:'crm/tasks/delete-task/{id}/',
            delete_section:'crm/tasks/delete-section/{id}/',
            update_section:'crm/tasks/update-section/{id}/',
            add_subtask:'crm/tasks/new-subtask/',
            toggle_task:'crm/tasks/toggle-task/{id}/',
            update_task:'crm/tasks/update-task/{id}/',
            assignee_task:'crm/tasks/assignee/{id}/',
            alendarTasks: 'crm/calendar/tasks/',
        },
        projects:
        {
            allprojects:'crm/projects/project-all/',
            personalprojects:'crm/projects/project-personal/',
            invitedprojects:'crm/projects/project-invited/',
            addproject:'crm/projects/project-new-add/',
            delete_project:'crm/projects/delete-project/{id}/',
            leave_project:'crm/projects/leave-project/{id}/{project_id}',
            counttasks:'crm/projects/tasks-count/',
            usersproject:'crm/projects/users-project/{id}/',
        },
        calendar:{
          createTask: 'crm/tasks/task/',
        }
    },
    expsys: {
        subjects: {
            allsubjects: '/expsys_module/subjects-all/',
            create:'/expsys_module/subject-create/',
            delete_subject:'/expsys_module/delete-subject/{id}/',
            create_competencies:'/expsys_module/competence-create/',
            create_indicator:'/expsys_module/indicator-create/',
            allcompenencies:'/expsys_module/subjectsindicators/',
            competencies:'/expsys_module/allcompetencies',
            countsubjectsind:'/expsys_module/indicator-subjects-count',
            indicators:'/expsys_module/allindicators',
            indicatorscompenencies:'/expsys_module/competenceindicators/',
            delete_competence:'/expsys_module/delete-competence/{id}/',
            delete_indicator:'/expsys_module/delete-indicator/{id}/',
            information:'/expsys_module/information-competence/',
            update_subject:'/expsys_module/update-subject/{id}/',
            update_competence:'/expsys_module/update-competence/{id}/',
            update_indicator:'/expsys_module/update-indicator/{id}/',
            countsstudents:'/expsys_module/countstudents-subject/',
            countslessons:'/expsys_module/countlessons-subject/',
            countstests:'/expsys_module/counttests-subject/',
        },
    },
    cms: {
        checkAccessToPage: 'cms/check_access_to_page/',
        checkAccessToComponent: 'cms/check_access_to_component/',
        checkAccessToAdminPanel: 'cms/check_access_to_admin_panel/',

        addGroupCategory: 'cms/post_group_category/',
        changeGroupCategory: 'cms/change_group_category/',
        deleteGroupCategory: 'cms/delete_group_category/',
        getGroupCategories: 'cms/get_group_categories/',

        addGroup: 'cms/add_group/',
        deleteGroup: 'cms/delete_group/',
        getGroups: 'cms/get_groups/',
        changeGroup: 'cms/change_group/',

        addPermission: 'cms/add_permission/',
        deletePermission: 'cms/delete_permission/',
        changePermission: 'cms/change_permission/',
        getPermissions: 'cms/get_permissions/',

        addUserPermission: 'cms/add_user_permission/',
        removeUserPermission: 'cms/remove_user_permission/',
        addUserGroup: 'cms/add_user_group/',
        removeUserGroup: 'cms/remove_user_group/',
        getUserGroupsAndPermissions: 'cms/get_user_groups_and_permissions/',
        getUserGroups: 'cms/get_user_groups/',
        getUserPermissions: 'cms/get_user_permissions/',

        addGroupsPermissions: 'cms/add_groups_permissions/',
        removeGroupsPermissions: 'cms/remove_groups_permissions/',
        getPermissionsByCategory: 'cms/get_permissions_by_category/',
        getUserName: 'cms/get_user_name/',
        getpages: 'cms/get-cms-pages',
        putpages: 'cms/put-cms-pages',
        getClosedPages: 'cms/get-closed-pages/',
        getClosedPagesForUser: 'cms/get-closed-pages-for-user/',

        addPageComponent: 'cms/add-page-component/',
        removePageComponent: 'cms/remove-page-component/',
        updatePageComponent: 'cms/update-page-component/',
        getPageComponents: 'cms/get-page-components/'
    },
    expert_system: {
        studyGroups: 'expert_system/study-groups/',
        students: 'expert_system/students/',
        studentsMe: 'expert_system/students/me/',
        companies: 'expert_system/companies/',
        companiesMe: 'expert_system/companies/me/',
        skills: 'expert_system/skills/',
        userSkills: 'expert_system/user-skills/',
        myVacancies: 'expert_system/companies/my-vacancies/',
        roles: 'expert_system/roles/',
        trajectorySteps: 'expert_system/trajectory-steps/',
        orientationTests: 'expert_system/orientation-tests/',
        orientationQuestions: 'expert_system/orientation-questions/',
        orientationAnswers: 'expert_system/orientation-answers/',
        orientationResults: 'expert_system/orientation-results/',
        orientationUserAnswers: 'expert_system/orientation-user-answers/',

        skillTests: 'expert_system/skill-tests/',
        skillQuestions: 'expert_system/skill-questions/',
        skillAnswers: 'expert_system/skill-answers/',
        testResults: 'expert_system/test-results/',

        vacancies: 'expert_system/vacancies/',
        vacancySkills: 'expert_system/vacancy-skills/',
        applications: 'expert_system/applications/',

        setUserSkillTest: 'expert_system/set-user-skill-test',
        getUserSkillTest: 'expert_system/get-user-skill-tests',
        getUserSkills: 'expert_system/get-user-skills',
        setUserSkills: 'expert_system/set-user-skills',

        getAllTests: 'expert_system/get-all-tests',
        createTest: 'expert_system/create-test',
        deleteTest: 'expert_system/delete-test',
        getTest: 'expert_system/get-test',
        updateTest: 'expert_system/patch-test',
        getSkillsForCreate: 'expert_system/get-skills-for-create-test',
        getSkillsForRedact: 'expert_system/get-skills-for-redact-test',
        getTestIdBySkill: 'expert_system/get-test-id-by-skill',
        getTestForRedact: 'expert_system/get-test-for-redact',
        evaluateTest: 'expert_system/evaluate-test',
        saveOrientationTestResult: 'expert_system/orientation-test-results/',
        saveBestRoleToStudent: 'expert_system/students/me/set-role/',
        setStudentRole: 'expert_system/students/me/set-role/',
        getTestResult: 'expert_system/get-test-result',
        courses: 'expert_system/courses/',
        getTestResultBySkillId: 'expert_system/get-test-result-by-skill-id',
        deleteTestResultBySkill: 'expert_system/delete-test-result-by-skill',
        analytics: {
          systemMetrics: 'expert_system/analytics/system-metrics/',
          skillsData: 'expert_system/analytics/skills-data/',
          topSkills: 'expert_system/analytics/top-skills/',
          studentsStats: 'expert_system/analytics/students-stats/',
          testingData: 'expert_system/analytics/testing-data/',
      }
    },
    bi: {
        DatasetsList: 'bi_analysis/bi_datasets/',
        ConnectionsList: 'bi_analysis/bi_connections/',
        CheckConnection: 'bi_analysis/bi_connections/check-connection/',
        ChartsList: 'bi_analysis/bi_charts/',
        Upload: 'bi_analysis/bi_datasets/upload/',
        UploadedFiles: 'bi_analysis/bi_datasets/user-files/',
    },
    file: 'settings/file/',
    audit: 'settings/audit-logs/',
    categories: {
        list: 'settings/categories/',
        create: 'settings/categories/',
        update: id => `settings/categories/${id}/`,
        delete: id => `settings/categories/${id}/`
    },
    tags: {
        list: 'settings/tags/',
        create: 'settings/tags/',
        update: id => `settings/tags/${id}/`,
        delete: id => `settings/tags/${id}/`
    },
    lms: {
        // Пользователи и профили
        profiles: 'lms/api/profiles/',
        myProfile: 'lms/profile/me/',
        userRoles: 'lms/user/roles/',
        switchRole: 'lms/user/roles/switch/',
        
        // Курсы
        categories: 'lms/api/categories/',
        deleteCategory: id => `lms/api/categories/${id}/`,
        courseFormats: 'lms/api/course-formats/',
        deleteCourseFormat: id => `lms/api/course-formats/${id}/`,
        subjects: 'lms/api/subjects/',
        enrollments: 'lms/api/enrollments/',
        
        // Темы курсов
        themes: 'lms/api/themes/',
        reorderLessons: id => `lms/themes/${id}/reorder-lessons/`,
        reorderThemes: 'lms/themes/reorder-themes/',
        
        // Уроки
        lessons: 'lms/api/lessons/',
        duplicateLesson: id => `lms/lessons/${id}/duplicate/`,
        toggleLessonVisibility: id => `lms/lessons/${id}/toggle-visibility/`,
        lessonsByCourse: 'lms/lessons/by-course/',
        
        // Ресурсы
        resources: 'lms/api/resources/',
        downloadResource: id => `lms/resources/${id}/download/`,
        toggleResourceVisibility: id => `lms/resources/${id}/toggle-visibility/`,
        resourcesByContext: 'lms/resources/by-context/',
        
        // Записи на курсы
        enroll: id => `lms/subjects/${id}/enroll/`,
        unenroll: id => `lms/subjects/${id}/unenroll/`,
        enrolledStudents: id => `lms/subjects/${id}/students/`,
        duplicateSubject: id => `lms/subjects/${id}/duplicate/`,
        toggleSubjectPublished: id => `lms/subjects/${id}/toggle-published/`,
        subjectStructure: id => `lms/subjects/${id}/structure/`,
        
        // Тестирование
        testBanks: 'lms/api/test-banks/',
        tests: 'lms/api/tests/',
        testAttempts: 'lms/api/test-attempts/',
        startTest: id => `lms/tests/${id}/start/`,
        
        // Задания
        assignments: 'lms/api/assignments/',
        submittedAssignments: 'lms/api/submitted-assignments/',
        
        // Форумы
        forums: 'lms/api/forums/',
        discussions: 'lms/api/discussions/',
        posts: 'lms/api/posts/',
        
        // Календарь
        calendar: 'lms/api/calendar/',
        upcomingEvents: 'lms/calendar/upcoming/',
        
        // Значки и достижения
        badges: 'lms/api/badges/',
        userBadges: 'lms/api/user-badges/',
        
        // Уведомления
        notifications: 'lms/api/notifications/',
        markAsRead: id => `lms/notifications/${id}/read/`,
        markAllAsRead: 'lms/notifications/read-all/',
        
        // Личные сообщения
        messages: 'lms/api/messages/',
        
        // Аналитика
        studentStats: 'lms/analytics/student/',
        teacherStats: 'lms/analytics/teacher/',
        dashboard: 'lms/analytics/dashboard/'
    },
    userAvatars: {
        list: 'settings/user-avatars/',
        create: 'settings/user-avatars/',
        delete: id => `settings/user-avatars/${id}/`
    },
    settings: {
        generalSettings: 'settings/general-settings/',
        lastSettings: 'settings/general-settings/last/',
        mediaSettings: 'settings/media-settings/',
        permalinkSettings: 'settings/permalink-settings/',
        emailSettings: 'settings/email-settings/',
        securitySettings: 'settings/security-settings/',
    },
    shortcodes: {
        latest: 'cms_shortcodes/pages/latest/',
        templates: 'cms_shortcodes/templates/',
        pages: 'cms_shortcodes/pages/',
        instances: 'cms_shortcodes/instances/',
        instancesTree: 'cms_shortcodes/instances/tree/',
        categories: 'cms_shortcodes/categories/',
        pageByPath: 'cms_shortcodes/pages/by_path/',
        layout: 'cms_shortcodes/layout/',
    },
    learning_analytics: {
        tables: 'learning_analytics/tables/',
        clearTables: 'learning_analytics/tables/clear/',

        excel: {
            upload: 'learning_analytics/data_formalization_submodule/upload-excel/',
            process: 'learning_analytics/data_formalization_submodule/process-excel/'
        },

        relations: {
            disciplineTechnology: 'learning_analytics/data_formalization_submodule/relations/discipline-technology/',
            disciplineCompetency: 'learning_analytics/data_formalization_submodule/relations/discipline-competency/',
            vacancyTechnology: 'learning_analytics/data_formalization_submodule/relations/vacancy-technology/',
            vacancyCompetency: 'learning_analytics/data_formalization_submodule/relations/vacancy-competency/',
            vcmTechnology: 'learning_analytics/data_formalization_submodule/relations/vcm-technology/',
            vcmCompetency: 'learning_analytics/data_formalization_submodule/relations/vcm-competency/',
        },

        employers: {
            get: 'learning_analytics/employers/',
            create: 'learning_analytics/employers/',
            update: (pk) => `learning_analytics/employers/${pk}/`,
            delete: (pk) => `learning_analytics/employers/${pk}/`,
            loadSampleData: 'learning_analytics/employers/loadsampledata/',
        },

        specialities: {
            get: 'learning_analytics/data_formalization_submodule/specialities/',
            create: 'learning_analytics/data_formalization_submodule/specialities/',
            update: (pk) => `learning_analytics/data_formalization_submodule/specialities/${pk}/`,
            delete: (pk) => `learning_analytics/data_formalization_submodule/specialities/${pk}/`,
            loadSampleData: 'learning_analytics/data_formalization_submodule/specialities/loadsampledata/',
        },
        curriculums: {
            get: 'learning_analytics/data_formalization_submodule/curriculums/',
            create: 'learning_analytics/data_formalization_submodule/curriculums/',
            update: (pk) => `learning_analytics/data_formalization_submodule/curriculums/${pk}/`,
            delete: (pk) => `learning_analytics/data_formalization_submodule/curriculums/${pk}/`,
            loadSampleData: 'learning_analytics/data_formalization_submodule/curriculums/loadsampledata/',
        },
        technologies: {
            get: 'learning_analytics/data_formalization_submodule/technologies/',
            create: 'learning_analytics/data_formalization_submodule/technologies/',
            update: (pk) => `learning_analytics/data_formalization_submodule/technologies/${pk}/`,
            delete: (pk) => `learning_analytics/data_formalization_submodule/technologies/${pk}/`,
            loadSampleData: 'learning_analytics/data_formalization_submodule/technologies/loadsampledata/',
        },
        competencies: {
            get: 'learning_analytics/data_formalization_submodule/competencies/',
            create: 'learning_analytics/data_formalization_submodule/competencies/',
            update: (pk) => `learning_analytics/data_formalization_submodule/competencies/${pk}/`,
            delete: (pk) => `learning_analytics/data_formalization_submodule/competencies/${pk}/`,
            loadSampleData: 'learning_analytics/data_formalization_submodule/competencies/loadsampledata/',
        },
        baseDisciplines: {
            get: 'learning_analytics/data_formalization_submodule/base_disciplines/',
            create: 'learning_analytics/data_formalization_submodule/base_disciplines/',
            update: (pk) => `learning_analytics/data_formalization_submodule/base_disciplines/${pk}/`,
            delete: (pk) => `learning_analytics/data_formalization_submodule/base_disciplines/${pk}/`,
            loadSampleData: 'learning_analytics/data_formalization_submodule/base_disciplines/loadsampledata/',
        },
        disciplines: {
            get: 'learning_analytics/data_formalization_submodule/disciplines/',
            create: 'learning_analytics/data_formalization_submodule/disciplines/',
            update: (pk) => `learning_analytics/data_formalization_submodule/disciplines/${pk}/`,
            delete: (pk) => `learning_analytics/data_formalization_submodule/disciplines/${pk}/`,
            loadSampleData: 'learning_analytics/data_formalization_submodule/disciplines/loadsampledata/',
        },
        vacancies: {
            get: 'learning_analytics/data_formalization_submodule/vacancies/',
            create: 'learning_analytics/data_formalization_submodule/vacancies/',
            update: (pk) => `learning_analytics/data_formalization_submodule/vacancies/${pk}/`,
            delete: (pk) => `learning_analytics/data_formalization_submodule/vacancies/${pk}/`,
            loadSampleData: 'learning_analytics/data_formalization_submodule/vacancies/loadsampledata/',
        },
        acms: {
            get: 'learning_analytics/data_formalization_submodule/acms/',
            create: 'learning_analytics/data_formalization_submodule/acms/',
            update: (pk) => `learning_analytics/data_formalization_submodule/acms/${pk}/`,
            delete: (pk) => `learning_analytics/data_formalization_submodule/acms/${pk}/`,
            loadSampleData: 'learning_analytics/data_formalization_submodule/acms/loadsampledata/',
        },
        vcms: {
            get: 'learning_analytics/data_formalization_submodule/vcms/',
            create: 'learning_analytics/data_formalization_submodule/vcms/',
            update: (pk) => `learning_analytics/data_formalization_submodule/vcms/${pk}/`,
            delete: (pk) => `learning_analytics/data_formalization_submodule/vcms/${pk}/`,
            loadSampleData: 'learning_analytics/data_formalization_submodule/vcms/loadsampledata/',
        },
        ucms: {
            get: 'learning_analytics/data_formalization_submodule/ucms/',
            create: 'learning_analytics/data_formalization_submodule/ucms/',
            update: (pk) => `learning_analytics/data_formalization_submodule/ucms/${pk}/`,
            delete: (pk) => `learning_analytics/data_formalization_submodule/ucms/${pk}/`,
            loadSampleData: 'learning_analytics/data_formalization_submodule/ucms/loadsampledata/',
        },
        importHistory: {
            get: 'learning_analytics/data_formalization_submodule/import_history/',
            create: 'learning_analytics/data_formalization_submodule/import_history/',
            update: (pk) => `learning_analytics/data_formalization_submodule/import_history/${pk}/`,
            delete: (pk) => `learning_analytics/data_formalization_submodule/import_history/${pk}/`,
        },
        importStats: {
            get: 'learning_analytics/data_formalization_submodule/import_stats/',
            update: (pk) => `learning_analytics/data_formalization_submodule/import_stats/${pk}/`,
        },
    },
};
