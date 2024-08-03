'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/verbete-obras',
      handler: 'verbete-obra.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/verbete-obras/:id',
      handler: 'verbete-obra.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/verbete-obras',
      handler: 'verbete-obra.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/verbete-obras/:id',
      handler: 'verbete-obra.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/verbete-obras/:id',
      handler: 'verbete-obra.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
