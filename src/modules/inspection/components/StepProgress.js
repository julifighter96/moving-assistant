import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

const StepProgress = ({ currentStep, steps }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div key={step.label} className="flex flex-col items-center flex-1">
              <div className="relative w-full">
                {index !== 0 && (
                  <div 
                    className={`absolute left-0 right-1/2 top-4 h-1 -z-10 
                    ${isCompleted ? 'bg-primary' : 'bg-gray-200'}`}
                  />
                )}
                {index !== steps.length - 1 && (
                  <div 
                    className={`absolute left-1/2 right-0 top-4 h-1 -z-10 
                    ${index < currentStep ? 'bg-primary' : 'bg-gray-200'}`}
                  />
                )}
                <div className="flex justify-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center 
                    ${isCompleted ? 'bg-primary text-white' : 
                      isCurrent ? 'bg-primary-light border-2 border-primary' : 
                      'bg-gray-200'}`}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                </div>
              </div>
              <span className={`mt-2 text-sm font-medium 
                ${isCurrent ? 'text-primary' : 'text-gray-500'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepProgress;