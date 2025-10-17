export default function DottedBackground() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `radial-gradient(circle, #4B5563 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
        zIndex: 0,
      }}
    />
  );
}

