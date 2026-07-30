import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle, Edit3, X, Plus, Save, History, MessageSquare, Trash2, ImagePlus } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  getSubmissionSuggestions,
  getSubmissionVersions,
  acceptSuggestion,
  counterSuggestion,
  getSubmissionById,
  uploadSubmissionMedia,
  authorSetSubmissionMedia,
  authorRemoveSubmissionMedia,
  ApiError,
  type SubmissionSuggestion,
  type SubmissionVersion,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface BibItem {
  year: string;
  title: string;
  author: string;
  location?: string;
  publisher?: string;
}

// ── Funções Auxiliares para o Metadata e Bibliografia ────────
const getMeta = (data: any) => {
  if (!data) return {};
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return {}; }
  }
  return data;
};

const formatBib = (bibArray: any) => {
  if (!Array.isArray(bibArray) || bibArray.length === 0) return '';
  return bibArray
    .map((b: any) => {
      const author = b.author ? `${b.author} ` : '';
      const year = b.year ? `(${b.year}). ` : '';
      const title = b.title ? `${b.title}. ` : '';
      const locPub = [b.location, b.publisher].filter(Boolean).join(': ');
      return `${author}${year}${title}${locPub}`.trim();
    })
    .join('\n\n');
};

function DiffField({ label, original, suggested }: {
  label: string;
  original?: string | null;
  suggested?: string | null;
}) {
  if (suggested === undefined || suggested === null) return null;
  const origStr = String(original || '').trim();
  const suggStr = String(suggested || '').trim();
  if (origStr === suggStr) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md max-h-96 overflow-y-auto">
          <p className="text-xs font-medium text-destructive mb-2">Original</p>
          <p className="text-sm whitespace-pre-wrap break-words">{origStr || '—'}</p>
        </div>
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-md max-h-96 overflow-y-auto">
          <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-2">Sugestão</p>
          <p className="text-sm whitespace-pre-wrap break-words">{suggStr}</p>
        </div>
      </div>
    </div>
  );
}

