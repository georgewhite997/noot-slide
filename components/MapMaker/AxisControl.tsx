import React from "react";

type AxisControlProps = {
  /** “X”, “Y” or “Z” */
  label: string;
  /** Current value shown in the input */
  value: number;
  /** Write the new value back to parent */
  setValue: (v: number) => void;
  /** Step sizes that should get a + and – button (e.g. [0.2, 1]) */
  steps: number[];
  /** Optional post-processing (rounding etc.) */
  prepare?: (n: number) => number;
  /** Optional presets that should get a button */
  presets?: { value?: number; action?: number; label: string }[];
};

export const AxisControl: React.FC<AxisControlProps> = ({
  label,
  value,
  setValue,
  steps,
  prepare = (n) => n,
  presets,
}) => (
  <div className="flex gap-1 items-center bg-gray-200 rounded-md p-1 max-w-min">
    <div>
      <p className="text-center">{label}</p>

      <input
        type="text"
        value={value}
        className="max-w-[60px] bg-white rounded-md px-1"
        onChange={(e) =>
          setValue(prepare(parseFloat(e.target.value.trim()) || 0))
        }
      />
      <div className="flex w-[60px] justify-between">
        {presets && presets.length > 0
          ? presets.map((preset) => (
              <button
                key={preset.label}
                className="bg-white px-[4px] py-[2px] rounded-md mt-[2px]"
                onClick={() =>
                  preset.value === undefined
                    ? setValue(value * (preset.action || 1))
                    : setValue(preset.value)
                }
              >
                {preset.label}
              </button>
            ))
          : null}
      </div>
    </div>

    {/* ± buttons */}
    {steps.map((step) => (
      <div key={step} className="flex flex-col gap-1">
        <button
          className="p-1 bg-green-500 rounded-md max-w-min"
          onClick={() => setValue(prepare(value + step))}
        >
          {step.toFixed(1)}
        </button>
        <button
          className="p-1 bg-red-500 rounded-md max-w-min"
          onClick={() => setValue(prepare(value - step))}
        >
          {step.toFixed(1)}
        </button>
      </div>
    ))}
  </div>
);
