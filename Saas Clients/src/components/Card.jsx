export function Card({ children, className }) {
  return (
    <div className={`rounded-xl border border-gray-800 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}