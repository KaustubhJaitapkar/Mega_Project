'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Select date & time',
  minDate,
  maxDate,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [activeView, setActiveView] = useState<'date' | 'time'>('date');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        let hours = date.getHours();
        const mins = date.getMinutes();
        const period = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        setSelectedHour(hours);
        setSelectedMinute(Math.round(mins / 5) * 5);
        setSelectedPeriod(period);
        setViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < new Date(minDate.setHours(0, 0, 0, 0))) return true;
    if (maxDate && date > new Date(maxDate.setHours(23, 59, 59, 999))) return true;
    return false;
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (isDateDisabled(newDate)) return;
    setSelectedDate(newDate);
    updateValue(newDate, selectedHour, selectedMinute, selectedPeriod);
  };

  const handleTimeChange = (hour: number, minute: number, period: 'AM' | 'PM') => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedPeriod(period);
    if (selectedDate) {
      updateValue(selectedDate, hour, minute, period);
    }
  };

  const updateValue = (date: Date, hour: number, minute: number, period: 'AM' | 'PM') => {
    let h = hour;
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;

    const newDate = new Date(date);
    newDate.setHours(h, minute, 0, 0);
    onChange(newDate.toISOString().slice(0, 16));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const { firstDay, daysInMonth } = getDaysInMonth(viewDate);

  const formatDisplayValue = () => {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' at ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      viewDate.getMonth() === today.getMonth() &&
      viewDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      viewDate.getMonth() === selectedDate.getMonth() &&
      viewDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  return (
    <div ref={containerRef} className="dp-container">
      {label && <label className="dp-label">{label}</label>}

      <button
        type="button"
        className="dp-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? 'dp-trigger-value' : 'dp-trigger-placeholder'}>
          {value ? formatDisplayValue() : placeholder}
        </span>
        <Clock className="dp-trigger-icon" size={16} />
      </button>

      {isOpen && (
        <div className="dp-dropdown">
          <div className="dp-view-toggle">
            <button
              type="button"
              className={`dp-view-btn ${activeView === 'date' ? 'dp-view-btn-active' : ''}`}
              onClick={() => setActiveView('date')}
            >
              Date
            </button>
            <button
              type="button"
              className={`dp-view-btn ${activeView === 'time' ? 'dp-view-btn-active' : ''}`}
              onClick={() => setActiveView('time')}
            >
              Time
            </button>
          </div>

          {activeView === 'date' ? (
            <>
              <div className="dp-header">
                <button
                  type="button"
                  className="dp-nav-btn"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="dp-month-year">
                  {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                </div>
                <button
                  type="button"
                  className="dp-nav-btn"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="dp-weekdays">
                {DAYS.map(day => (
                  <div key={day} className="dp-weekday">{day}</div>
                ))}
              </div>

              <div className="dp-grid">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="dp-day-empty" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const disabled = isDateDisabled(
                    new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
                  );
                  return (
                    <button
                      key={day}
                      type="button"
                      className={`dp-day ${isToday(day) ? 'dp-day-today' : ''} ${isSelected(day) ? 'dp-day-selected' : ''} ${disabled ? 'dp-day-disabled' : ''}`}
                      onClick={() => handleDateSelect(day)}
                      disabled={disabled}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="dp-time">
              <div className="dp-time-picker">
                <div className="dp-time-column">
                  <button type="button" className="dp-time-arrow" onClick={() => handleTimeChange(selectedHour === 12 ? 1 : selectedHour + 1, selectedMinute, selectedPeriod)}>
                    <ChevronLeft size={16} className="rotate-90" />
                  </button>
                  <div className="dp-time-value">{String(selectedHour).padStart(2, '0')}</div>
                  <button type="button" className="dp-time-arrow" onClick={() => handleTimeChange(selectedHour === 1 ? 12 : selectedHour - 1, selectedMinute, selectedPeriod)}>
                    <ChevronRight size={16} className="rotate-90" />
                  </button>
                </div>
                <div className="dp-time-separator">:</div>
                <div className="dp-time-column">
                  <button type="button" className="dp-time-arrow" onClick={() => handleTimeChange(selectedHour, selectedMinute === 55 ? 0 : selectedMinute + 5, selectedPeriod)}>
                    <ChevronLeft size={16} className="rotate-90" />
                  </button>
                  <div className="dp-time-value">{String(selectedMinute).padStart(2, '0')}</div>
                  <button type="button" className="dp-time-arrow" onClick={() => handleTimeChange(selectedHour, selectedMinute === 0 ? 55 : selectedMinute - 5, selectedPeriod)}>
                    <ChevronRight size={16} className="rotate-90" />
                  </button>
                </div>
                <div className="dp-time-period">
                  <button
                    type="button"
                    className={`dp-period-btn ${selectedPeriod === 'AM' ? 'dp-period-active' : ''}`}
                    onClick={() => handleTimeChange(selectedHour, selectedMinute, 'AM')}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    className={`dp-period-btn ${selectedPeriod === 'PM' ? 'dp-period-active' : ''}`}
                    onClick={() => handleTimeChange(selectedHour, selectedMinute, 'PM')}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="dp-footer">
            <button
              type="button"
              className="dp-now-btn"
              onClick={() => {
                const now = new Date();
                setSelectedDate(now);
                let h = now.getHours();
                const period = h >= 12 ? 'PM' : 'AM';
                h = h % 12 || 12;
                updateValue(now, h, now.getMinutes(), period);
              }}
            >
              Now
            </button>
            <button
              type="button"
              className="dp-done-btn"
              onClick={() => setIsOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
