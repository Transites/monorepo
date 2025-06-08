'use strict';

/**
 * Script to seed the database with initial data for verbete types, categories, and tags.
 *
 * Usage:
 * - Make sure your Strapi server is running
 * - Run this script with: node scripts/seed-data.js
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:1337/api'; // Change this if your Strapi is running on a different URL
const AUTH_TOKEN = process.env.STRAPI_ADMIN_TOKEN || '';

// Data to seed
const categories = [
  { name: 'Arte', description: 'Categoria relacionada a manifestações artísticas' },
  { name: 'Ciência', description: 'Categoria relacionada a ciência e pesquisa' },
  { name: 'Cultura', description: 'Categoria relacionada a manifestações culturais' },
  { name: 'Educação', description: 'Categoria relacionada a educação e ensino' },
  { name: 'História', description: 'Categoria relacionada a eventos históricos' },
  { name: 'Literatura', description: 'Categoria relacionada a obras literárias' },
  { name: 'Política', description: 'Categoria relacionada a política e governança' }
];

const tags = [
  { name: 'Brasil', description: 'Relacionado ao Brasil' },
  { name: 'Portugal', description: 'Relacionado a Portugal' },
  { name: 'França', description: 'Relacionado à França' },
  { name: 'Século XIX', description: 'Relacionado ao século XIX' },
  { name: 'Século XX', description: 'Relacionado ao século XX' },
  { name: 'Modernismo', description: 'Relacionado ao movimento modernista' },
  { name: 'Colonialismo', description: 'Relacionado ao período colonial' },
  { name: 'Independência', description: 'Relacionado a processos de independência' },
  { name: 'Migração', description: 'Relacionado a processos migratórios' },
  { name: 'Intelectuais', description: 'Relacionado a intelectuais e pensadores' },
  { name: 'Universidade', description: 'Relacionado a instituições universitárias' },
  { name: 'Livro', description: 'Relacionado a publicações literárias' },
  { name: 'Revista', description: 'Relacionado a publicações periódicas' },
  { name: 'Jornal', description: 'Relacionado a publicações jornalísticas' },
  { name: 'Pintura', description: 'Relacionado a obras pictóricas' },
  { name: 'Escultura', description: 'Relacionado a obras escultóricas' },
  { name: 'Música', description: 'Relacionado a obras musicais' },
  { name: 'Teatro', description: 'Relacionado a obras teatrais' },
  { name: 'Cinema', description: 'Relacionado a obras cinematográficas' }
];

const personArticles = [
  {
    title: 'Claude Lévi-Strauss',
    summary: '<p>Antropólogo francês, considerado um dos principais fundadores da antropologia estrutural. Viveu no Brasil entre 1935 e 1939, onde desenvolveu pesquisas fundamentais sobre povos indígenas.</p>',
    Artigo: '<p>Claude Lévi-Strauss nasceu em Bruxelas em 1908 e faleceu em Paris em 2009. Chegou ao Brasil em 1935 como professor da recém-criada Universidade de São Paulo, onde permaneceu até 1939. Durante sua estadia no país, realizou expedições etnográficas ao Mato Grosso e à Amazônia, estudando grupos indígenas como os Bororo, Nambikwara e Tupi-Kawahib.</p><p>Suas experiências no Brasil foram fundamentais para o desenvolvimento de sua teoria estruturalista, influenciando profundamente a antropologia moderna. Suas obras "Tristes Trópicos" e "O Pensamento Selvagem" refletem suas observações sobre as culturas brasileiras.</p>',
    Bibliografia: '<p>LÉVI-STRAUSS, Claude. <em>Tristes tropiques</em>. Paris: Plon, 1955.</p><p>LÉVI-STRAUSS, Claude. <em>Anthropologie structurale</em>. Paris: Plon, 1958.</p>',
    alternativeTitles: 'Claude Levi-Strauss',
    birth: { data: '1908-11-28', local: 'Bruxelas, Bélgica' },
    death: { data: '2009-10-30', local: 'Paris, França' },
    categories: ['Ciência', 'Cultura'],
    tags: ['França', 'Brasil', 'Século XX', 'Intelectuais', 'Universidade']
  },
  {
    title: 'Fernand Braudel',
    summary: '<p>Historiador francês, principal representante da Escola dos Annales. Lecionou na Universidade de São Paulo entre 1935 e 1937, contribuindo para a formação da historiografia brasileira.</p>',
    Artigo: '<p>Fernand Braudel nasceu em 1902 e faleceu em 1985. Veio ao Brasil em 1935 para lecionar na Faculdade de Filosofia, Ciências e Letras da Universidade de São Paulo, onde permaneceu até 1937. Durante sua estadia, influenciou profundamente a formação de uma nova geração de historiadores brasileiros.</p><p>Sua abordagem da "longa duração" e sua concepção da história total marcaram não apenas a historiografia francesa, mas também a brasileira. Seus discípulos no Brasil continuaram desenvolvendo suas metodologias inovadoras.</p>',
    Bibliografia: '<p>BRAUDEL, Fernand. <em>La Méditerranée et le monde méditerranéen à l\'époque de Philippe II</em>. Paris: Armand Colin, 1949.</p><p>BRAUDEL, Fernand. <em>Civilisation matérielle, économie et capitalisme</em>. Paris: Armand Colin, 1979.</p>',
    birth: { data: '1902-08-24', local: 'Luméville-en-Ornois, França' },
    death: { data: '1985-11-27', local: 'Cluses, França' },
    categories: ['História', 'Educação'],
    tags: ['França', 'Brasil', 'Século XX', 'Intelectuais', 'Universidade']
  },
  {
    title: 'Roger Bastide',
    summary: '<p>Sociólogo e antropólogo francês, especialista em religiões afro-brasileiras. Viveu no Brasil de 1938 a 1954, tornando-se uma das principais autoridades sobre a cultura negra brasileira.</p>',
    Artigo: '<p>Roger Bastide nasceu em 1898 e faleceu em 1974. Chegou ao Brasil em 1938 para substituir Claude Lévi-Strauss na cadeira de Sociologia da USP, permanecendo até 1954. Durante esses 16 anos, desenvolveu estudos pioneiros sobre as religiões afro-brasileiras, especialmente o candomblé.</p><p>Seus trabalhos sobre a cultura negra no Brasil, incluindo "O Candomblé da Bahia" e "As Religiões Africanas no Brasil", são considerados clássicos da sociologia brasileira. Bastide conseguiu conciliar rigor científico com profundo respeito pelas tradições estudadas.</p>',
    Bibliografia: '<p>BASTIDE, Roger. <em>Le Candomblé de Bahia</em>. Paris: Mouton, 1958.</p><p>BASTIDE, Roger. <em>Les Religions africaines au Brésil</em>. Paris: PUF, 1960.</p>',
    birth: { data: '1898-04-01', local: 'Anduze, França' },
    death: { data: '1974-04-10', local: 'Maisons-Laffitte, França' },
    categories: ['Ciência', 'Cultura'],
    tags: ['França', 'Brasil', 'Século XX', 'Intelectuais', 'Universidade']
  }
];

// Helper function to create API client
const createApiClient = () => {
  const client = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (AUTH_TOKEN) {
    client.defaults.headers.common['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }

  return client;
};

// Seed categories
const seedCategories = async (client) => {
  console.log('Seeding categories...');

  for (const category of categories) {
    try {
      // Check if category already exists
      const response = await client.get(`/categories?filters[name][$eq]=${encodeURIComponent(category.name)}`);

      if (response.data.data.length === 0) {
        // Create category if it doesn't exist
        await client.post('/categories', {
          data: {
            name: category.name,
            description: category.description,
            publishedAt: new Date().toISOString()
          }
        });
        console.log(`Created category: ${category.name}`);
      } else {
        console.log(`Category already exists: ${category.name}`);
      }
    } catch (error) {
      console.error(`Error creating category ${category.name}:`, error.message);
    }
  }
};

// Seed tags
const seedTags = async (client) => {
  console.log('Seeding tags...');

  for (const tag of tags) {
    try {
      // Check if tag already exists
      const response = await client.get(`/tags?filters[name][$eq]=${encodeURIComponent(tag.name)}`);

      if (response.data.data.length === 0) {
        // Create tag if it doesn't exist
        var postResponse = await client.post('/tags', {
          data: {
            name: tag.name,
            description: tag.description,
            publishedAt: new Date().toISOString()
          }
        });
        console.log('Tag created:', postResponse.data.data);
        console.log(`Created tag: ${tag.name}`);
      } else {
        console.log(`Tag already exists: ${tag.name}`);
      }
    } catch (error) {
      console.error(`Error creating tag ${tag.name}:`, error.message);
    }
  }
};

// Seed person articles
const seedPersonArticles = async (client) => {
  console.log('Seeding person articles...');

  // First, get all categories and tags to map names to IDs
  const categoriesResponse = await client.get('/categories');
  const tagsResponse = await client.get('/tags');

  const categoryMap = {};
  const tagMap = {};

  categoriesResponse.data.data.forEach(cat => {
    categoryMap[cat.attributes.name] = cat.id;
  });

  tagsResponse.data.data.forEach(tag => {
    tagMap[tag.attributes.name] = tag.id;
  });

  for (const article of personArticles) {
    try {
      // Check if article already exists
      const response = await client.get(`/person-articles?filters[title][$eq]=${encodeURIComponent(article.title)}`);

      if (response.data.data.length === 0) {
        // Map category and tag names to IDs
        const categoryIds = article.categories.map(name => categoryMap[name]).filter(id => id);
        const tagIds = article.tags.map(name => tagMap[name]).filter(id => id);

        // Create person article
        const articleData = {
          title: article.title,
          summary: article.summary,
          Artigo: article.Artigo,
          Bibliografia: article.Bibliografia,
          alternativeTitles: article.alternativeTitles,
          birth: article.birth,
          death: article.death,
          categories: categoryIds,
          tags: tagIds,
          publishedAt: new Date().toISOString()
        };
        await client.post('/person-articles', {
          data: articleData
        });
        console.log(`Created person article: ${article.title}`);
      } else {
        console.log(`Person article already exists: ${article.title}`);
      }
    } catch (error) {
      console.error(`Error creating person article ${article.title}:`, error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    }
  }
};

// Main function
const main = async () => {
  try {
    const client = createApiClient();

    // Seed data
    await seedCategories(client);
    await seedTags(client);
    await seedPersonArticles(client);

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error.message);
  }
};

// Run the script
main();
