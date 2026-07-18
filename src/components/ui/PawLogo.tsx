interface PawLogoProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function PawLogo({ size = 24, color = '#2B2620', className }: PawLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main pad */}
      <path
        d="M50 60c13.5 0 25 10 25 22.5C75 91.5 67.5 95 59.5 95c-3.5 0-6.5-1.3-9.5-1.3S43.5 95 40.5 95c-8 0-15.5-3.5-15.5-12.5C25 70 36.5 60 50 60Z"
        fill={color}
      />
      {/* Top-left toe */}
      <ellipse cx="36.5" cy="24" rx="11.5" ry="16" fill={color} />
      {/* Top-right toe */}
      <ellipse cx="63.5" cy="24" rx="11.5" ry="16" fill={color} />
      {/* Bottom-left toe */}
      <ellipse cx="14" cy="48" rx="10.5" ry="14" transform="rotate(-22 14 48)" fill={color} />
      {/* Bottom-right toe */}
      <ellipse cx="86" cy="48" rx="10.5" ry="14" transform="rotate(22 86 48)" fill={color} />
    </svg>
  );
}
