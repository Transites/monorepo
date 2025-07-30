import { createStore } from 'vuex';
import search from './search';
import personArticle from './personArticle';

export default createStore({
  modules: {
    search,
    personArticle
  }
});
