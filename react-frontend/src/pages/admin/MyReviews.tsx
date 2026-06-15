import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertCircle, Inbox, UserMinus, Clock } from 'lucide-react';
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
import { useAuth } from '@/hooks/use-user';
import {
  getMyReviews,
  unassignSubmission,
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
  onUnassign,
  isUnassigning,
}: {
  submission: AdminSubmission;
  onUnassign: (id: string) => void;
  isUnassigning: boolean;
}) {
  return (
    <Card>
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
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUnassign(submission.id)}
              disabled={isUnassigning}
            >
              {isUnassigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Devolvendo…
                </>
              ) : (
                <>
                  <UserMinus className="h-4 w-4 mr-2" />
                  Devolver à fila
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyReviews() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [unassigningId, setUnassigningId] = useState<string | null>(null);

  const adminId = user?.id;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'my-reviews', adminId],
    queryFn: () => getMyReviews(adminId as string, { limit: 50 }),
    enabled: !!adminId,
  });

  const unassignMutation = useMutation({
    mutationFn: unassignSubmission,
    onMutate: (id: string) => setUnassigningId(id),
    onSettled: () => setUnassigningId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'my-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'review-queue'] });
    },
  });

  const submissions = data?.submissions ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Minhas revisões</h1>
            <p className="text-muted-foreground mt-2">
              Artigos pelos quais você é responsável.
            </p>
          </div>
          <Link to="/admin/fila-de-revisao">
            <Button variant="outline">Fila de revisão</Button>
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
              <p className="font-medium">Não foi possível carregar suas revisões</p>
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
            <p className="font-medium">Nenhuma revisão atribuída</p>
            <p className="text-sm mt-1">
              Vá até a fila de revisão para assumir um artigo.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {submissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              onUnassign={(id) => unassignMutation.mutate(id)}
              isUnassigning={unassigningId === submission.id}
            />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}