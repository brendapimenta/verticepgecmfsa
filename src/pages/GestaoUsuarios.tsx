import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePerfilVisual } from '@/contexts/ViewAsContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, Plus, Pencil, KeyRound, Loader2, RefreshCw, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface UsuarioItem {
  id: string;
  nome: string;
  email: string;
  username: string;
  perfil: string;
  ativo: boolean;
  primeiro_login_pendente: boolean;
  ultimo_login_em: string | null;
  criado_em: string;
}

const perfilLabels: Record<string, string> = {
  administrador: 'ADMINISTRADOR',
  sala_espera: 'SALA DE ESPERA',
  brenda: 'BRENDA',
  presidente: 'PRESIDENTE',
};

const GestaoUsuarios: React.FC = () => {
  const { usuario } = useAuth();
  const perfilUI = usePerfilVisual();
  const isAdmin = perfilUI === 'administrador';

  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UsuarioItem | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);

  // Form
  const [formNome, setFormNome] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPerfil, setFormPerfil] = useState('sala_espera');
  const [formAtivo, setFormAtivo] = useState(true);
  const [formSenha, setFormSenha] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  // Reset password
  const [resetSenha, setResetSenha] = useState('');
  const [resetSaving, setResetSaving] = useState(false);
  const [senhaCopied, setSenhaCopied] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.functions.invoke('admin-users?action=list', { method: 'GET' });
    if (Array.isArray(data)) setUsuarios(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => {
    setEditingUser(null);
    setFormNome('');
    setFormUsername('');
    setFormEmail('');
    setFormPerfil('sala_espera');
    setFormAtivo(true);
    setFormSenha('');
    setDialogOpen(true);
  };

  const openEdit = (u: UsuarioItem) => {
    setEditingUser(u);
    setFormNome(u.nome);
    setFormUsername(u.username);
    setFormEmail(u.email);
    setFormPerfil(u.perfil);
    setFormAtivo(u.ativo);
    setFormSenha('');
    setDialogOpen(true);
  };

  const gerarSenha = async () => {
    const { data } = await supabase.functions.invoke('admin-users?action=gerar-senha', { method: 'GET' });
    if (data?.senha) {
      setFormSenha(data.senha);
    }
  };

  const gerarSenhaReset = async () => {
    const { data } = await supabase.functions.invoke('admin-users?action=gerar-senha', { method: 'GET' });
    if (data?.senha) {
      setResetSenha(data.senha);
    }
  };

  const copiarSenha = (senha: string) => {
    navigator.clipboard.writeText(senha);
    setSenhaCopied(true);
    setTimeout(() => setSenhaCopied(false), 2000);
  };

  const handleSave = async () => {
    setFormSaving(true);
    try {
      if (editingUser) {
        const { data, error } = await supabase.functions.invoke('admin-users?action=update', {
          method: 'PUT',
          body: { id: editingUser.id, nome: formNome, username: formUsername, email: formEmail, perfil: formPerfil, ativo: formAtivo },
        });
        if (error || data?.error) {
          toast.error(data?.error || 'Erro ao atualizar.');
        } else {
          toast.success('Usuário atualizado com sucesso.');
          setDialogOpen(false);
          fetchUsers();
        }
      } else {
        if (!formSenha) {
          toast.error('Defina uma senha provisória.');
          setFormSaving(false);
          return;
        }
        const { data, error } = await supabase.functions.invoke('admin-users?action=create', {
          method: 'POST',
          body: { nome: formNome, username: formUsername, email: formEmail || undefined, perfil: formPerfil, senha: formSenha },
        });
        if (error || data?.error) {
          toast.error(data?.error || 'Erro ao criar usuário.');
        } else {
          toast.success('Usuário criado com sucesso.');
          setDialogOpen(false);
          fetchUsers();
        }
      }
    } catch {
      toast.error('Erro de conexão.');
    }
    setFormSaving(false);
  };

  const handleResetPassword = async () => {
    if (!resetUserId || !resetSenha) return;
    setResetSaving(true);
    const { data, error } = await supabase.functions.invoke('admin-users?action=reset-password', {
      method: 'POST',
      body: { id: resetUserId, nova_senha: resetSenha },
    });
    setResetSaving(false);
    if (error || data?.error) {
      toast.error(data?.error || 'Erro ao resetar senha.');
    } else {
      toast.success('Senha resetada. O usuário deverá trocar no próximo login.');
      setResetDialogOpen(false);
      setResetSenha('');
      fetchUsers();
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Acesso restrito ao Administrador.</p>
      </div>
    );
  }

  const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground uppercase tracking-wide">GESTÃO DE USUÁRIOS</h1>
            <p className="text-xs text-muted-foreground">Cadastro, edição e controle de acesso</p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase text-xs">Nome</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase text-xs">Usuário</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase text-xs">E-mail</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase text-xs">Perfil</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase text-xs">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground uppercase text-xs">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{u.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">@{u.username}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px] uppercase">{perfilLabels[u.perfil] || u.perfil}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.ativo ? 'default' : 'destructive'} className="text-[10px]">
                        {u.ativo ? 'ATIVO' : 'INATIVO'}
                      </Badge>
                      {u.primeiro_login_pendente && (
                        <Badge variant="outline" className="text-[10px] ml-1 border-amber-500/30 text-amber-600">
                          1º LOGIN
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(u)} title="Editar">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setResetUserId(u.id); setResetSenha(''); setResetDialogOpen(true); }}
                          title="Resetar Senha"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {usuarios.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhum usuário cadastrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide">
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className={labelClass}>Nome Completo</label>
              <Input value={formNome} onChange={e => setFormNome(e.target.value)} placeholder="Ex.: João Silva" />
            </div>
            <div>
              <label className={labelClass}>Nome de Usuário (login)</label>
              <Input value={formUsername} onChange={e => setFormUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))} placeholder="joao.silva" />
            </div>
            <div>
              <label className={labelClass}>E-mail (opcional)</label>
              <Input value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="joao@exemplo.gov.br" type="email" />
            </div>
            <div>
              <label className={labelClass}>Perfil de Visualização</label>
              <Select value={formPerfil} onValueChange={setFormPerfil}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrador">ADMINISTRADOR</SelectItem>
                  <SelectItem value="presidente">PRESIDENTE</SelectItem>
                  <SelectItem value="brenda">BRENDA</SelectItem>
                  <SelectItem value="sala_espera">SALA DE ESPERA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editingUser && (
              <div className="flex items-center gap-3">
                <label className={`${labelClass} mb-0`}>Ativo</label>
                <Switch checked={formAtivo} onCheckedChange={setFormAtivo} />
              </div>
            )}
            {!editingUser && (
              <div>
                <label className={labelClass}>Senha Provisória</label>
                <div className="flex gap-2">
                  <Input value={formSenha} onChange={e => setFormSenha(e.target.value)} placeholder="Ex.: Vertice@2026" />
                  <Button variant="outline" size="sm" onClick={gerarSenha} className="gap-1 whitespace-nowrap">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Gerar
                  </Button>
                  {formSenha && (
                    <Button variant="ghost" size="sm" onClick={() => copiarSenha(formSenha)} className="gap-1">
                      {senhaCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  )}
                </div>
                <p className="text-[10px] mt-1.5" style={{ color: '#5A6F8A' }}>
                  Mín. 6 caracteres, 1 letra, 1 número e 1 caractere especial. O usuário será obrigado a trocar no primeiro acesso.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={formSaving || !formNome || !formUsername || !formPerfil}>
              {formSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 uppercase tracking-wide">
              <KeyRound className="w-5 h-5" />
              Resetar Senha
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Defina uma nova senha provisória. O usuário será obrigado a trocar no próximo login.
            </p>
            <div>
              <label className={labelClass}>Nova Senha Provisória</label>
              <div className="flex gap-2">
                <Input value={resetSenha} onChange={e => setResetSenha(e.target.value)} placeholder="Ex.: Vertice@2026" />
                <Button variant="outline" size="sm" onClick={gerarSenhaReset} className="gap-1 whitespace-nowrap">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Gerar
                </Button>
                {resetSenha && (
                  <Button variant="ghost" size="sm" onClick={() => copiarSenha(resetSenha)} className="gap-1">
                    {senhaCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleResetPassword} disabled={resetSaving || !resetSenha}>
              {resetSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Resetar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GestaoUsuarios;
