import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TableOfContents from "@/components/TableOfContents";
import ArticleContent from "@/components/ArticleContent";
import { Button } from "@/components/ui/button";
import { getSubmissionById } from "@/lib/api";
import { useAdminAuth }            from "@/hooks/use-admin-auth";
import { AdminPasswordDialog }     from "@/components/AdminPasswordDialog";
import { ArticleEditor }           from "@/components/ArticleEditor";

const Article = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient    = useQueryClient();

    // Hook de autenticação temporária
  const { isAuthenticated, login, logout } = useAdminAuth();

  // Controla se o modal de senha está aberto
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  // Controla se o editor está aberto
  const [isEditing, setIsEditing] = useState(false);

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['article', id],
    queryFn: () => getSubmissionById(id!),
    enabled: !!id,
  });

    if (!id) {
    navigate('/404');
    return null;
  }


     // Chamado quando o admin clica no lápis
  const handleEditClick = () => {
    if (isAuthenticated) {
      // Já autenticado — abre direto o editor
      setIsEditing(true);
    } else {
      // Não autenticado — pede a senha primeiro
      setShowPasswordDialog(true);
    }
  };

  // Chamado quando digita a senha correta no modal
  const handlePasswordSuccess = () => {
    setShowPasswordDialog(false);
    setIsEditing(true);
  };

  // Chamado quando salva no editor
  const handleSave = () => {
    // Invalida o cache do TanStack Query pra recarregar o artigo atualizado
    queryClient.invalidateQueries({ queryKey: ['article', id] });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-32 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1">
                <div className="h-64 bg-muted rounded"></div>
              </div>
              <div className="lg:col-span-3 space-y-4">
                <div className="h-12 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Artigo não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            O artigo solicitado não foi encontrado ou não está disponível.
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao início
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">

        {/* Barra superior com Voltar + botão de editar */}
        <div className="flex items-center justify-between mb-6">
          <Button onClick={() => navigate('/')} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          {/* Botão do lápis — sempre visível, mas pede senha se não autenticado */}
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <span className="text-xs text-muted-foreground">Modo admin</span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditClick}
            >
              <Pencil size={14} className="mr-1" />
              Editar artigo
            </Button>
            {/* Botão de sair do modo admin — só aparece se autenticado */}
            {isAuthenticated && (
              <Button variant="ghost" size="sm" onClick={logout}>
                Sair
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 lg:gap-8">
          <aside className="lg:col-span-1">
            <TableOfContents article={article} />
          </aside>
          <div className="lg:col-span-3">
            <ArticleContent article={article} />
          </div>
        </div>
      </main>
      <Footer />

      {/* Modal de senha */}
      <AdminPasswordDialog
        open={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        onSuccess={handlePasswordSuccess}
        onLogin={login}
      />

      {/* Editor — renderiza por cima de tudo quando isEditing = true */}
      {isEditing && article && (
        <ArticleEditor
          article={article}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      )}
    </div>
  );
};

export default Article;