import axios from 'axios';

// Determine a URL base baseado no ambiente
const getBaseURL = () => {
    const hostname = window.location.hostname;
    console.log('Current hostname:', hostname);

    // Se estiver em desenvolvimento local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:1337/api';
    }
    // Se estiver no servidor IEA
    return 'http://enciclopedia.iea.usp.br:1337/api';
};

const baseURL = getBaseURL();
console.log('API Base URL:', baseURL);

const api = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: false,
    timeout: 10000 // 10 segundos de timeout
});

export default api;