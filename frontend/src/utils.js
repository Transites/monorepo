
export function createChipList(article) {
    const categories = article.attributes.categories?.data.map(category => category.attributes.name) || [];
    const tags = article.attributes.tags?.data.map(tag => tag.attributes.name) || [];
    
    return [...categories, ...tags];
  }
  
  export function createAuthorList(article) {
    return article.attributes.authors?.data.map(author => author.attributes.name) || [];
  }
  