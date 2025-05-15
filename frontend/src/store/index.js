import { createStore } from 'vuex';
import search from './search';
import submission from './submission';

export default createStore({
  modules: {
    search,
    submission
  }
});
