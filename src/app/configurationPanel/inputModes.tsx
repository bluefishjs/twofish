import React from "react";
type NumericInputProps = {
  label: string;
  value?: number;
  onChange: (evt: any) => any;
};

export function NumericInput(props: NumericInputProps) {
  return (
    <div>
      <label htmlFor={props.label}>
        {props.label}:{" "}
        {props.value !== undefined ? (
          <input
            id={props.label}
            type="number"
            onChange={props.onChange}
            className="nodrag"
            value={Math.round(props.value * 100) / 100}
            size={5}
          />
        ) : (
          <em>computed</em>
        )}
      </label>
    </div>
  );
};
