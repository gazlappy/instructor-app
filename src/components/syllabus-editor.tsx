import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip } from '@/components/ui/chip';
import { FormInput } from '@/components/ui/form';
import { Spacing } from '@/constants/theme';
import {
  addSkill,
  deleteSkill,
  deleteSkillCategory,
  listSkills,
  moveSkill,
  moveSkillCategory,
  renameSkill,
  renameSkillCategory,
} from '@/db/queries';
import { type Skill } from '@/db/types';
import { useQuery } from '@/db/use-query';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive, showAlert } from '@/lib/alert';

type Editing =
  | { kind: 'skill'; id: number }
  | { kind: 'category'; name: string }
  | { kind: 'new-skill'; category: string }
  | { kind: 'new-category' }
  | null;

function IconButton({
  glyph,
  label,
  onPress,
  danger,
}: {
  glyph: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
      <ThemedText type="small" style={{ color: danger ? theme.danger : theme.textSecondary }}>
        {glyph}
      </ThemedText>
    </Pressable>
  );
}

/** Editable syllabus: rename, add, delete, and reorder categories and skills. */
export function SyllabusEditor() {
  const db = useSQLiteContext();
  const { data: skills, refresh } = useQuery((db) => listSkills(db));
  const [editing, setEditing] = useState<Editing>(null);
  const [draft, setDraft] = useState('');
  const [draftSkill, setDraftSkill] = useState('');

  const groups = useMemo(() => {
    const result: { category: string; skills: Skill[] }[] = [];
    for (const skill of skills ?? []) {
      const last = result[result.length - 1];
      if (last && last.category === skill.category) last.skills.push(skill);
      else result.push({ category: skill.category, skills: [skill] });
    }
    return result;
  }, [skills]);

  const done = () => {
    setEditing(null);
    setDraft('');
    setDraftSkill('');
    refresh();
  };

  const startEdit = (next: Editing, initial = '') => {
    setEditing(next);
    setDraft(initial);
    setDraftSkill('');
  };

  const saveEdit = async () => {
    const name = draft.trim();
    if (!editing) return;
    if (editing.kind === 'new-category') {
      const firstSkill = draftSkill.trim();
      if (!name || !firstSkill) {
        showAlert('Both fields are required', 'Give the category a name and its first skill.');
        return;
      }
      if (groups.some((g) => g.category === name)) {
        showAlert('Category already exists');
        return;
      }
      await addSkill(db, name, firstSkill);
    } else if (!name) {
      showAlert('Name is required');
      return;
    } else if (editing.kind === 'skill') {
      await renameSkill(db, editing.id, name);
    } else if (editing.kind === 'category') {
      if (name !== editing.name && groups.some((g) => g.category === name)) {
        showAlert('Category already exists');
        return;
      }
      await renameSkillCategory(db, editing.name, name);
    } else if (editing.kind === 'new-skill') {
      await addSkill(db, editing.category, name);
    }
    done();
  };

  const editorRow = (placeholder: string) => (
    <View style={styles.editorRow}>
      <FormInput value={draft} onChangeText={setDraft} placeholder={placeholder} autoFocus style={styles.editorInput} />
      <Chip label="Cancel" onPress={done} />
      <Chip label="Save" selected onPress={saveEdit} />
    </View>
  );

  const act = async (operation: Promise<void>) => {
    await operation;
    refresh();
  };

  return (
    <View style={styles.list}>
      <ThemedText type="small" themeColor="textSecondary">
        The skills used for pupil progress tracking. Changes apply to every student; deleting a
        skill removes any recorded progress for it.
      </ThemedText>

      {groups.map((group, groupIndex) => (
        <ThemedView key={group.category} type="backgroundElement" style={styles.card}>
          {editing?.kind === 'category' && editing.name === group.category ? (
            editorRow('Category name')
          ) : (
            <View style={styles.row}>
              <ThemedText type="smallBold" style={styles.rowLabel}>
                {group.category}
              </ThemedText>
              {groupIndex > 0 && (
                <IconButton glyph="↑" label={`Move ${group.category} up`} onPress={() => act(moveSkillCategory(db, group.category, -1))} />
              )}
              {groupIndex < groups.length - 1 && (
                <IconButton glyph="↓" label={`Move ${group.category} down`} onPress={() => act(moveSkillCategory(db, group.category, 1))} />
              )}
              <IconButton glyph="✎" label={`Rename ${group.category}`} onPress={() => startEdit({ kind: 'category', name: group.category }, group.category)} />
              <IconButton
                glyph="✕"
                label={`Delete ${group.category}`}
                danger
                onPress={() =>
                  confirmDestructive(
                    `Delete "${group.category}"?`,
                    'All its skills and any recorded progress for them will be removed.',
                    'Delete category',
                    () => act(deleteSkillCategory(db, group.category))
                  )
                }
              />
            </View>
          )}

          {group.skills.map((skill, skillIndex) =>
            editing?.kind === 'skill' && editing.id === skill.id ? (
              <View key={skill.id}>{editorRow('Skill name')}</View>
            ) : (
              <View key={skill.id} style={styles.row}>
                <ThemedText type="small" style={styles.rowLabel}>
                  {skill.name}
                </ThemedText>
                {skillIndex > 0 && (
                  <IconButton glyph="↑" label={`Move ${skill.name} up`} onPress={() => act(moveSkill(db, skill.id, -1))} />
                )}
                {skillIndex < group.skills.length - 1 && (
                  <IconButton glyph="↓" label={`Move ${skill.name} down`} onPress={() => act(moveSkill(db, skill.id, 1))} />
                )}
                <IconButton glyph="✎" label={`Rename ${skill.name}`} onPress={() => startEdit({ kind: 'skill', id: skill.id }, skill.name)} />
                <IconButton
                  glyph="✕"
                  label={`Delete ${skill.name}`}
                  danger
                  onPress={() =>
                    confirmDestructive(
                      `Delete "${skill.name}"?`,
                      'Any recorded progress for this skill will be removed.',
                      'Delete skill',
                      () => act(deleteSkill(db, skill.id))
                    )
                  }
                />
              </View>
            )
          )}

          {editing?.kind === 'new-skill' && editing.category === group.category ? (
            editorRow('New skill name')
          ) : (
            <Pressable
              onPress={() => startEdit({ kind: 'new-skill', category: group.category })}
              style={({ pressed }) => [styles.addRow, pressed && styles.pressed]}>
              <ThemedText type="small" themeColor="textSecondary">
                ＋ Add skill
              </ThemedText>
            </Pressable>
          )}
        </ThemedView>
      ))}

      {editing?.kind === 'new-category' ? (
        <ThemedView type="backgroundElement" style={styles.card}>
          <FormInput value={draft} onChangeText={setDraft} placeholder="Category name" autoFocus />
          <FormInput value={draftSkill} onChangeText={setDraftSkill} placeholder="First skill name" />
          <View style={styles.editorButtons}>
            <Chip label="Cancel" onPress={done} />
            <Chip label="Save" selected onPress={saveEdit} />
          </View>
        </ThemedView>
      ) : (
        <View style={styles.addCategoryRow}>
          <Chip label="Add category" onPress={() => startEdit({ kind: 'new-category' })} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two,
  },
  card: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: 40,
  },
  rowLabel: {
    flex: 1,
    paddingRight: Spacing.two,
  },
  iconButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  editorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  editorInput: {
    flex: 1,
    paddingVertical: Spacing.two,
  },
  editorButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  addRow: {
    paddingVertical: Spacing.two,
  },
  addCategoryRow: {
    flexDirection: 'row',
  },
  pressed: {
    opacity: 0.6,
  },
});
