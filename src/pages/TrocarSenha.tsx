import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import verticeLogoFull from '@/assets/vertice-logo-full.png';

const regras = [
  { label: 'Mínimo 6 caracteres', test: (s: string) => s.length >= 6 },
  { label: 'Pelo menos 1 letra', test: (s: string) => /[a-zA-Z]/.test(s) },
  { label: 'Pelo menos 1 número', test: (s: string) => /[0-9]/.test(s) },
  { label: 'Pelo menos 1 caractere especial', test: (s: string) => /[^a-zA-Z0-9]/.test(s) },
];

const TrocarSenha: React.FC = () => {
  const { trocarSenha, setPrimeiroLoginDone, usuario } = useAuth();
  const navigate = useNavigate();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const todasRegrasOk = regras.every(r => r.test(novaSenha));
  const senhasIguais = novaSenha === confirmarSenha && confirmarSenha.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!todasRegrasOk) {
      setErro('A senha não atende aos requisitos mínimos.');
      return;
    }
    if (!senhasIguais) {
      setErro('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const result = await trocarSenha(novaSenha);
    setLoading(false);

    if (!result.success) {
      setErro(result.error || 'Erro ao trocar senha.');
      return;
    }

    setPrimeiroLoginDone();
    const defaultRoute = usuario?.perfil === 'sala_espera' ? '/fila' : '/dashboard';
    navigate(defaultRoute, { replace: true });
  };

  const inputClasses =
    'w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200 placeholder:text-[#5A6F8A]';

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'radial-gradient(circle at top center, #0C2A4D 0%, #071B34 40%, #050B18 100%)',
      }}
    >
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="flex flex-col items-center mb-8">
          <img src={verticeLogoFull} alt="VÉRTICE" className="w-[180px] object-contain mb-4" />
        </div>

        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(13, 30, 58, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #1F3455',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <KeyRound className="w-5 h-5" style={{ color: '#A9B7C9' }} />
            <h2 className="text-lg font-semibold tracking-wide uppercase" style={{ color: '#E6EDF5' }}>
              DEFINIR NOVA SENHA
            </h2>
          </div>
          <p className="text-xs mb-6" style={{ color: '#5A6F8A' }}>
            Por segurança, defina uma nova senha para continuar acessando o sistema.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#A9B7C9' }}>
                NOVA SENHA
              </label>
              <input
                type="password"
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                disabled={loading}
                className={inputClasses}
                style={{
                  background: '#122544',
                  border: '1px solid #324A71',
                  color: '#E6EDF5',
                }}
              />
            </div>

            {/* Password rules */}
            <div className="space-y-1.5">
              {regras.map((r, i) => {
                const ok = r.test(novaSenha);
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {novaSenha.length > 0 ? (
                      ok ? <CheckCircle className="w-3.5 h-3.5" style={{ color: '#4ADE80' }} /> : <AlertCircle className="w-3.5 h-3.5" style={{ color: '#E5737F' }} />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border" style={{ borderColor: '#324A71' }} />
                    )}
                    <span style={{ color: novaSenha.length > 0 ? (ok ? '#4ADE80' : '#E5737F') : '#5A6F8A' }}>{r.label}</span>
                  </div>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#A9B7C9' }}>
                CONFIRMAR NOVA SENHA
              </label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                disabled={loading}
                className={inputClasses}
                style={{
                  background: '#122544',
                  border: `1px solid ${confirmarSenha.length > 0 && !senhasIguais ? '#7A3040' : '#324A71'}`,
                  color: '#E6EDF5',
                }}
              />
              {confirmarSenha.length > 0 && !senhasIguais && (
                <p className="text-xs mt-1" style={{ color: '#E5737F' }}>As senhas não coincidem.</p>
              )}
            </div>

            {erro && <p className="text-sm" style={{ color: '#E5737F' }}>{erro}</p>}

            <button
              type="submit"
              disabled={loading || !todasRegrasOk || !senhasIguais}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: todasRegrasOk && senhasIguais ? '#3C5C7A' : '#1F3455',
                color: '#E6EDF5',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              {loading ? 'SALVANDO...' : 'SALVAR NOVA SENHA'}
            </button>
          </form>
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center z-10">
        <p className="text-[10px] tracking-[0.08em] uppercase font-medium" style={{ color: '#5A6F8A' }}>
          © 2026 VÉRTICE TECNOLOGIA INSTITUCIONAL
        </p>
      </div>
    </div>
  );
};

export default TrocarSenha;
