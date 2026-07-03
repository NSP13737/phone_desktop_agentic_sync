export type TranscriptionJobStatus =
  | 'queued'
  | 'running_vad'
  | 'no_speech_detected'
  | 'transcribing'
  | 'transcript_inserted'
  | 'saved'
  | 'audio_deleted'
  | 'failed';

export interface SpeechRange {
  startMs: number;
  endMs: number;
}

export interface InsertionTarget {
  position: number;
}

export interface LocalNote {
  id: string;
  text: string;
  updatedAt: string;
}

export interface TranscriptionJob {
  id: string;
  noteId: string;
  createdAt: string;
  captureSequence: number;
  audioTempUri: string;
  status: TranscriptionJobStatus;
  insertionTarget: InsertionTarget;
  vadSpeechRanges?: SpeechRange[];
  transcriptionModelId?: string;
  language?: string;
  errorMessage?: string;
}

export interface VadAdapter {
  detectSpeech(audioTempUri: string): Promise<SpeechRange[]>;
}

export interface TranscriptionEngineAdapter {
  transcribe(audioTempUri: string, speechRanges: SpeechRange[]): Promise<string>;
}

export interface LocalNoteStore {
  getNote(noteId: string): Promise<LocalNote>;
  saveNote(note: LocalNote): Promise<void>;
  saveJob(job: TranscriptionJob): Promise<void>;
}

export interface TemporaryAudioStore {
  deleteAudio(audioTempUri: string): Promise<void>;
}
