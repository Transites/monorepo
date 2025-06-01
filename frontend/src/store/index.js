import { createStore } from 'vuex';
import search from './search';
import submission from './submission';
import personArticle from './personArticle';

export default createStore({
  modules: {
    search,
    submission,
    personArticle
  }
});
