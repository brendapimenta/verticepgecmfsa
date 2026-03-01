import React from 'react';
import { usePerfilVisual } from '@/contexts/ViewAsContext';
import { Shield, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const StatusSistema: React.FC = () => {
  const perfil = usePerfilVisual();

  if (perfil !== 'administrador') {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-lg font-semibold">ACESSO RESTRITO</p>
        <p className="text-sm mt-1">Este módulo é exclusivo para administradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground uppercase flex items-center gap-2">
          <Info className="w-6 h-6 text-primary" />
          STATUS DO SISTEMA (MODO TESTE)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumo da revisão geral e estado atual do VÉRTICE para testes internos.
        </p>
      </div>

      {/* Estáveis */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-foreground uppercase flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          FUNCIONALIDADES PRINCIPAIS ESTÁVEIS
        </h2>
        <ul className="space-y-2 text-sm text-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span><strong>Login por usuário e senha</strong> – Autenticação via edge function com bloqueio por tentativas (5 falhas = 15min de bloqueio). Troca obrigatória de senha no primeiro acesso.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span><strong>Fila de Atendimento</strong> – Ordenação híbrida (status → janela de agendamento → prioridade → chegada). Tarja lateral por prioridade. Tempo de espera formatado em horas e minutos.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span><strong>Pauta para Despacho do Presidente</strong> – Criação por Sala Principal e Presidente. Ações rápidas: decidir, adiar, pedir informações. Tarefas operacionais vinculadas.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span><strong>Autorizações Financeiras</strong> – Prioridade fixa Alta. Criação pela Sala Principal, conclusão por Presidente ou Sala Principal com confirmação em modal.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span><strong>Comandos Rápidos</strong> – Presidente pode chamar Sala Principal, solicitar encerramento. Sala Principal envia comandos para Sala de Espera. Solicitações internas entre perfis.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span><strong>Agenda / Calendário</strong> – Visão mensal e semanal. CRUD completo de eventos. Vínculo opcional com atendimentos.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span><strong>Notificações e Toasts</strong> – Todas as ações geram notificação + toast automático. Alerta urgente com popup bloqueante para o Presidente.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span><strong>Dashboards por perfil</strong> – Métricas em tempo real, calendário lateral, alertas estratégicos. Todos os perfis têm acesso ao Dashboard.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span><strong>Persistência real</strong> – Todos os dados são salvos no banco de dados. Realtime habilitado para atualizações automáticas entre perfis.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span><strong>Exportação de dados</strong> – Backup completo em CSV ou Excel (ZIP) disponível para o Administrador.</span>
          </li>
        </ul>
      </div>

      {/* Melhorias */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-foreground uppercase flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          PONTOS A MELHORAR EM PRÓXIMAS VERSÕES
        </h2>
        <ul className="space-y-2 text-sm text-foreground">
          <li className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
            <span><strong>Log de Auditoria no banco</strong> – O log do frontend registra ações em memória local. Para auditoria persistente, as ações de login/logout são registradas via edge function. Próxima etapa: migrar todas as ações do frontend para o banco.</span>
          </li>
          <li className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
            <span><strong>Notificações push</strong> – Atualmente via polling/realtime no navegador. Para uso em produção, considerar notificações push nativas.</span>
          </li>
          <li className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
            <span><strong>Upload de foto do cidadão</strong> – Campo existe mas o upload de arquivos ainda não está implementado.</span>
          </li>
          <li className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
            <span><strong>Relatórios avançados</strong> – Gráficos de tendência, comparativos mensais e exportação programada podem ser adicionados.</span>
          </li>
          <li className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
            <span><strong>Gestão de múltiplas instituições</strong> – A estrutura multi-tenant existe no banco mas a UI de gestão de instituições está simplificada.</span>
          </li>
        </ul>
      </div>

      {/* Info */}
      <div className="bg-primary/5 rounded-xl border border-primary/20 p-6">
        <h3 className="font-display text-base font-bold text-foreground uppercase mb-2">CREDENCIAIS DE TESTE</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">USUÁRIO</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">SENHA</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">PERFIL</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-2 px-3 font-mono text-foreground">administrador</td>
                <td className="py-2 px-3 font-mono text-foreground">Vertice@2026</td>
                <td className="py-2 px-3 text-foreground">Administrador</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 px-3 font-mono text-foreground">presidente</td>
                <td className="py-2 px-3 font-mono text-foreground">Vertice@2026</td>
                <td className="py-2 px-3 text-foreground">Presidente</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 px-3 font-mono text-foreground">brenda</td>
                <td className="py-2 px-3 font-mono text-foreground">Vertice@2026</td>
                <td className="py-2 px-3 text-foreground">Sala Principal</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono text-foreground">recepcao</td>
                <td className="py-2 px-3 font-mono text-foreground">Vertice@2026</td>
                <td className="py-2 px-3 text-foreground">Sala de Espera</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Todos os usuários exigem troca de senha no primeiro acesso. Após trocar, use a nova senha para logins futuros.
        </p>
      </div>

      <div className="text-center py-4">
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
          © 2026 VÉRTICE TECNOLOGIA INSTITUCIONAL · CONTROLE, ESTRATÉGIA E PRECISÃO NA GESTÃO PÚBLICA.
        </p>
      </div>
    </div>
  );
};

export default StatusSistema;
