import React from 'react';
import { cn } from '@/lib/utils';

interface PersonAvatarProps {
  nome: string;
  fotoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-20 h-20 text-xl',
};

const getInitials = (nome: string) => {
  const parts = nome.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const PersonAvatar: React.FC<PersonAvatarProps> = ({ nome, fotoUrl, size = 'md', className }) => {
  return (
    <div
      className={cn(
        'rounded-full flex-shrink-0 flex items-center justify-center font-semibold overflow-hidden',
        sizeClasses[size],
        className
      )}
      style={{
        background: fotoUrl ? 'transparent' : '#1F3455',
        color: '#A9B7C9',
        border: '1px solid hsl(215 35% 22%)',
      }}
    >
      {fotoUrl ? (
        <img src={fotoUrl} alt={nome} className="w-full h-full object-cover" />
      ) : (
        getInitials(nome)
      )}
    </div>
  );
};
