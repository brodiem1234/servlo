'use client';

import { useState } from 'react';
import { markOnboardingComplete } from '@/app/dashboard/owner/actions';

export function OnboardingTour({ initialCompleted }: { initialCompleted: boolean }) {
  const [visible, setVisible] = useState(!initialCompleted);

  async function dismiss() {
    setVisible(false);
    await markOnboardingComplete();
  }

  if (!visible) return null;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.75)' }} />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          zIndex: 51,
          width: 'min(480px,90vw)',
        }}
        className="bg-[#111927] rounded-xl p-8 shadow-2xl"
      >
        <h2 className="text-xl font-bold text-white mb-2">Welcome to SERVLO! 🎉</h2>
        <p className="text-sm text-gray-400 mb-6">Let&apos;s get your account set up in 3 simple steps.</p>
        <ol className="space-y-4 mb-8">
          <li className="flex gap-3 items-start">
            <span className="h-6 w-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold shrink-0">1</span>
            <div>
              <p className="font-semibold text-sm text-white">Add your business details</p>
              <p className="text-xs text-gray-400">ABN, trading name, contact info and logo.</p>
            </div>
          </li>
          <li className="flex gap-3 items-start">
            <span className="h-6 w-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold shrink-0">2</span>
            <div>
              <p className="font-semibold text-sm text-white">Invite your team</p>
              <p className="text-xs text-gray-400">Add employees or subcontractors.</p>
            </div>
          </li>
          <li className="flex gap-3 items-start">
            <span className="h-6 w-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold shrink-0">3</span>
            <div>
              <p className="font-semibold text-sm text-white">Explore with demo data</p>
              <p className="text-xs text-gray-400">Load sample jobs, clients and invoices.</p>
            </div>
          </li>
        </ol>
        <button
          onClick={dismiss}
          className="w-full rounded-lg py-2.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Get started
        </button>
        <button
          onClick={dismiss}
          className="mt-3 w-full text-sm text-gray-400 hover:text-gray-300"
        >
          Skip for now
        </button>
      </div>
    </>
  );
}
