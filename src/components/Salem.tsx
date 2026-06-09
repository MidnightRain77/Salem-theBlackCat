import React from "react";

export const Salem: React.FC = () => {
  return (
    <svg
      id="salem"
      width="120"
      height="120"
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Placeholder: black circle to confirm transparency & rendering */}
      <circle
        id="salem-body"
        cx="60"
        cy="60"
        r="55"
        fill="#1a1a1a"
        stroke="#333"
        strokeWidth="2"
      />
      {/* Eyes — two small green dots so it reads as "cat" */}
      <circle id="eye-left" cx="42" cy="50" r="5" fill="#39ff14" />
      <circle id="eye-right" cx="78" cy="50" r="5" fill="#39ff14" />
    </svg>
  );
};
