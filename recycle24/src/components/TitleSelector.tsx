'use client';

import { useState, useMemo } from 'react';
import { Title, TITLES, Gender, getTitleById } from '@/lib/title-system';

interface TitleSelectorProps {
  value?: string;
  onChange: (titleId: string, gender: Gender) => void;
  label?: string;
  error?: string;
  required?: boolean;
}

export function TitleSelector({
  value,
  onChange,
  label = 'اللقب',
  error,
  required = false,
}: TitleSelectorProps) {
  const [selectedTitle, setSelectedTitle] = useState<string>(value || '');
  
  const gender = useMemo(() => {
    if (!selectedTitle) return 'unknown' as Gender;
    const title = getTitleById(selectedTitle);
    if (title && title.male !== title.female) {
      const detectedGender: Gender = ['الآنسة', 'الحاجة', 'الشيخة', 'الامامة', 'عقيدة', 'العميدة', 'النقيمة'].includes(title.female)
        ? 'female'
        : 'male';
      return detectedGender;
    }
    return 'unknown' as Gender;
  }, [selectedTitle]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setSelectedTitle(newValue);
    
    const title = getTitleById(newValue);
    if (title && title.male !== title.female) {
      const detectedGender: Gender = ['الآنسة', 'الحاجة', 'الشيخة', 'الامامة', 'عقيدة', 'العميدة', 'النقيمة'].includes(title.female)
        ? 'female'
        : 'male';
      onChange(newValue, detectedGender);
    } else {
      onChange(newValue, 'unknown');
    }
  };

  const categories = {
    professional: 'ألقاب مهنية',
    religious: 'ألقاب دينية',
    honorific: 'ألقاب تشريفية',
    social: 'ألقاب اجتماعية',
    military: 'ألقاب عسكرية',
    education: 'المؤهلات العلمية',
  };

  const groupedTitles = TITLES.reduce((acc, title) => {
    if (!acc[title.category]) {
      acc[title.category] = [];
    }
    acc[title.category].push(title);
    return acc;
  }, {} as Record<string, Title[]>);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-300">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      
      <select
        value={selectedTitle}
        onChange={handleChange}
        className={`
          w-full px-4 py-2.5 rounded-lg border
          focus:ring-2 focus:ring-primary focus:border-transparent
          transition-all duration-200
          ${error ? 'border-red-500 bg-red-900/20' : 'border-slate-600 bg-surface-dark'}
          text-white
        `}
      >
        <option value="">اختر اللقب...</option>
        
        {Object.entries(groupedTitles).map(([category, titles]) => (
          <optgroup key={category} label={categories[category as keyof typeof categories]}>
            {titles.map((title) => (
              <option key={title.id} value={title.id}>
                {title.male} / {title.female}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
      
      {selectedTitle && gender !== 'unknown' && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>الجنس المحدد تلقائياً:</span>
          <span className={`font-medium ${gender === 'male' ? 'text-blue-400' : 'text-pink-400'}`}>
            {gender === 'male' ? 'ذكر' : 'أنثى'}
          </span>
        </div>
      )}
    </div>
  );
}

interface GenderSelectorProps {
  value: Gender;
  onChange: (gender: Gender) => void;
  label?: string;
  required?: boolean;
}

export function GenderSelector({
  value,
  onChange,
  label = 'الجنس',
  required = false,
}: GenderSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-300">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="gender"
            value="male"
            checked={value === 'male'}
            onChange={() => onChange('male')}
            className="w-4 h-4 text-blue-500 border-slate-600 focus:ring-blue-500 bg-surface-dark"
          />
          <span className="text-sm text-white">ذكر</span>
        </label>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="gender"
            value="female"
            checked={value === 'female'}
            onChange={() => onChange('female')}
            className="w-4 h-4 text-pink-500 border-slate-600 focus:ring-pink-500 bg-surface-dark"
          />
          <span className="text-sm text-white">أنثى</span>
        </label>
      </div>
    </div>
  );
}

interface SmartNameInputProps {
  firstName: string;
  lastName: string;
  titleId?: string;
  gender?: Gender;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onTitleChange: (titleId: string, gender: Gender) => void;
  onGenderChange?: (gender: Gender) => void;
}

export function SmartNameInput({
  firstName,
  lastName,
  titleId,
  gender = 'unknown',
  onFirstNameChange,
  onLastNameChange,
  onTitleChange,
  onGenderChange,
}: SmartNameInputProps) {
  return (
    <div className="space-y-4">
      <TitleSelector
        value={titleId}
        onChange={onTitleChange}
        required
      />
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">
            الاسم الأول <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            placeholder="الاسم الأول"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-600 bg-surface-dark text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">
            اسم العائلة <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            placeholder="اسم العائلة"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-600 bg-surface-dark text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>
      </div>
      
      {onGenderChange && gender === 'unknown' && (
        <GenderSelector
          value={gender}
          onChange={onGenderChange}
        />
      )}
    </div>
  );
}
