import { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type Status = 'idle' | 'loading' | 'success' | 'error';

// `creatorId` scopes the signup to a creator's page; omit it for the main site list.
export function useNewsletter(creatorId?: string) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setStatus('error');
      setMessage('Signups are not available yet.');
      return;
    }
    setStatus('loading');
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: email.trim().toLowerCase(), creator_id: creatorId ?? null });

    // 23505 = unique violation: already subscribed, which is fine from the fan's side.
    if (error && error.code !== '23505') {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
      return;
    }
    setStatus('success');
    setMessage("You're on the list!");
    setEmail('');
  };

  return { email, setEmail, status, message, subscribe };
}
