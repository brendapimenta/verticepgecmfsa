import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAudit } from '@/contexts/AuditContext';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast as sonnerToast } from 'sonner';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const TABELAS = [
  { nome: 'usuarios', label: 'USUÁRIOS' },
  { nome: 'atendimentos', label: 'ATENDIMENTOS' },
  { nome: 'pautas_despacho', label: 'PAUTAS DE DESPACHO' },
  { nome: 'solicitacoes', label: 'SOLICITAÇÕES' },
  { nome: 'eventos_agenda', label: 'AGENDA' },
  { nome: 'log_auditoria', label: 'LOG DE AUDITORIA' },
  { nome: 'autorizacoes_financeiras', label: 'AUTORIZAÇÕES FINANCEIRAS' },
  { nome: 'demandas', label: 'DEMANDAS' },
  { nome: 'comandos', label: 'COMANDOS' },
  { nome: 'mensagens_chat', label: 'MENSAGENS DO CHAT' },
  { nome: 'notificacoes', label: 'NOTIFICAÇÕES' },
] as const;

type Formato = 'csv' | 'xlsx';

const ExportarDados: React.FC = () => {
  const { usuario } = useAuth();
  const { registrarAuditoria } = useAudit();
  const [exportando, setExportando] = useState(false);

  if (!usuario) return null;

  const fetchTabela = async (nome: string) => {
    const { data, error } = await supabase.from(nome as any).select('*');
    if (error) { console.error(`Erro ao exportar ${nome}:`, error); return []; }
    return data || [];
  };

  const gerarCSV = (dados: Record<string, unknown>[], nomeTabela: string): string => {
    if (dados.length === 0) return '';
    const headers = Object.keys(dados[0]);
    const linhas = dados.map(row => headers.map(h => {
      const val = (row as any)[h];
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(','));
    return [headers.join(','), ...linhas].join('\n');
  };

  const exportar = async (formato: Formato) => {
    setExportando(true);
    try {
      const zip = new JSZip();
      const timestamp = new Date().toISOString().split('T')[0];

      for (const tabela of TABELAS) {
        const dados = await fetchTabela(tabela.nome);
        if (dados.length === 0) continue;

        if (formato === 'csv') {
          const csv = gerarCSV(dados, tabela.nome);
          zip.file(`${tabela.nome}_${timestamp}.csv`, csv);
        } else {
          const ws = XLSX.utils.json_to_sheet(dados);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, tabela.label.slice(0, 31));
          const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          zip.file(`${tabela.nome}_${timestamp}.xlsx`, xlsxBuffer);
        }
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `VERTICE_BACKUP_${formato.toUpperCase()}_${timestamp}.zip`);

      registrarAuditoria({
        usuario_id: usuario.id,
        nome_usuario: usuario.nome,
        perfil_usuario: usuario.perfil,
        tipo_acao: 'logout' as any,
        modulo: 'sistema',
        descricao_resumida: `Exportação completa realizada em formato ${formato.toUpperCase()}.`,
        nivel_sensibilidade: 'estratégico',
      });

      sonnerToast.success(`Exportação ${formato.toUpperCase()} concluída!`);
    } catch (err) {
      console.error('Erro na exportação:', err);
      sonnerToast.error('Erro ao exportar dados.');
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground uppercase">EXPORTAR DADOS COMPLETOS</h1>
        <p className="text-sm text-muted-foreground mt-1">Gere um backup de todas as tabelas do sistema em CSV ou Excel</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Exportação de Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            A exportação incluirá todas as tabelas: Usuários, Atendimentos, Pautas de Despacho, Solicitações,
            Agenda, Log de Auditoria, Autorizações Financeiras, Demandas, Comandos, Mensagens e Notificações.
          </p>
          <p className="text-sm text-muted-foreground">
            Cada tabela será exportada como arquivo individual dentro de um ZIP compactado.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button onClick={() => exportar('csv')} disabled={exportando} className="gap-2">
              {exportando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              EXPORTAR CSV (ZIP)
            </Button>
            <Button onClick={() => exportar('xlsx')} disabled={exportando} variant="outline" className="gap-2">
              {exportando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              EXPORTAR EXCEL (ZIP)
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">Tabelas incluídas:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {TABELAS.map(t => (
                <div key={t.nome} className="text-xs text-muted-foreground bg-muted/50 rounded px-3 py-1.5">{t.label}</div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportarDados;
