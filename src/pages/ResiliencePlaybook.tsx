import React from 'react';
import { CanairyMascot } from '../components/canairy/CanairyMascot';

export const ResiliencePlaybook: React.FC = () => {
  return (
    <div className="min-h-screen bg-canairy-neutral p-6">
      <div className="max-w-4xl mx-auto">
        <div className="card-canairy mb-6">
          <div className="flex items-center gap-4">
            <CanairyMascot size="md" mood="happy" />
            <div>
              <h1 className="text-2xl font-bold text-canairy-charcoal">Resilience Playbook</h1>
              <p className="text-canairy-charcoal-light">Your family's guide to staying prepared</p>
            </div>
          </div>
        </div>

        <div className="card-canairy">
          <p className="text-center text-canairy-charcoal-light py-12">
            Resilience playbook coming soon...
          </p>
        </div>
      </div>
    </div>
  );
};