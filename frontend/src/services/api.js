import axios from 'axios';

const api = axios.create({
    baseURL: `${import.meta.env.VITE_STRAPI_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: false,
    timeout: 10000 // 10 segundos de timeout
});

export default api;