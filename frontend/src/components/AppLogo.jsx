export default function AppLogo({ size = 36 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Background */}
      <rect width="40" height="40" rx="9" fill="#1e6f5c" />

      {/* Receipt body */}
      <rect x="11" y="5" width="18" height="22" rx="2" fill="white" />

      {/* Serrated bottom of receipt */}
      <path
        d="M11 24 L12.5 26.5 L14 24 L15.5 26.5 L17 24 L18.5 26.5 L20 24 L21.5 26.5 L23 24 L24.5 26.5 L26 24 L27 24 L27 27 L11 27 Z"
        fill="white"
      />

      {/* Store name */}
      <rect x="13" y="8" width="14" height="2.5" rx="1.25" fill="#1e6f5c" />

      {/* Item row 1 */}
      <rect x="13" y="13" width="8" height="1.75" rx="0.875" fill="#b5d8d1" />
      <rect x="23" y="13" width="4" height="1.75" rx="0.875" fill="#b5d8d1" />

      {/* Item row 2 */}
      <rect x="13" y="16.25" width="6" height="1.75" rx="0.875" fill="#b5d8d1" />
      <rect x="23" y="16.25" width="4" height="1.75" rx="0.875" fill="#b5d8d1" />

      {/* Divider */}
      <rect x="13" y="19.75" width="14" height="0.75" rx="0.375" fill="#d6eeea" />

      {/* Total */}
      <rect x="17" y="21.5" width="10" height="2.25" rx="1.125" fill="#1e6f5c" />

      {/* Checkmark badge — bottom-right corner */}
      <circle cx="29" cy="31" r="7" fill="#1e6f5c" stroke="white" strokeWidth="2" />
      <path
        d="M25.5 31 L27.8 33.5 L32.5 27.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
