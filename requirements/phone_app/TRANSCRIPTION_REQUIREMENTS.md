# Phone App Transcription Requirements

This document lays out the phone app transcription requirements in more detail than `TECHNICAL_FLOW.md`.

The current decision is to use a local, queued, VAD-first transcription pipeline. The goal is fast capture for personal thought recording, including recordings with long pauses, without uploading audio or blocking the user from recording more segments.

## Core Decision

For v1 planning, assume:

- transcription runs on the phone.
- audio is temporary working data, not durable user data.
- each stopped recording becomes a queued transcription job.
- transcription jobs are processed in the background.
- the microphone becomes available again immediately after the user stops recording.
- the transcription pipeline uses Voice Activity Detection before speech-to-text.
- Whisper-family local transcription remains the default candidate, with `whisper.cpp` as the leading underlying implementation candidate.
- Because the app framework is React Native with Expo, the first implementation spike should evaluate `whisper.rn` in an Expo development build.

The app framework decision lives in `APP_FRAMEWORK.md`. If the app framework changes later, the transcription implementation may use a wrapper around the same underlying approach.

## Why VAD Is Required

The app is meant for spoken thoughts. That means recordings may contain:

- long pauses while the user thinks.
- short false starts.
- breathing, room noise, or handling noise.
- segments where the user accidentally records no speech.

Whisper-family models can sometimes produce unwanted text during silence or non-speech. The app should avoid treating silence as audio that must be transcribed.

Voice Activity Detection, or VAD, should run before transcription. VAD identifies speech ranges inside an audio segment. The app should send speech ranges to the transcription engine and skip silence.

## Target Pipeline

1. User starts recording from the current note.
2. App records temporary audio.
3. User stops recording.
4. App creates a transcription job for that stopped segment.
5. App records the intended insertion target for the eventual transcript.
6. Microphone returns to ready state immediately.
7. Background transcription worker picks up the job.
8. VAD scans the audio segment for speech ranges.
9. If speech is detected, speech ranges are passed to the local transcription engine.
10. If no speech is detected, the job completes as `no_speech_detected` and inserts no text.
11. Successful transcript text is inserted into the note.
12. The note is saved locally.
13. Temporary audio for the segment is deleted.
14. The note enters or remains in the sync queue.

## Engine Recommendation

The leading underlying candidate is `whisper.cpp` with VAD enabled.

Reasons:

- It is a widely used local Whisper implementation.
- It supports mobile-oriented deployment paths.
- It supports quantized models, which matters for phone performance and app size.
- It includes VAD support, including Silero VAD.
- It keeps the local/offline transcription story simple.

For the v1 Expo app, evaluate `whisper.rn` first because it exposes Whisper and VAD functionality to React Native apps. Treat this as an implementation spike: a small proof that audio recorded on a real phone can be transcribed locally through the selected wrapper before the rest of the UI is built around it.

If `whisper.rn` cannot meet the project needs in an Expo development build, keep the underlying requirement as VAD-first local transcription and evaluate a different wrapper or native module path.

Alternative engines may be evaluated later, especially `sherpa-onnx`, but a replacement should beat the Whisper plus VAD approach on simplicity, credibility, local operation, mobile support, and implementation effort.

## Spike-First Requirement

The initial MVP implementation should start with a transcription spike before building the full app around the transcription layer.

The spike must verify:

- audio can be recorded on a physical phone from the Expo development build.
- the recorded audio can be saved as temporary working data.
- local VAD-first transcription can run through `whisper.rn` or the selected wrapper.
- the transcript can be inserted into local text state.
- temporary audio can be deleted after the transcript is safely available.

If the spike fails, choose and document a replacement transcription path before continuing with the full MVP implementation.

## VAD Requirements

The VAD stage should:

- run locally on the phone.
- detect speech ranges before transcription.
- skip silent ranges rather than sending them to the speech-to-text model.
- handle long pauses within one stopped recording segment.
- treat no-speech segments as normal outcomes, not user-visible errors.
- preserve enough timing information to keep transcript ordering stable.
- expose failure states separately from transcription failures.

The first implementation should prefer an existing VAD implementation bundled with, or commonly used alongside, the selected transcription engine. The app should not invent its own VAD algorithm.

## No-Speech Behavior

If VAD finds no speech in a queued segment:

- no transcript text should be inserted.
- the note should not be marked as failed.
- the temporary audio should be deleted after the no-speech outcome is safely recorded.
- the app may quietly ignore the segment in the main note UI.
- diagnostic metadata may record that no speech was detected.

A no-speech segment is different from a transcription failure. It means the app successfully processed the segment and decided there was nothing useful to insert.

## Whisper Hallucination Mitigation

The transcription engine should be configured to reduce silence-related hallucinations.

Requirements:

