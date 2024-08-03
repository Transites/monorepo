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
    // Outras rotas...
  ],
};
