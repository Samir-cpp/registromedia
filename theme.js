// Runs before paint; the preference is not personal school data.
try {
  const mode = localStorage.getItem("rm-theme") || "system";
  document.documentElement.dataset.theme =
    mode === "system"
      ? matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : mode;
} catch {}

window.NativeAppearance?.postMessage(
  document.documentElement.dataset.theme || "light",
);
