import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { TipoCidadao, TipoRegistro, Prioridade } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const tiposCidadao: TipoCidadao[] = ['Autoridade', 'Vereador', 'Administração', 'Liderança', 'Assessor', 'Servidor', 'Efetivo', 'Família', 'Cidadão'];
const tiposRegistro: TipoRegistro[] = ['Sem agendamento', 'Atendimento agendado', 'Reunião agendada'];

const NovoAtendimento: React.FC = () => {
  const { addAtendimento } = useData();
  const { usuario } = useAuth();
  const { toast } = useToast();
  const [sucesso, setSucesso] = useState(false);

  const [form, setForm] = useState({
    nome_cidadao: '', tipo: '' as TipoCidadao, tipo_registro: '' as TipoRegistro,
    data_agendada: '', hora_agendada: '', telefone_contato: '', indicado_por: '',
    assunto: '', demanda_principal: '', descricao: '', observacao_recepcao: '',
  });

  const needsSchedule = form.tipo_registro === 'Atendimento agendado' || form.tipo_registro === 'Reunião agendada';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (needsSchedule && (!form.data_agendada || !form.hora_agendada)) {
      toast({ title: 'Campos obrigatórios', description: 'Data e hora agendada são obrigatórios para este tipo de registro.', variant: 'destructive' });
      return;
    }

    const agora = new Date();
    addAtendimento({
      ...form,
      data_chegada: agora.toISOString().split('T')[0],
      hora_chegada: agora.toTimeString().slice(0, 5),
      prioridade: 'Média',
      status: 'Aguardando',
      responsavel: 'Brenda',
      criado_por: usuario?.id || '',
    });

    toast({ title: 'Atendimento criado!', description: `${form.nome_cidadao} adicionado à fila.` });
    setSucesso(true);
    setTimeout(() => {
      setSucesso(false);
      setForm({ nome_cidadao: '', tipo: '' as TipoCidadao, tipo_registro: '' as TipoRegistro, data_agendada: '', hora_agendada: '', telefone_contato: '', indicado_por: '', assunto: '', demanda_principal: '', descricao: '', observacao_recepcao: '' });
    }, 2000);
  };

  if (sucesso) {
    return (
      <div className="flex items-center justify-center py-20 animate-fade-in">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-foreground">Atendimento Registrado!</h2>
          <p className="text-muted-foreground mt-2">O cidadão foi adicionado à fila.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Novo Atendimento</h1>
        <p className="text-sm text-muted-foreground mt-1">Registrar novo atendimento na fila</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nome do Cidadão *</Label>
            <Input className="mt-1.5" value={form.nome_cidadao} onChange={e => setForm(f => ({ ...f, nome_cidadao: e.target.value }))} required />
          </div>
          <div>
            <Label>Tipo *</Label>
            <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v as TipoCidadao }))}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {tiposCidadao.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Tipo de Registro *</Label>
            <Select value={form.tipo_registro} onValueChange={v => setForm(f => ({ ...f, tipo_registro: v as TipoRegistro }))}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {tiposRegistro.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Telefone de Contato *</Label>
            <Input className="mt-1.5" value={form.telefone_contato} onChange={e => setForm(f => ({ ...f, telefone_contato: e.target.value }))} required placeholder="(63) 99999-0000" />
          </div>
        </div>

        {needsSchedule && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-secondary border border-border">
            <div>
              <Label>Data Agendada *</Label>
              <Input type="date" className="mt-1.5" value={form.data_agendada} onChange={e => setForm(f => ({ ...f, data_agendada: e.target.value }))} required />
            </div>
            <div>
              <Label>Hora Agendada *</Label>
              <Input type="time" className="mt-1.5" value={form.hora_agendada} onChange={e => setForm(f => ({ ...f, hora_agendada: e.target.value }))} required />
            </div>
          </div>
        )}

        <div>
          <Label>Indicado por</Label>
          <Input className="mt-1.5" value={form.indicado_por} onChange={e => setForm(f => ({ ...f, indicado_por: e.target.value }))} placeholder="Quem indicou?" />
        </div>

        <div>
          <Label>Assunto *</Label>
          <Input className="mt-1.5" value={form.assunto} onChange={e => setForm(f => ({ ...f, assunto: e.target.value }))} required />
        </div>

        <div>
          <Label>Demanda Principal *</Label>
          <Input className="mt-1.5" value={form.demanda_principal} onChange={e => setForm(f => ({ ...f, demanda_principal: e.target.value }))} required placeholder="Qual demanda a pessoa quer tratar?" />
        </div>

        <div>
          <Label>Descrição Detalhada</Label>
          <Textarea className="mt-1.5 min-h-[100px]" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
        </div>

        <div>
          <Label>Observação da Recepção</Label>
          <Textarea className="mt-1.5" value={form.observacao_recepcao} onChange={e => setForm(f => ({ ...f, observacao_recepcao: e.target.value }))} />
        </div>

        <Button type="submit" className="w-full gap-2">
          <PlusCircle className="w-4 h-4" />
          Registrar Atendimento
        </Button>
      </form>
    </div>
  );
};

export default NovoAtendimento;
