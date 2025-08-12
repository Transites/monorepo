'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::submission.submission', ({ strapi }) => ({
  // Get verbete types
  async getVerbeteTypes(ctx) {
    try {
      // Get the verbete types from the schema
      const verbeteTypes = [
        {title: 'Pessoa', value: 'person'},
        {title: 'Instituição', value: 'institution'},
        {title: 'Obra', value: 'work'},
        {title: 'Evento', value: 'event'}
      ];

      return { data: verbeteTypes };
    } catch (error) {
      ctx.throw(500, `Error fetching verbete types: ${error.message}`);
    }
  },
  // Create a new submission or save as draft
  async create(ctx) {
    try {
      const {data} = ctx.request.body;

      // Set the author to the current user
      const user = ctx.state.user;
      if (user) {
        data.author = user.id;
      }

      // Create the submission
      const entity = await strapi.entityService.create('api::submission.submission', {
        data
      });

      // Return the sanitized response
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      return this.transformResponse(sanitizedEntity);
    } catch (error) {
      console.error('Error creating submission:', {
        error: error,
        stackTrace: error.stack,
        requestBody: ctx.request.body,
        userData: ctx.state.user
      });

      if (error.details?.errors) {
        const errorMessages = error.details.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join('; ');
        ctx.throw(500, `Error creating submission: ${errorMessages}`);
      } else {
        ctx.throw(500, `Error creating submission: ${error.message || 'Unknown error'}`);
      }
    }
  },

  // Get a specific submission
  async findOne(ctx) {
    try {
      const { id } = ctx.params;

      // Find the submission
      const entity = await strapi.entityService.findOne('api::submission.submission', id, {
        populate: ['author', 'reviewer', 'media', 'categories', 'tags']
      });

      if (!entity) {
        return ctx.notFound(`Submission with ID ${id} not found`);
      }

      // Check if the user is authorized to view this submission
      const user = ctx.state.user;
      if (user && user.role.name !== 'Admin' && entity.author?.id !== user.id) {
        return ctx.forbidden('You are not authorized to view this submission');
      }

      // Return the sanitized response
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      return this.transformResponse(sanitizedEntity);
    } catch (error) {
      ctx.throw(500, `Error fetching submission with ID ${ctx.params.id}: ${error.message}`);
    }
  },

  // Get submissions for a specific user
  async findByUser(ctx) {
    try {
      const { userId } = ctx.params;

      // Check if the user is authorized to view these submissions
      const user = ctx.state.user;
      if (user && user.role.name !== 'Admin' && user.id !== parseInt(userId)) {
        return ctx.forbidden('You are not authorized to view these submissions');
      }

      // Find submissions for the user
      const entities = await strapi.entityService.findMany('api::submission.submission', {
        filters: {
          author: userId
        },
        populate: ['categories', 'tags']
      });

      // Return the sanitized response
      const sanitizedEntities = await this.sanitizeOutput(entities, ctx);
      return this.transformResponse(sanitizedEntities);
    } catch (error) {
      ctx.throw(500, `Error fetching submissions for user ${ctx.params.userId}: ${error.message}`);
    }
  },

  // Update a submission
  async update(ctx) {
    try {
      const { id } = ctx.params;
      const { data } = ctx.request.body;

      // Find the submission
      const submission = await strapi.entityService.findOne('api::submission.submission', id);

      if (!submission) {
        return ctx.notFound(`Submission with ID ${id} not found`);
      }

      // Check if the user is authorized to update this submission
      const user = ctx.state.user;
      if (user && user.role.name !== 'Admin' && submission.author?.id !== user.id) {
        return ctx.forbidden('You are not authorized to update this submission');
      }

      // Update the submission
      const entity = await strapi.entityService.update('api::submission.submission', id, {
        data
      });

      // Return the sanitized response
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      return this.transformResponse(sanitizedEntity);
    } catch (error) {
      ctx.throw(500, `Error updating submission with ID ${ctx.params.id}: ${error.message}`);
    }
  },

  // Submit a submission for review
  async submit(ctx) {
    try {
      const { id } = ctx.params;

      // Find the submission
      const submission = await strapi.entityService.findOne('api::submission.submission', id);

      if (!submission) {
        return ctx.notFound(`Submission with ID ${id} not found`);
      }

      // Check if the user is authorized to submit this submission
      const user = ctx.state.user;
      if (user && submission.author?.id !== user.id) {
        return ctx.forbidden('You are not authorized to submit this submission');
      }

      // Update the submission status to 'submitted'
      const entity = await strapi.entityService.update('api::submission.submission', id, {
        data: {
          status: 'submitted'
        }
      });

      // Return the sanitized response
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      return this.transformResponse(sanitizedEntity);
    } catch (error) {
      ctx.throw(500, `Error submitting submission with ID ${ctx.params.id}: ${error.message}`);
    }
  },

  // Delete a submission
  async delete(ctx) {
    try {
      const { id } = ctx.params;

      // Find the submission
      const submission = await strapi.entityService.findOne('api::submission.submission', id);

      if (!submission) {
        return ctx.notFound(`Submission with ID ${id} not found`);
      }

      // Check if the user is authorized to delete this submission
      const user = ctx.state.user;
      if (user && user.role.name !== 'Admin' && submission.author?.id !== user.id) {
        return ctx.forbidden('You are not authorized to delete this submission');
      }

      // Delete the submission
      const entity = await strapi.entityService.delete('api::submission.submission', id);

      // Return the sanitized response
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      return this.transformResponse(sanitizedEntity);
    } catch (error) {
      ctx.throw(500, `Error deleting submission with ID ${ctx.params.id}: ${error.message}`);
    }
  }
}));
