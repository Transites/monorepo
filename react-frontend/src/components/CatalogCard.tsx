import { User, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ArticleSummary } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

interface CatalogCardProps {
  article: ArticleSummary;
}

export function CatalogCard({ article }: CatalogCardProps) {
  const navigate = useNavigate();

  return (
    // Em vez de Card vertical, usamos um div horizontal
    // items-start: alinha thumbnail e texto pelo topo
    // gap-4: espaço entre a thumbnail e o texto
    // py-4 + border-b: separa cada item com uma linha embaixo (igual Google)
    <div
      onClick={() => navigate(`/article/${article.id}`)}
      className="flex items-start gap-4 py-4 border-b border-border cursor-pointer group hover:bg-muted/30 transition-colors px-2 rounded-sm"
    >
      {/* Thumbnail — pequena, quadrada, só aparece se tiver imagem */}
      {article.metadata?.image?.url && (
        // shrink-0: impede a imagem de encolher quando o texto é longo
        <div className="shrink-0 w-20 h-20 rounded-full overflow-hidden">
          <img
            src={article.metadata.image.url}
            alt={article.metadata.image.alternativeText ?? article.title}
            // object-cover: preenche o quadrado sem distorcer
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>
      )}

      {/* Conteúdo textual — ocupa todo o espaço restante */}
      {/* min-w-0: permite que o texto quebre linha corretamente em flex */}
      <div className="flex-1 min-w-0 space-y-1">

        {/* Categoria — pequena, acima do título, igual URL verde do Google */}
        {article.category && (
          <p className="text-xs text-muted-foreground">
            {article.category}
          </p>
        )}

        {/* Título — azul clicável, igual Google */}
        <h3 className="text-base font-semibold text-primary leading-snug group-hover:underline line-clamp-1">
          {article.title}
        </h3>

        {/* Resumo — linha-clamp-2 mostra só 2 linhas, igual Google */}
        {article.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {article.summary}
          </p>
        )}

        {/* Rodapé: autor e instituição numa linha só */}
        <div className="flex items-center gap-3 pt-1">
          {article.author_name && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User size={11} />
              <span>{article.author_name}</span>
            </div>
          )}
          {article.author_institution && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <BookOpen size={11} />
              {/* truncate: corta com "..." se o nome for muito longo */}
              <span className="truncate max-w-[200px]">{article.author_institution}</span>
            </div>
          )}
        </div>
      </div>

      {/* Badge de keywords — só no desktop, lado direito */}
      {/* hidden sm:flex: some no mobile, aparece no desktop */}
      {article.keywords && article.keywords.length > 0 && (
        <div className="hidden sm:flex flex-col gap-1 shrink-0">
          {article.keywords.slice(0, 2).map(kw => (
            <Badge key={kw} variant="outline" className="text-xs whitespace-nowrap">
              {kw}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}