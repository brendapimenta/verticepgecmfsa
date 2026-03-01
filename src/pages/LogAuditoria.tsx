import React, { useState, useMemo } from 'react';
import { useAudit } from '@/contexts/AuditContext';
import { usePerfilVisual } from '@/contexts/ViewAsContext';
import {
  RegistroAuditoria, TipoAcaoAuditoria, ModuloAuditoria, NivelSensibilidade
} from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield, Search, Download, FileText, Clock, User, Filter, AlertTriangle
} from 'lucide-react';

const nivelStyle: Record<NivelSensibilidade, string> = {
  normal: 'bg-muted text-muted-foreground',
  'estratégico': 'bg-primary/15 text-primary',
  financeiro: 'bg-yellow-500/15 text-yellow-500',
};

const tipoAcaoLabels: Record<TipoAcaoAuditoria, string> = {
  login: 'Login',
  logout: 'Logout',
  criar_atendimento: 'Criar Atendimento',
  editar_atendimento: 'Editar Atendimento',
  alterar_prioridade: 'Alterar Prioridade',
  alterar_status: 'Alterar Status',
  checkin: 'Check-in',
  protocolo_encerramento: 'Protocolo Encerramento',
  enviar_alerta: 'Enviar Alerta',
  comando_rapido: 'Comando Rápido',
  criar_demanda: 'Criar Demanda',
  criar_solicitacao: 'Criar Solicitação',
  criar_autorizacao: 'Criar Autorização',
  concluir_autorizacao: 'Concluir Autorização',
  editar_autorizacao: 'Editar Autorização',
  alterar_ficha: 'Alterar Ficha',
  mudanca_tema: 'Mudança de Tema',
  criar_evento: 'Criar Evento',
  editar_evento: 'Editar Evento',
  excluir_evento: 'Excluir Evento',
  chamar_brenda: 'Chamar Brenda',
  criar_pauta: 'Criar Pauta',
  decidir_pauta: 'Decidir Pauta',
  adiar_pauta: 'Adiar Pauta',
  pedir_info_pauta: 'Pedir Info Pauta',
  criar_tarefa_operacional: 'Criar Tarefa Operacional',
  alterar_status_pauta: 'Alterar Status Pauta',
};

const moduloLabels: Record<ModuloAuditoria, string> = {
  'autenticação': 'Autenticação',
  atendimento: 'Atendimento',
  fila: 'Fila',
  comandos: 'Comandos',
  demandas: 'Demandas',
  'solicitações': 'Solicitações',
  financeiro: 'Financeiro',
  agenda: 'Agenda',
  chat: 'Chat',
  sistema: 'Sistema',
};

