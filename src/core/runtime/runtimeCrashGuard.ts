export function startRuntimeCrashGuard() {

  window.addEventListener('error', (event) => {
    console.error('💥 Runtime Error:', event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('💥 Unhandled Promise:', event.reason);
  });

}
