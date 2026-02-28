import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn } from 'lucide-react';
import logoVerticeFull from '@/assets/logo-vertice-full.png';

/* ── Particle layer (canvas) ── */
const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let w = 0, h = 0;

    const resize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const COUNT = 50;
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * 2000,
      y: Math.random() * 2000,
      r: Math.random() * 1.8 + 0.6,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      o: Math.random() * 0.25 + 0.08,
    }));

    const LINK_DIST = 140;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // move
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
      }

      // lines
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * 0.12;
            ctx.strokeStyle = `rgba(36,56,82,${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // dots
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(169,183,201,${p.o})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
};

/* ── Login Page ── */
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

  const inputClasses =
    'w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200 placeholder:text-[#5A6F8A] login-input';

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'radial-gradient(circle at top center, #0C2A4D 0%, #071B34 40%, #050B18 100%)',
      }}
    >
      {/* Particle + network layer */}
      <ParticleBackground />

      {/* Static geometric pattern */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ zIndex: 2 }}>
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
        <div
          className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left py-8 lg:py-0"
          style={{ animation: 'login-brand-in 0.6s ease-out both' }}
        >
          <div className="relative">
            <div
              className="absolute inset-0 -m-16 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(60,92,122,0.25) 0%, rgba(60,92,122,0.1) 40%, transparent 70%)',
              }}
            />
            <img src={logoVerticeFull} alt="VÉRTICE" className="relative w-44 lg:w-56 object-contain mb-6 drop-shadow-none" style={{ background: 'transparent' }} />
          </div>
          <p className="text-base lg:text-xl tracking-[0.3em] uppercase font-semibold mb-4" style={{ color: '#E6EDF5' }}>
            Gestão Estratégica de Atendimentos
          </p>
          <p className="text-sm lg:text-base max-w-sm leading-relaxed" style={{ color: '#A9B7C9' }}>
            Controle, estratégia e precisão no atendimento público.
          </p>
        </div>

        {/* Right: Login Card */}
        <div className="w-full max-w-md" style={{ animation: 'login-card-in 0.4s ease-out both 0.15s' }}>
          <div
            className="rounded-2xl p-8"
            style={{
              background: 'rgba(13, 30, 58, 0.85)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid #1F3455',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
          >
            <h2 className="text-lg font-semibold tracking-wide uppercase mb-6" style={{ color: '#E6EDF5' }}>
              Acesso ao sistema
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs font-medium mb-1.5 uppercase tracking-wider login-label" style={{ color: '#A9B7C9' }}>
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.gov.br"
                  required
                  className={`${inputClasses}${erro ? ' login-input-error' : ''}`}
                />
              </div>

              <div>
                <label htmlFor="senha" className="block text-xs font-medium mb-1.5 uppercase tracking-wider login-label" style={{ color: '#A9B7C9' }}>
                  Senha
                </label>
                <input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`${inputClasses}${erro ? ' login-input-error' : ''}`}
                />
              </div>

              {erro && <p className="text-sm" style={{ color: '#E5737F' }}>{erro}</p>}

              <button
                type="submit"
                className="login-btn w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium"
              >
                <LogIn className="w-4 h-4" />
                Entrar
              </button>
            </form>
          </div>

          {/* Demo accounts */}
          <div className="mt-5 rounded-xl p-4" style={{ background: 'rgba(13, 30, 58, 0.6)', border: '1px solid #1F3455' }}>
            <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: '#6B7F99' }}>
              Acesso Demonstração
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => { setEmail(acc.email); setSenha('demo'); }}
                  className="text-left px-3 py-2 rounded-lg text-xs transition-colors duration-200 hover:bg-[#122544] hover:border-[#324A71] border border-transparent"
                  style={{ color: '#A9B7C9' }}
                >
                  <span className="font-medium block" style={{ color: '#E6EDF5' }}>{acc.label}</span>
                  <span style={{ color: '#6B7F99' }}>{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes login-brand-in {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes login-card-in {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        .login-input {
          background: #122544;
          border: 1px solid #324A71;
          color: #E6EDF5;
        }
        .login-input:focus {
          border-color: #4A7BBF;
          box-shadow: 0 0 0 2px rgba(74,123,191,0.15);
        }
        .login-input-error {
          border-color: #7A3040 !important;
        }
        .login-input-error:focus {
          border-color: #9B4050 !important;
          box-shadow: 0 0 0 2px rgba(155,64,80,0.15);
        }
        .login-label {
          transition: color 0.2s;
        }
        .login-input:focus ~ .login-label,
        .login-input:focus + .login-label {
          color: #E6EDF5;
        }
        .login-btn {
          background: #3C5C7A;
          color: #E6EDF5;
          transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
        }
        .login-btn:hover {
          background: #486891;
          box-shadow: 0 0 12px rgba(60,92,122,0.3);
        }
        .login-btn:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
