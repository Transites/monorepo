import { useCatalog }       from '../hooks/use-catalog';
import { CatalogCard }      from '../components/CatalogCard';
//import { CatalogFilters }   from '../components/CatalogFilters';
import { Skeleton }         from '../components/ui/skeleton';
import { Button }           from '../components/ui/button';
import Header               from '../components/Header';
import Footer               from '../components/Footer';
import { BookOpen, AlertCircle } from 'lucide-react';

// Array de 12 itens pra renderizar skeletons enquanto carrega.
// Array.from({ length: 12 }) cria [ undefined × 12 ]
// O segundo argumento é uma função que recebe (_, index) → retorna o index
const SKELETON_ITEMS = Array.from({ length: 12 }, (_, i) => i);

const CATEGORY_TITLES: Record<string, string> = {
  'pessoa':      'Pessoas',
  'evento':      'Eventos',
  'instituicao': 'Instituições',
  'tema':        'Conceitos',
  'obra':        'Obras',
  'agrupamento': 'Agrupamentos',
  'empresa': 'Empresas',
};

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
            <h1 className="text-3xl font-bold">{CATEGORY_TITLES[category] ?? 'Todos os Artigos'}</h1>
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
        <div>



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
                <div className="flex flex-col">
                  {SKELETON_ITEMS.map(i => (
                    <div key={i} className="flex items-start gap-4 py-4 border-b border-border px-2">
                      <Skeleton className="shrink-0 w-20 h-20 rounded-md" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-1/4" />
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
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
                  <div className="flex flex-col">
                    {articles.map(article => (
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