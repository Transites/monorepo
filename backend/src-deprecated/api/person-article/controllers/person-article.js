'use strict';

const { factories } = require('@strapi/strapi');

module.exports = factories.createCoreController('api::person-article.person-article', ({ strapi }) => ({
  async find(ctx) {
    const { query } = ctx;
    const filters = {};

    // Filtro para o título, se fornecido
    if (query.title_contains) {
      filters.title = { $contains: Array.isArray(query.title_contains) ? query.title_contains[0] : query.title_contains };
    }

    // Filtro para categorias, se fornecido
    if (typeof query['categories.id'] === 'string') {
      filters.categories = { id: query['categories.id'] };
    }

    // Filtro para tags com múltiplos IDs, se fornecido
    if (typeof query['tags.id_in'] === 'string') {
      const tagIds = query['tags.id_in'].split(',');  // Converte os IDs de tags em um array
      filters.tags = { id: { $in: tagIds } };  // Aplica o filtro $in para múltiplos IDs de tags
    }

    try {
      const entities = await strapi.entityService.findMany('api::person-article.person-article', {
        filters,
        populate: ['tags', 'categories', 'authors', 'Image', 'birth', 'death', 'Franca', 'Brasil', 'Abertura', 'Fechamento', 'Eventos', 'inicio', 'fim'],  // Populando todos os campos necessários
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
        populate: ['tags', 'categories', 'authors', 'Image', 'birth', 'death', 'Franca', 'Brasil', 'Abertura', 'Fechamento', 'Eventos', 'inicio', 'fim'],  // Populando todos os campos necessários
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

