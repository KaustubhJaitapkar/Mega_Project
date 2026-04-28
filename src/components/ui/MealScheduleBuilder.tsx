'use client';

import { Plus, Trash2, GripVertical, Clock } from 'lucide-react';

interface MealItem {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  day: number;
}

interface MealScheduleBuilderProps {
  items: MealItem[];
  onChange: (items: MealItem[]) => void;
  hackathonDays: number;
}

export default function MealScheduleBuilder({
  items,
  onChange,
  hackathonDays = 2,
}: MealScheduleBuilderProps) {
  const addRow = () => {
    const newItem: MealItem = {
      id: `meal-${Date.now()}`,
      name: '',
      startTime: '09:00',
      endTime: '10:00',
      day: 1,
    };
    onChange([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof MealItem, value: string | number) => {
    onChange(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const getMealIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('breakfast')) return '🌅';
    if (lower.includes('lunch')) return '☀️';
    if (lower.includes('dinner')) return '🌙';
    if (lower.includes('snack')) return '🍪';
    if (lower.includes('coffee') || lower.includes('tea')) return '☕';
    return '🍽️';
  };

  return (
    <div className="msb-container">
      <div className="msb-header">
        <div className="msb-title">
          <Clock size={18} />
          <span>Meal Schedule</span>
        </div>
        <button type="button" className="msb-add-btn" onClick={addRow}>
          <Plus size={16} />
          <span>Add Meal Slot</span>
        </button>
      </div>

      <p className="msb-description">
        Define meal slots to power QR scanning and prevent double-dipping.
        This helps track participant attendance during meal times.
      </p>

      {items.length === 0 ? (
        <div className="msb-empty">
          <div className="msb-empty-icon">🍽️</div>
          <p>No meal slots configured</p>
          <p className="msb-empty-hint">Click "Add Meal Slot" to define when meals will be served</p>
        </div>
      ) : (
        <div className="msb-list">
          <div className="msb-list-header">
            <div className="msb-col-drag"></div>
            <div className="msb-col-name">Item Name</div>
            <div className="msb-col-day">Day</div>
            <div className="msb-col-time">Start Time</div>
            <div className="msb-col-time">End Time</div>
            <div className="msb-col-actions"></div>
          </div>

          {items.map((item, index) => (
            <div key={item.id} className="msb-row" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="msb-col-drag">
                <GripVertical size={16} className="msb-grip" />
              </div>

              <div className="msb-col-name">
                <div className="msb-name-input-wrap">
                  <span className="msb-meal-icon">{getMealIcon(item.name)}</span>
                  <input
                    type="text"
                    className="org-input msb-name-input"
                    placeholder="e.g., Lunch Day 1"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                  />
                </div>
              </div>

              <div className="msb-col-day">
                <select
                  className="org-select msb-day-select"
                  value={item.day}
                  onChange={(e) => updateItem(item.id, 'day', parseInt(e.target.value))}
                >
                  {Array.from({ length: hackathonDays }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Day {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div className="msb-col-time">
                <input
                  type="time"
                  className="org-input msb-time-input"
                  value={item.startTime}
                  onChange={(e) => updateItem(item.id, 'startTime', e.target.value)}
                />
              </div>

              <div className="msb-col-time">
                <input
                  type="time"
                  className="org-input msb-time-input"
                  value={item.endTime}
                  onChange={(e) => updateItem(item.id, 'endTime', e.target.value)}
                />
              </div>

              <div className="msb-col-actions">
                <button
                  type="button"
                  className="msb-remove-btn"
                  onClick={() => removeItem(item.id)}
                  title="Remove meal slot"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="msb-info">
        <div className="msb-info-icon">ℹ️</div>
        <p>
          Participants will scan QR codes during these time windows.
          The system prevents duplicate scans within the same meal slot.
        </p>
      </div>
    </div>
  );
}
