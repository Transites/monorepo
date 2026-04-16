// Importamos só o que vamos usar do lucide-react
// (já está instalado no projeto)
import { User, BookOpen, Tag } from 'lucide-react';

// Os componentes ui/ já existem no projeto (shadcn/ui)
import { Badge }                    from '@/components/ui/badge';
import { Card, CardContent }        from '@/components/ui/card';
import { ArticleSummary }           from '@/lib/api';

// useNavigate: hook do React Router pra navegar entre páginas
// sem recarregar o browser (SPA navigation)
import { useNavigate } from 'react-router-dom';

interface CatalogCardProps {
  article: ArticleSummary;
}

export function CatalogCard({ article }: CatalogCardProps) {
  const navigate = useNavigate();

  // Navega para /article/:id — rota que já existe no App.tsx
  const handleClick = () => {
    navigate(`/article/${article.id}`);
  };

  // Pega as 3 primeiras keywords para exibir (evita card enorme)
  const keywords = article.keywords?.slice(0, 3) ?? [];

  return (
    // group: classe do Tailwind que permite estilizar filhos no hover do pai
    // cursor-pointer: cursor de mãozinha para indicar que é clicável
    <Card
      onClick={handleClick}
      className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 flex flex-col h-full"
    >
      {/* Imagem de capa — só renderiza se existir */}
      {article.metadata?.image?.url && (
        <div className="relative overflow-hidden rounded-t-lg h-40">
          <img
            src={article.metadata.image.url}
            alt={article.metadata.image.alternativeText ?? article.title}
            // object-cover: preenche o espaço sem distorcer
            // group-hover:scale-105: zoom suave no hover do Card pai
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <CardContent className="flex flex-col gap-3 p-4 flex-1">
        {/* Categoria — Badge já tem estilo definido */}
        {article.category && (
          <Badge variant="secondary" className="w-fit text-xs">
            {article.category}
          </Badge>
        )}

        {/* Título */}
        {/* line-clamp-2: corta em 2 linhas com "..." — evita cards desiguais */}
        <h3 className="font-semibold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>

        {/* Resumo */}
        {article.summary && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {article.summary}
          </p>
        )}

        {/* Empurra o rodapé pro fundo do card — mt-auto = margin-top: auto */}
        <div className="mt-auto flex flex-col gap-2">
          {/* Autor */}
          {article.author_name && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {/* Ícone do lucide-react — size controla width e height */}
              <User size={12} />
              <span className="truncate">{article.author_name}</span>
            </div>
          )}

          {/* Instituição */}
          {article.author_institution && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <BookOpen size={12} />
              <span className="truncate">{article.author_institution}</span>
            </div>
          )}

          {/* Keywords */}
          {keywords.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <Tag size={10} className="text-muted-foreground" />
              {keywords.map(kw => (
                // key é obrigatório quando renderizamos uma lista com .map()
                // React usa ela pra identificar qual item mudou
                <span key={kw} className="text-xs text-muted-foreground">
                  {kw}{keywords.indexOf(kw) < keywords.length - 1 ? ',' : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}