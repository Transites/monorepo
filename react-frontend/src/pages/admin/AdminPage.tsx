import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  UserPlus, 
  UserX, 
  Ban, 
  FileX, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ArrowLeft
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { fetchAdmins, addAdminFn, blockUserFn, moderatePageFn, removeAdminFn } from '@/hooks/use-admin-actions';


export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [newAdminName, setNewAdminName] = useState<string>('');
  const [newAdminEmail, setNewAdminEmail] = useState<string>('');
  
  const [targetUser, setTargetUser] = useState<string>('');
  const [blockReason, setBlockReason] = useState<string>('');
  
  const [targetPage, setTargetPage] = useState<string>('');

  const { data: admins = [], isLoading: isLoadingAdmins } = useQuery({
    queryKey: ['admins'],
    queryFn: fetchAdmins,
  });

  const clearMessages = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const addAdminMutation = useMutation({
    mutationFn: addAdminFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setSuccessMessage('Novo administrador adicionado com sucesso!');
      setNewAdminName('');
      setNewAdminEmail('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: () => setErrorMessage('Erro ao adicionar administrador.'),
  });

  const removeAdminMutation = useMutation({
    mutationFn: removeAdminFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setSuccessMessage('Administrador removido com sucesso.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: () => setErrorMessage('Erro ao remover administrador.'),
  });

  const blockUserMutation = useMutation({
    mutationFn: blockUserFn,
    onSuccess: () => {
      setSuccessMessage(`Usuário ${targetUser} foi bloqueado no sistema.`);
      setTargetUser('');
      setBlockReason('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: () => setErrorMessage('Erro ao tentar bloquear o usuário.'),
  });

  const moderatePageMutation = useMutation({
    mutationFn: moderatePageFn,
    onSuccess: (_, variables) => {
      const verb = variables.action === 'erase' ? 'excluída' : 'suspensa';
      setSuccessMessage(`A página "${variables.pageIdOrSlug}" foi ${verb} com sucesso.`);
      setTargetPage('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: () => setErrorMessage('Erro ao executar moderação na página.'),
  });

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    addAdminMutation.mutate({ name: newAdminName, email: newAdminEmail });
  };

  const handleBlockUser = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    blockUserMutation.mutate({ userIdOrEmail: targetUser, reason: blockReason });
  };

  const handlePageAction = (action: 'suspend' | 'erase') => {
    if (!targetPage.trim()) return;
    clearMessages();
    moderatePageMutation.mutate({ pageIdOrSlug: targetPage, action });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" /> Painel de Administração
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie privilégios administrativos e aplique moderações de conteúdo e usuários.
            </p>
          </div>
        </div>

        {/* feedback message */}
        {successMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Section 1: list all admins in the system*/}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Administradores Atuais</h2>
          
          {isLoadingAdmins ? (
            <div className="flex items-center justify-center p-6 border rounded-lg">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="border rounded-lg bg-card max-h-[416px] overflow-y-auto relative">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="sticky top-0 bg-muted/90 backdrop-blur-sm p-3 font-medium z-10 border-b shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                      Nome
                    </th>
                    <th className="sticky top-0 bg-muted/90 backdrop-blur-sm p-3 font-medium z-10 border-b shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                      E-mail
                    </th>
                    <th className="sticky top-0 bg-muted/90 backdrop-blur-sm p-3 font-medium z-10 border-b shadow-[0_1px_0_0_rgba(0,0,0,0.05)] text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-muted/30">
                      <td className="p-3 font-medium">{admin.name}</td>
                      <td className="p-3 text-muted-foreground">{admin.email}</td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja remover os privilégios de ${admin.name}?`)) {
                              removeAdminMutation.mutate(admin.id);
                            }
                          }}
                          disabled={removeAdminMutation.isPending}
                        >
                          <UserX size={16} className="mr-1" /> Remover
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Separator />

        {/* Section 2: add a new admin in the system */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Adicionar Novo Administrador</h2>
          <form onSubmit={handleAddAdmin} className="space-y-4 p-4 border rounded-lg bg-card">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admin-name">Nome completo *</Label>
                <Input
                  id="admin-name"
                  placeholder="Nome do usuário"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">E-mail corporativo *</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="email@wiki.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={addAdminMutation.isPending}
              size="sm"
            >
              {addAdminMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus size={16} className="mr-2" />
              )}
              Promover a Administrador
            </Button>
          </form>
        </div>

        <Separator />

        {/* section 3: block or suspend a user or a page */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold tracking-tight">Controle de Moderação</h2>

            
            <form onSubmit={handleBlockUser} className="space-y-4 p-4 border rounded-lg bg-card flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-destructive font-medium">
                  <Ban size={18} />
                  <span>Bloquear Usuário</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-user">ID ou E-mail do Usuário *</Label>
                  <Input
                    id="target-user"
                    placeholder="ex: user_123987 ou email@usuario.com"
                    value={targetUser}
                    onChange={(e) => setTargetUser(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="block-reason">Motivo da Suspensão</Label>
                  <textarea
                    id="block-reason"
                    rows={2}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    placeholder="Vandalismo recorrente, SPAM, etc..."
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                variant="destructive" 
                className="w-full mt-4"
                disabled={blockUserMutation.isPending}
              >
                {blockUserMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Suspender Conta do Usuário
              </Button>
            </form>
        </div>

        <Separator />

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground max-w-[70%]">
            Todas as ações realizadas neste painel administrativo ficam registradas nos logs de auditoria do sistema.
          </p>
          <Link to="/" className="text-sm text-primary hover:underline flex items-center gap-1">
            <ArrowLeft size={14} /> Voltar ao início
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}