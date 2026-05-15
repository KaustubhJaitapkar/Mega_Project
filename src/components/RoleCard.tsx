'use client';

import { UserRole } from '@prisma/client';
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface RoleCardProps {
  role: UserRole;
  title: string;
  description: string;
  icon: LucideIcon;
  benefits: string[];
  isSelected: boolean;
  onClick: () => void;
}

export default function RoleCard({
  title,
  description,
  icon: Icon,
  benefits,
  isSelected,
  onClick,
}: RoleCardProps) {
  return (
    <div
      onClick={onClick}
      className={`auth-role-card ${isSelected ? 'auth-role-card--selected' : ''}`}
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '300px',
        cursor: 'pointer',
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="auth-role-card__check" style={{ top: '16px', right: '16px' }}>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6.5L4.5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="auth-role-card__icon" style={{ width: '44px', height: '44px', marginBottom: '16px' }}>
        <Icon className="h-5 w-5" strokeWidth={1.5} />
      </div>

      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '17px',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: '4px',
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: '13px',
        color: 'var(--text-muted)',
        marginBottom: '16px',
        lineHeight: 1.5,
      }}>
        {description}
      </p>

      <div style={{ flex: 1 }}>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--text-muted)',
          marginBottom: '10px',
        }}>
          What you&apos;ll do
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {benefits.map((benefit, idx) => (
            <li
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                marginBottom: '8px',
                lineHeight: 1.4,
              }}
            >
              <span style={{
                color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                marginTop: '2px',
                flexShrink: 0,
                transition: 'color 200ms',
              }}>•</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <div style={{
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <div
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: 600,
            textAlign: 'center',
            transition: 'all 200ms',
            background: isSelected ? 'var(--accent)' : 'var(--bg-root)',
            color: isSelected ? 'var(--text-inverse)' : 'var(--text-secondary)',
            border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-default)',
          }}
        >
          {isSelected ? 'Selected' : 'Select Role'}
        </div>
      </div>
    </div>
  );
}
