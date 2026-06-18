import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertCircle, Inbox, UserPlus, Clock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getReviewQueue,
  assignSubmission,
  ApiError,
  type AdminSubmission,
} from '@/lib/api';

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function SubmissionCard({
  submission,
  onAssign,
  isAssigning,
}: {
  submission: AdminSubmission;
  onAssign: (id: string) => void;
  isAssigning: boolean;
}) {
  const navigate = useNavigate();

  // Função que navega pro detalhe, mas evita disparar quando clica no botão
  const handleCardClick = (e: React.MouseEvent) => {
    // Se o clique foi no botão "Tornar-se responsável", não navega
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/admin/revisar/${submission.id}`);
  };

  return (
    <Card
      onClick={handleCardClick}
      className="cursor-pointer hover:border-primary/50 transition-colors"
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">{submission.title}</CardTitle>
            <CardDescription className="mt-1">
              {submission.authorName}
              {submission.authorInstitution && ` · ${submission.authorInstitution}`}
            </CardDescription>
          </div>
          {submission.category && (
            <Badge variant="secondary" className="shrink-0">
              {submission.category}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {submission.summary}
        </p>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Enviado em {formatDate(submission.submittedAt)}
          </p>
          <Button
            size="sm"
            onClick={() => onAssign(submission.id)}
            disabled={isAssigning}
          >
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Atribuindo…
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Tornar-se responsável
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReviewQueue() {
  const queryClient = useQueryClient();
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'review-queue'],
    queryFn: () => getReviewQueue({ limit: 50 }),
  });

  const assignMutation = useMutation({
    mutationFn: assignSubmission,
    onMutate: (id: string) => setAssigningId(id),
    onSettled: () => setAssigningId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'my-reviews'] });
    },
  });

  const submissions = data?.submissions ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fila de revisão</h1>
            <p className="text-muted-foreground mt-2">
              Artigos enviados para revisão e ainda sem responsável.
            </p>
          </div>
          <Link to="/admin/minhas-revisoes">
            <Button variant="outline">Minhas revisões</Button>
          </Link>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Carregando submissões…
          </div>
        )}

        {isError && (
          <div
            className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive"
            role="alert"
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Não foi possível carregar a fila</p>
              <p className="text-sm mt-1">
                {error instanceof ApiError
                  ? error.message
                  : 'Erro inesperado. Tente novamente em instantes.'}
              </p>
            </div>
          </div>
        )}

        {!isLoading && !isError && submissions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Inbox className="h-10 w-10 mb-3" />
            <p className="font-medium">Nenhum artigo pendente</p>
            <p className="text-sm mt-1">
              Todos os artigos enviados já possuem um responsável.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {submissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              onAssign={(id) => assignMutation.mutate(id)}
              isAssigning={assigningId === submission.id}
            />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}