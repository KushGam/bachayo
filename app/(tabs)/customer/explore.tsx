import { Suspense, lazy } from 'react';
import { StatusBar } from 'expo-status-bar';

import { ExploreSkeleton } from '@/components/explore/ExploreSkeleton';

const ExploreMapContent = lazy(() => import('@/components/explore/ExploreMapContent'));

export default function ExploreScreen() {
  return (
    <>
      <StatusBar style="dark" />
      <Suspense fallback={<ExploreSkeleton />}>
        <ExploreMapContent />
      </Suspense>
    </>
  );
}
