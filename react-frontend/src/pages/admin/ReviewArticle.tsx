import { useState, useEffect} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, AlertCircle, ArrowLeft, Save, Plus, Trash2, X,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { ApiError } from '@/lib/api';

// ─── tipos ────────────────────────────────────────────────────────────────────

interface BibItem {
  year: string;
  title: string;
  author: string;
  location?: string;
  publisher?: string;
}

interface Submission {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  category?: string;
  keywords?: string[];
  author_name?: string;
  author_institution?: string;
  author_email?: string;
  doi?: string;
  status: string;
  metadata?: {
    bibliography?: BibItem[];
    zenodo?: {
      depositionId?: number;
      doi?: string;
      doiUrl?: string;
      recordUrl?: string;
      publishedAt?: string;
    };
    [key: string]: unknown;
  };
}

interface Suggestion {
  id: string;
  admin_name?: string;
  suggested_title?: string;
  suggested_summary?: string;
  suggested_content?: string;
  suggested_category?: string;
  suggested_keywords?: string[];
  notes: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

interface ReviewDetail {
  submission: Submission;
  pendingSuggestion: Suggestion | null;
  zenodoEnabled?: boolean;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1337/api';

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new ApiError('Sessão expirada', 401);

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const json = await res.json();
  if (!res.ok) throw new ApiError(json.message || `HTTP ${res.status}`, res.status);
  return json.data as T;
}

// ─── componente principal ─────────────────────────────────────────────────────

export default function ReviewArticle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'original' | 'editing'>('original');
  const [formReady, setFormReady] = useState(false);

