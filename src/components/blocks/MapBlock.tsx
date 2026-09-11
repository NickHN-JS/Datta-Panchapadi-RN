import React from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import type { Block } from '../../types/book';

export const MapBlock: React.FC<{ block: Block }> = ({ block }) => {
    const { lat, lng, mapUrl } = block.metadata || {};
    if (lat === undefined || lng === undefined) return null;

    const targetUrl = mapUrl || `https://maps.google.com/?q=${lat},${lng}`;

    return (
        <Pressable
            onPress={() => Linking.openURL(targetUrl)}
            className="relative my-6 mx-2 rounded-3xl border border-ink/10 bg-surface-container h-32 items-center justify-center active:opacity-80"
        >
            <Text className="font-sans-bold text-ink/70 mb-2">{block.content || 'Map'}</Text>
            <View className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/95">
                <Text className="text-blue-700 text-xs font-sans-bold">Open in Maps {'↗'}</Text>
            </View>
        </Pressable>
    );
};
