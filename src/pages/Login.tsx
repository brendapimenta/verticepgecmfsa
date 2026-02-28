import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!login(email, senha)) {
      setErro('E-mail não encontrado. Use um dos e-mails de demonstração.');
    }
  };

  const demoAccounts = [
    { label: 'Administrador', email: 'admin@cmfs.gov.br' },
    { label: 'Sala de Espera', email: 'recepcao@cmfs.gov.br' },
    { label: 'Brenda', email: 'brenda@cmfs.gov.br' },
    { label: 'Presidente', email: 'presidente@cmfs.gov.br' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">CMFS</h1>
          <p className="text-muted-foreground mt-1">Sistema de Gestão de Atendimentos</p>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.gov.br"
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5"
                required
              />
            </div>
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            <Button type="submit" className="w-full gap-2">
              <LogIn className="w-4 h-4" />
              Entrar
            </Button>
          </form>
        </div>

        <div className="mt-6 bg-card rounded-xl border border-border shadow-sm p-4">
          <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Acesso Demonstração</p>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map(acc => (
              <button
                key={acc.email}
                onClick={() => { setEmail(acc.email); setSenha('demo'); }}
                className="text-left px-3 py-2 rounded-lg text-xs bg-muted hover:bg-accent/10 hover:border-accent/30 border border-transparent transition-all"
              >
                <span className="font-medium text-foreground block">{acc.label}</span>
                <span className="text-muted-foreground">{acc.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
