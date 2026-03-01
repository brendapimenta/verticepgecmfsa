import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';
import { LogOut, User, Camera, KeyRound, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const perfilLabels: Record<string, string> = {
  administrador: 'ADMINISTRADOR',
  sala_espera: 'SALA DE ESPERA',
  sala_principal: 'SALA PRINCIPAL',
  presidente: 'PRESIDENTE',
};

function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return nome.substring(0, 2).toUpperCase();
}

export const UserAvatarMenu: React.FC = () => {
  const { usuario, logout, updateAvatar } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load avatar signed URL
  const loadAvatar = useCallback(async () => {
    if (!usuario?.avatar_path) {
      setAvatarUrl(null);
      return;
    }
    try {
      const { data } = await supabase.storage
        .from('avatars')
        .createSignedUrl(usuario.avatar_path, 3600);
      if (data?.signedUrl) {
        setAvatarUrl(data.signedUrl);
      }
    } catch {
      setAvatarUrl(null);
    }
  }, [usuario?.avatar_path]);

  useEffect(() => {
    loadAvatar();
  }, [loadAvatar]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !usuario) return;

    if (!file.type.startsWith('image/')) {
      sonnerToast.error('Selecione um arquivo de imagem válido.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      sonnerToast.error('A imagem deve ter no máximo 2MB.');
      return;
    }

    setUploading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUserId = sessionData.session?.user.id;
      if (!authUserId) {
        sonnerToast.error('Sessão expirada.');
        return;
      }

      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `${authUserId}/avatar.${ext}`;

      // Delete old avatar if exists
      if (usuario.avatar_path) {
        await supabase.storage.from('avatars').remove([usuario.avatar_path]);
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        sonnerToast.error('Erro ao enviar imagem: ' + uploadError.message);
        return;
      }

      // Update usuario record
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ avatar_path: filePath })
        .eq('id', usuario.id);

      if (updateError) {
        sonnerToast.error('Erro ao salvar referência da imagem.');
        return;
      }

      updateAvatar(filePath);
      sonnerToast.success('Foto atualizada com sucesso!');
      setShowPhotoDialog(false);
    } catch {
      sonnerToast.error('Erro ao processar imagem.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!usuario?.avatar_path) return;
    setUploading(true);
    try {
      await supabase.storage.from('avatars').remove([usuario.avatar_path]);
      await supabase.from('usuarios').update({ avatar_path: null }).eq('id', usuario.id);
      updateAvatar(null);
      setAvatarUrl(null);
      sonnerToast.success('Foto removida.');
      setShowPhotoDialog(false);
    } catch {
      sonnerToast.error('Erro ao remover foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    sonnerToast.success('Sessão encerrada com sucesso.');
  };

  if (!usuario) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors focus:outline-none">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-primary/20">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={usuario.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {getInitials(usuario.nome)}
                  </span>
                </div>
              )}
            </div>
            {/* Name and role */}
            <div className="hidden sm:flex flex-col items-start min-w-0">
              <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">
                {usuario.nome}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {perfilLabels[usuario.perfil]}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => navigate('/trocar-senha')} className="gap-2">
            <User className="w-4 h-4" />
            MEU PERFIL
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowPhotoDialog(true)} className="gap-2">
            <Camera className="w-4 h-4" />
            ALTERAR FOTO
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/trocar-senha')} className="gap-2">
            <KeyRound className="w-4 h-4" />
            ALTERAR SENHA
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive focus:text-destructive">
            <LogOut className="w-4 h-4" />
            SAIR
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog: Alterar Foto */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              ALTERAR FOTO
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20">
              {avatarUrl ? (
                <img src={avatarUrl} alt={usuario.nome} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{getInitials(usuario.nome)}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Formatos aceitos: JPG, PNG. Tamanho máximo: 2MB.
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleUpload}
              disabled={uploading}
              className="text-sm"
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {usuario.avatar_path && (
              <Button variant="outline" onClick={handleRemovePhoto} disabled={uploading} className="text-destructive hover:text-destructive">
                Remover foto
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowPhotoDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
