import React from 'react';
import { CanairyMascot } from '../components/canairy/CanairyMascot';

export const FamilyChecklist: React.FC = () => {
  return (
    <div className="min-h-screen bg-canairy-neutral p-6">
      <div className="max-w-4xl mx-auto">
        <div className="card-canairy mb-6">
          <div className="flex items-center gap-4">
            <CanairyMascot size="md" mood="happy" />
            <div>
              <h1 className="text-2xl font-bold text-canairy-charcoal">Family Actions</h1>
              <p className="text-canairy-charcoal-light">Simple steps to keep your family prepared</p>
            </div>
          </div>
        </div>

        <div className="card-canairy">
          <p className="text-center text-canairy-charcoal-light py-12">
            Family checklist coming soon...
          </p>
        </div>
      </div>
    </div>
  );
};