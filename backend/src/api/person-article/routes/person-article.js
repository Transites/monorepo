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
    // Outras rotas...
  ],
};
