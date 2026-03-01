import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Volume2, Smartphone } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { isPushSupported, subscribeToPush, unsubscribeFromPush, getPushPermission } from '@/lib/pushNotifications';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Prefs {
  push_ativo: boolean;
  som_alerta_urgente: boolean;
}

export const NotificationPreferences: React.FC<Props> = ({ open, onOpenChange }) => {
  const { usuario } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>({ push_ativo: true, som_alerta_urgente: true });
  const [loading, setLoading] = useState(true);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (!usuario || !open) return;
    setPushPermission(getPushPermission());

    const fetchPrefs = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('preferencias_notificacao')
        .select('push_ativo, som_alerta_urgente')
        .eq('usuario_id', usuario.id)
        .maybeSingle();
      if (data) {
        setPrefs({ push_ativo: data.push_ativo, som_alerta_urgente: data.som_alerta_urgente });
      }
      setLoading(false);
    };
    fetchPrefs();
  }, [usuario, open]);

  const updatePref = async (key: keyof Prefs, value: boolean) => {
    if (!usuario) return;
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);

    const { error } = await supabase
      .from('preferencias_notificacao')
      .upsert({
        usuario_id: usuario.id,
        ...newPrefs,
        atualizado_em: new Date().toISOString(),
      } as any, { onConflict: 'usuario_id' } as any);

    if (error) {
      sonnerToast.error('Erro ao salvar preferência.');
      setPrefs(prefs); // revert
      return;
    }

    // Handle push subscription changes
    if (key === 'push_ativo') {
      if (value) {
        const success = await subscribeToPush(usuario.id);
        if (!success) {
          sonnerToast.error('Não foi possível ativar notificações push. Verifique as permissões do navegador.');
          setPrefs({ ...newPrefs, push_ativo: false });
          await supabase.from('preferencias_notificacao').update({ push_ativo: false } as any).eq('usuario_id', usuario.id);
          return;
        }
      } else {
        await unsubscribeFromPush(usuario.id);
      }
    }

    sonnerToast.success('Preferência salva.');
    setPushPermission(getPushPermission());
  };

  if (!usuario) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            PREFERÊNCIAS DE NOTIFICAÇÃO
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
          ) : (
            <>
              {/* Push notifications */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <Label className="text-sm font-medium">Notificações push do navegador</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Receba alertas mesmo quando o VÉRTICE não estiver em foco
                    </p>
                    {!isPushSupported() && (
                      <p className="text-xs text-destructive mt-1">Seu navegador não suporta notificações push.</p>
                    )}
                    {pushPermission === 'denied' && (
                      <p className="text-xs text-destructive mt-1">
                        Permissão bloqueada. Altere nas configurações do navegador.
                      </p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={prefs.push_ativo}
                  onCheckedChange={(v) => updatePref('push_ativo', v)}
                  disabled={!isPushSupported() || pushPermission === 'denied'}
                />
              </div>

              {/* Sound for urgent alerts */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Volume2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <Label className="text-sm font-medium">Som para alertas urgentes</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Toque sonoro discreto para notificações de alta prioridade
                    </p>
                  </div>
                </div>
                <Switch
                  checked={prefs.som_alerta_urgente}
                  onCheckedChange={(v) => updatePref('som_alerta_urgente', v)}
                />
              </div>

              <div className="border-t pt-4">
                <p className="text-[11px] text-muted-foreground">
                  Notificações internas (toasts e popups) não podem ser desabilitadas pois fazem parte do fluxo operacional do sistema.
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
