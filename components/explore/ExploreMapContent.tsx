import { isExpoGo } from '@/lib/expoGo';

import ExploreMapExpoGo from './ExploreMapExpoGo';

export default function ExploreMapContent() {
  if (isExpoGo()) {
    return <ExploreMapExpoGo />;
  }

  const ExploreMapNative = require('./ExploreMapNative').default as typeof import('./ExploreMapNative').default;
  return <ExploreMapNative />;
}