type Tab = 'suggestions' | 'versions' | 'counter';

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>('versions');
  const [counteringId, setCounteringId] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<SubmissionVersion | null>(null);

  // Campos básicos da contra-proposta
  const [title, setTitle]         = useState('');
  const [summary, setSummary]     = useState('');
  const [content, setContent]     = useState('');
  const [category, setCategory]   = useState('');
  const [keywords, setKeywords]   = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [authorNotes, setAuthorNotes] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);

  // ── Novos Estados (Metadata) ────────────────────────────────
  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [deathPlace, setDeathPlace] = useState('');
  const [occupations, setOccupations] = useState<string[]>([]);
  const [newOccupation, setNewOccupation] = useState('');
  const [organizations, setOrganizations] = useState<string[]>([]);
  const [newOrganization, setNewOrganization] = useState('');
  const [alternativeNames, setAlternativeNames] = useState<string[]>([]);
  const [newAlternativeName, setNewAlternativeName] = useState('');
  const [bibliography, setBibliography] = useState<BibItem[]>([]);

  const { isAuthenticated, loading: authLoading } = useAuth();

  const { data: submission } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => getSubmissionById(id!),
    enabled: !!id && !authLoading && !!isAuthenticated,
  });

  // Só sugestões do curador (created_by = 'admin')
  const { data: allSuggestions, isLoading: loadingSuggestions } = useQuery({
    queryKey: ['author', 'suggestions', id],
    queryFn: () => getSubmissionSuggestions(id!),
    enabled: !!id && !authLoading && !!isAuthenticated,
  });
  const suggestions = allSuggestions?.filter(s => s.created_by === 'admin') ?? [];

  const { data: versions, isLoading: loadingVersions } = useQuery({
    queryKey: ['author', 'versions', id],
    queryFn: () => getSubmissionVersions(id!),
    enabled: !!id && !authLoading && !!isAuthenticated,
  });

  const acceptMutation = useMutation({
    mutationFn: (suggestionId: string) => acceptSuggestion(id!, suggestionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['author', 'suggestions', id] });
      queryClient.invalidateQueries({ queryKey: ['author', 'versions', id] });
      queryClient.invalidateQueries({ queryKey: ['submission', id] });
    },
  });

  const counterMutation = useMutation({
    mutationFn: async () => {
      // Helper para formatar a data de nascimento e morte
      const formatLifeEvent = (dateStr: string, placeStr: string) => {
        let formattedDate = '';
        if (dateStr) {
          const [y, m, d] = dateStr.split('-');
          const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
          if (y && m && d) formattedDate = `${parseInt(d, 10)} de ${months[parseInt(m, 10) - 1]} de ${y}`;
        }
        return [formattedDate, placeStr].filter(Boolean).join(', ');
      };

      const newMetadata: any = { ...getMeta((submission as any)?.metadata) };

      if (occupations.length > 0) newMetadata.occupation = occupations;
      else delete newMetadata.occupation;

      if (organizations.length > 0) newMetadata.organizations = organizations;
      else delete newMetadata.organizations;

      if (alternativeNames.length > 0) newMetadata.alternativeNames = alternativeNames;
      else delete newMetadata.alternativeNames;
      
      if (bibliography.length > 0) newMetadata.bibliography = bibliography;
      else delete newMetadata.bibliography;

      if (category === 'pessoa') {
        if (birthDate || birthPlace) {
          newMetadata.birth = { date: birthDate || undefined, place: birthPlace || undefined, formatted: formatLifeEvent(birthDate, birthPlace) || undefined };
        } else {
          delete newMetadata.birth;
        }
        if (deathDate || deathPlace) {
          newMetadata.death = { date: deathDate || undefined, place: deathPlace || undefined, formatted: formatLifeEvent(deathDate, deathPlace) || undefined };
        } else {
          delete newMetadata.death;
        }
      } else {
        delete newMetadata.birth;
        delete newMetadata.death;
      }

      await counterSuggestion(id!, counteringId!, {
        suggested_title:    title,
        suggested_summary:  summary,
        suggested_content:  content,
        suggested_category: category,
        suggested_keywords: keywords,
        suggested_metadata: newMetadata, // Anexando o novo metadata ao payload
        notes:              authorNotes,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['author', 'suggestions', id] });
      queryClient.invalidateQueries({ queryKey: ['author', 'versions', id] });
      queryClient.invalidateQueries({ queryKey: ['author', 'my-submissions'] });
      setActiveTab('suggestions');
      setCounteringId(null);
    },
    onError: (error: any) => {
      alert(error.message || 'Erro ao enviar. Tente novamente.');
    },
  });

  const setImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const uploaded = await uploadSubmissionMedia(file);
      await authorSetSubmissionMedia(id!, {
        type: uploaded.resourceType,
        url: uploaded.url,
        publicId: uploaded.publicId,
      });
    },
    onSuccess: () => {
      setImageError(null);
      queryClient.invalidateQueries({ queryKey: ['submission', id] });
    },
    onError: (error: any) => {
      setImageError(error instanceof ApiError ? error.message : 'Falha ao enviar a imagem/vídeo. Tente novamente.');
    },
  });

  const removeImageMutation = useMutation({
    mutationFn: () => authorRemoveSubmissionMedia(id!),
    onSuccess: () => {
      setImageError(null);
      queryClient.invalidateQueries({ queryKey: ['submission', id] });
    },
    onError: (error: any) => {
      setImageError(error instanceof ApiError ? error.message : 'Falha ao remover a imagem/vídeo. Tente novamente.');
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setImageError('Selecione um arquivo de imagem ou vídeo válido.');
      return;
    }
    setImageMutation.mutate(file);
  };

  const handleStartCounter = (s: SubmissionSuggestion) => {
    setTitle(s.suggested_title ?? submission?.title ?? '');
    setSummary(s.suggested_summary ?? submission?.summary ?? '');
    setCategory(s.suggested_category ?? submission?.category ?? '');
    setKeywords(s.suggested_keywords ?? submission?.keywords ?? []);
    setContent(s.suggested_content ?? submission?.content ?? '');

    // Leitura segura do metadata garantindo que a sugestão seja priorizada se existir
    const hasSuggestedMeta = (s as any).suggested_metadata !== undefined && (s as any).suggested_metadata !== null;
    const meta = hasSuggestedMeta ? getMeta((s as any).suggested_metadata) : getMeta((submission as any)?.metadata);

    setBirthDate(meta.birth?.date ?? '');
    setBirthPlace(meta.birth?.place ?? '');
    setDeathDate(meta.death?.date ?? '');
    setDeathPlace(meta.death?.place ?? '');
    setOccupations(meta.occupation ?? []);
    setOrganizations(meta.organizations ?? []);
    setAlternativeNames(meta.alternativeNames ?? []);
    setBibliography(meta.bibliography ?? []);

    setAuthorNotes('');
    setCounteringId(s.id);
    setActiveTab('counter');
  };

  // ── Funções de Array (Keywords e Metadata) ──────────────────
  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (kw && !keywords.includes(kw)) setKeywords([...keywords, kw]);
    setNewKeyword('');
  };

  const addOccupation = () => {
    const occ = newOccupation.trim();
    if (occ && !occupations.includes(occ)) setOccupations([...occupations, occ]);
    setNewOccupation('');
  };
  const removeOccupation = (occ: string) => setOccupations(occupations.filter((o) => o !== occ));

  const addOrganization = () => {
    const org = newOrganization.trim();
    if (org && !organizations.includes(org)) setOrganizations([...organizations, org]);
    setNewOrganization('');
  };
  const removeOrganization = (org: string) => setOrganizations(organizations.filter((o) => o !== org));

  const addAlternativeName = () => {
    const an = newAlternativeName.trim();
    if (an && !alternativeNames.includes(an)) setAlternativeNames([...alternativeNames, an]);
    setNewAlternativeName('');
  };
  const removeAlternativeName = (an: string) => setAlternativeNames(alternativeNames.filter((a) => a !== an));
  
  // ── Bibliografia ───────────────────────────────────────────
  const addBibItem = () =>
    setBibliography([...bibliography, { year: '', title: '', author: '', location: '', publisher: '' }]);
  const updateBibItem = (index: number, field: keyof BibItem, value: string) =>
    setBibliography(bibliography.map((item, i) => i === index ? { ...item, [field]: value } : item));
  const removeBibItem = (index: number) =>
    setBibliography(bibliography.filter((_, i) => i !== index));

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'versions',    label: 'Histórico de versões', icon: <History className="h-4 w-4" /> },
    { key: 'suggestions', label: 'Sugestões do curador', icon: <MessageSquare className="h-4 w-4" /> },
    { key: 'counter',     label: 'Nova versão',          icon: <Edit3 className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => navigate('/minhas-submissoes')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">{submission?.title ?? 'Carregando…'}</h1>
          <p className="text-muted-foreground mt-2">Revisão editorial</p>
          {submission?.metadata?.video?.url ? (
            <div className="mt-4">
              <video src={submission.metadata.video.url} controls className="max-h-64 rounded-md border" />
              {submission.metadata.video.caption && (
                <p className="text-xs text-muted-foreground italic mt-1">{submission.metadata.video.caption}</p>
              )}
            </div>
          ) : submission?.metadata?.image?.url ? (
            <div className="mt-4">
              <img
                src={submission.metadata.image.url}
                alt={submission.metadata.image.alternativeText || submission.title}
                className="max-h-64 rounded-md border"
              />
              {submission.metadata.image.caption && (
                <p className="text-xs text-muted-foreground italic mt-1">{submission.metadata.image.caption}</p>
              )}
            </div>
          ) : null}
        </div>

        {/* Abas */}
        <div className="flex border-b mb-6 gap-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.key === 'counter' && !counteringId) return;
                setActiveTab(tab.key);
              }}
              disabled={tab.key === 'counter' && !counteringId}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Aba: Sugestões do curador */}
        {activeTab === 'suggestions' && (
          <div className="space-y-6">
            {loadingSuggestions && (
              <div className="flex justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loadingSuggestions && suggestions.length === 0 && (
              <p className="text-center text-muted-foreground py-16">
                Nenhuma sugestão pendente do curador.
              </p>
            )}

            {suggestions.map(s => (
              <Card key={s.id} className={s.status !== 'pending' ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-base">
                        Sugestão de {s.admin_name ?? 'curador'}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(s.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge variant={
                      s.status === 'accepted' ? 'default' :
                      s.status === 'rejected' ? 'destructive' : 'secondary'
                    }>
                      {s.status === 'pending'   ? 'Pendente'  :
                       s.status === 'accepted'  ? 'Aceita'    : 'Resolvida'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {s.notes && (
                    <div className="p-4 bg-muted/40 rounded-lg border-l-4 border-primary">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Notas do curador</p>
                      <p className="text-sm whitespace-pre-wrap">{s.notes}</p>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-5">
                    <DiffField label="Título"         original={submission?.title}                    suggested={s.suggested_title} />
                    <DiffField label="Resumo"         original={submission?.summary}                  suggested={s.suggested_summary} />
                    <DiffField label="Categoria"      original={submission?.category}                 suggested={s.suggested_category} />
                    <DiffField label="Palavras-chave" original={submission?.keywords?.join(', ')}     suggested={s.suggested_keywords?.join(', ')} />
                    <DiffField label="Conteúdo"       original={submission?.content}                  suggested={s.suggested_content} />
                    
                    {/* O Campo de Bibliografia Adicionado Aqui! */}
                    <DiffField 
                      label="Bibliografia" 
                      original={formatBib(getMeta((submission as any)?.metadata).bibliography)} 
                      suggested={(s as any).suggested_metadata ? formatBib(getMeta((s as any).suggested_metadata).bibliography) : null} 
                    />
                  </div>

                  {s.status === 'pending' && (
                    <>
                      <Separator />
                      <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => handleStartCounter(s)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Fazer contra-proposta
                        </Button>
                        <Button
                          onClick={() => acceptMutation.mutate(s.id)}
                          disabled={acceptMutation.isPending && acceptMutation.variables === s.id}
                        >
                          {acceptMutation.isPending && acceptMutation.variables === s.id
                            ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            : <CheckCircle className="h-4 w-4 mr-2" />}
                          Aceitar e aplicar
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Aba: Histórico de versões */}
        {activeTab === 'versions' && (
          <div className="space-y-4">
            {loadingVersions && (
              <div className="flex justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loadingVersions && versions?.length === 0 && (
              <p className="text-center text-muted-foreground py-16">
                Nenhuma versão registrada ainda.
              </p>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
              {/* Lista de versões */}
              <div className="space-y-2">
                {versions?.map(v => (
                  <button
                    key={v.version_number}
                    onClick={() => setSelectedVersion(v)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      selectedVersion?.version_number === v.version_number
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Versão {v.version_number}</span>
                      <Badge variant="outline" className="text-xs">
                        {v.created_by === 'author' ? 'Autor' : 'Sistema'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(v.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </p>
                    {v.change_summary && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {v.change_summary}
                      </p>
                    )}
                  </button>
                ))}
              </div>

              {/* Detalhe da versão selecionada */}
              {selectedVersion ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Versão {selectedVersion.version_number}
                    </CardTitle>
                    {selectedVersion.change_summary && (
                      <div className="p-3 bg-muted/40 rounded-md border-l-4 border-primary mt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Notas</p>
                        <p className="text-sm">{selectedVersion.change_summary}</p>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Título</p>
                      <p className="text-sm">{selectedVersion.title}</p>
                    </div>
                    {selectedVersion.summary && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Resumo</p>
                        <p className="text-sm">{selectedVersion.summary}</p>
                      </div>
                    )}
                    {selectedVersion.content && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Conteúdo</p>
                        <p className="text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                          {selectedVersion.content}
                        </p>
                        <div className="text-right text-xs text-muted-foreground mt-1">
                          {selectedVersion.content.length} caracteres
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="flex items-center justify-center py-16 text-muted-foreground border rounded-lg">
                  <p className="text-sm">Selecione uma versão para visualizar</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Aba: Contra-proposta */}
        {activeTab === 'counter' && (
          <div className="space-y-6 bg-card p-6 rounded-lg border">
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950 p-4 text-sm text-blue-800 dark:text-blue-200">
              Você está criando uma nova versão com base nas sugestões do curador. Faça seus ajustes e explique as mudanças nas notas.
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Imagem ou vídeo de destaque</Label>
                <p className="text-xs text-muted-foreground">
                  É preciso remover a mídia atual antes de enviar uma nova. Apenas um arquivo (imagem ou vídeo) por artigo.
                </p>

                {submission?.metadata?.video?.url ? (
                  <div className="relative inline-block">
                    <video src={submission.metadata.video.url} controls className="max-h-64 rounded-md border" />
                    <button
                      type="button"
                      onClick={() => removeImageMutation.mutate()}
                      disabled={removeImageMutation.isPending}
                      className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-1 shadow disabled:opacity-50"
                      aria-label="Remover vídeo"
                    >
                      {removeImageMutation.isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <X size={14} />
                      )}
                    </button>
                  </div>
                ) : submission?.metadata?.image?.url ? (
                  <div className="relative inline-block">
                    <img
                      src={submission.metadata.image.url}
                      alt={submission.metadata.image.alternativeText || submission.title}
                      className="max-h-64 rounded-md border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImageMutation.mutate()}
                      disabled={removeImageMutation.isPending}
                      className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-1 shadow disabled:opacity-50"
                      aria-label="Remover imagem"
                    >
                      {removeImageMutation.isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <X size={14} />
                      )}
                    </button>
                  </div>
                ) : (
                  <>
                    <label
                      htmlFor="counter-image"
                      className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-input px-4 py-8 text-sm text-muted-foreground cursor-pointer hover:border-primary/50"
                    >
                      {setImageMutation.isPending ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <ImagePlus className="h-6 w-6" />
                      )}
                      Clique para selecionar uma imagem ou vídeo
                    </label>
                    <input
                      id="counter-image"
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleImageChange}
                      disabled={setImageMutation.isPending}
                      className="hidden"
                    />
                  </>
                )}

                {imageError && <p className="text-sm text-destructive">{imageError}</p>}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Resumo</Label>
                <textarea 
                  value={summary} 
                  onChange={e => setSummary(e.target.value)} 
                  rows={4}
                  maxLength={1000}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y" 
                />
                <div className="text-right text-xs text-muted-foreground mt-1">
                  {summary.length}/1000
                </div>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">Sem categoria</option>
                  <option value="pessoa">Pessoa</option>
                  <option value="evento">Evento</option>
                  <option value="instituicao">Instituição</option>
                  <option value="tema">Tema</option>
                  <option value="obra">Obra</option>
                </select>
              </div>

              {/* ── Novos Campos (Nascimento, Morte, Ocupação, etc) ── */}
              {category === 'pessoa' && (
                <div className="space-y-6 pt-2 pb-2">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Nascimento</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Data de Nascimento</Label>
                        <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Local de Nascimento</Label>
                        <Input value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} placeholder="Ex: São Paulo, Brasil" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Morte</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Data de Morte</Label>
                        <Input type="date" value={deathDate} onChange={(e) => setDeathDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Local de Morte</Label>
                        <Input value={deathPlace} onChange={(e) => setDeathPlace(e.target.value)} placeholder="Ex: São Paulo, Brasil" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 mt-4">
                <Label>Ocupação</Label>
                <div className="flex flex-wrap gap-2">
                  {occupations.map((occ) => (
                    <Badge key={occ} variant="secondary" className="gap-1 pr-1">
                      {occ}
                      <button type="button" onClick={() => removeOccupation(occ)} className="ml-1 hover:text-destructive">
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Ex: jornalista, advogado..." value={newOccupation} onChange={(e) => setNewOccupation(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOccupation(); } }} />
                  <Button variant="outline" onClick={addOccupation} type="button"><Plus size={16} /></Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Organizações</Label>
                <div className="flex flex-wrap gap-2">
                  {organizations.map((org) => (
                    <Badge key={org} variant="secondary" className="gap-1 pr-1">
                      {org}
                      <button type="button" onClick={() => removeOrganization(org)} className="ml-1 hover:text-destructive">
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Ex: O Estado de S. Paulo..." value={newOrganization} onChange={(e) => setNewOrganization(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOrganization(); } }} />
                  <Button variant="outline" onClick={addOrganization} type="button"><Plus size={16} /></Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Nomes Alternativos</Label>
                <div className="flex flex-wrap gap-2">
                  {alternativeNames.map((an) => (
                    <Badge key={an} variant="secondary" className="gap-1 pr-1">
                      {an}
                      <button type="button" onClick={() => removeAlternativeName(an)} className="ml-1 hover:text-destructive">
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Ex: Paulo Alfeu Junqueira..." value={newAlternativeName} onChange={(e) => setNewAlternativeName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAlternativeName(); } }} />
                  <Button variant="outline" onClick={addAlternativeName} type="button"><Plus size={16} /></Button>
                </div>
              </div>

              <Separator />

              {/* ── Palavras-chave ── */}
              <div className="space-y-3">
                <Label>Palavras-chave</Label>
                <div className="flex flex-wrap gap-2">
                  {keywords.map(kw => (
                    <Badge key={kw} variant="secondary" className="gap-1 pr-1">
                      {kw}
                      <button onClick={() => setKeywords(keywords.filter(k => k !== kw))} className="ml-1 hover:text-destructive">
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Nova palavra-chave..." value={newKeyword}
                    onChange={e => setNewKeyword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addKeyword()} />
                  <Button variant="outline" onClick={addKeyword} type="button"><Plus size={16} /></Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Conteúdo</Label>
                <textarea 
                  value={content} 
                  onChange={e => setContent(e.target.value)} 
                  rows={20}
                  maxLength={10000}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y" 
                />
                <div className="text-right text-xs text-muted-foreground mt-1">
                  {content.length}/10000
                </div>
              </div>

              <Separator />

              {/* ── Bibliografia ── */}
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

              <div className="space-y-2">
                <Label>Notas para o curador <span className="text-destructive">*</span></Label>
                <p className="text-xs text-muted-foreground">Explique por que você alterou certas partes.</p>
                <textarea value={authorNotes} onChange={e => setAuthorNotes(e.target.value)} rows={5}
                  placeholder="Ex: Aceitei a mudança no título, mas preferi manter o segundo parágrafo porque..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => { setActiveTab('suggestions'); setCounteringId(null); }}>
                Cancelar
              </Button>
              <Button onClick={() => counterMutation.mutate()} disabled={counterMutation.isPending || !authorNotes.trim()}>
                {counterMutation.isPending
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando…</>
                  : <><Save className="h-4 w-4 mr-2" />Enviar nova versão</>}
              </Button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}