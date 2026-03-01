import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, Loader2 } from 'lucide-react';
import verticeLogoFull from '@/assets/vertice-logo-full.png';

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
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      }
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
  const { login, loading: authLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoginLoading(true);
    const result = await login(username, senha);
    setLoginLoading(false);
    if (!result.success) {
      setErro(result.error || 'Erro ao fazer login.');
    }
  };

  const inputClasses =
    'w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200 placeholder:text-[#5A6F8A] login-input';

  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'radial-gradient(circle at top center, #0C2A4D 0%, #071B34 40%, #050B18 100%)' }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#A9B7C9' }} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'radial-gradient(circle at top center, #0C2A4D 0%, #071B34 40%, #050B18 100%)',
      }}
    >
      <ParticleBackground />

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

      <div
        className="relative z-10 w-full mx-auto px-6 lg:px-10 min-h-screen"
        style={{ maxWidth: '1240px', display: 'grid', gridTemplateColumns: '1fr', alignItems: 'center', justifyItems: 'center' }}
      >
        <div className="w-full grid gap-12 lg:gap-20 items-center" style={{ gridTemplateColumns: '1fr' }}>
          <style>{`@media (min-width: 1024px) { .login-grid { grid-template-columns: 1fr 1fr !important; } }`}</style>
          <div className="login-grid w-full grid gap-12 lg:gap-20 items-center" style={{ gridTemplateColumns: '1fr' }}>
            {/* Left: Branding */}
            <div
              className="flex flex-col items-center justify-center text-center px-4 lg:px-8 py-8 lg:py-0"
              style={{ animation: 'login-brand-in 0.6s ease-out both' }}
            >
              <div className="relative flex flex-col items-center">
                <div
                  className="absolute inset-0 -m-16 pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(60,92,122,0.25) 0%, rgba(60,92,122,0.1) 40%, transparent 70%)' }}
                />
                <img
                  src={verticeLogoFull}
                  alt="VÉRTICE"
                  className="relative w-[220px] lg:w-[340px] object-contain"
                  style={{ filter: 'drop-shadow(0 0 40px rgba(60,92,122,0.15))' }}
                />
              </div>
              <div className="h-[18px]" />
              <p className="text-base lg:text-xl tracking-[0.12em] uppercase font-semibold" style={{ color: '#DCE6F2' }}>
                PLATAFORMA DE GESTÃO ESTRATÉGICA PARA CÂMARAS MUNICIPAIS
              </p>
              <div className="h-3" />
              <p className="text-[10px] lg:text-sm tracking-[0.06em] uppercase leading-relaxed font-medium" style={{ color: '#A9B7C9' }}>
                CONTROLE, ESTRATÉGIA E PRECISÃO NA GESTÃO PÚBLICA.
              </p>
            </div>

            {/* Right: Login Card */}
            <div className="flex items-center justify-center px-4 lg:px-8" style={{ animation: 'login-card-in 0.4s ease-out both 0.15s' }}>
              <div className="w-full max-w-md">
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
                    ACESSO AO SISTEMA
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="username" className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#A9B7C9' }}>
                        USUÁRIO
                      </label>
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="seu.usuario"
                        required
                        autoComplete="username"
                        disabled={loginLoading}
                        className={`${inputClasses}${erro ? ' login-input-error' : ''}`}
                      />
                    </div>

                    <div>
                      <label htmlFor="senha" className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#A9B7C9' }}>
                        SENHA
                      </label>
                      <input
                        id="senha"
                        type="password"
                        value={senha}
                        onChange={e => setSenha(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                        disabled={loginLoading}
                        className={`${inputClasses}${erro ? ' login-input-error' : ''}`}
                      />
                    </div>

                    {erro && <p className="text-sm" style={{ color: '#E5737F' }}>{erro}</p>}

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="login-btn w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium"
                    >
                      {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                      {loginLoading ? 'ENTRANDO...' : 'ENTRAR'}
                    </button>
                  </form>

                  <p className="text-[10px] text-center mt-4" style={{ color: '#5A6F8A' }}>
                    Acesso exclusivo para usuários cadastrados pelo administrador.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center z-10">
        <p className="text-[10px] tracking-[0.08em] uppercase font-medium" style={{ color: '#5A6F8A' }}>
          © 2026 VÉRTICE TECNOLOGIA INSTITUCIONAL
        </p>
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
        .login-input:disabled {
          opacity: 0.6;
        }
        .login-input-error {
          border-color: #7A3040 !important;
        }
        .login-input-error:focus {
          border-color: #9B4050 !important;
          box-shadow: 0 0 0 2px rgba(155,64,80,0.15);
        }
        .login-btn {
          background: #3C5C7A;
          color: #E6EDF5;
          transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
        }
        .login-btn:hover:not(:disabled) {
          background: #486891;
          box-shadow: 0 0 12px rgba(60,92,122,0.3);
        }
        .login-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
        .login-btn:disabled {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
