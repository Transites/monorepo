import { Search, Info, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SearchResult, Submission } from "@/lib/api";
import { useNavigate } from "react-router-dom";

interface SearchResultsProps {
  results: SearchResult;
  query: string;
  isLoading?: boolean;
  onSubmissionClick?: (id: string) => void;
  onPageChange?: (page: number) => void;
}

export function SearchResults({
  results,
  query,
  isLoading = false,
  onSubmissionClick,
  onPageChange
}: SearchResultsProps) {
  const navigate = useNavigate();
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <LoadingSpinner size="sm" />
          <span>Buscando...</span>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!results || results.submissions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-muted/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-3 text-foreground">Nenhum resultado encontrado</h3>
        <p className="text-muted-foreground mb-6 text-lg max-w-md mx-auto">
          Não encontramos nenhum artigo que corresponda a "{query}"
        </p>
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">💡 Dicas para melhorar sua busca:</p>
              <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                <li>• Tente termos mais gerais</li>
                <li>• Use apenas palavras essenciais</li>
                <li>• A busca tolera erros de digitação</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { submissions, pagination, searchMetadata } = results;

  return (
    <div className="space-y-6">
      {/* Search Summary */}
      <SearchSummary 
        results={results}
        query={query}
      />

      {/* Results List */}
      <div className="space-y-4">
        {submissions.map((submission, index) => (
          <SubmissionCard
            key={submission.id}
            submission={submission}
            query={query}
            onClick={() => {
              onSubmissionClick?.(submission.id);
              navigate(`/article/${submission.id}`);
            }}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <PaginationControls pagination={pagination} onPageChange={onPageChange} />
      )}
    </div>
  );
}

interface SearchSummaryProps {
  results: SearchResult;
  query: string;
}

function SearchSummary({ results, query }: SearchSummaryProps) {
  const { pagination } = results;

  return (
    <div className="bg-muted/20 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-primary" />
        <span className="text-lg font-semibold text-foreground">
          {pagination.total} {pagination.total === 1 ? 'resultado encontrado para' : 'resultados encontrados para'}
          {query && <span className="text-muted-foreground"> "{query}"</span>}
        </span>
      </div>
    </div>
  );
}

interface SubmissionCardProps {
  submission: Submission;
  query: string;
  onClick?: () => void;
}

function SubmissionCard({ submission, query, onClick }: SubmissionCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-primary/20" onClick={onClick}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="place-self-start text-xl font-semibold leading-tight mb-2 text-foreground">
              {submission.title}
            </CardTitle>
            {submission.author_name && (
              <p className="text-sm text-muted-foreground">
                Por <span className="font-medium">{submission.author_name}</span>
              </p>
            )}
          </div>
          
          {submission.category && (
            <Badge variant="outline" className="text-xs flex-shrink-0 font-medium capitalize">
              {submission.category}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Atualizado em {formatDate(submission.updated_at)}</span>
          </div>
          
          {submission.feedback_count && parseInt(submission.feedback_count) > 0 && (
            <span className="text-muted-foreground">{submission.feedback_count} comentários</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface PaginationControlsProps {
  pagination: {
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onPageChange?: (page: number) => void;
}

function PaginationControls({ pagination, onPageChange }: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!pagination.hasPrev}
        onMouseDown={(event) => {
          event.preventDefault();
        }}
        onPointerDown={(event) => {
          event.preventDefault();
        }}
        onFocus={(event) => {
          event.currentTarget.blur();
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (event.currentTarget && typeof event.currentTarget.blur === 'function') {
            event.currentTarget.blur();
          }
          onPageChange?.(pagination.page - 1);
        }}
      >
        Anterior
      </Button>

      <span className="px-4 py-2 text-sm">
        Página {pagination.page} de {pagination.totalPages}
      </span>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!pagination.hasNext}
        onMouseDown={(event) => {
          event.preventDefault();
        }}
        onPointerDown={(event) => {
          event.preventDefault();
        }}
        onFocus={(event) => {
          event.currentTarget.blur();
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (event.currentTarget && typeof event.currentTarget.blur === 'function') {
            event.currentTarget.blur();
          }
          onPageChange?.(pagination.page + 1);
        }}
      >
        Próxima
      </Button>
    </div>
  );
}