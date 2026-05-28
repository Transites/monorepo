// useState: controla o valor do input de senha e o erro
import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface AdminPasswordDialogProps {
  open: boolean;                    // controla se o modal está aberto
  onClose: () => void;              // chamado ao fechar sem autenticar
  onSuccess: () => void;            // chamado quando a senha está correta
  onLogin: (password: string) => boolean; // função de verificação do hook
}

export function AdminPasswordDialog({
  open,
  onClose,
  onSuccess,
  onLogin,
}: AdminPasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');

  const handleSubmit = () => {
    // Tenta autenticar com a senha digitada
    const ok = onLogin(password);

    if (ok) {
      // Limpa o estado local e avisa o pai que deu certo
      setPassword('');
      setError('');
      onSuccess();
    } else {
      setError('Senha incorreta. Tente novamente.');
    }
  };

  // Permite enviar com Enter — melhor UX
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    // onOpenChange: chamado quando o usuário fecha o modal (clica fora ou ESC)
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock size={18} />
            Área restrita
          </DialogTitle>
          <DialogDescription>
            Digite a senha de administrador para editar este artigo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="admin-password">Senha</Label>
            <Input
              id="admin-password"
              type="password"
              placeholder="Digite a senha..."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(''); // limpa erro ao digitar
              }}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            {/* Mensagem de erro — só aparece se errar a senha */}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              Entrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}