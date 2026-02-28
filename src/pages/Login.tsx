import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn } from 'lucide-react';
import logoVerticeFull from '@/assets/logo-vertice-full.png';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!login(email, senha)) {
      setErro('E-mail não encontrado. Use um dos e-mails de demonstração.');
    }
  };

  const demoAccounts = [
    { label: 'Administrador', email: 'admin@cmfs.gov.br' },
    { label: 'Sala de Espera', email: 'recepcao@cmfs.gov.br' },
    { label: 'Brenda', email: 'brenda@cmfs.gov.br' },
    { label: 'Presidente', email: 'presidente@cmfs.gov.br' },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'radial-gradient(circle at top center, #0C2A4D 0%, #071B34 40%, #050B18 100%)',
      }}
    >
      {/* Subtle geometric background */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 80" stroke="#A9B7C9" strokeWidth="0.5" fill="none" />
              <path d="M 0 0 L 80 80" stroke="#A9B7C9" strokeWidth="0.5" fill="none" />
              <circle cx="40" cy="40" r="1.5" fill="#A9B7C9" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row items-center w-full max-w-5xl mx-auto px-4 gap-12 lg:gap-16">
        {/* Left: Branding */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left py-8 lg:py-0">
          <img
            src={logoVerticeFull}
            alt="VÉRTICE"
            className="w-44 lg:w-56 object-contain mb-6"
          />
          <p
            className="text-sm lg:text-base tracking-[0.25em] uppercase font-medium mb-4"
            style={{ color: '#A9B7C9' }}
          >
            Gestão Estratégica de Atendimentos
          </p>
          <p
            className="text-sm lg:text-base max-w-sm leading-relaxed"
            style={{ color: '#6B7F99' }}
          >
            Controle, estratégia e precisão no atendimento público.
          </p>
        </div>

        {/* Right: Login Card */}
        <div className="w-full max-w-md">
          <div
            className="rounded-2xl p-8 backdrop-blur-sm"
            style={{
              background: 'rgba(13, 30, 58, 0.85)',
              border: '1px solid #1F3455',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
          >
            <h2
              className="text-lg font-semibold tracking-wide uppercase mb-6"
              style={{ color: '#E6EDF5' }}
            >
              Acesso ao sistema
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                  style={{ color: '#A9B7C9' }}
                >
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.gov.br"
                  required
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-colors duration-200 placeholder:text-[#5A6F8A]"
                  style={{
                    background: '#122544',
                    border: '1px solid #324A71',
                    color: '#E6EDF5',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#5A7FAA')}
                  onBlur={e => (e.target.style.borderColor = '#324A71')}
                />
              </div>

              <div>
                <label
                  htmlFor="senha"
                  className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                  style={{ color: '#A9B7C9' }}
                >
                  Senha
                </label>
                <input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-colors duration-200 placeholder:text-[#5A6F8A]"
                  style={{
                    background: '#122544',
                    border: '1px solid #324A71',
                    color: '#E6EDF5',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#5A7FAA')}
                  onBlur={e => (e.target.style.borderColor = '#324A71')}
                />
              </div>

              {erro && (
                <p className="text-sm" style={{ color: '#E5737F' }}>
                  {erro}
                </p>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200"
                style={{
                  background: '#3C5C7A',
                  color: '#E6EDF5',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#486891')}
                onMouseLeave={e => (e.currentTarget.style.background = '#3C5C7A')}
              >
                <LogIn className="w-4 h-4" />
                Entrar
              </button>
            </form>
          </div>

          {/* Demo accounts */}
          <div
            className="mt-5 rounded-xl p-4"
            style={{
              background: 'rgba(13, 30, 58, 0.6)',
              border: '1px solid #1F3455',
            }}
          >
            <p
              className="text-xs font-medium uppercase tracking-widest mb-3"
              style={{ color: '#6B7F99' }}
            >
              Acesso Demonstração
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => { setEmail(acc.email); setSenha('demo'); }}
                  className="text-left px-3 py-2 rounded-lg text-xs transition-colors duration-200"
                  style={{
                    background: 'transparent',
                    border: '1px solid transparent',
                    color: '#A9B7C9',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#122544';
                    e.currentTarget.style.borderColor = '#324A71';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <span className="font-medium block" style={{ color: '#E6EDF5' }}>
                    {acc.label}
                  </span>
                  <span style={{ color: '#6B7F99' }}>{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
