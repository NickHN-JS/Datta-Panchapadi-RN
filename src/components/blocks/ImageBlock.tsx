import React from 'react';
import { View, Image, Text } from 'react-native';
import { resolveImage } from '../../lib/assets';
import type { Block } from '../../types/book';

export const ImageBlock: React.FC<{ block: Block }> = ({ block }) => {
    const { imageId, caption } = block.metadata || {};

    if (!imageId) return null;

    const src = resolveImage(imageId);

    return (
        <View className="my-12 items-center">
            <Image
                source={{ uri: src }}
                accessibilityLabel={caption || 'Book illustration'}
                resizeMode="contain"
                className="w-full rounded-sm"
                style={{ height: 320 }}
            />
            {caption && (
                <Text className="mt-4 text-sm text-gray-500 font-sans tracking-wide">
                    {caption}
                </Text>
            )}
        </View>
    );
};
