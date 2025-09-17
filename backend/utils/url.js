/**
 * URL and string manipulation utilities
 */

/**
 * Gerar slug a partir do título
 * Converts a title string into a URL-friendly slug
 *
 * @param {string} title - The title to convert to a slug
 * @returns {string} - The URL-friendly slug
 */
function generateSlug(title) {
    if (!title) return '';

    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
        .trim()
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/-+/g, '-') // Remove hífens duplicados
        .substring(0, 100); // Limita tamanho
}

/**
 * Generate a full article URL from a slug
 *
 * @param {string} slug - The slug for the article
 * @returns {string} - The full article URL
 */
function generateArticleUrl(slug) {
    // Base URL can be configured based on environment
    const baseUrl = process.env.FRONTEND_URL || 'https://example.com';
    return `${baseUrl}/articles/${slug}`;
}

module.exports = {
    generateSlug,
    generateArticleUrl
};
