export default function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="w-8 h-8 border-3 border-gray-200 border-t-forest-500 rounded-full animate-spin" style={{ borderTopColor: '#E8CB80', borderWidth: '3px' }} />
    </div>
  );
}
