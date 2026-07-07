import { useFocusEffect } from 'expo-router';
import { type SQLiteDatabase, useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

/**
 * Runs a query whenever the screen gains focus (so edits made on other
 * screens show up on return) and whenever `deps` change. Returns a
 * `refresh` function for after local mutations.
 */
export function useQuery<T>(
  query: (db: SQLiteDatabase) => Promise<T>,
  deps: readonly unknown[] = []
): { data: T | undefined; refresh: () => void } {
  const db = useSQLiteContext();
  const [data, setData] = useState<T>();
  const [version, setVersion] = useState(0);
  // Callers pass inline query closures, so depend on the serialized deps
  // instead of the function identity to avoid refetching every render.
  const depsKey = JSON.stringify(deps);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      query(db).then((result) => {
        if (live) setData(result);
      });
      return () => {
        live = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [db, version, depsKey])
  );

  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  return { data, refresh };
}
