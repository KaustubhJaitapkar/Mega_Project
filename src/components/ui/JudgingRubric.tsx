'use client';

import { useState, useMemo } from 'react';
import { Plus, Trash2, BarChart3, AlertCircle } from 'lucide-react';

interface RubricItem {
  id: string;
  name: string;
  description: string;
  weight: number;
  maxScore: number;
}

interface JudgingRubricProps {
  items: RubricItem[];
  onChange: (items: RubricItem[]) => void;
}

export default function JudgingRubric({
  items,
  onChange,
}: JudgingRubricProps) {
  const totalWeight = useMemo(() =>
    items.reduce((sum, item) => sum + item.weight, 0),
    [items]
  );

  const isValid = totalWeight === 100;

  const addItem = () => {
    const newItem: RubricItem = {
      id: `rubric-${Date.now()}`,
      name: '',
      description: '',
      weight: 0,
      maxScore: 10,
    };
    onChange([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof RubricItem, value: string | number) => {
    onChange(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const distributeEqually = () => {
    const equalWeight = Math.floor(100 / items.length);
    const remainder = 100 - (equalWeight * items.length);

    onChange(items.map((item, index) => ({
      ...item,
      weight: equalWeight + (index === 0 ? remainder : 0),
    })));
  };

  const presetRubrics = [
    {
      name: 'Standard',
      items: [
        { name: 'Code Quality', description: 'Code structure, readability, and best practices', weight: 25, maxScore: 10 },
        { name: 'Innovation', description: 'Creativity and uniqueness of the solution', weight: 30, maxScore: 10 },
        { name: 'Impact', description: 'Potential real-world impact and usefulness', weight: 20, maxScore: 10 },
        { name: 'Presentation', description: 'Pitch clarity, demo quality, and Q&A handling', weight: 15, maxScore: 10 },
        { name: 'Design', description: 'UI/UX design and visual appeal', weight: 10, maxScore: 10 },
      ],
    },
    {
      name: 'Technical Focus',
      items: [
        { name: 'Technical Complexity', description: 'Difficulty of implementation and technical depth', weight: 35, maxScore: 10 },
        { name: 'Code Quality', description: 'Clean code, documentation, and testing', weight: 25, maxScore: 10 },
        { name: 'Functionality', description: 'Working features and bug-free execution', weight: 25, maxScore: 10 },
        { name: 'Scalability', description: 'Potential for growth and maintenance', weight: 15, maxScore: 10 },
      ],
    },
    {
      name: 'Pitch Heavy',
      items: [
        { name: 'Pitch Quality', description: 'Storytelling and communication skills', weight: 30, maxScore: 10 },
        { name: 'Innovation', description: 'Novelty and creative problem solving', weight: 25, maxScore: 10 },
        { name: 'Business Viability', description: 'Market potential and business model', weight: 25, maxScore: 10 },
        { name: 'Technical Execution', description: 'Working prototype and implementation', weight: 20, maxScore: 10 },
      ],
    },
  ];

  const loadPreset = (preset: typeof presetRubrics[0]) => {
    onChange(preset.items.map((item, i) => ({
      id: `rubric-${Date.now()}-${i}`,
      ...item,
    })));
  };

  return (
    <div className="jr-container">
      <div className="jr-header">
        <div className="jr-title">
          <BarChart3 size={18} />
          <span>Judging Rubric</span>
        </div>
        <div className="jr-header-actions">
          <div className="jr-presets">
            <span className="jr-presets-label">Presets:</span>
            {presetRubrics.map(preset => (
              <button
                key={preset.name}
                type="button"
                className="jr-preset-btn"
                onClick={() => loadPreset(preset)}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="jr-weight-indicator">
        <div className="jr-weight-bar">
          <div
            className={`jr-weight-fill ${!isValid && totalWeight > 0 ? 'jr-weight-invalid' : ''}`}
            style={{ width: `${Math.min(totalWeight, 100)}%` }}
          />
        </div>
        <div className={`jr-weight-label ${!isValid && totalWeight > 0 ? 'jr-weight-label-invalid' : ''}`}>
          {totalWeight}% / 100%
          {totalWeight > 0 && !isValid && (
            <span className="jr-weight-hint"> {totalWeight < 100 ? '(add ' + (100 - totalWeight) + '% more)' : '(remove ' + (totalWeight - 100) + '%)'}</span>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="jr-empty">
          <div className="jr-empty-icon">📊</div>
          <p>No judging criteria defined</p>
          <p className="jr-empty-hint">Add criteria or use a preset to get started</p>
        </div>
      ) : (
        <div className="jr-list">
          {items.map((item, index) => (
            <div key={item.id} className="jr-card" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="jr-card-header">
                <span className="jr-card-number">#{index + 1}</span>
                <button
                  type="button"
                  className="jr-remove-btn"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="jr-card-body">
                <div className="jr-field jr-field-name">
                  <label className="jr-field-label">Criterion Name</label>
                  <input
                    type="text"
                    className="org-input"
                    placeholder="e.g., Code Quality"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                  />
                </div>

                <div className="jr-field jr-field-desc">
                  <label className="jr-field-label">Description (optional)</label>
                  <input
                    type="text"
                    className="org-input"
                    placeholder="What does this criterion evaluate?"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  />
                </div>

                <div className="jr-field jr-field-weight">
                  <label className="jr-field-label">Weight (%)</label>
                  <div className="jr-weight-input-wrap">
                    <input
                      type="number"
                      className="org-input jr-weight-input"
                      min="0"
                      max="100"
                      value={item.weight}
                      onChange={(e) => updateItem(item.id, 'weight', parseInt(e.target.value) || 0)}
                    />
                    <span className="jr-weight-unit">%</span>
                  </div>
                  <input
                    type="range"
                    className="jr-slider"
                    min="0"
                    max="100"
                    value={item.weight}
                    onChange={(e) => updateItem(item.id, 'weight', parseInt(e.target.value))}
                  />
                </div>

                <div className="jr-field jr-field-score">
                  <label className="jr-field-label">Max Score</label>
                  <input
                    type="number"
                    className="org-input jr-score-input"
                    min="1"
                    max="100"
                    value={item.maxScore}
                    onChange={(e) => updateItem(item.id, 'maxScore', parseInt(e.target.value) || 10)}
                  />
                </div>
              </div>

              <div className="jr-card-preview">
                <div className="jr-preview-bar" style={{ width: `${item.weight}%` }} />
                <span className="jr-preview-text">
                  {item.name || 'Unnamed'}: {item.weight}% weight, {item.maxScore} pts max
                </span>
              </div>
            </div>
          ))}

          {totalWeight !== 100 && items.length > 0 && (
            <div className="jr-warning">
              <AlertCircle size={16} />
              <span>
                Weights must total 100%. Currently at {totalWeight}%.
                <button type="button" className="jr-auto-fix" onClick={distributeEqually}>
                  Auto-distribute equally
                </button>
              </span>
            </div>
          )}
        </div>
      )}

      <button type="button" className="jr-add-btn" onClick={addItem}>
        <Plus size={16} />
        <span>Add Criteria</span>
      </button>
    </div>
  );
}
