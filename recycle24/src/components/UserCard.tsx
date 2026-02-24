import Image from "next/image";
import Link from "next/link";
import { Gender, getTitleDisplay } from "@/lib/title-system";
import { TitleBadge } from "./TitleFormatter";

interface UserCardProps {
  id?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  titleId?: string;
  gender?: Gender;
  imageUrl?: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  showTitleBadge?: boolean;
  showVerified?: boolean;
  onCallClick?: () => void;
  onMessageClick?: () => void;
}

export function UserCard({
  id,
  name,
  firstName,
  lastName,
  titleId,
  gender = "male",
  imageUrl,
  subtitle,
  badge,
  badgeColor = "primary",
  showTitleBadge = false,
  showVerified = false,
  onCallClick,
  onMessageClick,
}: UserCardProps) {
  const displayName = titleId 
    ? `${getTitleDisplay(titleId, gender)} ${firstName || name}`.trim()
    : name;

  return (
    <div className="flex items-center p-4 rounded-2xl bg-surface-highlight border border-slate-700">
      {/* Avatar */}
      <div className="relative">
        {imageUrl ? (
          <div className="w-14 h-14 rounded-full overflow-hidden shrink-0">
            <Image
              src={imageUrl}
              alt={displayName}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary !text-[28px]">person</span>
          </div>
        )}
        {showVerified && (
          <span className="absolute -bottom-0.5 -left-0.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-surface-highlight">
            <span className="material-symbols-outlined !text-[12px] text-white filled">check</span>
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 mr-3 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {showTitleBadge && titleId && (
            <TitleBadge titleId={titleId} gender={gender} size="sm" />
          )}
          <h3 className="font-bold text-white truncate">{displayName}</h3>
        </div>
        
        {subtitle && (
          <p className="text-sm text-slate-400 mt-0.5 truncate">{subtitle}</p>
        )}
        
        {badge && (
          <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-${badgeColor}/10 text-${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 mr-2">
        {onMessageClick && (
          <button 
            onClick={onMessageClick}
            className="size-10 rounded-full bg-surface-dark text-slate-400 flex items-center justify-center hover:text-primary transition"
          >
            <span className="material-symbols-outlined !text-[20px]">chat</span>
          </button>
        )}
        {onCallClick && (
          <button 
            onClick={onCallClick}
            className="size-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition"
          >
            <span className="material-symbols-outlined !text-[20px]">call</span>
          </button>
        )}
        {id && !onCallClick && !onMessageClick && (
          <Link href={`/users/${id}`} className="size-10 rounded-full bg-surface-dark text-slate-400 flex items-center justify-center hover:text-white transition">
            <span className="material-symbols-outlined !text-[20px]">chevron_left</span>
          </Link>
        )}
      </div>
    </div>
  );
}

interface UserListProps {
  users: UserCardProps[];
  emptyMessage?: string;
}

export function UserList({ users, emptyMessage = "لا يوجد مستخدمين" }: UserListProps) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="material-symbols-outlined text-slate-600 !text-[48px] mb-2">group</span>
        <p className="text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user, index) => (
        <UserCard key={user.id || index} {...user} />
      ))}
    </div>
  );
}
