'use strict';

const { factories } = require('@strapi/strapi');

module.exports = factories.createCoreController('api::person-article.person-article', ({ strapi }) => ({
  async find(ctx) {
    const { query } = ctx;
    const filters = {
      ...query.filters,
      ...(query.title_contains ? { title: { $contains: query.title_contains } } : {}),
      ...(query['categories.id'] ? { categories: { id: query['categories.id'] } } : {}),
      ...(query['tags.id_in'] ? { tags: { id_in: query['tags.id_in'].split(',') } } : {})
    };
    
    const entities = await strapi.entityService.findMany('api::person-article.person-article', {
      filters,
      populate: ['tags', 'categories']
    });
    const sanitizedEntities = await this.sanitizeOutput(entities, ctx);
    return this.transformResponse(sanitizedEntities);
  }
}));
