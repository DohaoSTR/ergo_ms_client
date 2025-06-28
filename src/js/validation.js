export const validateFieldValue = (value, name) => {
    let error = null;

    if (value && value.trim()) 
    {
        error = null;
    } 
    else if (value && !value.trim()) 
    {
        error = `${name} не может состоять только из пробелов.`;
    } 
    else 
    {
        error = `${name} обязателен для заполнения.`;
    }

    return error;
}

export const validateFieldsOnEquality = (firstField, secondField, error) => {
    let firstFieldError = null;
    let secondFieldError = null;

    if (firstField !== secondField)
    {
        firstFieldError = ' ';
        secondFieldError = error;
    }

    return {
        firstFieldError,
        secondFieldError
    };
}

// Функция для валидации только логина и пароля (без подтверждения)
export const validateLoginForm = (login, password) => {
    let loginError = validateFieldValue(login, 'Логин');
    let passwordError = validateFieldValue(password, 'Пароль');
    
    return {
        loginError,
        passwordError,
    }
}

export const validateAuthorizationForm = (login, password, passwordConfirm) => {
    let loginError = validateFieldValue(login, 'Логин');
    let passwordError = validateFieldValue(password, 'Пароль');
    let passwordConfirmError = validateFieldValue(passwordConfirm, 'Подтверждение пароля');
    
    if (passwordError === null && passwordConfirmError === null)
    {
      const { firstFieldError, secondFieldError } = validateFieldsOnEquality(
        password,
        passwordConfirm,
        'Пароли не совпадают.'
      );
  
      passwordError = firstFieldError;
      passwordConfirmError = secondFieldError;
    }
  
    return {
        loginError,
        passwordError,
        passwordConfirmError,
    }
}

export const validateAuthorizationMethod = (apiErrors) => {
    let loginError = null;
    let passwordError = null;
    let passwordConfirmError = null;

    const firstErrorObject = apiErrors;
    const entries = Object.entries(firstErrorObject);
    const [key, value] = entries[0];
    
    switch (key) {
        case 'password_confirm':
            passwordError = ' ';
            passwordConfirmError = value;
            break;
        case 'message':
            loginError = ' ';
            passwordError = ' ';
            passwordConfirmError = value;
            break;
        default:
            break;
    }

    return {
        loginError,
        passwordError,
        passwordConfirmError,
    }
}

export const validateCheckBoxValue = (value, error) => {
    if (!value) 
    {
        return error;
    }
    else
    {
        return null;
    }
}

export const Comparison = {
    LESS: 'LESS',
    MORE: 'MORE'
};

export const validateFieldValueOnLength = (value, length, comparison, error) => {
    if (value.length < length && comparison === comparison.LESS) {
        return error;
    }
    else if (value.length > length && comparison === comparison.MORE)
    {
        return error;
    }

    return null;
}

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateFieldWithRegex = (value, regex, error) => {
    if (regex.test(value) === false)
    {
        return error;
    }

    return null;
}

/**
 * Функция для валидации формы регистрации.
 * 
 * @param {string} name - Имя пользователя.
 * @param {string} login - Логин пользователя.
 * @param {string} email - Email пользователя.
 * @param {string} password - Пароль пользователя.
 * @param {string} passwordConfirm - Подтверждение пароля пользователя.
 * @param {string} terms - Пользовательское соглашение.
 * 
 * @returns {Object} - Объект с ошибками валидации для каждого поля.
 * 
 * @property {string|null} nameError - Ошибка для поля "Имя пользователя".
 * @property {string|null} loginError - Ошибка для поля "Логин".
 * @property {string|null} emailError - Ошибка для поля "Email".
 * @property {string|null} passwordError - Ошибка для поля "Пароль".
 * @property {string|null} passwordConfirmError - Ошибка для поля "Подтверждение пароля".
 * @property {string|null} terms - Ошибка для поля "Пользовательское соглашение".
 */
export const validateRegistrationForm = (name, login, email, password, passwordConfirm, terms) => {
    let errors = {
        name: null,
        login: null,
        email: null,
        password: null,
        passwordConfirm: null,
        terms: null
    };

    // Валидация полей на пустые значения (null или пустая строка)
    errors.name = validateFieldValue(name, 'Имя пользователя');
    errors.login = validateFieldValue(login, 'Логин');
    errors.email = validateFieldValue(email, 'Email');
    errors.password = validateFieldValue(password, 'Пароль');
    errors.passwordConfirm = validateFieldValue(passwordConfirm, 'Подтверждение пароля');

    // Валидация пользовательского соглашения
    errors.terms = validateCheckBoxValue(terms, 'Необходимо согласиться с пользовательским соглашением.')

    // Валидация email с использованием регулярного выражения
    if (errors.email === null) {
        errors.email = validateFieldWithRegex(email, emailRegex, 'Введите корректный email.');
    }

    const minPasswordLength = 8;

    // Валидация длины пароля
    if (errors.password === null) {
        errors.password = validateFieldValueOnLength(
            password, 
            minPasswordLength, 
            Comparison.LESS, 
            'Пароль должен быть не менее 8 символов.'
        );
    }

    // Валидация длины подтверждения пароля
    if (errors.passwordConfirm === null) {
        errors.passwordConfirm = validateFieldValueOnLength(
            passwordConfirm, 
            minPasswordLength, 
            Comparison.LESS, 
            'Пароль должен быть не менее 8 символов.'
        );
    }

    // Валидация совпадения паролей
    if (errors.password === null && errors.passwordConfirm === null) {
        const { firstFieldError, secondFieldError } = validateFieldsOnEquality(
            password,
            passwordConfirm,
            'Пароли не совпадают.'
        );

        errors.password = firstFieldError;
        errors.passwordConfirm = secondFieldError;
    }

    return errors;
}

export const validateRegistrationMethod = (apiErrors) => {
    let errors = {
        name: null,
        login: null,
        email: null,
        password: null,
        passwordConfirm: null,
        terms: null
    };

    const firstErrorObject = apiErrors;
    const entries = Object.entries(firstErrorObject);
    const [key, value] = entries[0];
    
    switch (key) {
        case 'message':
            errors.name = ' ';
            errors.login = ' ';
            errors.email = ' ';
            errors.password = ' ';
            errors.passwordConfirm = value;
            break;
        case 'username':
            errors.login = value;
            break;
        case 'email':
            errors.email = value;
            break;
        default:
            break;
    }

    return errors;
}