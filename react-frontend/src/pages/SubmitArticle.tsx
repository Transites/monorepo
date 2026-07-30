import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Save, X, Plus, Trash2, CheckCircle2, AlertCircle, Loader2, ImagePlus } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { createArticleSubmission, uploadSubmissionMedia, ApiError, type BibliographyItem } from '@/lib/api';
import {
  ARTICLE_EDITOR_CATEGORIES,
  ARTICLE_EDITOR_CATEGORY_LABELS,
  buildSubmissionPayload,
  validateSubmissionForm,
  type ArticleFormFields,
} from '@/lib/article-form';
import { useAuth } from '@/contexts/AuthContext';

export default function SubmitArticle() {
  const { user } = useAuth();
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Mesmos campos que ArticleEditor (+ e-mail de contato para submissão)
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('tema');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState(user?.email ?? '');
  const [authorInst, setAuthorInst] = useState('');
  const [content, setContent] = useState('');
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

  // ── Estados Anteriores ──────────────────────────────────────
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [bibliography, setBibliography] = useState<BibliographyItem[]>([]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaCaption, setMediaCaption] = useState('');
  const [mediaAlternativeText, setMediaAlternativeText] = useState('');

  // Lógica de Mutação adaptada para os estados manuais
  const mutation = useMutation({
    mutationFn: createArticleSubmission,
    onSuccess: () => {
      setSubmitSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Limpar formulário após sucesso
      setTitle('');
      setSummary('');
      setAuthorName('');
      setAuthorEmail('');
      setAuthorInst('');
      setContent('');
      setKeywords([]);
      setBibliography([]);
      setBirthDate('');
      setBirthPlace('');
      setDeathDate('');
      setDeathPlace('');
      setOccupations([]);
      setOrganizations([]);
      setAlternativeNames([]);
      setMediaCaption('');
      setMediaAlternativeText('');
      removeMedia();
    },
  });

  // ── Funções Auxiliares de Arrays ───────────────────────────
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

  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (kw && !keywords.includes(kw)) setKeywords([...keywords, kw]);
    setNewKeyword('');
  };
  const removeKeyword = (kw: string) => setKeywords(keywords.filter((k) => k !== kw));

  const addBibItem = () => {
    setBibliography([...bibliography, { year: '', title: '', author: '', location: '', publisher: '' }]);
  };
  const updateBibItem = (index: number, field: keyof BibliographyItem, value: string) => {
    const updated = bibliography.map((item, i) => i === index ? { ...item, [field]: value } : item);
    setBibliography(updated);
  };
  const removeBibItem = (index: number) => {
    setBibliography(bibliography.filter((_, i) => i !== index));
  };

  // ── Funções de Mídia (imagem ou vídeo, um único arquivo) ───
  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setMediaError(null);

    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }

    if (!file) {
      setMediaFile(null);
      setMediaPreviewUrl(null);
      return;
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setMediaError('Selecione um arquivo de imagem ou vídeo.');
      setMediaFile(null);
      setMediaPreviewUrl(null);
      e.target.value = '';
      return;
    }

    setMediaFile(file);
    setMediaPreviewUrl(URL.createObjectURL(file));
  };

  const removeMedia = () => {
    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    setMediaFile(null);
    setMediaPreviewUrl(null);
    setMediaError(null);
    setMediaCaption('');
    setMediaAlternativeText('');
  };

  // ── Enviar Submissão ───────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccess(false);
    setValidationErrors([]);
    setMediaError(null);

    // Estruturando o metadata de acordo com o JSON esperado pelo banco
    const metadataPayload: any = {
      bibliography, // Caso não seja enviado por fora, já fica no metadata
    };

    if (category === 'pessoa') {
      if (birthDate || birthPlace) {
        metadataPayload.birth = { date: birthDate || undefined, place: birthPlace || undefined };
      }
      if (deathDate || deathPlace) {
        metadataPayload.death = { date: deathDate || undefined, place: deathPlace || undefined };
      }
    }
    
    if (occupations.length > 0) metadataPayload.occupation = occupations;
    if (organizations.length > 0) metadataPayload.organizations = organizations;
    if (alternativeNames.length > 0) metadataPayload.alternativeNames = alternativeNames;

    const formFields = {
      title,
      summary,
      category,
      author_name: authorName,
      author_email: authorEmail,
      author_institution: authorInst,
      content,
      keywords,
      bibliography,
      metadata: metadataPayload, // Enviando os metadados gerados
    };

    const errors = validateSubmissionForm(formFields);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    let media: ArticleFormFields['media'];
    if (mediaFile) {
      setMediaUploading(true);
      try {
        const uploaded = await uploadSubmissionMedia(mediaFile);
        media = {
          type: uploaded.resourceType,
          data: {
            url: uploaded.url,
            publicId: uploaded.publicId,
            caption: mediaCaption.trim() || undefined,
            alternativeText: mediaAlternativeText.trim() || undefined,
          },
        };
      } catch (error) {
        setMediaError(
          error instanceof ApiError ? error.message : 'Falha ao enviar a imagem/vídeo. Tente novamente.'
        );
        setMediaUploading(false);
        return;
      }
      setMediaUploading(false);
    }

    mutation.mutate(buildSubmissionPayload({ ...formFields, media }));
  };

  const apiErrors = mutation.error instanceof ApiError ? mutation.error.errors : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* Cabeçalho da Página */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Submeter artigo</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Preencha os campos abaixo para enviar seu verbete para a revisão editorial.
            </p>
          </div>
        </div>

        {/* Alertas de Feedback */}
        {submitSuccess && (
          <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Submissão enviada com sucesso!</p>
              <p className="text-sm mt-1 opacity-90">
                Recebemos seu artigo. A equipe editorial entrará em contato pelo e-mail informado.
              </p>
            </div>
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <ul className="text-sm list-disc list-inside">
              {validationErrors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {mutation.isError && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Não foi possível enviar</p>
              <p className="text-sm mt-1">
                {mutation.error instanceof ApiError
                  ? mutation.error.message
                  : 'Erro inesperado. Tente novamente em instantes.'}
              </p>
              {apiErrors && apiErrors.length > 0 && (
                <ul className="text-sm mt-2 list-disc list-inside">
                  {apiErrors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Formulário com a exata estilização do Editor */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* E-mail de contato — único campo extra em relação ao ArticleEditor */}
          <div className="space-y-2">
            <Label htmlFor="submit-author-email">E-mail de contato *</Label>
            <Input
              id="submit-author-email"
              type="email"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              required
            />
          </div>

          <Separator />

          {/* ── Campos básicos (mesma ordem do ArticleEditor) ── */}
          <div className="space-y-2">
            <Label htmlFor="submit-title">Título *</Label>
            <Input
              id="submit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="submit-summary">Resumo *</Label>
            <textarea
              id="submit-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              maxLength={1000}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              required
            />
            <div className="text-right text-xs text-muted-foreground mt-1">
              {summary.length}/1000
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="submit-category">Categoria *</Label>
              <select
                id="submit-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                {ARTICLE_EDITOR_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {ARTICLE_EDITOR_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="submit-author-name">Autor *</Label>
              <Input
                id="submit-author-name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="submit-institution">Instituição do autor</Label>
            <Input
              id="submit-institution"
              value={authorInst}
              onChange={(e) => setAuthorInst(e.target.value)}
            />
          </div>

          <Separator />

          {/* ── Nascimento, Morte ── */}

          {category === 'pessoa' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Nascimento</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="submit-birth-date" className="text-xs">Data de Nascimento</Label>
                    <Input
                      id="submit-birth-date"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="submit-birth-place" className="text-xs">Local de Nascimento</Label>
                    <Input
                      id="submit-birth-place"
                      value={birthPlace}
                      onChange={(e) => setBirthPlace(e.target.value)}
                      placeholder="Ex: São Paulo, Brasil"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Morte</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="submit-death-date" className="text-xs">Data de Morte</Label>
                    <Input
                      id="submit-death-date"
                      type="date"
                      value={deathDate}
                      onChange={(e) => setDeathDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="submit-death-place" className="text-xs">Local de Morte</Label>
                    <Input
                      id="submit-death-place"
                      value={deathPlace}
                      onChange={(e) => setDeathPlace(e.target.value)}
                      placeholder="Ex: São Paulo, Brasil"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* ── Ocupação ── */}
          <div className="space-y-3 mt-6">
            <Label>Ocupação</Label>
            <div className="flex flex-wrap gap-2">
              {occupations.map((occ) => (
                <Badge key={occ} variant="secondary" className="gap-1 pr-1">
                  {occ}
                  <button
                    type="button"
                    onClick={() => removeOccupation(occ)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: jornalista, advogado..."
                value={newOccupation}
                onChange={(e) => setNewOccupation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addOccupation();
                  }
                }}
              />
              <Button variant="outline" onClick={addOccupation} type="button">
                <Plus size={16} />
              </Button>
            </div>
          </div>

         {/* ── Organizações ── */}
          <div className="space-y-3">
            <Label>Organizações</Label>
            <div className="flex flex-wrap gap-2">
              {organizations.map((org) => (
                <Badge key={org} variant="secondary" className="gap-1 pr-1">
                  {org}
                  <button
                    type="button"
                    onClick={() => removeOrganization(org)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: O Estado de S. Paulo..."
                value={newOrganization}
                onChange={(e) => setNewOrganization(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addOrganization();
                  }
                }}
              />
              <Button variant="outline" onClick={addOrganization} type="button">
                <Plus size={16} />
              </Button>
            </div>
          </div>
          
          {/* ── Nomes Alternativos ── */}
          <div className="space-y-3">
            <Label>Nomes Alternativos</Label>
            <div className="flex flex-wrap gap-2">
              {alternativeNames.map((an) => (
                <Badge key={an} variant="secondary" className="gap-1 pr-1">
                  {an}
                  <button
                    type="button"
                    onClick={() => removeAlternativeName(an)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Paulo Alfeu Junqueira de Monteiro Duarte..."
                value={newAlternativeName}
                onChange={(e) => setNewAlternativeName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addAlternativeName();
                  }
                }}
              />
              <Button variant="outline" onClick={addAlternativeName} type="button">
                <Plus size={16} />
              </Button>
            </div>
          </div>

          <Separator />

          {/* ── Keywords ───────────────────────────────────── */}
          <div className="space-y-3">
            <Label>Palavras-chave *</Label>
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw) => (
                <Badge key={kw} variant="secondary" className="gap-1 pr-1">
                  {kw}
                  <button
                    type="button"
                    onClick={() => removeKeyword(kw)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nova palavra-chave..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
              />
              <Button variant="outline" onClick={addKeyword} type="button">
                <Plus size={16} />
              </Button>
            </div>
          </div>

          <Separator />

          {/* ── Conteúdo (HTML/Texto Bruto) ────────────────── */}
          <div className="space-y-2">
            <Label htmlFor="submit-content">Conteúdo (texto puro) *</Label>
            <p className="text-xs text-muted-foreground">
              Este é o texto da biografia. Edite o conteúdo diretamente.
            </p>
            <textarea
              id="submit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              maxLength={10000}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              placeholder="Desenvolva o texto completo do seu verbete aqui..."
              required
            />
            <div className="text-right text-xs text-muted-foreground mt-1">
              {content.length}/10000
            </div>
          </div>

          <Separator />

          {/* ── Imagem ou vídeo (opcional, um único arquivo) ── */}
          <div className="space-y-2">
            <Label htmlFor="submit-media">Imagem ou vídeo de destaque</Label>
            <p className="text-xs text-muted-foreground">
              Envie no máximo um arquivo (imagem ou vídeo) para ilustrar o artigo.
            </p>

            {!mediaPreviewUrl && (
              <label
                htmlFor="submit-media"
                className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-input px-4 py-8 text-sm text-muted-foreground cursor-pointer hover:border-primary/50"
              >
                <ImagePlus className="h-6 w-6" />
                Clique para selecionar uma imagem ou vídeo
              </label>
            )}

            {mediaPreviewUrl && mediaFile && (
              <div className="relative inline-block">
                {mediaFile.type.startsWith('video/') ? (
                  <video src={mediaPreviewUrl} controls className="max-h-64 rounded-md border" />
                ) : (
                  <img src={mediaPreviewUrl} alt="Pré-visualização" className="max-h-64 rounded-md border" />
                )}
                <button
                  type="button"
                  onClick={removeMedia}
                  className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-1 shadow"
                  aria-label="Remover mídia"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <input
              id="submit-media"
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaChange}
              className="hidden"
            />

            {mediaError && <p className="text-sm text-destructive">{mediaError}</p>}

            {mediaFile && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="submit-media-caption">Legenda</Label>
                  <Input
                    id="submit-media-caption"
                    value={mediaCaption}
                    onChange={(e) => setMediaCaption(e.target.value)}
                    placeholder="Legenda exibida junto à mídia"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="submit-media-alt">Texto alternativo</Label>
                  <Input
                    id="submit-media-alt"
                    value={mediaAlternativeText}
                    onChange={(e) => setMediaAlternativeText(e.target.value)}
                    placeholder="Descrição para acessibilidade"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* ── Bibliografia ──────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Bibliografia</Label>
              <Button variant="outline" size="sm" onClick={addBibItem} type="button">
                <Plus size={14} className="mr-1" /> Adicionar item
              </Button>
            </div>

            {bibliography.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                Nenhum item. Clique em &quot;Adicionar item&quot; para começar.
              </p>
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
                    <Input
                      value={item.year}
                      onChange={(e) => updateBibItem(index, 'year', e.target.value)}
                      placeholder="2024"
                    />
                  </div>
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <Label className="text-xs">Autor</Label>
                    <Input
                      value={item.author}
                      onChange={(e) => updateBibItem(index, 'author', e.target.value)}
                      placeholder="SOBRENOME, Nome"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Título</Label>
                  <Input
                    value={item.title}
                    onChange={(e) => updateBibItem(index, 'title', e.target.value)}
                    placeholder="Título da obra"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Local</Label>
                    <Input
                      value={item.location ?? ''}
                      onChange={(e) => updateBibItem(index, 'location', e.target.value)}
                      placeholder="São Paulo"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Editora</Label>
                    <Input
                      value={item.publisher ?? ''}
                      onChange={(e) => updateBibItem(index, 'publisher', e.target.value)}
                      placeholder="Editora"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Barra de Ações Inferior */}
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between pt-4">
            <Button
              type="submit"
              size="lg"
              disabled={mutation.isPending || mediaUploading}
              className="sm:min-w-[220px]"
            >
              {mediaUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando mídia...
                </>
              ) : mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" /> Enviar submissão
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground">
              Ao enviar, você aceita a revisão editorial.{' '}
              <Link to="/" className="text-primary hover:underline">
                Voltar ao início
              </Link>
            </p>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}