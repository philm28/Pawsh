import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
}

export default function StarRating({ value, onChange, size = 20, readonly = false }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          disabled={readonly}
          className={readonly ? 'cursor-default' : 'cursor-pointer transition-transform hover:scale-110 active:scale-95'}
        >
          <Star
            size={size}
            className={star <= active ? 'text-amber-400' : 'text-gray-200'}
            fill={star <= active ? '#FBBF24' : 'none'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}
