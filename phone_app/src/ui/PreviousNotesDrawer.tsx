import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NoteRecord } from '../domain/types';

type Props = {
  visible: boolean;
  notes: NoteRecord[];
  onClose(): void;
  onOpenNote(id: string): void;
  onDeleteSynced(): void;
};

export function PreviousNotesDrawer({
  visible,
  notes,
  onClose,
  onOpenNote,
  onDeleteSynced,
}: Props) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Previous notes</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>x</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.list}>
            {notes.map((note) => (
              <Pressable
                key={note.id}
                style={styles.noteRow}
                onPress={() => {
                  onOpenNote(note.id);
                  onClose();
                }}
              >
                <Text numberOfLines={2} style={styles.preview}>
                  {preview(note)}
                </Text>
                <Text style={styles.status}>{statusLabel(note.sync_status)}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert('Delete synced notes?', 'Only notes already marked synced are removed.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: onDeleteSynced },
              ]);
            }}
          >
            <Text style={styles.deleteText}>Delete synced notes</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function preview(note: NoteRecord): string {
  return note.title ?? (note.text.trim() || 'Untitled local note');
}

function statusLabel(status: NoteRecord['sync_status']): string {
  switch (status) {
    case 'draft_local':
      return 'Local only';
    case 'queued':
      return 'Queued';
    case 'syncing':
      return 'Syncing';
    case 'synced':
      return 'Synced';
    case 'sync_failed':
      return 'Sync failed';
  }
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    maxHeight: '76%',
    padding: 18,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    color: '#202124',
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  closeText: {
    fontSize: 28,
  },
  list: {
    marginBottom: 12,
  },
  noteRow: {
    borderBottomColor: '#eceee8',
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  preview: {
    color: '#202124',
    fontSize: 15,
    marginBottom: 6,
  },
  status: {
    color: '#637168',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#202124',
    borderRadius: 8,
    padding: 14,
  },
  deleteText: {
    color: '#fff',
    fontWeight: '700',
  },
});
