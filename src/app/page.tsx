'use client';

import dynamic from 'next/dynamic';

const EVPetrolCalculator = dynamic(
  () => import('@/components/ev-petrol-calculator'),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12">
      <EVPetrolCalculator />
    </main>
  );
}
