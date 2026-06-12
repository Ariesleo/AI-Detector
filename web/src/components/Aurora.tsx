/**
 * The slow-breathing aurora field behind every page.
 * Pure CSS keyframes (20-30s cycles) on three blurred gradient blobs —
 * deep midnight base shifting through deep teal and soft violet.
 */
export function Aurora({ intensity = 1 }: { intensity?: number }) {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-20 overflow-hidden bg-midnight"
      style={{ opacity: 1 }}
    >
      <div style={{ opacity: intensity }} className="absolute inset-0">
        <div
          className="aurora-blob aurora-a"
          style={{
            top: "-20%",
            left: "-10%",
            width: "70vmax",
            height: "55vmax",
            background:
              "radial-gradient(ellipse at center, rgba(13,61,58,0.85), rgba(13,61,58,0) 65%)",
          }}
        />
        <div
          className="aurora-blob aurora-b"
          style={{
            bottom: "-25%",
            right: "-15%",
            width: "65vmax",
            height: "60vmax",
            background:
              "radial-gradient(ellipse at center, rgba(26,10,46,0.9), rgba(26,10,46,0) 65%)",
          }}
        />
        <div
          className="aurora-blob aurora-c"
          style={{
            top: "30%",
            left: "35%",
            width: "55vmax",
            height: "45vmax",
            background:
              "radial-gradient(ellipse at center, rgba(20,84,96,0.5), rgba(20,84,96,0) 70%)",
          }}
        />
      </div>
      {/* vignette keeps edges calm and text readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(6,10,20,0.55) 100%)",
        }}
      />
    </div>
  );
}
