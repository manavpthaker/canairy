import React from 'react';
import { useParams } from 'react-router-dom';
import { CanairyMascot } from '../components/canairy/CanairyMascot';

export const IndicatorDetails: React.FC = () => {
  const { id } = useParams();
  
  return (
    <div className="min-h-screen bg-canairy-neutral p-6">
      <div className="max-w-4xl mx-auto">
        <div className="card-canairy mb-6">
          <div className="flex items-center gap-4">
            <CanairyMascot size="md" mood="thinking" />
            <div>
              <h1 className="text-2xl font-bold text-canairy-charcoal">Indicator Details</h1>
              <p className="text-canairy-charcoal-light">Understanding {id}</p>
            </div>
          </div>
        </div>

        <div className="card-canairy">
          <p className="text-center text-canairy-charcoal-light py-12">
            Detailed information coming soon...
          </p>
        </div>
      </div>
    </div>
  );
};