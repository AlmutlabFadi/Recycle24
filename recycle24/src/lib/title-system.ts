export type Gender = 'male' | 'female' | 'unknown';

export interface Title {
  id: string;
  male: string;
  female: string;
  abbreviation?: string;
  category: 'professional' | 'religious' | 'honorific' | 'social' | 'military' | 'education';
}

export const TITLES: Title[] = [
  {
    id: 'dr',
    male: 'دكتور',
    female: 'دكتورة',
    abbreviation: 'د.م',
    category: 'professional',
  },
  {
    id: 'eng',
    male: 'مهندس',
    female: 'مهندسة',
    abbreviation: 'م.م',
    category: 'professional',
  },
  {
    id: 'prof',
    male: 'استاذ',
    female: 'استاذة',
    abbreviation: 'أ.د',
    category: 'professional',
  },
  {
    id: 'businessman',
    male: 'رجل أعمال',
    female: 'سيدة أعمال',
    category: 'professional',
  },
  {
    id: 'mr',
    male: 'السيد',
    female: 'السيدة',
    category: 'honorific',
  },
  {
    id: 'miss',
    male: ' ',
    female: 'الآنسة',
    category: 'honorific',
  },
];

export const getTitleById = (id: string): Title | undefined => {
  return TITLES.find(t => t.id === id);
};

export const getTitleDisplay = (
  titleId: string | undefined,
  gender: Gender
): string => {
  if (!titleId) return '';
  
  const title = getTitleById(titleId);
  if (!title) return titleId;
  
  if (gender === 'female') {
    return title.female;
  }
  
  return title.male;
};

export const getTitleWithName = (
  titleId: string | undefined,
  name: string,
  gender: Gender
): string => {
  const titleDisplay = getTitleDisplay(titleId, gender);
  return titleDisplay ? `${titleDisplay} ${name}` : name;
};

export const getGenderFromTitle = (titleId: string): Gender => {
  const title = getTitleById(titleId);
  if (!title) return 'unknown';
  
  if (title.male === title.female) return 'unknown';
  return 'male';
};

export const getTitlesByCategory = (category: Title['category']): Title[] => {
  return TITLES.filter(t => t.category === category);
};

export const formatFullName = (
  firstName: string,
  lastName: string,
  titleId?: string,
  gender?: Gender
): string => {
  const fullName = `${firstName} ${lastName}`;
  
  if (!titleId || !gender || gender === 'unknown') {
    return fullName;
  }
  
  return getTitleWithName(titleId, fullName, gender);
};
