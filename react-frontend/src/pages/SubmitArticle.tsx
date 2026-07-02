import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Save, X, Plus, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { createArticleSubmission, ApiError } from '@/lib/api';

// Interface idêntica à do ArticleEditor para a bibliografia
interface BibItem {
  year: string;
  title: string;
  author: string;
  location?: string;
  publisher?: string;
}

export default function SubmitArticle() {
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Cada campo do formulário gerenciado por estados separados como no ArticleEditor
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('tema');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [authorInst, setAuthorInst] = useState('');
  const [content, setContent] = useState('');

  // Estados locais para Keywords e Bibliografia
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [bibliography, setBibliography] = useState<BibItem[]>([]);

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
    },
  });

  // ── Funções de Keywords ────────────────────────────────────
  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
    }
    setNewKeyword('');
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  // ── Funções de Bibliografia ────────────────────────────────
  const addBibItem = () => {
    setBibliography([
      ...bibliography,
      { year: '', title: '', author: '', location: '', publisher: '' },
    ]);
  };

  const updateBibItem = (index: number, field: keyof BibItem, value: string) => {
    const updated = bibliography.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setBibliography(updated);
  };

  const removeBibItem = (index: number) => {
    setBibliography(bibliography.filter((_, i) => i !== index));
  };

  // ── Enviar Submissão ───────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccess(false);

    // Monta o payload no formato esperado pelo backend
    const payload = {
      title,
      summary,
      category,
      author_name: authorName,
      author_email: authorEmail,
      author_institution: authorInst,
      content,
      keywords,
      metadata: {
        bibliography,
      },
    };

    mutation.mutate(payload);
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
          
          {/* ── Seção: Autor ───────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="submit-author-name">Nome completo *</Label>
              <Input
                id="submit-author-name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
              />
            </div>

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
          </div>

          <div className="space-y-2">
            <Label htmlFor="submit-institution">Instituição do autor</Label>
            <Input
              id="submit-institution"
              value={authorInst}
              onChange={(e) => setAuthorInst(e.target.value)}
              placeholder="Universidade, centro de pesquisa…"
            />
          </div>

          <Separator />

          {/* ── Campos Básicos do Verbete ──────────────────── */}
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
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              placeholder="Síntese do verbete em poucas linhas (50 a 500 caracteres)..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="submit-category">Categoria *</Label>
            <select
              id="submit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="pessoa">Pessoa</option>
              <option value="evento">Evento</option>
              <option value="instituicao">Instituição</option>
              <option value="tema">Tema</option>
              <option value="obra">Obra</option>
            </select>
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
            <Label htmlFor="submit-content">Conteúdo principal *</Label>
            <p className="text-xs text-muted-foreground">
              Este é o corpo principal do verbete. Digite ou cole o texto puro.
            </p>
            <textarea
              id="submit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={18}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              placeholder="Desenvolva o texto completo do seu verbete aqui..."
              required
            />
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
                      placeholder="2026"
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
              disabled={mutation.isPending}
              className="sm:min-w-[220px]"
            >
              {mutation.isPending ? (
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