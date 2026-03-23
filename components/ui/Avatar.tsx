import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/utils';

interface AvatarProps {
  discordId: string;
  avatarHash: string | null;
  username: string;
  size?: number;
  isOnline?: boolean;
  showStatus?: boolean;
  className?: string;
}

export function Avatar({
  discordId,
  avatarHash,
  username,
  size = 48,
  isOnline = false,
  showStatus = false,
  className,
}: AvatarProps) {
  const url = getAvatarUrl(discordId, avatarHash);

  return (
    <div className={cn('relative inline-block', className)} style={{ width: size, height: size }}>
      <div
        className="rounded-full overflow-hidden"
        style={{
          width: size,
          height: size,
          boxShadow: isOnline
            ? '0 0 0 2px var(--green), 0 0 10px rgba(57,255,20,0.4)'
            : '0 0 0 2px var(--border)',
        }}
      >
        <Image
          src={url}
          alt={username}
          width={size}
          height={size}
          className="object-cover"
          unoptimized
        />
      </div>
      {showStatus && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-[var(--bg)]"
          style={{
            width: size * 0.28,
            height: size * 0.28,
            backgroundColor: isOnline ? 'var(--green)' : 'var(--text-muted)',
            boxShadow: isOnline ? 'var(--glow-green)' : 'none',
          }}
        />
      )}
    </div>
  );
}
