import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Phone transcription spike</Text>
      <Text style={styles.body}>Queued VAD-first transcription pipeline shell.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#f7f7f2',
    flex: 1,
    justifyContent: 'center',
    padding: 24
  },
  title: {
    color: '#222222',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8
  },
  body: {
    color: '#4b4b46',
    fontSize: 16,
    textAlign: 'center'
  }
});
