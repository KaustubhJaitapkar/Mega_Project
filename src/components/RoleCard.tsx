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
  role,
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
      className={`p-6 rounded-2xl border-2 cursor-pointer transition-all min-h-[320px] flex flex-col transform hover:scale-105 active:scale-95 ${
        isSelected
          ? 'border-indigo-600 bg-indigo-50 shadow-lg'
          : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
          <Icon className="w-6 h-6 text-indigo-600" />
        </div>
        {isSelected && (
          <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center animate-scale-in">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>

      <div className="flex-1">
        <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">What you'll do:</p>
        <ul className="space-y-2">
          {benefits.map((benefit, idx) => (
            <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
              <span className="text-indigo-600 mt-1">•</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          className={`w-full py-2 rounded-lg font-medium transition-all ${
            isSelected
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isSelected ? '✓ Selected' : 'Select Role'}
        </button>
      </div>
    </div>
  );
}
