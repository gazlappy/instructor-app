/**
 * Web backup file IO: downloads via a temporary anchor and imports via a
 * hidden file input. Keeps expo-file-system (native-only) out of the web bundle.
 */
export async function saveBackupFile(json: string, filename: string): Promise<void> {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Opens the browser file picker and returns the chosen file's text, or null if cancelled. */
export function pickBackupFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) resolve(null);
      else file.text().then(resolve, () => resolve(null));
    };
    // Browsers don't reliably report "cancel"; resolve null when focus returns
    // without a file (the delay lets onchange win if a file was picked).
    window.addEventListener(
      'focus',
      () =>
        setTimeout(() => {
          if (!input.files?.length) resolve(null);
        }, 500),
      { once: true }
    );
    input.click();
  });
}
