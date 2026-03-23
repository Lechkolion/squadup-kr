import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(date: string | Date, locale: 'ko' | 'en' = 'ko') {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: locale === 'ko' ? ko : enUS,
  });
}

export function formatActiveHours(start: number, end: number): string {
  const fmt = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}${period}`;
  };
  return `${fmt(start)}–${fmt(end)} KST`;
}

export function getAvatarUrl(discordId: string, avatarHash: string | null): string {
  if (!avatarHash) {
    const defaultIdx = parseInt(discordId) % 6;
    return `https://cdn.discordapp.com/embed/avatars/${defaultIdx}.png`;
  }
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png?size=256`;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '…';
}

export function isUserOnline(lastHeartbeat: string | null): boolean {
  if (!lastHeartbeat) return false;
  const diff = Date.now() - new Date(lastHeartbeat).getTime();
  return diff < 2 * 60 * 1000; // 2 minutes
}
