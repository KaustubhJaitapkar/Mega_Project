'use client';

import { Plus, Trash2, BarChart3 } from 'lucide-react';

interface RubricItem {
  id: string;
  name: string;
  description: string;
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
  const addItem = () => {
    const newItem: RubricItem = {
      id: `rubric-${Date.now()}`,
      name: '',
      description: '',
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

  const presetRubrics = [
    {
      name: 'Standard',
      items: [
        { name: 'Code Quality', description: 'Code structure, readability, and best practices', maxScore: 10 },
        { name: 'Innovation', description: 'Creativity and uniqueness of the solution', maxScore: 10 },
        { name: 'Impact', description: 'Potential real-world impact and usefulness', maxScore: 10 },
        { name: 'Presentation', description: 'Pitch clarity, demo quality, and Q&A handling', maxScore: 10 },
        { name: 'Design', description: 'UI/UX design and visual appeal', maxScore: 10 },
      ],
    },
    {
      name: 'Technical Focus',
      items: [
        { name: 'Technical Complexity', description: 'Difficulty of implementation and technical depth', maxScore: 10 },
        { name: 'Code Quality', description: 'Clean code, documentation, and testing', maxScore: 10 },
        { name: 'Functionality', description: 'Working features and bug-free execution', maxScore: 10 },
        { name: 'Scalability', description: 'Potential for growth and maintenance', maxScore: 10 },
      ],
    },
    {
      name: 'Pitch Heavy',
      items: [
        { name: 'Pitch Quality', description: 'Storytelling and communication skills', maxScore: 10 },
        { name: 'Innovation', description: 'Novelty and creative problem solving', maxScore: 10 },
        { name: 'Business Viability', description: 'Market potential and business model', maxScore: 10 },
        { name: 'Technical Execution', description: 'Working prototype and implementation', maxScore: 10 },
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
                <span className="jr-preview-text">
                  {item.name || 'Unnamed'}: {item.maxScore} pts max
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <button type="button" className="jr-add-btn" onClick={addItem}>
        <Plus size={16} />
        <span>Add Criteria</span>
      </button>
    </div>
  );
}
