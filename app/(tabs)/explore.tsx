import { Suspense, lazy } from 'react';

import { ExploreSkeleton } from '@/components/explore/ExploreSkeleton';

const ExploreMapContent = lazy(() => import('@/components/explore/ExploreMapContent'));

export default function ExploreScreen() {
  return (
    <Suspense fallback={<ExploreSkeleton />}>
      <ExploreMapContent />
    </Suspense>
  );
}
