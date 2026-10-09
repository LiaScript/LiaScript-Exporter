'use strict'

import { unzipSync } from 'fflate'
import { MemoryFS } from '../fs/memory'
import { ExportError } from './errors'
import { requiredBundles } from './bundles'

import commonBundle from 'url:./generated/assets/common.zip'
import webBundle from 'url:./generated/assets/web.zip'
import xapiBundle from 'url:./generated/assets/xapi.zip'
import scorm12Bundle from 'url:./generated/assets/scorm1.2.zip'
import scorm2004Bundle from 'url:./generated/assets/scorm2004.zip'
import scorm12SuspendBundle from 'url:./generated/assets/scorm1.2-suspend.zip'
import scorm2004SuspendBundle from 'url:./generated/assets/scorm2004-suspend.zip'
import indexeddbBundle from 'url:./generated/assets/indexeddb.zip'
import scormSchemas from 'url:./generated/assets/scorm-schemas.zip'

const BUNDLES: Record<string, string> = {
  common: commonBundle,
  web: webBundle,
  xapi: xapiBundle,
  'scorm1.2': scorm12Bundle,
  'scorm2004': scorm2004Bundle,
  'scorm1.2-suspend': scorm12SuspendBundle,
  'scorm2004-suspend': scorm2004SuspendBundle,
  indexeddb: indexeddbBundle,
  'scorm-schemas': scormSchemas,
}

/**
 * Where the SCORM packager's own schemas are seeded — it copies these XSD/DTD
 * files into every package, locating them through its `assetRoot` (its install
 * directory under Node). See `scormAdapter`.
 */
export const SCORM_SCHEMA_ROOT = '/assets/scorm-packager'

/**
 * Fetches and seeds the asset bundles a format needs.
 *
 * Assets ship as one zip per bundle rather than loose files: `web` alone is 612
 * files, and per-request overhead would dominate.
 */
export class AssetLoader {
  /**
   * Decoded bundles, shared by every instance. Each export gets a fresh
   * `MemoryFS`, so what is worth caching is the bytes — a multi-megabyte
   * download and an unzip each — not a per-instance "seeded" flag.
   */
  private static cache = new Map<string, Record<string, Uint8Array>>()

  constructor(private fs: MemoryFS) {}

  /** Bundles `format` needs, honouring its IndexedDB and suspend variants. */
  required(format: string, options: Record<string, any> = {}): string[] {
    const required = requiredBundles(format, options)

    if (!required) {
      throw new ExportError(
        'errors.assets.unsupportedFormat',
        '"{format}" cannot be exported in the browser',
        { format },
      )
    }

    return required
  }

  /**
   * Ensures every bundle `format` needs is in the store. `onProgress` reports
   * each bundle as it starts, so the UI is not silent through a multi-megabyte
   * download.
   */
  async ensure(
    format: string,
    onProgress?: (bundle: string, index: number, total: number) => void,
    options: Record<string, any> = {},
  ): Promise<void> {
    const required = this.required(format, options)

    for (const [index, bundle] of required.entries()) {
      onProgress?.(bundle, index, required.length)
      await this.seedBundle(bundle)
    }
  }

  private async seedBundle(bundle: string): Promise<void> {
    const cached = AssetLoader.cache.get(bundle)

    if (cached) {
      this.fs.seed(cached)
      return
    }

    const url = BUNDLES[bundle]
    const response = await fetch(url)

    if (!response.ok) {
      throw new ExportError(
        'errors.assets.loadFailed',
        'could not load the "{bundle}" assets ({status} from {url})',
        { bundle, status: response.status, url },
      )
    }

    const entries = unzipSync(new Uint8Array(await response.arrayBuffer()))

    // Zip entries are relative to the bundle root, while `seed` places them
    // below `assetRoot()` — the directory *containing* `assets` — and the
    // exporters ask for `./assets/<bundle>/...`, so that segment is part of the
    // key. The packager's schemas are a separate library's files and sit at
    // their own root instead.
    const prefix =
      bundle === 'scorm-schemas' ? 'scorm-packager/schemas' : `assets/${bundle}`

    const seed: Record<string, Uint8Array> = {}

    for (const [name, bytes] of Object.entries(entries)) {
      // Directory entries have a trailing slash and no content.
      if (name.endsWith('/')) continue

      seed[`${prefix}/${name}`] = bytes
    }

    AssetLoader.cache.set(bundle, seed)
    this.fs.seed(seed)
  }
}
