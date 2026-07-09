import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NotesController } from '../hooks/useNotesController';

type Props = {
  visible: boolean;
  controller: NotesController;
  onClose(): void;
};

export function SettingsScreen({ visible, controller, onClose }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanOpen, setScanOpen] = useState(false);
  const [rawQr, setRawQr] = useState('');
  const [host, setHost] = useState(controller.pairing?.host ?? '');
  const [port, setPort] = useState(String(controller.pairing?.port ?? ''));

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>x</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Desktop companion</Text>
          <Text style={styles.value}>{controller.pairing?.desktop_name ?? 'Not paired'}</Text>
          <Text style={styles.status}>State: {controller.connectionState}</Text>
        </View>

        {scanOpen ? (
          <View style={styles.cameraBox}>
            {permission?.granted ? (
              <CameraView
                style={styles.camera}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={({ data }) => {
                  setScanOpen(false);
                  void controller.pairFromQr(data);
                }}
              />
            ) : (
              <Pressable style={styles.primaryButton} onPress={() => void requestPermission()}>
                <Text style={styles.primaryText}>Allow camera</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              if (!permission?.granted) void requestPermission();
              setScanOpen(true);
            }}
          >
            <Text style={styles.primaryText}>Scan QR</Text>
          </Pressable>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Paste QR JSON</Text>
          <TextInput
            style={styles.multilineInput}
            value={rawQr}
            onChangeText={setRawQr}
            placeholder='{"v":1,"app":"obsidian-notetaker",...}'
            multiline
            textAlignVertical="top"
          />
          <Pressable style={styles.secondaryButton} onPress={() => void controller.pairFromQr(rawQr)}>
            <Text style={styles.secondaryText}>Pair from JSON</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Manual address</Text>
          <View style={styles.row}>
            <TextInput style={styles.hostInput} value={host} onChangeText={setHost} placeholder="Host" />
            <TextInput
              style={styles.portInput}
              value={port}
              onChangeText={setPort}
              keyboardType="number-pad"
              placeholder="Port"
            />
          </View>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => controller.updateManualAddress(host.trim(), Number(port))}
          >
            <Text style={styles.secondaryText}>Save address</Text>
          </Pressable>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => void controller.syncQueuedNotes()}>
          <Text style={styles.primaryText}>Sync now</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f7f7f4',
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 56,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    color: '#202124',
    fontSize: 22,
    fontWeight: '700',
  },
  closeButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  closeText: {
    fontSize: 24,
  },
  section: {
    borderBottomColor: '#d9ddd6',
    borderBottomWidth: 1,
    marginBottom: 18,
    paddingBottom: 18,
  },
  label: {
    color: '#4e5a52',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  value: {
    color: '#202124',
    fontSize: 18,
    fontWeight: '700',
  },
  status: {
    color: '#637168',
    marginTop: 4,
  },
  cameraBox: {
    backgroundColor: '#111',
    borderRadius: 8,
    height: 260,
    marginBottom: 18,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#202124',
    borderRadius: 8,
    marginBottom: 18,
    padding: 14,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#202124',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 12,
  },
  secondaryText: {
    color: '#202124',
    fontWeight: '700',
  },
  multilineInput: {
    backgroundColor: '#fff',
    borderColor: '#d9ddd6',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 94,
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  hostInput: {
    backgroundColor: '#fff',
    borderColor: '#d9ddd6',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: 10,
  },
  portInput: {
    backgroundColor: '#fff',
    borderColor: '#d9ddd6',
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    width: 90,
  },
});
