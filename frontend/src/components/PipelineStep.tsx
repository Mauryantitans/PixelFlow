import React from 'react';
import * as LucideReact from 'lucide-react';
import { PipelineStep, DEFAULT_OPERATION_CONFIGS } from '../types';

interface PipelineStepProps {
  step: PipelineStep;
  index: number;
  totalSteps: number;
  onRemove: () => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onParameterChange: (stepId: string, paramName: string, value: any) => void;
  onPreview: () => void;
  isViewing: boolean;
}

const PipelineStepComponent: React.FC<PipelineStepProps> = ({
  step,
  index,
  totalSteps,
  onRemove,
  onMove,
  onParameterChange,
  onPreview,
  isViewing
}) => {
  const config = DEFAULT_OPERATION_CONFIGS[step.name];

  const handleMoveUp = () => {
    if (index > 0) onMove(index, index - 1);
  };

  const handleMoveDown = () => {
    if (index < totalSteps - 1) onMove(index, index + 1);
  };

  const renderParameterControl = (param: any) => {
    const value = step.params[param.name];

    switch (param.type) {
      case 'slider':
        return (
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={param.min}
              max={param.max}
              value={Number(value)}
              onChange={(e) => onParameterChange(step.id, param.name, parseInt(e.target.value))}
              className="param-slider flex-1"
            />
            <span className="text-sm font-mono text-gray-600 dark:text-gray-300 w-12 text-right">
              {Number(value) > 0 ? `+${value}` : String(value)}
            </span>
          </div>
        );
      
      case 'select':
        return (
          <select
            value={String(value)}
            onChange={(e) => onParameterChange(step.id, param.name, e.target.value)}
            className="param-select"
          >
            {param.options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="pipeline-step flex items-center gap-3">
      {/* Reorder Controls */}
      <div className="flex flex-col gap-1">
        <button
          onClick={handleMoveUp}
          disabled={index === 0}
          className="reorder-btn text-gray-400 hover:text-zinc-800 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <LucideReact.ArrowUp className="w-4 h-4" />
        </button>
        <button
          onClick={handleMoveDown}
          disabled={index === totalSteps - 1}
          className="reorder-btn text-gray-400 hover:text-zinc-800 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <LucideReact.ArrowDown className="w-4 h-4" />
        </button>
      </div>

      {/* Step Content */}
      <div className="flex-grow">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold text-zinc-900 dark:text-white">
            {step.name}
          </h4>
        </div>

        {/* Parameters */}
        {config && config.params.length > 0 && (
          <div className="space-y-2">
            {config.params.map((param) => (
              <div key={param.name}>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                  {param.name}
                </label>
                {renderParameterControl(param)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex flex-col gap-2">
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Remove step"
        >
          <LucideReact.X className="w-5 h-5" />
        </button>
        <button
          onClick={onPreview}
          className={`transition-colors ${
            isViewing
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-400 hover:text-zinc-800 dark:hover:text-white'
          }`}
          title="Preview this step"
        >
          <LucideReact.Eye className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PipelineStepComponent;