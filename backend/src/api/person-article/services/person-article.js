'use strict';

/**
 * person-article service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::person-article.person-article');
