import { WalkStatus } from '../../lib/types';

const config: Record<WalkStatus, { label: string; className: string }> = {
  scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  assigned: { label: 'Assigned', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  in_progress: { label: 'In Progress', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700 border-green-200' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-500 border-gray-200' },
};

export default function StatusBadge({ status }: { status: WalkStatus }) {
  const { label, className } = config[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  );
}
