import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePerfilVisual } from '@/contexts/ViewAsContext';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const ConfiguracaoInstituicao: React.FC = () => {
  const { usuario } = useAuth();
  const perfilUI = usePerfilVisual();
  const isAdmin = perfilUI === 'administrador';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [instituicao, setInstituicao] = useState<{
    id: string;
    nome_instituicao: string;
    sigla: string;
    logo_url: string;
    cor_primaria: string;
    cor_secundaria: string;
    dominio: string;
    observacoes: string;
  } | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('instituicoes')
        .select('*')
        .eq('ativa', true)
        .limit(1)
        .single();
      if (data) {
        setInstituicao({
          id: data.id,
          nome_instituicao: data.nome_instituicao,
          sigla: data.sigla,
          logo_url: data.logo_url || '',
          cor_primaria: data.cor_primaria || '#0C2A4D',
          cor_secundaria: data.cor_secundaria || '#3C5C7A',
          dominio: data.dominio || '',
          observacoes: data.observacoes || '',
        });
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Acesso restrito ao Administrador.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!instituicao) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Nenhuma instituição encontrada.</p>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('instituicoes')
      .update({
        nome_instituicao: instituicao.nome_instituicao,
        sigla: instituicao.sigla,
        logo_url: instituicao.logo_url || null,
        cor_primaria: instituicao.cor_primaria,
        cor_secundaria: instituicao.cor_secundaria,
        dominio: instituicao.dominio || null,
        observacoes: instituicao.observacoes || null,
      })
      .eq('id', instituicao.id);

    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar configurações.');
    } else {
      toast.success('Configurações da instituição salvas com sucesso.');
    }
  };

  const update = (field: string, value: string) => {
    setInstituicao(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5';
  const inputClass = 'bg-background';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground uppercase tracking-wide">CONFIGURAÇÕES DA INSTITUIÇÃO</h1>
          <p className="text-xs text-muted-foreground">Dados cadastrais e personalização visual</p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Nome da Instituição</label>
            <Input
              value={instituicao.nome_instituicao}
              onChange={e => update('nome_instituicao', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Sigla</label>
            <Input
              value={instituicao.sigla}
              onChange={e => update('sigla', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Domínio (opcional)</label>
            <Input
              value={instituicao.dominio}
              onChange={e => update('dominio', e.target.value)}
              placeholder="vertice.cmfs.ba.gov.br"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>URL do Logo (opcional)</label>
          <Input
            value={instituicao.logo_url}
            onChange={e => update('logo_url', e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
          {instituicao.logo_url && (
            <div className="mt-2 p-3 rounded-lg bg-muted/50 inline-block">
              <img src={instituicao.logo_url} alt="Logo" className="h-12 object-contain" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Cor Primária</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={instituicao.cor_primaria}
                onChange={e => update('cor_primaria', e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-border"
              />
              <Input
                value={instituicao.cor_primaria}
                onChange={e => update('cor_primaria', e.target.value)}
                className={`${inputClass} flex-1`}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Cor Secundária</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={instituicao.cor_secundaria}
                onChange={e => update('cor_secundaria', e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-border"
              />
              <Input
                value={instituicao.cor_secundaria}
                onChange={e => update('cor_secundaria', e.target.value)}
                className={`${inputClass} flex-1`}
              />
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>Observações Internas (opcional)</label>
          <Textarea
            value={instituicao.observacoes}
            onChange={e => update('observacoes', e.target.value)}
            placeholder="Informações internas sobre a instituição..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default ConfiguracaoInstituicao;
