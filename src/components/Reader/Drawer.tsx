import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Image, ScrollView, Modal, Dimensions } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, runOnJS, Easing } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReaderNav, useReaderSettings, useReaderUI, useSadhana } from '../../context/ReaderContext';
import { themeVars } from '../../theme/tokens';
import { resolveImage } from '../../lib/assets';
import { TourTarget } from './TourTarget';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const APP_VERSION: string = require('../../../package.json').version;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PANEL_WIDTH = Math.min(320, SCREEN_WIDTH * 0.85);
const ANIM_DURATION = 250;

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose }) => {
    const { theme } = useReaderSettings();
    const { books, activeBookId, setActiveBookId } = useReaderNav();
    const { setSadhanaOpen, setSearchOpen, setTourActive, setTourStep } = useReaderUI();
    const { sadhanaStreak } = useSadhana();

    const [isRendered, setIsRendered] = useState(isOpen);
    const translateX = useSharedValue(-PANEL_WIDTH);
    const backdropOpacity = useSharedValue(0);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            translateX.value = withTiming(0, { duration: ANIM_DURATION, easing: Easing.out(Easing.cubic) });
            backdropOpacity.value = withTiming(0.45, { duration: ANIM_DURATION });
        } else {
            translateX.value = withTiming(-PANEL_WIDTH, { duration: ANIM_DURATION, easing: Easing.in(Easing.cubic) });
            backdropOpacity.value = withTiming(0, { duration: ANIM_DURATION }, (finished) => {
                if (finished) runOnJS(setIsRendered)(false);
            });
        }
    }, [isOpen]);

    const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
    const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

    if (!isRendered) return null;

    const handleBookSelect = (bookId: string) => {
        setActiveBookId(bookId);
        onClose();
    };

    const handleHomeClick = () => {
        setActiveBookId(null);
        onClose();
    };

    const handleKshetraParichayClick = () => {
        setActiveBookId('kshetra-parichay');
        onClose();
    };

    const handleSadhanaClick = () => {
        setSadhanaOpen(true);
        onClose();
    };

    const handleSearchClick = () => {
        setSearchOpen(true);
        onClose();
    };

    const handleStartTourClick = () => {
        setTourStep(0);
        setTourActive(true);
        onClose();
    };

    return (
        <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
            <Animated.View style={[{ flex: 1, backgroundColor: '#000' }, backdropStyle]}>
                <Pressable style={{ flex: 1 }} onPress={onClose} />
            </Animated.View>

            <Animated.View
                style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, width: PANEL_WIDTH }, panelStyle]}
            >
                <SafeAreaView style={themeVars[theme]} className="flex-1 bg-surface" edges={['top', 'bottom']}>
                    <View className="p-6 border-b border-ink/10 items-center">
                        <Pressable
                            onPress={onClose}
                            accessibilityLabel="बंद करा"
                            className="absolute top-4 right-4 w-8 h-8 rounded-full items-center justify-center bg-black/5 active:bg-black/10"
                        >
                            <Text className="text-ink/70 text-sm">✕</Text>
                        </Pressable>

                        <View className="w-16 h-16 rounded-full border border-amber-600/30 overflow-hidden my-2">
                            <Image source={{ uri: resolveImage('datta-hq.jpg') }} className="w-full h-full" resizeMode="cover" />
                        </View>

                        <Text className="font-serif-black text-lg text-ink tracking-wide mt-2">श्रीदत्त पंचपदी</Text>
                        <Text className="text-[10px] font-sans-bold tracking-widest text-ink/50 uppercase mt-0.5">
                            श्री गुरुदेव दत्त
                        </Text>
                    </View>

                    <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ gap: 6 }}>
                        <DrawerItem label="मुख्य पान" active={activeBookId === null} onPress={handleHomeClick} icon="🏠" />
                        <DrawerItem label="क्षेत्र परिचय" active={activeBookId === 'kshetra-parichay'} onPress={handleKshetraParichayClick} icon="🛕" />

                        <View className="w-full h-px bg-ink/5 my-2" />
                        <TourTarget id="tour-drawer-books" style={{ gap: 6 }}>
                            <Text className="text-[10px] font-sans-bold uppercase tracking-wider opacity-40 px-5 py-1">
                                पंचपदी संग्रह (Read Scriptures)
                            </Text>

                            {books.filter(book => book.id !== 'kshetra-parichay').map(book => (
                                <DrawerItem
                                    key={book.id}
                                    label={book.metadata.title}
                                    active={activeBookId === book.id}
                                    onPress={() => handleBookSelect(book.id)}
                                    icon="📖"
                                />
                            ))}
                        </TourTarget>

                        <View className="w-full h-px bg-ink/5 my-2" />
                        <Text className="text-[10px] font-sans-bold uppercase tracking-wider opacity-40 px-5 py-1">
                            साधना आणि शोध (Worship)
                        </Text>

                        <TourTarget id="tour-drawer-sadhana">
                            <DrawerItem
                                label="माझी नित्य साधना"
                                onPress={handleSadhanaClick}
                                icon="🙏"
                                trailing={sadhanaStreak > 0 ? `🔥 ${sadhanaStreak}` : undefined}
                            />
                        </TourTarget>
                        <DrawerItem label="पंचपदीमध्ये शोधा" onPress={handleSearchClick} icon="🔍" />
                        <DrawerItem label="टूर पहा (Take a Tour)" onPress={handleStartTourClick} icon="❔" />
                    </ScrollView>

                    <View className="p-4 border-t border-ink/5 items-center">
                        <Text className="text-[10px] font-sans-bold opacity-40 tracking-wider">
                            V{APP_VERSION} • श्रीदत्त पंचपदी
                        </Text>
                    </View>
                </SafeAreaView>
            </Animated.View>
        </Modal>
    );
};

const DrawerItem: React.FC<{ label: string; active?: boolean; onPress: () => void; icon: string; trailing?: string }> = ({
    label, active, onPress, icon, trailing,
}) => (
    <Pressable
        onPress={onPress}
        className={`w-full flex-row items-center gap-3.5 px-5 py-3 rounded-full active:opacity-70 ${active ? 'bg-primary-container' : ''}`}
    >
        <Text className="text-base">{icon}</Text>
        <Text className={`flex-1 font-serif-bold text-sm ${active ? 'text-on-primary-container' : 'text-ink/80'}`}>
            {label}
        </Text>
        {trailing && (
            <Text className="text-[10px] font-sans-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                {trailing}
            </Text>
        )}
    </Pressable>
);
