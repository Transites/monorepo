import { useCatalog }       from '../hooks/use-catalog';
import { CatalogCard }      from '../components/CatalogCard';
import { CatalogFilters }   from '../components/CatalogFilters';
import { Skeleton }         from '../components/ui/skeleton';
import { Button }           from '../components/ui/button';
import Header               from '../components/Header';
import Footer               from '../components/Footer';
import { BookOpen, AlertCircle } from 'lucide-react';

// Array de 12 itens pra renderizar skeletons enquanto carrega.
// Array.from({ length: 12 }) cria [ undefined × 12 ]
// O segundo argumento é uma função que recebe (_, index) → retorna o index
const SKELETON_ITEMS = Array.from({ length: 12 }, (_, i) => i);

export default function Catalog() {
  // Tudo que precisamos vem de um único hook — a página fica limpa
  const {
    articles,
    categories,
    pagination,
    isLoading,
    error,
    search,
    category,
    page,
    setSearch,
    setCategory,
    setPage,
    retry,
  } = useCatalog();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-10">

        {/* Cabeçalho da página */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="text-primary" size={24} />
            <h1 className="text-3xl font-bold">Catálogo de Artigos</h1>
          </div>
          <p className="text-muted-foreground">
            Explore todos os artigos publicados na Enciclopédia Trânsitos
          </p>
          {/* Mostra total só quando carregou */}
          {pagination && !isLoading && (
            <p className="text-sm text-muted-foreground mt-1">
              {pagination.total} artigo{pagination.total !== 1 ? 's' : ''} encontrado{pagination.total !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Layout: filtros na lateral (desktop) ou em cima (mobile) */}
        {/* grid-cols-1: 1 coluna no mobile */}
        {/* lg:grid-cols-[280px_1fr]: 2 colunas no desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">

          {/* Coluna esquerda: filtros */}
          {/* lg:sticky: fica fixo enquanto você rola — top-24 = abaixo do header */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <CatalogFilters
              search={search}
              category={category}
              categories={categories}
              onSearch={setSearch}
              onCategory={setCategory}
            />
          </aside>

          {/* Coluna direita: grid de artigos */}
          <section>

            {/* Estado de erro */}
            {error && (
              <div className="flex flex-col items-center gap-4 py-20 text-center">
                <AlertCircle size={40} className="text-destructive" />
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={retry} variant="outline">
                  Tentar novamente
                </Button>
              </div>
            )}

            {/* Estado de carregando — exibe skeletons no lugar dos cards */}
            {isLoading && !error && (
              // grid-cols-1 no mobile, 2 no tablet, 3 no desktop
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {SKELETON_ITEMS.map(i => (
                  // Skeleton imita o formato do CatalogCard
                  <div key={i} className="flex flex-col gap-3 p-4 border rounded-lg">
                    <Skeleton className="h-40 w-full rounded-md" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-4/5" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
            )}

            {/* Lista de artigos — só renderiza se não estiver carregando e sem erro */}
            {!isLoading && !error && (
              <>
                {articles.length === 0 ? (
                  /* Estado vazio */
                  <div className="flex flex-col items-center gap-3 py-20 text-center">
                    <BookOpen size={40} className="text-muted-foreground" />
                    <p className="text-lg font-medium">Nenhum artigo encontrado</p>
                    <p className="text-sm text-muted-foreground">
                      Tente outros termos de busca ou remova os filtros
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {/* articles.map: transforma cada objeto em um componente visual */}
                    {articles.map(article => (
                      // key é obrigatório — usa o id único de cada artigo
                      <CatalogCard key={article.id} article={article} />
                    ))}
                  </div>
                )}

                {/* Paginação — só aparece se tiver mais de uma página */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setPage(page - 1)}
                      // disabled evita clicar quando não tem página anterior
                      disabled={!pagination.hasPrevious}
                    >
                      Anterior
                    </Button>

                    <span className="text-sm text-muted-foreground">
                      Página {page} de {pagination.totalPages}
                    </span>

                    <Button
                      variant="outline"
                      onClick={() => setPage(page + 1)}
                      disabled={!pagination.hasNext}
                    >
                      Próxima
                    </Button>
                  </div>
                )}
              </>
            )}

          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}