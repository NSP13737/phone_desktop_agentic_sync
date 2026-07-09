import { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNotesController } from './src/hooks/useNotesController';
import { CurrentNoteScreen } from './src/ui/CurrentNoteScreen';
import { PreviousNotesDrawer } from './src/ui/PreviousNotesDrawer';
import { SettingsScreen } from './src/ui/SettingsScreen';

export default function App() {
  const controller = useNotesController();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <CurrentNoteScreen
        controller={controller}
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <PreviousNotesDrawer
        visible={drawerOpen}
        notes={controller.notes}
        onClose={() => setDrawerOpen(false)}
        onOpenNote={(id) => void controller.openNote(id)}
        onDeleteSynced={() => void controller.deleteSyncedNotes()}
      />
      <SettingsScreen
        visible={settingsOpen}
        controller={controller}
        onClose={() => setSettingsOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#f7f7f4',
    flex: 1,
  },
});
