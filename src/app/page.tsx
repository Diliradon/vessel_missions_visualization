import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { queryClient } from 'shared/lib';

const HomePage = () => {
  return (
    <main className="p-2">
      <HydrationBoundary state={dehydrate(queryClient)}>
        Hello World
      </HydrationBoundary>
    </main>
  );
};

export default HomePage;
