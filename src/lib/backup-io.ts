import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { readAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

/**
 * Native backup file IO: write the JSON to the cache directory and hand it
 * to the share sheet (AirDrop, Files, Drive, email…). Web has its own
 * implementation in backup-io.web.ts.
 */
export async function saveBackupFile(json: string, filename: string): Promise<void> {
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Save your backup',
    UTI: 'public.json',
  });
}

/** Opens the document picker and returns the chosen file's text, or null if cancelled. */
export async function pickBackupFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets[0]) return null;
  return readAsStringAsync(result.assets[0].uri);
}
