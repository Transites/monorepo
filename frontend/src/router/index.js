import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Article from '../views/Article.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/article/:type/:id',
      name: 'Verbete',
      component: Article
    },
    {
      path: '/',
      name: 'Início',
      component: Home
    }
  ]
})

export default router
