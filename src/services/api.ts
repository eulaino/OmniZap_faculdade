import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://7970-146-164-9-234.ngrok-free.app',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    if (error.response) {
      console.log('Erro da API:', error.response.data);
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        message: 'Servidor demorou para responder. Tente novamente.',
        type: 'timeout',
      });
    }

    return Promise.reject(error);
  }
);