const LogAuditoria: React.FC = () => {
  const perfil = usePerfilVisual();
  const { registros } = useAudit();

  const [searchText, setSearchText] = useState('');
  const [filtroModulo, setFiltroModulo] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroUsuario, setFiltroUsuario] = useState<string>('todos');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  const usuariosUnicos = [...new Set(registros.map(r => r.nome_usuario))];

  const filtrados = useMemo(() => {
    return registros.filter(r => {
      if (searchText && !r.descricao_resumida.toLowerCase().includes(searchText.toLowerCase()) &&
          !r.nome_usuario.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (filtroModulo !== 'todos' && r.modulo !== filtroModulo) return false;
      if (filtroTipo !== 'todos' && r.tipo_acao !== filtroTipo) return false;
      if (filtroUsuario !== 'todos' && r.nome_usuario !== filtroUsuario) return false;
      if (filtroDataInicio) {
        const dataReg = r.data_hora.split('T')[0];
        if (dataReg < filtroDataInicio) return false;
      }
      if (filtroDataFim) {
        const dataReg = r.data_hora.split('T')[0];
        if (dataReg > filtroDataFim) return false;
      }
      return true;
    });
  }, [registros, searchText, filtroModulo, filtroTipo, filtroUsuario, filtroDataInicio, filtroDataFim]);

  if (perfil !== 'administrador') {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-lg font-semibold">Acesso Restrito</p>
        <p className="text-sm mt-1">Este módulo é exclusivo para administradores.</p>
      </div>
    );
  }

  const gerarCSV = () => {
    const headers = ['Data/Hora', 'Usuário', 'Perfil', 'Ação', 'Módulo', 'Descrição', 'Valor Anterior', 'Valor Novo', 'Sensibilidade'];
    const rows = filtrados.map(r => [
      new Date(r.data_hora).toLocaleString('pt-BR'),
      r.nome_usuario,
      r.perfil_usuario,
      tipoAcaoLabels[r.tipo_acao] || r.tipo_acao,
      moduloLabels[r.modulo] || r.modulo,
      r.descricao_resumida,
      r.valor_anterior || '',
      r.valor_novo || '',
      r.nivel_sensibilidade,
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.map(v => `"${v}"`).join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vertice-auditoria-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const gerarPDFInstitucional = () => {
    const filtrosTexto = [
      filtroModulo !== 'todos' ? `Módulo: ${moduloLabels[filtroModulo as ModuloAuditoria] || filtroModulo}` : null,
      filtroTipo !== 'todos' ? `Ação: ${tipoAcaoLabels[filtroTipo as TipoAcaoAuditoria] || filtroTipo}` : null,
      filtroUsuario !== 'todos' ? `Usuário: ${filtroUsuario}` : null,
      filtroDataInicio ? `De: ${filtroDataInicio}` : null,
      filtroDataFim ? `Até: ${filtroDataFim}` : null,
    ].filter(Boolean).join(' | ') || 'Sem filtros aplicados';

    const tableRows = filtrados.map(r => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;">${new Date(r.data_hora).toLocaleString('pt-BR')}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;">${r.nome_usuario}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;">${r.perfil_usuario}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;">${tipoAcaoLabels[r.tipo_acao] || r.tipo_acao}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;">${r.descricao_resumida}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;">${r.nivel_sensibilidade}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatório VÉRTICE</title>
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; color: #1a1a2e; }
      .header { text-align: center; border-bottom: 3px solid #1a3a5c; padding-bottom: 20px; margin-bottom: 20px; }
      .header h1 { font-size: 18px; color: #1a3a5c; margin: 0; letter-spacing: 2px; }
      .header h2 { font-size: 13px; color: #64748b; margin: 4px 0 0; font-weight: 400; }
      .meta { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-bottom: 16px; }
      .filters { background: #f1f5f9; border-radius: 6px; padding: 8px 12px; font-size: 11px; color: #475569; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #1a3a5c; color: white; padding: 8px; font-size: 11px; text-align: left; }
      .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e5e7eb; padding-top: 12px; }
    </style></head><body>
    <div class="header">
      <h1>VÉRTICE – SISTEMA DE GESTÃO ESTRATÉGICA</h1>
      <h2>Relatório de Auditoria</h2>
    </div>
    <div class="meta">
      <span>Data de geração: ${new Date().toLocaleString('pt-BR')}</span>
      <span>Total de registros: ${filtrados.length}</span>
    </div>
    <div class="filters">Filtros: ${filtrosTexto}</div>
    <table>
      <thead><tr>
        <th>Data/Hora</th><th>Usuário</th><th>Perfil</th><th>Ação</th><th>Descrição</th><th>Sensibilidade</th>
      </tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
    <div class="footer">VÉRTICE – Câmara Municipal de Feira de Santana – Documento gerado automaticamente</div>
    </body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Log de Auditoria
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Registro completo de todas as ações do sistema • {registros.length} registros</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={gerarCSV} className="gap-1">
            <Download className="w-3.5 h-3.5" /> Excel (CSV)
          </Button>
          <Button variant="outline" size="sm" onClick={gerarPDFInstitucional} className="gap-1">
            <FileText className="w-3.5 h-3.5" /> PDF Institucional
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="w-4 h-4" /> Filtros
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filtroModulo} onValueChange={setFiltroModulo}>
            <SelectTrigger><SelectValue placeholder="Módulo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os módulos</SelectItem>
              {Object.entries(moduloLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger><SelectValue placeholder="Tipo de ação" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as ações</SelectItem>
              {Object.entries(tipoAcaoLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroUsuario} onValueChange={setFiltroUsuario}>
            <SelectTrigger><SelectValue placeholder="Usuário" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os usuários</SelectItem>
              {usuariosUnicos.map(u => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input type="date" value={filtroDataInicio} onChange={e => setFiltroDataInicio(e.target.value)} placeholder="Data início" />
          <Input type="date" value={filtroDataFim} onChange={e => setFiltroDataFim(e.target.value)} placeholder="Data fim" />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data/Hora</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Usuário</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Perfil</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ação</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descrição</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sensibilidade</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>Nenhum registro encontrado.</p>
                  </td>
                </tr>
              ) : (
                filtrados.slice(0, 100).map(r => (
                  <tr key={r.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.data_hora).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      {r.nome_usuario}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px]">{r.perfil_usuario}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs">{tipoAcaoLabels[r.tipo_acao] || r.tipo_acao}</td>
                    <td className="px-4 py-3 text-xs max-w-[300px] truncate" title={r.descricao_resumida}>
                      {r.descricao_resumida}
                      {r.valor_anterior && (
                        <span className="block text-[10px] text-muted-foreground mt-0.5">
                          {r.valor_anterior} → {r.valor_novo}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] ${nivelStyle[r.nivel_sensibilidade]}`}>
                        {r.nivel_sensibilidade === 'estratégico' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {r.nivel_sensibilidade}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtrados.length > 100 && (
          <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
            Exibindo 100 de {filtrados.length} registros. Use os filtros para refinar.
          </div>
        )}
      </div>
    </div>
  );
};

export default LogAuditoria;
