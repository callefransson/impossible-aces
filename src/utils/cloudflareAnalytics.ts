const CLOUDFLARE_ANALYTICS_TOKEN = "ba46faeb2991486ca23e60601b7d4b41";

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
    };
  }
}

function isNativeShell() {
  return (
    window.Capacitor?.isNativePlatform?.() === true ||
    window.location.protocol === "capacitor:" ||
    window.location.protocol === "ionic:"
  );
}

function isLocalHost() {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.endsWith(".local")
  );
}

export function loadCloudflareAnalytics() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (isNativeShell() || isLocalHost()) return;
  if (!["http:", "https:"].includes(window.location.protocol)) return;
  if (
    document.querySelector(
      'script[data-impossible-aces-analytics="cloudflare"]',
    )
  ) {
    return;
  }

  const script = document.createElement("script");
  script.defer = true;
  script.src = "https://static.cloudflareinsights.com/beacon.min.js";
  script.dataset.cfBeacon = JSON.stringify({
    token: CLOUDFLARE_ANALYTICS_TOKEN,
  });
  script.dataset.impossibleAcesAnalytics = "cloudflare";
  document.body.appendChild(script);
}
