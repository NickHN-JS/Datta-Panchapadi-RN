import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, Dimensions } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, runOnJS, Easing } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReaderSettings } from '../../context/ReaderContext';
import { themeVars } from '../../theme/tokens';
import { TourTarget } from './TourTarget';

export interface IndexEntry {
    id: string;
    title: string;
}

interface ChapterIndexSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    bookTitle: string;
    items: IndexEntry[];
    activeItemId?: string;
    onSelect: (id: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PANEL_WIDTH = Math.min(340, SCREEN_WIDTH * 0.85);
const ANIM_DURATION = 250;

export const ChapterIndexSidebar: React.FC<ChapterIndexSidebarProps> = ({
    isOpen, onClose, bookTitle, items, activeItemId, onSelect,
}) => {
    const { theme } = useReaderSettings();

    const [isRendered, setIsRendered] = useState(isOpen);
    const translateX = useSharedValue(PANEL_WIDTH);
    const backdropOpacity = useSharedValue(0);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            translateX.value = withTiming(0, { duration: ANIM_DURATION, easing: Easing.out(Easing.cubic) });
            backdropOpacity.value = withTiming(0.45, { duration: ANIM_DURATION });
        } else {
            translateX.value = withTiming(PANEL_WIDTH, { duration: ANIM_DURATION, easing: Easing.in(Easing.cubic) });
            backdropOpacity.value = withTiming(0, { duration: ANIM_DURATION }, (finished) => {
                if (finished) runOnJS(setIsRendered)(false);
            });
        }
    }, [isOpen]);

    const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
    const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

    if (!isRendered) return null;

    return (
        <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
            <Animated.View style={[{ flex: 1, backgroundColor: '#000' }, backdropStyle]}>
                <Pressable style={{ flex: 1 }} onPress={onClose} />
            </Animated.View>

            <Animated.View
                style={[{ position: 'absolute', top: 0, bottom: 0, right: 0, width: PANEL_WIDTH }, panelStyle]}
            >
                <TourTarget id="tour-chapter-index-panel" style={{ flex: 1 }}>
                <SafeAreaView style={themeVars[theme]} className="flex-1 bg-surface" edges={['top', 'bottom']}>
                    <View className="p-5 pb-4 border-b border-ink/10 flex-row items-center justify-between">
                        <View className="flex-1 mr-3">
                            <Text className="text-[10px] font-sans-bold uppercase tracking-widest text-ink/50">
                                अनुक्रमणिका
                            </Text>
                            <Text className="font-serif-black text-base text-ink tracking-wide" numberOfLines={1}>
                                {bookTitle}
                            </Text>
                        </View>
                        <Pressable
                            onPress={onClose}
                            accessibilityLabel="बंद करा"
                            className="w-8 h-8 rounded-full items-center justify-center bg-black/5 active:bg-black/10"
                        >
                            <Text className="text-ink/70 text-sm">✕</Text>
                        </Pressable>
                    </View>

                    <ScrollView className="flex-1 px-3 py-4" contentContainerStyle={{ gap: 2 }}>
                        {items.map((item, idx) => {
                            const isActive = item.id === activeItemId;
                            return (
                                <Pressable
                                    key={item.id}
                                    onPress={() => onSelect(item.id)}
                                    className={`w-full flex-row items-center gap-3 px-4 py-2.5 rounded-2xl active:opacity-70 ${isActive ? 'bg-primary-container' : ''}`}
                                >
                                    <Text className="text-[10px] font-sans-bold opacity-40 w-6 text-right">
                                        {idx + 1}
                                    </Text>
                                    <Text
                                        className={`flex-1 font-serif-bold text-sm ${isActive ? 'text-on-primary-container' : 'text-ink/80'}`}
                                        numberOfLines={1}
                                    >
                                        {item.title}
                                    </Text>
                                </Pressable>
                            );
                        })}

                        {items.length === 0 && (
                            <Text className="text-center text-xs text-ink/50 mt-8">
                                या पुस्तकासाठी अनुक्रमणिका उपलब्ध नाही.
                            </Text>
                        )}
                    </ScrollView>
                </SafeAreaView>
                </TourTarget>
            </Animated.View>
        </Modal>
    );
};
