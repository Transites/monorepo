import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, FileText, Clock, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getMySubmissions, type AuthorSubmission } from '@/lib/api';

// Tradução dos status
const STATUS_LABEL: Record<string, string> = {
  DRAFT:             'Rascunho',
  SUBMITTED:         'Enviada para revisão',
  UNDER_REVIEW:      'Em revisão',
  CHANGES_REQUESTED: 'Correções solicitadas',
  APPROVED:          'Aprovado',
  PUBLISHED:         'Publicado',
  REJECTED:          'Rejeitado',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT:             'secondary',
  SUBMITTED:         'default',
  UNDER_REVIEW:      'default',
  CHANGES_REQUESTED: 'destructive',
  APPROVED:          'default',
  PUBLISHED:         'default',
  REJECTED:          'destructive',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

function SubmissionCard({ submission }: { submission: AuthorSubmission }) {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => navigate(`/minhas-submissoes/${submission.id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{submission.title}</CardTitle>
            {submission.category && (
              <CardDescription className="mt-1 capitalize">
                {submission.category}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={STATUS_VARIANT[submission.status] ?? 'secondary'}>
              {STATUS_LABEL[submission.status] ?? submission.status}
            </Badge>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Atualizado em {formatDate(submission.updated_at)}
          </span>
            {parseInt(submission.pending_suggestions_count) > 0 && (
            <span className="text-destructive font-medium">
            {submission.pending_suggestions_count} sugestão(ões) pendente(s)
            </span>
            )}
        </div>

        {/* Aviso especial quando há alterações solicitadas */}
        {submission.status === 'CHANGES_REQUESTED' && (
          <p className="mt-3 text-sm text-destructive font-medium">
            O curador enviou sugestões de revisão. Clique para visualizar.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function MySubmissions() {
  const { data: submissions, isLoading, isError } = useQuery({
    queryKey: ['author', 'my-submissions'],
    queryFn:  getMySubmissions,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Minhas submissões</h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe o status dos seus artigos enviados para revisão.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Carregando suas submissões…
          </div>
        )}

        {isError && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p>Não foi possível carregar suas submissões. Tente novamente.</p>
          </div>
        )}

        {!isLoading && !isError && submissions?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mb-3" />
            <p className="font-medium">Nenhuma submissão ainda</p>
            <p className="text-sm mt-1">
              Quando você enviar um artigo, ele aparecerá aqui.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {submissions?.map(s => (
            <SubmissionCard key={s.id} submission={s} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}