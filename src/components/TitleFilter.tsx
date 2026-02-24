'use client';

import { useState } from 'react';
import { TITLES, Gender, Title } from '@/lib/title-system';

interface TitleFilterProps {
  onFilterChange: (filters: TitleFilterState) => void;
  initialFilters?: TitleFilterState;
}

export interface TitleFilterState {
  titleId?: string;
  gender?: Gender;
  category?: Title['category'];
}

export function TitleFilter({ onFilterChange, initialFilters }: TitleFilterProps) {
  const [filters, setFilters] = useState<TitleFilterState>(initialFilters || {});
  const [isOpen, setIsOpen] = useState(false);

  const categories = {
    professional: 'ألقاب مهنية',
    religious: 'ألقاب دينية',
    honorific: 'ألقاب تشريفية',
    social: 'ألقاب اجتماعية',
    military: 'ألقاب عسكرية',
    education: 'المؤهلات',
  };

  const handleFilterChange = (newFilters: Partial<TitleFilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange(updated);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const hasActiveFilters = filters.titleId || filters.gender || filters.category;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg border transition-all
          ${hasActiveFilters 
            ? 'bg-primary/10 border-primary text-primary' 
            : 'bg-surface-highlight border-slate-700 text-slate-300 hover:border-primary/50'
          }
        `}
      >
        <span className="material-symbols-outlined !text-[18px]">filter_list</span>
        <span className="text-sm font-medium">تصفية</span>
        {hasActiveFilters && (
          <span className="w-2 h-2 rounded-full bg-primary"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 w-72 bg-surface-dark border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-white">تصفية حسب اللقب</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  مسح الكل
                </button>
              )}
            </div>

            <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
              {/* Gender Filter */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block">الجنس</label>
                <div className="flex gap-2">
                  {[
                    { value: undefined, label: 'الكل' },
                    { value: 'male', label: 'ذكر' },
                    { value: 'female', label: 'أنثى' },
                  ].map((option) => (
                    <button
                      key={option.value || 'all'}
                      onClick={() => handleFilterChange({ gender: option.value as Gender | undefined })}
                      className={`
                        flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all
                        ${filters.gender === option.value || (!option.value && !filters.gender)
                          ? 'bg-primary text-white'
                          : 'bg-surface-highlight text-slate-400 hover:text-white'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block">فئة اللقب</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleFilterChange({ category: undefined })}
                    className={`
                      py-1.5 px-3 rounded-lg text-xs font-medium transition-all
                      ${!filters.category
                        ? 'bg-primary text-white'
                        : 'bg-surface-highlight text-slate-400 hover:text-white'
                      }
                    `}
                  >
                    الكل
                  </button>
                  {Object.entries(categories).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => handleFilterChange({ category: key as Title['category'] })}
                      className={`
                        py-1.5 px-3 rounded-lg text-xs font-medium transition-all
                        ${filters.category === key
                          ? 'bg-primary text-white'
                          : 'bg-surface-highlight text-slate-400 hover:text-white'
                        }
                      `}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Filter */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block">اللقب</label>
                <select
                  value={filters.titleId || ''}
                  onChange={(e) => handleFilterChange({ titleId: e.target.value || undefined })}
                  className="w-full bg-surface-highlight border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">اختر اللقب...</option>
                  {TITLES.map((title) => (
                    <option key={title.id} value={title.id}>
                      {title.male} / {title.female}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3 border-t border-slate-700">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition"
              >
                تطبيق
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function filterUsersByTitle<T extends { titleId?: string; gender?: Gender }>(
  users: T[],
  filters: TitleFilterState
): T[] {
  return users.filter((user) => {
    if (filters.titleId && user.titleId !== filters.titleId) {
      return false;
    }

    if (filters.gender && user.gender !== filters.gender) {
      return false;
    }

    if (filters.category) {
      const title = TITLES.find((t) => t.id === user.titleId);
      if (!title || title.category !== filters.category) {
        return false;
      }
    }

    return true;
  });
}
