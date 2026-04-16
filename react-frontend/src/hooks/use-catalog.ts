import {useState, useEffect, useCallback} from 'react';
import {fetchArticles, ArticleSummary, PaginationInfo} from '../lib/api';

interface CatalogState {
  articles:    ArticleSummary[];
  categories:  string[];
  pagination:  PaginationInfo | null;
  isLoading:   boolean;
  error:       string | null;
}

export interface UseCatalogReturn extends CatalogState {
  search:      string;
  category:    string;
  page:        number;
  setSearch:   (value: string) => void;
  setCategory: (value: string) => void;
  setPage:     (value: number) => void;
  retry:       () => void;
}

export function useCatalog(): UseCatalogReturn {
  // ── Filtros (o que o usuário selecionou) ──────────────────
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('');
  const [page,     setPage]     = useState(1);

  // ── Dados vindos da API ───────────────────────────────────
  const [state, setState] = useState<CatalogState>({
    articles:   [],
    categories: [],
    pagination: null,
    isLoading:  true,   // começa carregando
    error:      null,
  });

  // Função principal que busca dados da API.
  // useCallback garante que ela só é recriada se os filtros mudarem,
  // evitando loops infinitos no useEffect abaixo.
  const load = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await fetchArticles({
        search:   search   || undefined,   // não envia se vazio
        category: category || undefined,
        page,
        limit: 12,
      });

      setState({
        articles:   result.articles,
        categories: result.categories,
        pagination: result.pagination,
        isLoading:  false,
        error:      null,
      });
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        // err.message vem da classe ApiError que já existe no projeto
        error: err.message || 'Erro ao carregar artigos',
      }));
    }
  }, [search, category, page]);
  // ↑ toda vez que search, category ou page mudar, load() é recriada

  // useEffect executa load() sempre que ela mudar (ou seja, sempre que
  // os filtros mudarem). É o "motor" que aciona a busca automaticamente.
  useEffect(() => {
    load();
  }, [load]);

  // Quando o usuário muda busca ou categoria, volta pra página 1
  const handleSetSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleSetCategory = useCallback((value: string) => {
    setCategory(value);
    setPage(1);
  }, []);

  return {
    ...state,
    search,
    category,
    page,
    setSearch:   handleSetSearch,
    setCategory: handleSetCategory,
    setPage,
    retry: load,   // expõe load() como retry para o botão "tentar novamente"
  };
}