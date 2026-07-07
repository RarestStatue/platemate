export default function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect x="0.5" y="0.5" width="39" height="39" rx="10" fill="#0B0B0A" />
      {/* Pot body */}
      <path
        d="M10 18h20l-1.4 12a2 2 0 0 1-2 1.8H13.4a2 2 0 0 1-2-1.8L10 18z"
        fill="#F6F3EC"
      />
      {/* Handles */}
      <rect x="6" y="18.5" width="4.5" height="2" rx="1" fill="#F6F3EC" />
      <rect x="29.5" y="18.5" width="4.5" height="2" rx="1" fill="#F6F3EC" />
      {/* Steam */}
      <path
        d="M17 8c-1.5 2 1.5 3 0 5M23 6c-1.5 2 1.5 3 0 5"
        stroke="#3B5A3F"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Green leaf-mark on pot */}
      <circle cx="20" cy="24.5" r="2" fill="#3B5A3F" />
    </svg>
  );
}
