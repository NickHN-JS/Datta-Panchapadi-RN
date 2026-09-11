import type { RefObject } from 'react';
import type { View } from 'react-native';

/**
 * Module-level registry mapping tour target ids to the ref of whichever
 * mounted component currently claims that id. Plain mutable map (not React
 * state) since registration/unregistration on mount/unmount shouldn't itself
 * trigger a re-render anywhere — ProductTour reads it imperatively via
 * measureInWindow only when advancing to a step that needs it.
 */
const registry = new Map<string, RefObject<View | null>>();

export function registerTourTarget(id: string, ref: RefObject<View | null>) {
    registry.set(id, ref);
}

export function unregisterTourTarget(id: string, ref: RefObject<View | null>) {
    if (registry.get(id) === ref) {
        registry.delete(id);
    }
}

export function getTourTargetRef(id: string): RefObject<View | null> | undefined {
    return registry.get(id);
}
