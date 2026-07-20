import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertCircle, Inbox, UserMinus, Clock, X } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';
import {
  getMyReviews,
  unassignSubmission,
  ApiError,
  type AdminSubmission,
} from '@/lib/api';

// helpers 

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

type TabStatus = 'UNDER_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED';

const TABS: { id: TabStatus; label: string }[] = [
  { id: 'UNDER_REVIEW', label: 'Em revisão' },
  { id: 'CHANGES_REQUESTED', label: 'Correções solicitadas' },
  { id: 'APPROVED', label: 'Aprovados' },
  { id: 'REJECTED', label: 'Rejeitados' },
];

// subcomponentes 

function SubmissionCard({
  submission,
  onUnassignRequest,
  isUnassigning,
}: {
  submission: AdminSubmission;
  onUnassignRequest: (submission: AdminSubmission) => void;
  isUnassigning: boolean;
}) {
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/admin/revisar/${submission.id}`);
  };

  // Normalizando status para uppercase para garantir a comparação
  const status = submission.status?.toUpperCase();
  const canUnassign = status === 'UNDER_REVIEW' || status === 'CHANGES_REQUESTED';

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
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Enviado em {formatDate(submission.createdAt)}
          </p>
          
          <div className="flex gap-2">
            {canUnassign && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUnassignRequest(submission)}
                disabled={isUnassigning}
              >
                {isUnassigning ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Devolvendo…</>
                ) : (
                  <><UserMinus className="h-4 w-4 mr-2" /> Devolver à fila</>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// componente principal 

export default function MyReviews() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabStatus>('UNDER_REVIEW');
  const [unassigningId, setUnassigningId] = useState<string | null>(null);
  
  // Estado para controlar o modal de confirmação de devolução
  const [unassignConfirm, setUnassignConfirm] = useState<AdminSubmission | null>(null);

  const adminId = user?.id;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'my-reviews', adminId],
    queryFn: () => getMyReviews(adminId as string, { limit: 50 }),
    enabled: !!adminId,
  });

  const unassignMutation = useMutation({
    mutationFn: unassignSubmission,
    onMutate: (id: string) => {
      setUnassigningId(id);
      setUnassignConfirm(null); // Fecha o modal ao iniciar a mutação
    },
    onSettled: () => setUnassigningId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'my-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'review-queue'] });
    },
  });

  const submissions = data?.submissions ?? [];

  // Filtra as submissões localmente com base na aba ativa
  const filteredSubmissions = submissions.filter(
    (sub) => sub.status?.toUpperCase() === activeTab
  );

  return (
    <div className="min-h-screen bg-background relative">
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

        {/* ── Abas ─────────────────────────────────────────── */}
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
              {/* Opcional: Contador por aba */} 
             {/*<span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs">
                {submissions.filter(s => s.status?.toUpperCase() === tab.id).length}
              </span> */}
            </button>
          ))}
        </div>

        {/* ── Status de Carregamento / Erro ────────────────── */}
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
              <p className="font-medium">Não foi possível carregar suas revisões</p>
              <p className="text-sm mt-1">
                {error instanceof ApiError
                  ? error.message
                  : 'Erro inesperado. Tente novamente em instantes.'}
              </p>
            </div>
          </div>
        )}

        {/* ── Lista Vazia ──────────────────────────────────── */}
        {!isLoading && !isError && filteredSubmissions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border border-dashed rounded-lg">
            <Inbox className="h-10 w-10 mb-3 opacity-20" />
            <p className="font-medium">Nenhum artigo encontrado</p>
            <p className="text-sm mt-1">
              Você não possui artigos com o status "{TABS.find(t => t.id === activeTab)?.label}".
            </p>
          </div>
        )}

        {/* ── Lista de Submissões ──────────────────────────── */}
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              onUnassignRequest={(sub) => setUnassignConfirm(sub)}
              isUnassigning={unassigningId === submission.id}
            />
          ))}
        </div>
      </main>

      <Footer />

      {/* ── Modal de Confirmação de Devolução ────────────── */}
      {unassignConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card text-card-foreground w-full max-w-md rounded-lg border shadow-lg p-6 relative">
            <button 
              onClick={() => setUnassignConfirm(null)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            
            <h2 className="text-lg font-semibold tracking-tight mb-2">
              Devolver à fila de revisão?
            </h2>
            
            <div className="text-sm text-muted-foreground mb-6">
              {unassignConfirm.status?.toUpperCase() === 'CHANGES_REQUESTED' ? (
                <div className="space-y-2">
                  <p>
                    <strong>Atenção:</strong> Este artigo está com status de <em>Correções solicitadas</em>. 
                  </p>
                  <p>
                    Você já fez sugestões ou interações neste conteúdo. Se devolvê-lo, ele ficará disponível para qualquer outro curador assumir o seu lugar. Tem certeza?
                  </p>
                </div>
              ) : (
                <p>
                  O artigo <strong>"{unassignConfirm.title}"</strong> voltará para a fila geral e você deixará de ser o revisor responsável. Deseja continuar?
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setUnassignConfirm(null)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => unassignMutation.mutate(unassignConfirm.id)}
              >
                Sim, devolver à fila
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}