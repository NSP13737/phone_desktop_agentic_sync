import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NotesController } from '../hooks/useNotesController';

type Props = {
  controller: NotesController;
  onOpenDrawer(): void;
  onOpenSettings(): void;
};

export function CurrentNoteScreen({ controller, onOpenDrawer, onOpenSettings }: Props) {
  const note = controller.currentNote;
  const readOnly = note?.sync_status === 'synced';

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => void controller.createNewNote()}>
          <Text style={styles.iconText}>+</Text>
        </Pressable>
        <Text style={styles.status}>{statusText(controller.connectionState, note?.sync_status)}</Text>
        <Pressable style={styles.iconButton} onPress={onOpenSettings}>
          <Text style={styles.iconText}>S</Text>
        </Pressable>
      </View>

      {controller.error ? (
        <Pressable
          style={styles.error}
          onPress={() => {
            Alert.alert('Phone app', controller.error ?? '');
            controller.clearError();
          }}
        >
          <Text style={styles.errorText}>{controller.error}</Text>
        </Pressable>
      ) : null}

      <TextInput
        style={styles.title}
        value={note?.title ?? ''}
        onChangeText={controller.setTitle}
        placeholder="Title"
        editable={!readOnly}
        placeholderTextColor="#778"
      />
      <TextInput
        style={[styles.body, readOnly ? styles.readOnly : null]}
        value={note?.text ?? ''}
        onChangeText={controller.setText}
        placeholder="Start typing..."
        editable={!readOnly}
        multiline
        textAlignVertical="top"
        placeholderTextColor="#778"
      />

      <Pressable style={styles.drawerHandle} onPress={onOpenDrawer}>
        <Text style={styles.drawerText}>Previous notes</Text>
      </Pressable>
    </View>
  );
}

function statusText(connection: NotesController['connectionState'], noteStatus?: string): string {
  if (connection === 'syncing') return 'Syncing';
  if (connection === 'sync_error') return 'Sync error';
  if (noteStatus === 'synced') return 'Synced';
  if (noteStatus === 'queued' || noteStatus === 'sync_failed') return 'Saved locally';
  return connection === 'paired' ? 'Paired' : 'Local';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f4',
    paddingHorizontal: 18,
    paddingTop: 56,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#202124',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    width: 44,
  },
  iconText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  status: {
    color: '#3c4941',
    fontSize: 14,
    fontWeight: '700',
  },
  error: {
    backgroundColor: '#ffe9e3',
    borderColor: '#d86b4d',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    padding: 10,
  },
  errorText: {
    color: '#762d1d',
  },
  title: {
    borderBottomColor: '#d6d8d2',
    borderBottomWidth: 1,
    color: '#1f2320',
    fontSize: 20,
    fontWeight: '700',
    minHeight: 48,
    paddingVertical: 8,
  },
  body: {
    color: '#202124',
    flex: 1,
    fontSize: 18,
    lineHeight: 26,
    paddingTop: 18,
  },
  readOnly: {
    color: '#626862',
  },
  drawerHandle: {
    alignItems: 'center',
    borderTopColor: '#d6d8d2',
    borderTopWidth: 1,
    paddingBottom: 18,
    paddingTop: 12,
  },
  drawerText: {
    color: '#4f5b53',
    fontSize: 13,
    fontWeight: '700',
  },
});
