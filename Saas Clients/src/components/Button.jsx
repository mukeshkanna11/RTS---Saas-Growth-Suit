export default function Button({ children, ...props }) {
  return (
    <button
      className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
      {...props}
    >
      {children}
    </button>
  );
}