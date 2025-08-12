module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/person-articles',
      handler: 'person-article.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/person-articles/:id',
      handler: 'person-article.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/person-articles',
      handler: 'person-article.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/person-articles/:id',
      handler: 'person-article.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/person-articles/:id',
      handler: 'person-article.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
