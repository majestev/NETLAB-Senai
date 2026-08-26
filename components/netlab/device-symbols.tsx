export function DeviceSymbols() {
  return (
    <svg width="0" height="0" aria-hidden focusable="false" className="absolute">
      <defs>
        <symbol id="net-router" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="21" fill="none" strokeWidth="2" />
          <path
            d="M24 13v22M13 24h22M24 13l-4 4M24 13l4 4M24 35l-4-4M24 35l4-4M13 24l4-4M13 24l4 4M35 24l-4-4M35 24l-4 4"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>

        <symbol id="net-switch" viewBox="0 0 48 48">
          <rect x="4" y="12" width="40" height="24" rx="3" fill="none" strokeWidth="2" />
          <path
            d="M14 20h20M14 28h20M30 16l4 4-4 4M18 24l-4 4 4 4"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>

        <symbol id="net-host" viewBox="0 0 48 48">
          <rect x="6" y="9" width="36" height="24" rx="2" fill="none" strokeWidth="2" />
          <path
            d="M18 39h12M24 33v6"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </symbol>

        <symbol id="net-server" viewBox="0 0 48 48">
          <rect x="10" y="6" width="28" height="36" rx="2" fill="none" strokeWidth="2" />
          <path d="M16 14h16M16 22h16M16 30h10" fill="none" strokeWidth="2" strokeLinecap="round" />
          <circle cx="34" cy="30" r="1.6" />
        </symbol>

        <symbol id="net-ap" viewBox="0 0 48 48">
          <rect x="14" y="26" width="20" height="14" rx="2" fill="none" strokeWidth="2" />
          <path
            d="M17 20a10 10 0 0 1 14 0M13 15a17 17 0 0 1 22 0"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </symbol>
      </defs>
    </svg>
  );
}

export const DEVICE_SYMBOL: Record<string, string> = {
  host: "#net-host",
  switch: "#net-switch",
  router: "#net-router",
  server: "#net-server",
  ap: "#net-ap",
};
