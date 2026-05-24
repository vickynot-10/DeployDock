import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function AddOrEditAutomationSkeleton() {
  return (
    <div className="flex h-full w-full relative overflow-hidden">
      <div className="flex-1 h-full relative" style={{ background: "var(--bg-0)" }}>

        {/* Dot background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, var(--border-2) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Top-left: project name pill */}
        <div
          className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-xl border"
          style={{ background: "var(--bg-2)", borderColor: "var(--border-1)" }}
        >
          <Skeleton width={14} height={14} borderRadius={4} />
          <Skeleton width={100} height={12} />
        </div>

        {/* Top-right: Run + Add Node buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border"
            style={{ background: "var(--bg-2)", borderColor: "var(--border-1)" }}
          >
            <Skeleton width={12} height={12} borderRadius={3} />
            <Skeleton width={28} height={11} />
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border"
            style={{ background: "var(--bg-2)", borderColor: "var(--border-1)" }}
          >
            <Skeleton width={12} height={12} borderRadius={3} />
            <Skeleton width={60} height={11} />
          </div>
        </div>

        {/* Flow nodes */}
        <div className="absolute" style={{ top: 120, left: 60 }}>
          <FlowNodeSkeleton hideLeft />
        </div>
        <div className="absolute" style={{ top: 175, left: 326 }}>
          <FlowNodeSkeleton />
        </div>
        <div className="absolute" style={{ top: 260, left: 326 }}>
          <FlowNodeSkeleton />
        </div>
        <div className="absolute" style={{ top: 235, left: 590 }}>
          <FlowNodeSkeleton hideRight />
        </div>

        {/* Bottom-left: controls */}
        <div
          className="absolute bottom-4 left-4 flex flex-col rounded-xl border overflow-hidden"
          style={{ background: "var(--bg-2)", borderColor: "var(--border-1)" }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-8 h-7 flex items-center justify-center"
              style={{ borderBottom: i < 2 ? "1px solid var(--border-1)" : "none" }}
            >
              <Skeleton width={12} height={12} borderRadius={3} />
            </div>
          ))}
        </div>

        {/* Bottom-right: minimap */}
        <div
          className="absolute bottom-4 right-4 rounded-xl border overflow-hidden"
          style={{
            background: "var(--bg-2)",
            borderColor: "var(--border-1)",
            width: 120,
            height: 70,
          }}
        >
          <Skeleton width="100%" height="100%" borderRadius={0} />
        </div>
      </div>
    </div>
  );
}

function FlowNodeSkeleton({
  hideLeft = false,
  hideRight = false,
}: {
  hideLeft?: boolean;
  hideRight?: boolean;
}) {
  return (
    <div
      className="relative min-w-[180px] rounded-xl border overflow-visible"
      style={{ background: "var(--bg-2)", borderColor: "var(--border-2)" }}
    >
      {/* Color bar */}
      <Skeleton height={3} borderRadius={0} style={{ display: "block" }} />

      <div className="px-3 py-2.5 flex items-center gap-2.5">
        {/* Icon */}
        <Skeleton width={28} height={28} borderRadius={8} />

        {/* Label + description */}
        <div className="flex-1">
          <Skeleton width={90} height={11} style={{ marginBottom: 5 }} />
          <Skeleton width={120} height={9} />
        </div>
      </div>

      {/* Handles */}
      {!hideLeft && (
        <div
          className="absolute"
          style={{
            left: -5,
            top: "50%",
            transform: "translateY(-50%)",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "var(--border-3)",
            border: "2px solid var(--bg-2)",
          }}
        />
      )}
      {!hideRight && (
        <div
          className="absolute"
          style={{
            right: -5,
            top: "50%",
            transform: "translateY(-50%)",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "var(--border-3)",
            border: "2px solid var(--bg-2)",
          }}
        />
      )}
    </div>
  );
}