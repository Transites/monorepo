'use strict';

const { factories } = require('@strapi/strapi');

module.exports = factories.createCoreController('api::person-article.person-article', ({ strapi }) => ({
  async find(ctx) {
    const { query } = ctx;
    const filters = {};

    if (query.title_contains) {
      filters.title = { $contains: Array.isArray(query.title_contains) ? query.title_contains[0] : query.title_contains };
    }
    if (typeof query['categories.id'] === 'string') {
      filters.categories = { id: query['categories.id'] };
    }
    if (typeof query['tags.id_in'] === 'string') {
      filters.tags = { id: { $in: query['tags.id_in'].split(',') } };
    }

    try {
      const entities = await strapi.entityService.findMany('api::person-article.person-article', {
        filters,
        populate: ['tags', 'categories'],
      });

      const sanitizedEntities = await this.sanitizeOutput(entities, ctx);
      return this.transformResponse(sanitizedEntities);
    } catch (error) {
      ctx.throw(500, `Error fetching person-articles: ${error.message}`);
    }
  },

  async findOne(ctx) {
    const { id } = ctx.params;

    try {
      const entity = await strapi.entityService.findOne('api::person-article.person-article', id, {
        populate: ['tags', 'categories'],
      });

      if (!entity) {
        return ctx.notFound(`Person article with ID ${id} not found`);
      }

      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      return this.transformResponse(sanitizedEntity);
    } catch (error) {
      ctx.throw(500, `Error fetching person article with ID ${id}: ${error.message}`);
    }
  }
}));
