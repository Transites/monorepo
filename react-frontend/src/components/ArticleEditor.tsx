import { useState }      from 'react';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import { Button }        from '@/components/ui/button';
import { Input }         from '@/components/ui/input';
import { Label }         from '@/components/ui/label';
import { Separator }     from '@/components/ui/separator';
import { Badge }         from '@/components/ui/badge';
import { Submission, ArticleUpdateData, updateArticle, assignDoi } from '@/lib/api';

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

  // ── Novos Estados (Metadata) ────────────────────────────────
  const meta = article.metadata || {};
  const [birthDate, setBirthDate] = useState(meta.birth?.date ?? '');
  const [birthPlace, setBirthPlace] = useState(meta.birth?.place ?? '');
  const [deathDate, setDeathDate] = useState(meta.death?.date ?? '');
  const [deathPlace, setDeathPlace] = useState(meta.death?.place ?? '');
  
  const [occupations, setOccupations] = useState<string[]>(meta.occupation ?? []);
  const [newOccupation, setNewOccupation] = useState('');
  
  const [organizations, setOrganizations] = useState<string[]>(meta.organizations ?? []);
  const [newOrganization, setNewOrganization] = useState('');
  
  const [alternativeNames, setAlternativeNames] = useState<string[]>(meta.alternativeNames ?? []);
  const [newAlternativeName, setNewAlternativeName] = useState('');

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

  // Estado de atribuição de DOI
  const [doi, setDoi] = useState(article.doi ?? '');
  const [isAssigningDoi, setIsAssigningDoi] = useState(false);
  const [doiError, setDoiError] = useState('');

  // ── Funções de Arrays (Keywords e Metadata) ──────────────────
  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (kw && !keywords.includes(kw)) setKeywords([...keywords, kw]);
    setNewKeyword('');
  };
  const removeKeyword = (kw: string) => setKeywords(keywords.filter(k => k !== kw));

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
  const addBibItem = () => {
    setBibliography([...bibliography, { year: '', title: '', author: '', location: '', publisher: '' }]);
  };
  const updateBibItem = (index: number, field: keyof BibItem, value: string) => {
    const updated = bibliography.map((item, i) => i === index ? { ...item, [field]: value } : item);
    setBibliography(updated);
  };
  const removeBibItem = (index: number) => {
    setBibliography(bibliography.filter((_, i) => i !== index));
  };

  // ── Salvar ─────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');

    try {
      const formatLifeEvent = (dateStr: string, placeStr: string) => {
        let formattedDate = '';
        if (dateStr) {
          const [y, m, d] = dateStr.split('-');
          const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
          if (y && m && d) formattedDate = `${parseInt(d, 10)} de ${months[parseInt(m, 10) - 1]} de ${y}`;
        }
        return [formattedDate, placeStr].filter(Boolean).join(', ');
      };

      const updatedMetadata: any = {
        ...article.metadata,
        bibliography: bibliography.length > 0 ? bibliography : undefined,
        occupation: occupations.length > 0 ? occupations : undefined,
        organizations: organizations.length > 0 ? organizations : undefined,
        alternativeNames: alternativeNames.length > 0 ? alternativeNames : undefined,
      };

      if (category === 'pessoa') {
        if (birthDate || birthPlace) {
          updatedMetadata.birth = { date: birthDate || undefined, place: birthPlace || undefined, formatted: formatLifeEvent(birthDate, birthPlace) || undefined };
        } else {
          delete updatedMetadata.birth;
        }
        if (deathDate || deathPlace) {
          updatedMetadata.death = { date: deathDate || undefined, place: deathPlace || undefined, formatted: formatLifeEvent(deathDate, deathPlace) || undefined };
        } else {
          delete updatedMetadata.death;
        }
      } else {
        delete updatedMetadata.birth;
        delete updatedMetadata.death;
      }

      // Limpa as chaves vazias explicitamente
      Object.keys(updatedMetadata).forEach(key => updatedMetadata[key] === undefined && delete updatedMetadata[key]);

      // Monta só os campos que mudaram
      const updateData: ArticleUpdateData = {
        title,
        summary,
        category,
        author_name:        authorName,
        author_institution: authorInst,
        content,
        keywords,
        metadata: updatedMetadata,
      };

      const updated = await updateArticle(article.id, updateData);
      onSave(updated); // avisa o pai que salvou

    } catch (err: any) {
      setSaveError(err.message || 'Erro ao salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Atribuir DOI ───────────────────────────────────────────
  const handleAssignDoi = async () => {
    setIsAssigningDoi(true);
    setDoiError('');

    try {
      const updated = await assignDoi(article.id);
      setDoi(updated.doi ?? '');
    } catch (err: any) {
      setDoiError(err.message || 'Erro ao atribuir DOI. Tente novamente.');
    } finally {
      setIsAssigningDoi(false);
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

        {/* ── DOI ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap p-3 rounded-md border bg-muted/30">
          {doi ? (
            <p className="text-sm text-muted-foreground">
              DOI:{' '}
              <a
                href={`https://doi.org/${doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                {doi}
              </a>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhum DOI atribuído.</p>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleAssignDoi}
            disabled={!!doi || isAssigningDoi}
            type="button"
          >
            {isAssigningDoi ? 'Atribuindo…' : 'Atribuir DOI'}
          </Button>
        </div>
        {doiError && (
          <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {doiError}
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
              maxLength={1000}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            />
            <div className="text-right text-xs text-muted-foreground mt-1">
                {summary.length}/1000
            </div>
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

          {/* ── Nascimento, Morte ── */}
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
              maxLength={10000}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            />
            <div className="text-right text-xs text-muted-foreground mt-1">
                {content.length}/10000
              </div>
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