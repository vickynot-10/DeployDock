import { memo } from "react";

function Loader({ color = "var(--accent)", size = 18 }: { color?: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px solid transparent`,
        borderTopColor: color,
        borderRightColor: color,
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}

export default memo(Loader);