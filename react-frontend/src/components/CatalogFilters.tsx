import { Search, X, Filter } from 'lucide-react';
import { Input }  from '../components/ui/input';
import { Badge }  from '../components/ui/badge';
import { Button } from '../components/ui/button';

interface CatalogFiltersProps {
  search:      string;
  category:    string;
  categories:  string[];           // lista vinda da API
  onSearch:    (v: string) => void;
  onCategory:  (v: string) => void;
}

export function CatalogFilters({
  search,
  category,
  categories,
  onSearch,
  onCategory,
}: CatalogFiltersProps) {

  const hasActiveFilter = search || category;

  const clearAll = () => {
    onSearch('');
    onCategory('');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Campo de busca */}
      {/* relative: posiciona o ícone dentro do input com absolute */}
      <div className="relative">
        <Search
          size={16}
          // absolute + inset: posiciona exatamente dentro do container relative
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          // pl-9: padding-left pra não sobrepor o ícone
          className="pl-9 pr-9"
          placeholder="Buscar artigos, autores..."
          value={search}
          // e.target.value: valor atual do input a cada tecla
          onChange={e => onSearch(e.target.value)}
        />
        {/* Botão X só aparece se tiver texto */}
        {search && (
          <button
            onClick={() => onSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filtros de categoria */}
      {categories.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter size={12} />
            <span>Categorias</span>
          </div>

          {/* flex-wrap: quebra linha quando não cabe */}
          <div className="flex flex-wrap gap-2">
            {/* Badge "Todas" — ativo quando nenhuma categoria está selecionada */}
            <Badge
              variant={!category ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => onCategory('')}
            >
              Todas
            </Badge>

            {/* Uma Badge por categoria */}
            {categories.map(cat => (
              <Badge
                key={cat}
                // variant muda o estilo: 'default' = selecionado, 'outline' = não selecionado
                variant={category === cat ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => onCategory(cat === category ? '' : cat)}
                // ↑ clicar na categoria ativa → desativa (toggle)
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Botão "Limpar filtros" — só aparece se algum filtro estiver ativo */}
      {hasActiveFilter && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="w-fit text-xs">
          <X size={12} className="mr-1" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}