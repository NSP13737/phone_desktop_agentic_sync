import { isDeletableStatus, isEditableStatus } from './status';

test('only unsynced note statuses are editable', () => {
  expect(isEditableStatus('draft_local')).toBe(true);
  expect(isEditableStatus('queued')).toBe(true);
  expect(isEditableStatus('sync_failed')).toBe(true);
  expect(isEditableStatus('syncing')).toBe(false);
  expect(isEditableStatus('synced')).toBe(false);
});

test('only synced notes are locally deletable by cleanup', () => {
  expect(isDeletableStatus('synced')).toBe(true);
  expect(isDeletableStatus('queued')).toBe(false);
  expect(isDeletableStatus('sync_failed')).toBe(false);
});
