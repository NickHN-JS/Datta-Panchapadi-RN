import { BASE64_ASSETS } from './base64-assets';

/**
 * Resolves an image ID to a usable source for React Native's <Image>.
 * Base64 data URIs work directly as a `uri` source in RN.
 */
export function resolveImage(imageId: string): string {
    if (imageId.startsWith('data:')) {
        return imageId;
    }

    const assetsMap = BASE64_ASSETS as Record<string, string>;
    if (assetsMap[imageId]) {
        return assetsMap[imageId];
    }

    // No conventional asset path fallback in RN — bundled assets should be
    // registered in BASE64_ASSETS or referenced via a static require() map.
    return imageId;
}

export function getCoverUrl(_bookId: string, coverImageId?: string): string {
    if (!coverImageId) return '';
    return resolveImage(coverImageId);
}
