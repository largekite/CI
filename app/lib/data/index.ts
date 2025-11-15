// app/lib/data/index.ts
import { PropertyDataProvider } from './PropertyDataProvider';
import { EstatedProvider } from './EstatedProvider';

let provider: PropertyDataProvider | null = null;

export function getPropertyDataProvider(): PropertyDataProvider {
  if (!provider) {
    const apiKey = process.env.ESTATED_API_KEY!;
    provider = new EstatedProvider(apiKey);
  }
  return provider;
}
