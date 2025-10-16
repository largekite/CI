
import SentimentPillClient from './SentimentPillClient';
import { getSentimentCompact } from '@/app/lib/sentiment';

export default async function SentimentPill() {
  let initial = null;
  try {
    initial = await getSentimentCompact();
  } catch {
    // ignore; client will fetch and/or fallback
  }
  return <SentimentPillClient initial={initial} />;
}
