import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Article from '../views/Article.vue';
import PageNotFound from '../views/PageNotFound.vue';
import NormasDePublicacao from '@/components/NormasdePublicacao.vue';
import SearchResults from '../views/SearchResults.vue';
import Contribute from '@/components/Contribute.vue';
import SubmissionPage from '../views/SubmissionPage.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (savedPosition) {
          resolve(savedPosition);
        } else {
          // For regular navigation (clicking links), scroll to top
          resolve({ top: 0 });
        }
      }, 100); // Small delay to allow content to render
    });
  },
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
      path: '/results',
      name: 'Results',
      component: SearchResults
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
    },
    {
      path: '/Contribute',
      name: 'Contribute',
      component: Contribute
    },
    {
      path: '/submit',
      name: 'SubmitArticle',
      component: SubmissionPage
    },
    // Rota genérica para capturar qualquer caminho de 'article' que não foi definido
    {
      path: '/article/:type(.*)',
      redirect: '/404'
    }
  ]
});

export default router;