  // confirmação de ação
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approved' | 'rejected' | null;
  }>({ open: false, action: null });
  const [depositToZenodo, setDepositToZenodo] = useState(true);

  // campos editáveis
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorInst, setAuthorInst] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [bibliography, setBibliography] = useState<BibItem[]>([]);
  const [notes, setNotes] = useState('');

  // ── buscar submissão ───────────────────────────────────────
  const { data, isLoading, isError, error } = useQuery<ReviewDetail>({
    queryKey: ['admin', 'review-detail', id],
    queryFn: () => adminFetch<ReviewDetail>(`/admin/review/submissions/${id}/review-detail`),
    enabled: !!id,
  });

  useEffect(() => {
      if (!data || formReady) return;

      const sub = data.submission;
      const pending = data.pendingSuggestion;

      setTitle(pending?.suggested_title ?? sub.title ?? '');
      setSummary(pending?.suggested_summary ?? sub.summary ?? '');
      setContent(pending?.suggested_content ?? sub.content ?? '');
      setCategory(pending?.suggested_category ?? sub.category ?? '');
      setAuthorName(sub.author_name ?? '');
      setAuthorInst(sub.author_institution ?? '');
      setKeywords(pending?.suggested_keywords ?? sub.keywords ?? []);
      setBibliography(sub.metadata?.bibliography ?? []);
      setNotes(pending?.notes ?? '');
      setFormReady(true);
      }, [data, formReady]);

  // ── keywords ──────────────────────────────────────────────
  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (kw && !keywords.includes(kw)) setKeywords([...keywords, kw]);
    setNewKeyword('');
  };
  const removeKeyword = (kw: string) => setKeywords(keywords.filter(k => k !== kw));

  // ── bibliografia ──────────────────────────────────────────
  const addBibItem = () =>
    setBibliography([...bibliography, { year: '', title: '', author: '', location: '', publisher: '' }]);
  const updateBibItem = (index: number, field: keyof BibItem, value: string) =>
    setBibliography(bibliography.map((item, i) => i === index ? { ...item, [field]: value } : item));
  const removeBibItem = (index: number) =>
    setBibliography(bibliography.filter((_, i) => i !== index));

  // ── salvar sugestão ───────────────────────────────────────
  const sub = data?.submission;

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = { notes };
      if (title !== sub?.title) payload.suggested_title = title;
      if (summary !== sub?.summary) payload.suggested_summary = summary;
      if (content !== sub?.content) payload.suggested_content = content;
      if (category !== sub?.category) payload.suggested_category = category;
      if (JSON.stringify(keywords) !== JSON.stringify(sub?.keywords)) payload.suggested_keywords = keywords;

      return adminFetch(`/admin/review/submissions/${id}/suggestions`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'review-detail', id] });
    },
  });

  // ── atualizar status (aprovar/rejeitar) ────────────────────
  const statusMutation = useMutation({
    mutationFn: (newStatus: 'approved' | 'rejected') =>
      adminFetch(`/admin/review/submissions/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'review-detail', id] });
    },
  });

  // ── publicar artigo ────────────────────────────────────────
  const publishMutation = useMutation({
    mutationFn: () =>
      adminFetch<{
        articleUrl?: string;
        zenodo?: { doi?: string; recordUrl?: string };
      }>(`/admin/review/submissions/${id}/publish`, {
        method: 'POST',
        body: JSON.stringify({ depositToZenodo }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'review-detail', id] });
    },
  });

  // ─── loading / erro ───────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !sub) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-10 max-w-4xl">
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p>{error instanceof ApiError ? error.message : 'Erro ao carregar submissão.'}</p>
          </div>
        </main>
      </div>
    );
  }

  const hasPending = !!data?.pendingSuggestion;
  const zenodoEnabled = data?.zenodoEnabled ?? false;
  const isApproved = sub.status?.toUpperCase() === 'APPROVED';
  const isPublished = sub.status?.toUpperCase() === 'PUBLISHED';
  const zenodoDoi = sub.doi ?? sub.metadata?.zenodo?.doi;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-10 max-w-4xl space-y-6">

        {/* ── Cabeçalho ────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">{sub.title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {sub.author_name}
              {sub.author_institution && ` · ${sub.author_institution}`}
            </p>
          </div>
          <Badge variant={hasPending ? 'destructive' : 'secondary'}>
            {hasPending ? 'Sugestão pendente' : sub.status}
          </Badge>
        </div>

        {/* ── Abas ─────────────────────────────────────────── */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('original')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'original'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Original
          </button>
          <button
            onClick={() => setActiveTab('editing')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'editing'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Editando
            {hasPending && (
              <span className="ml-2 inline-flex items-center justify-center h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px]">
                1
              </span>
            )}
          </button>
        </div>

        {/* ── Aba: Original ─────────────────────────────────── */}
        {activeTab === 'original' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{sub.title}</CardTitle>
                {sub.summary && <CardDescription>{sub.summary}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {sub.category && <span className="font-medium">{sub.category}</span>}
                  {sub.author_name && <span>· {sub.author_name}</span>}
                  {sub.author_institution && <span>· {sub.author_institution}</span>}
                </div>
                {sub.keywords && sub.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {sub.keywords.map(kw => (
                      <Badge key={kw} variant="secondary">{kw}</Badge>
                    ))}
                  </div>
                )}
                <Separator />
                {zenodoDoi && (
                  <p className="text-sm text-muted-foreground">
                    DOI:{' '}
                    <a
                      href={sub.metadata?.zenodo?.doiUrl || `https://doi.org/${zenodoDoi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      {zenodoDoi}
                    </a>
                  </p>
                )}
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: sub.content ?? '' }}
                />
              </CardContent>
            </Card>

            {/* Botões de ação */}
            <div className="flex justify-end gap-3">
              {!isPublished && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => setConfirmDialog({ open: true, action: 'rejected' })}
                    disabled={statusMutation.isPending || publishMutation.isPending}
                  >
                    {statusMutation.isPending && statusMutation.variables === 'rejected' ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Rejeitando…</>
                    ) : (
                      'Rejeitar'
                    )}
                  </Button>
                  {!isApproved && (
                    <Button
                      onClick={() => {
                        setDepositToZenodo(true);
                        setConfirmDialog({ open: true, action: 'approved' });
                      }}
                      disabled={statusMutation.isPending || publishMutation.isPending}
                    >
                      {statusMutation.isPending && statusMutation.variables === 'approved' ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Aprovando…</>
                      ) : (
                        'Aprovar'
                      )}
                    </Button>
                  )}
                  {isApproved && (
                    <Button
                      onClick={() => publishMutation.mutate()}
                      disabled={statusMutation.isPending || publishMutation.isPending}
                    >
                      {publishMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Publicando…</>
                      ) : (
                        'Publicar'
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Feedback de status */}
            {publishMutation.isError && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p>{publishMutation.error instanceof ApiError ? publishMutation.error.message : 'Erro ao publicar artigo.'}</p>
              </div>
            )}
            {publishMutation.isSuccess && (
              <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-3 text-sm text-green-800 dark:text-green-200">
                Artigo publicado com sucesso!
              </div>
            )}
            {statusMutation.isError && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p>{statusMutation.error instanceof ApiError ? statusMutation.error.message : 'Erro ao atualizar status.'}</p>
              </div>
            )}
            {statusMutation.isSuccess && (
              <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-3 text-sm text-green-800 dark:text-green-200">
                Status atualizado com sucesso!
              </div>
            )}
          </div>
        )}

        {/* ── Aba: Editando ─────────────────────────────────── */}
        {activeTab === 'editing' && (
          <div className="space-y-6">

            {/* Aviso de sugestão pendente */}
            {hasPending && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 p-3 text-sm text-amber-800 dark:text-amber-200">
                Já existe uma sugestão pendente de <strong>{data.pendingSuggestion!.admin_name ?? 'outro curador'}</strong>.
                Ao salvar, ela será substituída pela sua versão.
              </div>
            )}

            {/* Campos básicos */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="r-title">Título</Label>
                <Input id="r-title" value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="r-summary">Resumo</Label>
                <textarea
                  id="r-summary"
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="r-category">Categoria</Label>
                  <select
                    id="r-category"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Sem categoria</option>
                    <option value="pessoa">Pessoa</option>
                    <option value="evento">Evento</option>
                    <option value="instituicao">Instituição</option>
                    <option value="tema">Tema</option>
                    <option value="obra">Obra</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="r-author">Autor</Label>
                  <Input id="r-author" value={authorName} onChange={e => setAuthorName(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="r-institution">Instituição do autor</Label>
                <Input id="r-institution" value={authorInst} onChange={e => setAuthorInst(e.target.value)} />
              </div>
            </div>

            <Separator />

            {/* Keywords */}
            <div className="space-y-3">
              <Label>Palavras-chave</Label>
              <div className="flex flex-wrap gap-2">
                {keywords.map(kw => (
                  <Badge key={kw} variant="secondary" className="gap-1 pr-1">
                    {kw}
                    <button onClick={() => removeKeyword(kw)} className="ml-1 hover:text-destructive">
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Nova palavra-chave..."
                  value={newKeyword}
                  onChange={e => setNewKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addKeyword()}
                />
                <Button variant="outline" onClick={addKeyword} type="button">
                  <Plus size={16} />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Conteúdo */}
            <div className="space-y-2">
              <Label htmlFor="r-content">Conteúdo principal</Label>
              <textarea
                id="r-content"
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={20}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              />
            </div>

            <Separator />

            {/* Bibliografia */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Bibliografia</Label>
                <Button variant="outline" size="sm" onClick={addBibItem} type="button">
                  <Plus size={14} className="mr-1" /> Adicionar item
                </Button>
              </div>

              {bibliography.length === 0 && (
                <p className="text-sm text-muted-foreground italic">Nenhum item de bibliografia.</p>
              )}

              {bibliography.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3 relative">
                  <button
                    onClick={() => removeBibItem(index)}
                    className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                    type="button"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Ano</Label>
                      <Input value={item.year} onChange={e => updateBibItem(index, 'year', e.target.value)} placeholder="2024" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Autor</Label>
                      <Input value={item.author} onChange={e => updateBibItem(index, 'author', e.target.value)} placeholder="SOBRENOME, Nome" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Título</Label>
                    <Input value={item.title} onChange={e => updateBibItem(index, 'title', e.target.value)} placeholder="Título da obra" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Local</Label>
                      <Input value={item.location ?? ''} onChange={e => updateBibItem(index, 'location', e.target.value)} placeholder="São Paulo" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Editora</Label>
                      <Input value={item.publisher ?? ''} onChange={e => updateBibItem(index, 'publisher', e.target.value)} placeholder="Editora" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Notas do curador */}
            <div className="space-y-2">
              <Label htmlFor="r-notes">
                Notas do curador <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Explique o motivo das sugestões — observações editoriais, pedidos de esclarecimento, referências faltando, etc.
              </p>
              <textarea
                id="r-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={6}
                placeholder="Ex: O título está impreciso pois… O segundo parágrafo precisa de fonte pois…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              />
            </div>

            {/* Feedback */}
            {saveMutation.isError && (
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {saveMutation.error instanceof ApiError ? saveMutation.error.message : 'Erro ao salvar sugestão.'}
              </p>
            )}
            {saveMutation.isSuccess && (
              <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950 p-3 rounded-md">
                Sugestão salva. O status da submissão foi atualizado para "Correções solicitadas".
              </p>
            )}

            {/* Botões */}
            <div className="flex justify-end gap-3 pb-8">
              <Button variant="outline" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !notes.trim()}
              >
                {saveMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando…</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />{hasPending ? 'Atualizar sugestão' : 'Enviar sugestão'}</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Diálogo de confirmação */}
        {confirmDialog.open && confirmDialog.action && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-card text-card-foreground w-full max-w-md rounded-lg border shadow-lg p-6 relative">
              <button 
                onClick={() => setConfirmDialog({ open: false, action: null })}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              
              <h2 className="text-lg font-semibold tracking-tight mb-2">
                {confirmDialog.action === 'approved' ? 'Aprovar submissão?' : 'Rejeitar submissão?'}
              </h2>
              
              <div className="text-sm text-muted-foreground mb-6">
                {confirmDialog.action === 'approved'
                  ? 'Tem certeza que deseja aprovar esta submissão? O autor será notificado.'
                  : 'Tem certeza que deseja rejeitar esta submissão? O autor será notificado.'}
              </div>

              {confirmDialog.action === 'approved' && zenodoEnabled && (
                <label className="flex items-start gap-3 mb-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={depositToZenodo}
                    onChange={(e) => setDepositToZenodo(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm">
                    <span className="font-medium text-foreground">Depositar no Zenodo e atribuir DOI</span>
                    <span className="block text-muted-foreground mt-0.5">
                      Preferência salva para quando o artigo for publicado.
                    </span>
                  </span>
                </label>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setConfirmDialog({ open: false, action: null })}>
                  Cancelar
                </Button>
                <Button 
                  variant={confirmDialog.action === 'rejected' ? 'destructive' : 'default'}
                  onClick={() => {
                    statusMutation.mutate(confirmDialog.action!);
                    setConfirmDialog({ open: false, action: null });
                  }}
                  disabled={publishMutation.isPending || statusMutation.isPending}
                >
                  {confirmDialog.action === 'approved' ? 'Aprovar' : 'Rejeitar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}