import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Article from '../views/Article.vue'
import PageNotFound from '../views/PageNotFound.vue'
import NormasDePublicacao from '@/components/NormasdePublicacao.vue'
import SearchResults from '@/views/SearchResults.vue'  // Adicione a importação

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
    },
    {
      path: '/search-results',
      name: 'SearchResults',
      component: SearchResults,
      props: route => ({ results: JSON.parse(route.params.results || '[]') })
    },
    {
      path: '/404',
      name: 'page-not-found',
      component: PageNotFound
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/404'
    },
    {
      path: '/normas-de-publicacao',
      name: 'NormasDePublicacao',
      component: NormasDePublicacao
    }
  ]
})

export default router
