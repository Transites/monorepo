import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Article from '../views/Article.vue'
import SearchView from '../views/SearchView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/article',
      name: 'Verbete',
      component: Article
    },
    { 
      path: '/',
      name: 'Início',
      component: Home
    },
    {
      path: '/search',
      name: 'Busca Avançada',
      component: SearchView
    }
  ]
})

export default router
