import type {
  LocalNote,
  LocalNoteStore,
  TemporaryAudioStore,
  TranscriptionEngineAdapter,
  TranscriptionJob,
  TranscriptionJobStatus,
  VadAdapter
} from './types';

export interface TranscriptionProcessorDependencies {
  noteStore: LocalNoteStore;
  temporaryAudioStore: TemporaryAudioStore;
  transcriptionEngine: TranscriptionEngineAdapter;
  vad: VadAdapter;
}

export interface TranscriptionProcessor {
  enqueue(job: TranscriptionJob): Promise<void>;
  processNext(): Promise<TranscriptionJob | undefined>;
}

export function createTranscriptionProcessor(
  dependencies: TranscriptionProcessorDependencies
): TranscriptionProcessor {
  const queue: TranscriptionJob[] = [];

  async function saveJobWithStatus(
    job: TranscriptionJob,
    status: TranscriptionJobStatus,
    changes: Partial<TranscriptionJob> = {}
  ): Promise<TranscriptionJob> {
    const updatedJob = {
      ...job,
      ...changes,
      status
    };
    await dependencies.noteStore.saveJob(updatedJob);
    return updatedJob;
  }

  return {
    async enqueue(job) {
      queue.push(job);
      await dependencies.noteStore.saveJob(job);
    },

    async processNext() {
      const queuedJob = queue.shift();

      if (!queuedJob) {
        return undefined;
      }

      let job = await saveJobWithStatus(queuedJob, 'running_vad');
      const speechRanges = await dependencies.vad.detectSpeech(job.audioTempUri);

      if (speechRanges.length === 0) {
        job = await saveJobWithStatus(job, 'no_speech_detected', {
          vadSpeechRanges: speechRanges
        });
        await dependencies.temporaryAudioStore.deleteAudio(job.audioTempUri);
        return saveJobWithStatus(job, 'audio_deleted');
      }

      job = await saveJobWithStatus(job, 'transcribing', {
        vadSpeechRanges: speechRanges
      });

      try {
        const transcript = await dependencies.transcriptionEngine.transcribe(
          job.audioTempUri,
          speechRanges
        );
        const note = await dependencies.noteStore.getNote(job.noteId);
        const updatedNote = insertTranscript(note, job.insertionTarget.position, transcript);

        job = await saveJobWithStatus(job, 'transcript_inserted');
        await dependencies.noteStore.saveNote(updatedNote);
        job = await saveJobWithStatus(job, 'saved');
        await dependencies.temporaryAudioStore.deleteAudio(job.audioTempUri);
        return saveJobWithStatus(job, 'audio_deleted');
      } catch (error) {
        return saveJobWithStatus(job, 'failed', {
          errorMessage: error instanceof Error ? error.message : String(error)
        });
      }
    }
  };
}

function insertTranscript(note: LocalNote, requestedPosition: number, transcript: string): LocalNote {
  const position = clampInsertionPosition(requestedPosition, note.text.length);
  const nextText = `${note.text.slice(0, position)}${transcript}${note.text.slice(position)}`;

  return {
    ...note,
    text: nextText,
    updatedAt: new Date().toISOString()
  };
}

function clampInsertionPosition(requestedPosition: number, textLength: number): number {
  if (!Number.isFinite(requestedPosition)) {
    return textLength;
  }

  return Math.min(Math.max(Math.trunc(requestedPosition), 0), textLength);
}
