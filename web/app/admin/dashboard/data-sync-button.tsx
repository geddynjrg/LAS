'use client';

import { IconRefresh } from '@tabler/icons-react';
import { Button } from '@workspace/ui/components/button';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { syncTaxonomyAction } from './actions';

export function DataSyncButton() {
  const t = useTranslations('Common');
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setMessage(null);

    try {
      const result = await syncTaxonomyAction();

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'Sync completed successfully',
        });
        // Clear success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Sync failed' });
      }
    } catch (error) {
      console.error('Failed to sync taxonomy:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="secondary"
        onClick={handleSync}
        disabled={isSyncing}
        className="flex items-center gap-2"
      >
        <IconRefresh className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Syncing...' : 'Sync Data'}
      </Button>

      {message && (
        <span
          className={`text-sm ${
            message.type === 'success' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {message.text}
        </span>
      )}
    </div>
  );
}
