'use strict';

module.exports = {
  routes: [
    // Get verbete types
    {
      method: 'GET',
      path: '/submissions/verbete-types',
      handler: 'submission.getVerbeteTypes',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // Create a new submission or save as draft
    {
      method: 'POST',
      path: '/submissions',
      handler: 'submission.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },

    // Get a specific submission
    {
      method: 'GET',
      path: '/submissions/:id',
      handler: 'submission.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },

    // Get submissions for a specific user
    {
      method: 'GET',
      path: '/submissions/user/:userId',
      handler: 'submission.findByUser',
      config: {
        policies: [],
        middlewares: [],
      },
    },

    // Update a submission
    {
      method: 'PUT',
      path: '/submissions/:id',
      handler: 'submission.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },

    // Submit a submission for review
    {
      method: 'POST',
      path: '/submissions/:id/submit',
      handler: 'submission.submit',
      config: {
        policies: [],
        middlewares: [],
      },
    },

    // Delete a submission
    {
      method: 'DELETE',
      path: '/submissions/:id',
      handler: 'submission.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
