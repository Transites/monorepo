// Category color constants for consistent usage across components
export const CATEGORY_COLORS = {
  pessoa: {
    css: 'pessoa',
    hsl: '0 72% 51%',        // Red
    hex: '#DC2626'
  },
  obra: {
    css: 'obra',
    hsl: '262 83% 58%',      // Purple
    hex: '#7C3AED'
  },
  evento: {
    css: 'evento',
    hsl: '142 76% 36%',      // Green
    hex: '#059669'
  },
  instituicoes: {
    css: 'instituicoes',
    hsl: '199 89% 48%',      // Light Blue
    hex: '#0EA5E9'
  },
  empresa: {
    css: 'empresa',
    hsl: '262 83% 58%',      // Purple
    hex: '#7C3AED'
  },
  agrupamentos: {
    css: 'agrupamentos',
    hsl: '186 100% 56%',     // Cyan
    hex: '#00D4FF'
  },
  conceitos: {
    css: 'conceitos',
    hsl: '45 93% 47%',       // Yellow
    hex: '#EAB308'
  }
} as const;

// Type for category keys
export type CategoryKey = keyof typeof CATEGORY_COLORS;

// Helper function to get CSS custom property
export const getCategoryColor = (category: string) => {
  const normalizedCategory = category.toLowerCase();
  const mappedCategory = LEGACY_CATEGORY_MAPPING[normalizedCategory as keyof typeof LEGACY_CATEGORY_MAPPING] || normalizedCategory;
  return CATEGORY_COLORS[mappedCategory as CategoryKey]?.css || 'primary';
};

// Legacy category name mappings for backward compatibility
export const LEGACY_CATEGORY_MAPPING = {
  'pessoa': 'pessoa',
  'pessoas': 'pessoa',
  'obra': 'obra', 
  'obras': 'obra',
  'evento': 'evento',
  'eventos': 'evento',
  'organizacao': 'instituicoes',
  'organização': 'instituicoes', 
  'instituicoes': 'instituicoes',
  'instituições': 'instituicoes',
  'empresa': 'empresa',
  'empresas': 'empresa',
  'agrupamentos': 'agrupamentos',
  'conceito': 'conceitos',
  'conceitos': 'conceitos'
} as const;