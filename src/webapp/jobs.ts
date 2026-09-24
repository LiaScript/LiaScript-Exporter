'use strict'

/**
 * A local stand-in for the export service's job queue.
 *
 * The browser export runs to completion in the tab, but the flow is kept
 * identical — submit, confirmation, status page, download — so one UI serves
 * both. Only the record's home differs: IndexedDB rather than `/api/job/:id`.
 *
 * IndexedDB and not `localStorage`: the result has to survive the full page
 * load to `status.html`, and `localStorage` is string-only and caps around
 * 5 MB, while a `web` export alone is 6.4 MB.
 */

import { Course } from './index'
import { PrintJob } from './pdf'

const DB_NAME = 'liaex'
const DB_VERSION = 1
const STORE = 'jobs'

/** How long a finished export is kept before being cleaned up. */
const RETENTION_MS = 24 * 60 * 60 * 1000

export interface Job {
  id: string
  /** The service's states minus `processing`: a job is `queued` until done. */
  status: 'queued' | 'completed' | 'failed'
  /** Format actually exported. */
  format: string
  /** The export's input; dropped once the job finishes, it is large. */
  course?: Course
  /** Export options, resolved from the preset and the form. */
  options: Record<string, any>
  /** What the running export is doing, for the status page. */
  progress?: string
  /** Preset the user chose, when they chose one. */
  preset?: string
  /** Number of files the user supplied. */
  fileCount: number
  createdAt: number
  completedAt?: number
  error?: string
  /** The finished export; present once completed. */
  filename?: string
  bytes?: Uint8Array
  /** Set instead of `bytes` for `pdf`; its presence marks a job as printed. */
  print?: PrintJob
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Runs one transaction and resolves when it commits. */
async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await open()

  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode)
    const request = run(transaction.objectStore(STORE))

    // Resolve on the transaction, not the request: a write is durable only once
    // it commits, and status.html reads it from a fresh page.
    transaction.oncomplete = () => {
      db.close()
      resolve(request.result)
    }
    transaction.onerror = () => {
      db.close()
      reject(transaction.error)
    }
  })
}

/** Records an export waiting to be run, and returns its id. */
export async function start(details: {
  format: string
  preset?: string
  fileCount: number
  course: Course
  options: Record<string, any>
}): Promise<string> {
  const id = `local-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`

  await withStore('readwrite', (store) =>
    store.put({
      id,
      status: 'queued',
      createdAt: Date.now(),
      ...details,
    } as Job),
  )

  void cleanup()

  return id
}

/** Merges `changes` into a job, doing nothing when it is already gone. */
async function update(id: string, changes: Partial<Job>): Promise<void> {
  const job = await get(id)

  if (!job) return

  await withStore('readwrite', (store) => store.put({ ...job, ...changes }))
}

/**
 * Shared by `run` and {@link unfinished}, so a job cannot block submission
 * while refusing to run.
 */
export function isUnfinished(job: Job): boolean {
  return job.status === 'queued'
}

/** Records how far a running export has got. */
export async function progress(id: string, message: string): Promise<void> {
  await update(id, { progress: message })
}

/**
 * Marks a job over. The course was only an input, and keeping it would double
 * what a finished job costs.
 */
async function finish(id: string, changes: Partial<Job>): Promise<void> {
  await update(id, {
    completedAt: Date.now(),
    course: undefined,
    progress: undefined,
    ...changes,
  })
}

/** Marks a job finished, storing the bytes to download or the print job. */
export async function complete(
  id: string,
  result: Pick<Job, 'bytes' | 'filename' | 'print'>,
): Promise<void> {
  await finish(id, { status: 'completed', ...result })
}

/** Marks a job failed, recording why. */
export async function fail(id: string, error: string): Promise<void> {
  await finish(id, { status: 'failed', error })
}

/** Looks up one job, or undefined when it is unknown or expired. */
export async function get(id: string): Promise<Job | undefined> {
  return withStore('readonly', (store) => store.get(id) as IDBRequest<Job>)
}

/**
 * The oldest unfinished job. Expired jobs are cleared first, or a stranded one
 * would block submission for good.
 */
export async function unfinished(): Promise<Job | undefined> {
  await cleanup()

  const all = await withStore(
    'readonly',
    (store) => store.getAll() as IDBRequest<Job[]>,
  )

  return all
    .filter(isUnfinished)
    .sort((a, b) => a.createdAt - b.createdAt)[0]
}

/** Deletes a job. */
export async function remove(id: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(id))
}

/**
 * Drops jobs older than {@link RETENTION_MS}. Exports are megabytes each, and
 * keeping them all would get the whole database evicted, recent ones included.
 */
async function cleanup(): Promise<void> {
  try {
    const all = await withStore(
      'readonly',
      (store) => store.getAll() as IDBRequest<Job[]>,
    )
    const cutoff = Date.now() - RETENTION_MS
    const stale = all.filter((job) => job.createdAt < cutoff)

    for (const job of stale) {
      await remove(job.id)
    }
  } catch (_) {
    // Cleanup is opportunistic; a failure here must not break an export.
  }
}
