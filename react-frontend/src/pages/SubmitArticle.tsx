import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createArticleSubmission, ApiError } from '@/lib/api';
import { SUBMISSION_CATEGORIES } from '@/lib/submission-constants';
import {
  articleSubmissionSchema,
  type ArticleSubmissionFormValues,
  formValuesToPayload,
  stripHtml,
} from '@/lib/submission-schema';
import { cn } from '@/lib/utils';

const defaultValues: ArticleSubmissionFormValues = {
  author_name: '',
  author_email: '',
  author_institution: '',
  title: '',
  category: 'História',
  keywords: '',
  summary: '',
  content: '',
  sections: [],
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive mt-1">{message}</p>;
}

function CharCount({
  current,
  max,
  min,
}: {
  current: number;
  max: number;
  min?: number;
}) {
  const belowMin = min !== undefined && current < min;
  return (
    <p
      className={cn(
        'text-xs mt-1 text-right',
        belowMin ? 'text-muted-foreground' : 'text-muted-foreground'
      )}
    >
      {current}
      {min !== undefined && ` / mín. ${min}`} · máx. {max}
    </p>
  );
}

export default function SubmitArticle() {
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ArticleSubmissionFormValues>({
    resolver: zodResolver(articleSubmissionSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'sections',
  });

  const summaryValue = watch('summary') ?? '';
  const contentValue = watch('content') ?? '';

  const mutation = useMutation({
    mutationFn: createArticleSubmission,
    onSuccess: () => {
      setSubmitSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  const onSubmit = handleSubmit((values) => {
    setSubmitSuccess(false);
    mutation.mutate(formValuesToPayload(values));
  });

  const apiErrors =
    mutation.error instanceof ApiError ? mutation.error.errors : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Submeter artigo</h1>
          <p className="text-muted-foreground mt-2">
            Preencha as seções do verbete. Use a barra de ferramentas para formatar
            títulos, listas e ênfases no texto principal e nas seções adicionais.
          </p>
        </div>

        {submitSuccess && (
          <div
            className="mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100"
            role="status"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Submissão enviada</p>
              <p className="text-sm mt-1 opacity-90">
                Recebemos seu artigo. A equipe editorial entrará em contato pelo
                e-mail informado após a revisão.
              </p>
            </div>
          </div>
        )}

        {mutation.isError && (
          <div
            className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive"
            role="alert"
          >
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

        <form onSubmit={onSubmit} className="space-y-8" noValidate>
          <Card>
            <CardHeader>
              <CardTitle>Autor</CardTitle>
              <CardDescription>Quem está enviando este verbete.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="author_name">Nome completo *</Label>
                <Input
                  id="author_name"
                  autoComplete="name"
                  className="mt-1.5"
                  {...register('author_name')}
                />
                <FieldError message={errors.author_name?.message} />
              </div>
              <div>
                <Label htmlFor="author_email">E-mail *</Label>
                <Input
                  id="author_email"
                  type="email"
                  autoComplete="email"
                  className="mt-1.5"
                  {...register('author_email')}
                />
                <FieldError message={errors.author_email?.message} />
              </div>
              <div>
                <Label htmlFor="author_institution">Instituição</Label>
                <Input
                  id="author_institution"
                  className="mt-1.5"
                  placeholder="Universidade, centro de pesquisa…"
                  {...register('author_institution')}
                />
                <FieldError message={errors.author_institution?.message} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Identificação do verbete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  className="mt-1.5"
                  placeholder="Nome do verbete"
                  {...register('title')}
                />
                <FieldError message={errors.title?.message} />
              </div>

              <div>
                <Label htmlFor="category">Categoria *</Label>
                <select
                  id="category"
                  className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  {...register('category')}
                >
                  {SUBMISSION_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.category?.message} />
              </div>

              <div>
                <Label htmlFor="keywords">Palavras-chave *</Label>
                <Input
                  id="keywords"
                  className="mt-1.5"
                  placeholder="circulação, império, comércio"
                  {...register('keywords')}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separe por vírgulas (máximo 10).
                </p>
                <FieldError message={errors.keywords?.message} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
              <CardDescription>
                Texto curto exibido nas listagens e resultados de busca (50–500
                caracteres).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="summary"
                rows={4}
                placeholder="Síntese do verbete em poucas linhas…"
                {...register('summary')}
              />
              <CharCount current={summaryValue.length} min={50} max={500} />
              <FieldError message={errors.summary?.message} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conteúdo principal</CardTitle>
              <CardDescription>
                Corpo do verbete com formatação (títulos, listas, negrito, etc.).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    id="content"
                    value={field.value}
                    onChange={field.onChange}
                    minHeightClassName="min-h-[280px]"
                    placeholder="Desenvolva o verbete aqui. Use H2/H3 para subdivisões…"
                  />
                )}
              />
              <CharCount
                current={stripHtml(contentValue).length}
                min={100}
                max={50000}
              />
              <FieldError message={errors.content?.message} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Seções adicionais</CardTitle>
                <CardDescription>
                  Blocos opcionais (ex.: biografia, obras, contexto histórico).
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ title: '', content: '' })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Seção
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma seção extra. Clique em &quot;Seção&quot; para adicionar.
                </p>
              )}

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg border border-dashed border-input p-4 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor={`section-title-${index}`}>
                      Título da seção {index + 1}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                  <Input
                    id={`section-title-${index}`}
                    placeholder="Ex.: Obras principais"
                    {...register(`sections.${index}.title`)}
                  />
                  <FieldError message={errors.sections?.[index]?.title?.message} />

                  <Label>Conteúdo</Label>
                  <Controller
                    name={`sections.${index}.content`}
                    control={control}
                    render={({ field: sectionField }) => (
                      <RichTextEditor
                        value={sectionField.value}
                        onChange={sectionField.onChange}
                        minHeightClassName="min-h-[160px]"
                        placeholder="Texto desta seção…"
                      />
                    )}
                  />
                  <FieldError message={errors.sections?.[index]?.content?.message} />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
            <Button
              type="submit"
              size="lg"
              disabled={mutation.isPending}
              className="sm:min-w-[200px]"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando…
                </>
              ) : (
                'Enviar submissão'
              )}
            </Button>
            <p className="text-sm text-muted-foreground">
              Ao enviar, você concorda com a revisão editorial.{' '}
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
