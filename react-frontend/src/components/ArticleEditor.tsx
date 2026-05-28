import { useState }      from 'react';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import { Button }        from '@/components/ui/button';
import { Input }         from '@/components/ui/input';
import { Label }         from '@/components/ui/label';
import { Separator }     from '@/components/ui/separator';
import { Badge }         from '@/components/ui/badge';
import { Submission, ArticleUpdateData, updateArticle } from '@/lib/api';

interface ArticleEditorProps {
  article:   Submission;
  onSave:    (updated: Submission) => void; // chamado após salvar com sucesso
  onCancel:  () => void;                    // chamado ao cancelar
}

export function ArticleEditor({ article, onSave, onCancel }: ArticleEditorProps) {
  // Cada campo do formulário é um estado separado.
  // Iniciamos com os valores atuais do artigo.
  const [title,       setTitle]       = useState(article.title       ?? '');
  const [summary,     setSummary]     = useState(article.summary     ?? '');
  const [category,    setCategory]    = useState(article.category    ?? '');
  const [authorName,  setAuthorName]  = useState(article.author_name ?? '');
  const [authorInst,  setAuthorInst]  = useState(article.author_institution ?? '');
  const [content,     setContent]     = useState(article.content     ?? '');

  // Cada item da bibliografia tem esses campos — igual ao que está no banco
  interface BibItem {
    year:      string;
    title:     string;
    author:    string;
    location?: string;
    publisher?: string;
  }

// Iniciamos com a bibliografia atual do artigo, ou array vazio se não tiver
const [bibliography, setBibliography] = useState<BibItem[]>(
  article.metadata?.bibliography ?? []
);
  // Keywords são um array — precisam de lógica especial
  const [keywords,    setKeywords]    = useState<string[]>(article.keywords ?? []);
  const [newKeyword,  setNewKeyword]  = useState('');

  // Estado de salvamento
  const [isSaving,  setIsSaving]  = useState(false);
  const [saveError, setSaveError] = useState('');

  // ── Funções de keywords ────────────────────────────────────
  const addKeyword = () => {
    const kw = newKeyword.trim();
    // Não adiciona se vazio ou duplicado
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
    }
    setNewKeyword('');
  };

  const removeKeyword = (kw: string) => {
    // filter: cria novo array sem o item removido
    setKeywords(keywords.filter(k => k !== kw));
  };
  
  // Adiciona um item vazio — o admin preenche os campos depois
  const addBibItem = () => {
    setBibliography([...bibliography, {
      year: '', title: '', author: '', location: '', publisher: ''
    }]);
  };

  // Atualiza um campo específico de um item específico da lista.
  // index: qual item (0, 1, 2...), field: qual campo, value: novo valor
  const updateBibItem = (index: number, field: keyof BibItem, value: string) => {
    // map: percorre o array e retorna um novo array com o item alterado
    const updated = bibliography.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
      //              ↑ spread: copia todos os campos, depois sobrescreve só o alterado
    );
    setBibliography(updated);
  };

  // Remove um item pelo índice
  const removeBibItem = (index: number) => {
    setBibliography(bibliography.filter((_, i) => i !== index));
  };
  // ── Salvar ─────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');

    try {
      // Monta só os campos que mudaram — evita sobrescrever dados desnecessariamente
      const updateData: ArticleUpdateData = {
        title,
        summary,
        category,
        author_name:        authorName,
        author_institution: authorInst,
        content,
        keywords,
        metadata: {
        ...article.metadata,
          bibliography,
        },
      };

      const updated = await updateArticle(article.id, updateData);
      onSave(updated); // avisa o pai que salvou

    } catch (err: any) {
      setSaveError(err.message || 'Erro ao salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // Overlay escuro que cobre a página inteira enquanto edita
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Barra de ações no topo */}
        <div className="flex items-center justify-between sticky top-0 bg-background/95 py-3 border-b z-10">
          <h2 className="text-lg font-semibold">Editando artigo</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} disabled={isSaving}>
              <X size={16} className="mr-1" /> Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save size={16} className="mr-1" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        {/* Erro de salvamento */}
        {saveError && (
          <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {saveError}
          </p>
        )}

        {/* ── Campos básicos ─────────────────────────────── */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Título</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-summary">Resumo</Label>
            {/* textarea manual — projeto não usa o componente Textarea do shadcn */}
            <textarea
              id="edit-summary"
              value={summary}
              onChange={e => setSummary(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category">Categoria</Label>
              {/* select com as categorias do banco */}
              <select
                id="edit-category"
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
              <Label htmlFor="edit-author">Autor</Label>
              <Input
                id="edit-author"
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-institution">Instituição do autor</Label>
            <Input
              id="edit-institution"
              value={authorInst}
              onChange={e => setAuthorInst(e.target.value)}
            />
          </div>

          <Separator />

          {/* ── Keywords ───────────────────────────────────── */}
          <div className="space-y-3">
            <Label>Palavras-chave</Label>
            {/* Lista das keywords com botão de remover */}
            <div className="flex flex-wrap gap-2">
              {keywords.map(kw => (
                <Badge key={kw} variant="secondary" className="gap-1 pr-1">
                  {kw}
                  <button
                    onClick={() => removeKeyword(kw)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
            {/* Input para adicionar nova keyword */}
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
          {/* ── Conteúdo (HTML bruto) ──────────────────────── */}
          <div className="space-y-2">
            <Label htmlFor="edit-content">
              Conteúdo (texto puro)
            </Label>
            <p className="text-xs text-muted-foreground">
              Este é o texto da biografia. Edite o conteúdo diretamente.
            </p>
            <textarea
              id="edit-content"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={20}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
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
                Nenhum item. Clique em "Adicionar item" para começar.
              </p>
            )}

            {/* Renderiza um formulário por item da bibliografia */}
            {bibliography.map((item, index) => (
              // key={index}: identificador único para o React — usamos o índice pois
              // não temos IDs nos itens da bibliografia
              <div key={index} className="p-4 border rounded-lg space-y-3 relative">

                {/* Botão de remover no canto do card */}
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
                      onChange={e => updateBibItem(index, 'year', e.target.value)}
                      placeholder="2024"
                    />
                  </div>
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <Label className="text-xs">Autor</Label>
                    <Input
                      value={item.author}
                      onChange={e => updateBibItem(index, 'author', e.target.value)}
                      placeholder="SOBRENOME, Nome"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Título</Label>
                  <Input
                    value={item.title}
                    onChange={e => updateBibItem(index, 'title', e.target.value)}
                    placeholder="Título da obra"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Local</Label>
                    <Input
                      value={item.location ?? ''}
                      onChange={e => updateBibItem(index, 'location', e.target.value)}
                      placeholder="São Paulo"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Editora</Label>
                    <Input
                      value={item.publisher ?? ''}
                      onChange={e => updateBibItem(index, 'publisher', e.target.value)}
                      placeholder="Editora"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>



        </div>

      </div>
    </div>
  );
}