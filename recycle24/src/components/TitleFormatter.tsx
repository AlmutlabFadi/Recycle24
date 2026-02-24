'use client';

import { Gender, Title, getTitleDisplay, TITLES } from '@/lib/title-system';

interface TitleFormatterProps {
  titleId?: string;
  name: string;
  gender: Gender;
  className?: string;
  showTitle?: boolean;
}

export function TitleFormatter({
  titleId,
  name,
  gender,
  className = '',
  showTitle = true,
}: TitleFormatterProps) {
  const displayTitle = showTitle ? getTitleDisplay(titleId, gender) : '';
  
  return (
    <span className={className}>
      {displayTitle ? (
        <>
          <span className="text-primary font-semibold">{displayTitle}</span>
          {' '}
          <span>{name}</span>
        </>
      ) : (
        <span>{name}</span>
      )}
    </span>
  );
}

interface TitleBadgeProps {
  titleId: string;
  gender: Gender;
  size?: 'sm' | 'md' | 'lg';
}

export function TitleBadge({ titleId, gender, size = 'md' }: TitleBadgeProps) {
  const title = TITLES.find(t => t.id === titleId);
  if (!title) return null;
  
  const displayText = getTitleDisplay(titleId, gender);
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };
  
  const categoryColors: Record<Title['category'], string> = {
    professional: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    religious: 'bg-green-500/20 text-green-400 border border-green-500/30',
    honorific: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    social: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
    military: 'bg-red-500/20 text-red-400 border border-red-500/30',
    education: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  };
  
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${categoryColors[title.category]}`}
    >
      {displayText}
    </span>
  );
}

interface UserDisplayProps {
  firstName: string;
  lastName: string;
  titleId?: string;
  gender?: Gender;
  avatar?: string;
  showBadge?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function UserDisplay({
  firstName,
  lastName,
  titleId,
  gender = 'male',
  avatar,
  showBadge = false,
  size = 'md',
}: UserDisplayProps) {
  const fullName = `${firstName} ${lastName}`;
  const avatarSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };
  
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };
  
  return (
    <div className="flex items-center gap-3">
      {avatar ? (
        <img
          src={avatar}
          alt={fullName}
          className={`${avatarSizes[size]} rounded-full object-cover`}
        />
      ) : (
        <div className={`${avatarSizes[size]} rounded-full bg-gray-200 flex items-center justify-center`}>
          <span className={`${textSizes[size]} text-gray-500 font-medium`}>
            {firstName.charAt(0)}{lastName.charAt(0)}
          </span>
        </div>
      )}
      
      <div className="flex flex-col">
        {showBadge && titleId && (
          <TitleBadge titleId={titleId} gender={gender} size="sm" />
        )}
        <span className={`${textSizes[size]} font-medium text-gray-900`}>
          <TitleFormatter
            titleId={titleId}
            name={fullName}
            gender={gender}
          />
        </span>
      </div>
    </div>
  );
}
