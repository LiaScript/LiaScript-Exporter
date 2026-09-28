'use strict'

/**
 * Traversal helpers for a `project` collection.
 *
 * Split out of [project.ts](./project.ts) so the exporter can drive the
 * fetch-one-course-at-a-time loop without importing that module, which pulls in
 * Puppeteer, the Android toolchain and `child_process` — none of which a
 * browser bundle can resolve. These two functions are pure structure walking
 * and carry no dependencies at all.
 */

/**
 * Returns the URL of the next course that has not been fetched yet, or `null`
 * when the collection is fully populated.
 */
export function getNext(collection: any): string | null {
  if (collection['collection']) {
    collection = collection['collection']
  }

  if (collection['url'] && collection['data'] === undefined) {
    return collection['url']
  } else {
    for (let i = 0; i < collection.length; i++) {
      let course = collection[i]

      if (course.collection) {
        let url = getNext(course)

        if (url) {
          return url
        }
      } else if (course.url && course.data === undefined) {
        return course.url
      }
    }
  }
  return null
}

/** Stores a fetched course against the first slot still awaiting data. */
export function storeNext(collection: any, data: any) {
  if (collection['collection']) {
    collection = collection['collection']
  }

  for (let i = 0; i < collection.length; i++) {
    if (collection[i].collection) {
      for (let j = 0; j < collection[i].collection.length; j++) {
        if (
          collection[i].collection[j].url &&
          collection[i].collection[j].data === undefined
        ) {
          collection[i].collection[j].data = data
          return
        }
      }
    } else if (collection[i].url && collection[i].data === undefined) {
      collection[i].data = data
      return
    }
  }

  return
}
