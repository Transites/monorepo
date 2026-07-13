import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

type TabStatus = 'NO_REVIEW' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

const TABS: { id: TabStatus; label: string }[] = [
  { id: 'NO_REVIEW', label: 'Sem revisão' },
  { id: 'UNDER_REVIEW', label: 'Sob revisão' },
  { id: 'APPROVED', label: 'Aprovados' },
  { id: 'REJECTED', label: 'Rejeitados' },
];

// Aqui nós dizemos exatamente quais status do banco pertencem a qual aba
const STATUS_MAP: Record<TabStatus, string[]> = {
  NO_REVIEW: ['SUBMITTED'],
  UNDER_REVIEW: ['UNDER_REVIEW', 'CHANGES_REQUESTED'],
  APPROVED: ['APPROVED'],
  REJECTED: ['REJECTED'],
};

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

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/admin/revisar/${submission.id}`);
  };

  return (
    <Card onClick={handleCardClick} className="cursor-pointer hover:border-primary/50 transition-colors">
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
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Enviado em {formatDate(submission.createdAt)}
            </p>
            {submission.assignedToName && (
              //console.log(submission.assignedToName);
              <p className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md inline-block w-fit">
                Responsável: <span className="font-medium text-foreground">{submission.assignedToName}</span>
              </p>
            )}
          </div>
          
          {!submission.assignedTo && submission.status?.toUpperCase() !== 'APPROVED' && submission.status?.toUpperCase() !== 'REJECTED' && (
            <Button
              size="sm"
              onClick={() => onAssign(submission.id)}
              disabled={isAssigning}
            >
              {isAssigning ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Atribuindo…</>
              ) : (
                <><UserPlus className="h-4 w-4 mr-2" /> Tornar-se responsável</>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReviewQueue() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabStatus>('NO_REVIEW');
  const [assigningId, setAssigningId] = useState<string | null>(null);

  // ──────────────────────────────────
  const { data, isLoading, isError, error } = useQuery({
    // A chave agora inclui a aba. Ao mudar de aba, o React refaz a busca.
    queryKey: ['admin', 'review-queue', activeTab],
    queryFn: () => getReviewQueue({
      limit: 50,
      status: STATUS_MAP[activeTab],
      // Se estiver na aba sem revisão, pedimos só os artigos que não têm dono
      unassigned: activeTab === 'NO_REVIEW' ? true : undefined,
    }),
  });

  const assignMutation = useMutation({
    mutationFn: assignSubmission,
    onMutate: (id: string) => setAssigningId(id),
    onSettled: () => setAssigningId(null),
    onSuccess: () => {
      // Invalida a busca atual para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['admin', 'review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'my-reviews'] });
    },
  });

  // Não precisamos mais daquele "filteredSubmissions" gigante. 
  // O backend já nos entrega a lista pronta e mastigada.
  const submissions = data?.submissions ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fila de revisão</h1>
            <p className="text-muted-foreground mt-2">
              Artigos enviados para revisão e acompanhamento geral.
            </p>
          </div>
          <Link to="/admin/minhas-revisoes">
            <Button variant="outline">Minhas revisões</Button>
          </Link>
        </div>

        {/* ─── ABAS (Sem os contadores para evitar bugs) ─────────── */}
        <div className="flex border-b mb-6 overflow-x-auto hide-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Carregando submissões…
          </div>
        )}

        {isError && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Não foi possível carregar a fila</p>
              <p className="text-sm mt-1">
                {error instanceof ApiError ? error.message : 'Erro inesperado.'}
              </p>
            </div>
          </div>
        )}

        {!isLoading && !isError && submissions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border border-dashed rounded-lg">
            <Inbox className="h-10 w-10 mb-3 opacity-20" />
            <p className="font-medium">Nenhum artigo encontrado</p>
            <p className="text-sm mt-1">
              A fila "{TABS.find(t => t.id === activeTab)?.label}" está vazia.
            </p>
          </div>
        )}

        {/* ─── RENDERIZAÇÃO DIRETA ───────────────────────────────── */}
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