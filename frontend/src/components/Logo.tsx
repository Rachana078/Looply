import { useId } from 'react';

interface Props {
  size?: number;
  className?: string;
}

export default function Logo({ size = 40, className = '' }: Props) {
  // useId ensures gradient/clip IDs are unique when multiple Logo instances exist
  const uid = useId().replace(/:/g, '');
  const blueId   = `${uid}-b`;
  const orangeId = `${uid}-o`;
  const backId   = `${uid}-back`;
  const frontId  = `${uid}-front`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Blue gradient — top-left light → bottom-right dark */}
        <linearGradient id={blueId} x1="15" y1="15" x2="82" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#A8D4E8" />
          <stop offset="100%" stopColor="#3A779C" />
        </linearGradient>

        {/* Orange gradient — top-right light → bottom-left dark */}
        <linearGradient id={orangeId} x1="85" y1="15" x2="18" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#F5B888" />
          <stop offset="100%" stopColor="#C05020" />
        </linearGradient>

        {/* Bottom-right triangle — blue ring goes BEHIND orange here */}
        <clipPath id={backId}>
          <polygon points="100,0 100,100 0,100" />
        </clipPath>

        {/* Top-left triangle — blue ring comes IN FRONT of orange here */}
        <clipPath id={frontId}>
          <polygon points="0,0 100,0 0,100" />
        </clipPath>
      </defs>

      {/* Blue ring — back portion (behind the orange ring) */}
      <ellipse
        cx="50" cy="50" rx="19" ry="34"
        transform="rotate(-38 50 50)"
        stroke={`url(#${blueId})`}
        strokeWidth="10"
        strokeLinecap="round"
        clipPath={`url(#${backId})`}
      />

      {/* Orange ring — drawn in full, sits between the two halves of blue */}
      <ellipse
        cx="50" cy="50" rx="19" ry="34"
        transform="rotate(38 50 50)"
        stroke={`url(#${orangeId})`}
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* Blue ring — front portion (in front of the orange ring) */}
      <ellipse
        cx="50" cy="50" rx="19" ry="34"
        transform="rotate(-38 50 50)"
        stroke={`url(#${blueId})`}
        strokeWidth="10"
        strokeLinecap="round"
        clipPath={`url(#${frontId})`}
      />
    </svg>
  );
}
