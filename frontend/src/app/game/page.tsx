'use client';

import { useEffect, useState } from 'react';
import GameFlow from '@/features/game/components/GameFlow';

function getStoredUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('real_you_user_id');
}

export default function GamePage() {
  const [userId] = useState<string | null>(getStoredUserId);

  useEffect(() => {
    if (!userId) {
      window.location.href = '/diagnosis';
    }
  }, [userId]);

  if (!userId) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
      </div>
    );
  }

  return <GameFlow userId={userId} />;
}
