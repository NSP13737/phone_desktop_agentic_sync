import { describe, expect, it } from 'vitest';
import { createTranscriptionProcessor } from './transcriptionProcessor';
import type {
  LocalNote,
  LocalNoteStore,
  SpeechRange,
  TemporaryAudioStore,
  TranscriptionEngineAdapter,
  TranscriptionJob,
  VadAdapter
} from './types';

function createJob(overrides: Partial<TranscriptionJob> = {}): TranscriptionJob {
  return {
    id: 'job-1',
    noteId: 'note-1',
    createdAt: '2026-07-02T10:00:00.000Z',
    captureSequence: 1,
    audioTempUri: 'file:///tmp/audio-1.wav',
    status: 'queued',
    insertionTarget: { position: 5 },
    ...overrides
  };
}

function createHarness(options: {
  noteText?: string;
  speechRanges: SpeechRange[];
  transcript?: string;
  transcriptionError?: Error;
}) {
  const note: LocalNote = {
    id: 'note-1',
    text: options.noteText ?? 'hello world',
    updatedAt: '2026-07-02T10:00:00.000Z'
  };
  const savedNotes: LocalNote[] = [];
  const savedJobs: TranscriptionJob[] = [];
  const deletedAudioUris: string[] = [];

  const vad: VadAdapter = {
    detectSpeech: async () => options.speechRanges
  };
  const transcriptionEngine: TranscriptionEngineAdapter = {
    transcribe: async () => {
      if (options.transcriptionError) {
        throw options.transcriptionError;
      }

      return options.transcript ?? ' inserted text';
    }
  };
  const noteStore: LocalNoteStore = {
    getNote: async () => note,
    saveNote: async (savedNote) => {
      savedNotes.push({ ...savedNote });
      note.text = savedNote.text;
      note.updatedAt = savedNote.updatedAt;
    },
    saveJob: async (job) => {
      savedJobs.push({ ...job });
    }
  };
  const temporaryAudioStore: TemporaryAudioStore = {
    deleteAudio: async (audioTempUri) => {
      deletedAudioUris.push(audioTempUri);
    }
  };

  return {
    deletedAudioUris,
    note,
    noteStore,
    savedJobs,
    savedNotes,
    temporaryAudioStore,
    transcriptionEngine,
    vad
  };
}

describe('createTranscriptionProcessor', () => {
  it('transcribes speech, inserts text into the note, saves, and deletes temporary audio', async () => {
    const harness = createHarness({
      speechRanges: [{ startMs: 100, endMs: 900 }],
      transcript: ' brave new'
    });
    const processor = createTranscriptionProcessor(harness);

    await processor.enqueue(createJob());
    const result = await processor.processNext();

    expect(result?.status).toBe('audio_deleted');
    expect(harness.savedNotes).toHaveLength(1);
    expect(harness.savedNotes[0].text).toBe('hello brave new world');
    expect(harness.deletedAudioUris).toEqual(['file:///tmp/audio-1.wav']);
    expect(harness.savedJobs.map((job) => job.status)).toEqual([
      'queued',
      'running_vad',
      'transcribing',
      'transcript_inserted',
      'saved',
      'audio_deleted'
    ]);
  });

  it('treats no-speech segments as successful empty outcomes and deletes temporary audio', async () => {
    const harness = createHarness({ speechRanges: [] });
    const processor = createTranscriptionProcessor(harness);

    await processor.enqueue(createJob());
    const result = await processor.processNext();

    expect(result?.status).toBe('audio_deleted');
    expect(harness.savedNotes).toHaveLength(0);
    expect(harness.note.text).toBe('hello world');
    expect(harness.deletedAudioUris).toEqual(['file:///tmp/audio-1.wav']);
    expect(harness.savedJobs.map((job) => job.status)).toEqual([
      'queued',
      'running_vad',
      'no_speech_detected',
      'audio_deleted'
    ]);
  });

  it('marks transcription failures without deleting temporary audio so the job can be retried', async () => {
    const harness = createHarness({
      speechRanges: [{ startMs: 100, endMs: 900 }],
      transcriptionError: new Error('model failed')
    });
    const processor = createTranscriptionProcessor(harness);

    await processor.enqueue(createJob());
    const result = await processor.processNext();

    expect(result?.status).toBe('failed');
    expect(result?.errorMessage).toBe('model failed');
    expect(harness.savedNotes).toHaveLength(0);
    expect(harness.deletedAudioUris).toEqual([]);
    expect(harness.savedJobs.map((job) => job.status)).toEqual([
      'queued',
      'running_vad',
      'transcribing',
      'failed'
    ]);
  });
});
