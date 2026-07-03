# Phone Transcription Spike Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first phone-app pipeline slice under `phone_app/`: a queued, VAD-first transcription service that inserts transcript text into local note state and deletes temporary audio after a safe outcome.

**Architecture:** Create an Expo-oriented TypeScript app skeleton, with the pipeline logic isolated from React Native UI and native modules. The transcription processor depends on small interfaces for VAD, transcription, note storage, and temporary audio cleanup so `whisper.rn` can replace the fake adapter later.

**Tech Stack:** React Native with Expo project shape, TypeScript, Vitest for pure service tests.

---

### Task 1: Project Skeleton

**Files:**
- Create: `phone_app/package.json`
- Create: `phone_app/tsconfig.json`
- Create: `phone_app/App.tsx`
- Create: `phone_app/src/transcription/types.ts`

- [ ] **Step 1: Add project metadata and scripts**

Create `phone_app/package.json` with Expo, React Native, TypeScript, and Vitest dependencies. Add `test` and `typecheck` scripts.

- [ ] **Step 2: Add TypeScript config**

Create `phone_app/tsconfig.json` using Expo defaults and include `src/**/*.ts`, `src/**/*.tsx`, and `App.tsx`.

- [ ] **Step 3: Add minimal app entry**

Create `phone_app/App.tsx` with a simple React Native screen that shows this is the transcription spike shell.

- [ ] **Step 4: Add transcription domain types**

Create `phone_app/src/transcription/types.ts` with note, job, status, VAD, transcription, note store, and temp audio service interfaces.

### Task 2: Failing Pipeline Tests

**Files:**
- Create: `phone_app/src/transcription/transcriptionProcessor.test.ts`

- [ ] **Step 1: Write failing tests**

Add Vitest tests proving:
- speech segments are transcribed, inserted into the note, saved, and then temporary audio is deleted.
- no-speech segments insert no text, save the no-speech outcome, and delete temporary audio.
- transcription failures keep temporary audio available for retry.

- [ ] **Step 2: Run tests to verify red**

Run `npm test -- --run src/transcription/transcriptionProcessor.test.ts` in `phone_app/`. Expected: fail because `createTranscriptionProcessor` does not exist yet.

### Task 3: Minimal Processor Implementation

**Files:**
- Create: `phone_app/src/transcription/transcriptionProcessor.ts`
- Modify: `phone_app/src/transcription/types.ts`

- [ ] **Step 1: Implement processor**

Create `createTranscriptionProcessor(dependencies)` with `processNext()` and `enqueue(job)` methods. Process one queued job at a time. Run VAD first; if speech ranges are empty, mark the job `no_speech_detected`, save, and delete audio. If speech exists, transcribe ranges, insert text at the captured target, save, mark `audio_deleted`, and delete audio. If transcription fails, mark `failed` and leave audio in place.

- [ ] **Step 2: Run tests to verify green**

Run `npm test -- --run src/transcription/transcriptionProcessor.test.ts` in `phone_app/`. Expected: all processor tests pass.

### Task 4: Verification

**Files:**
- No new files.

- [ ] **Step 1: Typecheck**

Run `npm run typecheck` in `phone_app/`. Expected: no TypeScript errors.

- [ ] **Step 2: Run all tests**

Run `npm test -- --run` in `phone_app/`. Expected: all tests pass.
