import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://enciclopedia.iea.usp.br:1337/api',
});

export default api;
