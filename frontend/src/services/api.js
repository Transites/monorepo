import axios from 'axios';

const api = axios.create({
  baseURL: 'http://enciclopedia.iea.usp.br:1337/api', // URL do seu backend Strapi
});

export default api;
