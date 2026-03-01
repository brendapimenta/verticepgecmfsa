import { ReferenciaTipo } from '@/types';

export const getRouteForRef = (tipo: ReferenciaTipo, id: string): string => {
  switch (tipo) {
    case 'atendimento': return `/atendimento/${id}`;
    case 'comando': return '/comandos';
    case 'chat': return '/chat';
    case 'solicitacao': return '/comandos';
    case 'demanda': return '/demandas';
    case 'demanda_atendimento': return '/fila';
    case 'autorizacao_financeira': return '/autorizacoes';
    case 'alerta': return '/notificacoes';
    case 'evento_agenda': return '/agenda';
    case 'pauta_despacho': return '/pauta-despacho';
    default: return '/notificacoes';
  }
};