- Run VAD before Whisper-family transcription.
- Prefer short segment transcription over long continuous-file transcription.
- Use no-speech and confidence thresholds where supported by the selected engine.
- Avoid carrying too much previous transcript context into unrelated segments if it causes repetition or invented text.
- Treat low-confidence or empty output conservatively.
- Do not insert filler text just because a segment existed.

The app should favor missing a silent segment over inserting invented text.

## Queue Requirements

The transcription queue should support repeated recording without waiting for local processing to finish.

Requirements:

- Each stopped recording creates one job.
- Jobs belong to a note.
- Jobs record their intended insertion target.
- Jobs should process in capture order for each note.
- v1 should process one transcription job at a time unless testing shows this is too slow.
- New recordings can be queued while earlier jobs are pending.
- Queue state should survive normal app backgrounding.
- Temporary audio should remain available only while needed for queued processing, retry, or recovery.

Suggested job statuses:

- `queued`
- `running_vad`
- `no_speech_detected`
- `transcribing`
- `transcript_inserted`
- `saved`
- `audio_deleted`
- `failed`

Suggested job fields:

- `id`
- `note_id`
- `created_at`
- `capture_sequence`
- `audio_temp_uri`
- `status`
- `insertion_target`
- `vad_engine_id`
- `vad_speech_ranges`, optional
- `transcription_engine_id`
- `transcription_model_id`
- `language`, optional
- `error_message`, optional

## Text Insertion Requirements

When transcription completes:

- insert text at the segment's captured cursor position when that position remains valid.
- replace the captured selection range when the range remains valid.
- append to the end if the original insertion target is no longer reliable.
- preserve capture order for multiple queued segments from the same note.
- never overwrite manual edits unless the insertion target is clearly valid.

Delayed transcription should prefer data safety over perfect cursor reconstruction.

## UI Requirements

The UI should not expose the full technical pipeline, but it should make pending work understandable.

Requirements:

- The microphone should be ready for another recording after the previous segment is queued.
- The note can show subtle pending transcript state while jobs are processing.
- No-speech segments should not require a disruptive alert.
- Failed transcription should be visible enough that the user understands why expected text did not appear.
- The user should be able to continue editing while transcription jobs are pending.

Possible UI labels:

- `Processing...`
- `Still transcribing...`
- `Could not transcribe this segment`

The exact UI treatment belongs in `UI_DESIGN_FLOW.md` if it becomes detailed.

## Audio Retention Requirements

Audio remains temporary working data.

Requirements:

- Store audio only long enough to support VAD, transcription, retry, or crash recovery.
- Delete audio after transcript insertion and local note save.
- Delete audio after a completed no-speech outcome.
- Do not include audio in sync payloads.
- Do not expose audio as a saved note attachment in v1.

Crash recovery policy:

- The app should persist the transcription job and temporary audio URI before processing starts.
- On app startup, queued or interrupted jobs may retry if their temporary audio still exists.
- Temporary audio should be deleted after success, after a completed no-speech outcome, or after the app records that the job is unrecoverable.
- If the temporary audio is missing or unreadable, the app should mark the segment failed and explain that it could not be converted.
- Do not keep temporary audio after transcription solely for review, sync, or archival purposes.

## Failure Handling

Important failure cases:

- recording fails to produce an audio file.
- VAD fails.
- transcription engine fails.
- transcription job is interrupted by app backgrounding or app close.
- temporary audio file is missing before processing.
- local note save fails after transcription.
- insertion target is no longer valid.

User-facing principles:

- Existing note text must remain safe.
- A failed segment must not block future recording.
- A no-speech segment should not look like an error.
- If audio still exists after failure, the app may retry or offer recovery.
- If audio cannot be recovered, the app should explain that this segment could not be converted.

## Source References

Primary candidates to evaluate during implementation:

- `whisper.cpp`: https://github.com/ggml-org/whisper.cpp
- `whisper.rn`: https://github.com/mybigday/whisper.rn
- `sherpa-onnx`: https://github.com/k2-fsa/sherpa-onnx

These are references for implementation research, not permanent product dependencies until an implementation plan selects a framework and integration path.

## Open Questions

- Which exact Whisper model size should be the v1 default?
- Should v1 be English-only or multilingual?
- How aggressive should VAD be about trimming pauses?
- Should the app show pending placeholders inline, or only a subtle processing indicator?
- Should users have a setting to disable VAD if it cuts off quiet speech?
- What test audio set should be used to validate silence, pauses, quiet speech, and noisy rooms?

## Current Planning Assumption

For v1 planning, use a VAD-first, queued, segment-based local transcription pipeline. Prefer `whisper.cpp` with Silero VAD as the underlying approach, and evaluate `whisper.rn` first as the React Native/Expo integration path unless implementation research shows a materially simpler or more reliable option.
