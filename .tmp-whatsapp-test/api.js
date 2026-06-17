"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const axios_1 = __importDefault(require("axios"));
exports.api = axios_1.default.create({
    baseURL: 'https://7970-146-164-9-234.ngrok-free.app',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    },
});
exports.api.interceptors.response.use((response) => {
    return response;
}, (error) => {
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
});
