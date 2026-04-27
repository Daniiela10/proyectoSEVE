export default function TrashBasuraIcon({ size = 18, color = "#c0392b" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {/* Tapa */}
      <path
        d="M3 6h18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Manija de la tapa */}
      <path
        d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Cuerpo del basurero */}
      <path
        d="M19 6l-1.5 14a1 1 0 0 1-1 .9H7.5a1 1 0 0 1-1-.9L5 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Líneas internas */}
      <line x1="10" y1="11" x2="10" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="11" x2="14" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
