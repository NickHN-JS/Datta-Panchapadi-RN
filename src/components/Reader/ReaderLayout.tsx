import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReaderNav, useReaderSettings, useReaderUI } from '../../context/ReaderContext';
import { Bookshelf } from './Bookshelf';
import { BookReader } from './BookReader';
import { Drawer } from './Drawer';
import { SearchModal } from './SearchModal';
import { SadhanaModal } from './SadhanaModal';
import { TourTarget } from './TourTarget';
import { ProductTour } from './ProductTour';
import { themeVars } from '../../theme/tokens';

const HeaderButton: React.FC<{ label: string; onPress: () => void; children: React.ReactNode }> = ({ label, onPress, children }) => (
    <Pressable
        onPress={onPress}
        accessibilityLabel={label}
        className="w-10 h-10 items-center justify-center rounded-full active:bg-black/5"
    >
        <Text className="text-ink/80 text-lg">{children}</Text>
    </Pressable>
);

export const ReaderLayout: React.FC = () => {
    const { theme } = useReaderSettings();
    const { activeBookId, activeBook } = useReaderNav();
    const { isDrawerOpen, setDrawerOpen, setSearchOpen } = useReaderUI();

    return (
        <>
            {!activeBookId || !activeBook ? (
                <SafeAreaView style={themeVars[theme]} className="flex-1 bg-background" edges={['top', 'left', 'right']}>
                    <View className="w-full border-b border-ink/10 flex-row items-center justify-between px-4 pb-3">
                        <TourTarget id="tour-menu-button">
                            <HeaderButton label="मेनू (Menu)" onPress={() => setDrawerOpen(true)}>☰</HeaderButton>
                        </TourTarget>
                        <Text className="font-serif-black text-base text-ink tracking-wide">श्रीदत्त पंचपदी</Text>
                        <TourTarget id="tour-search-button">
                            <HeaderButton label="शोधा (Search)" onPress={() => setSearchOpen(true)}>🔍</HeaderButton>
                        </TourTarget>
                    </View>

                    <View className="flex-1 items-center justify-center">
                        <Bookshelf />
                    </View>
                </SafeAreaView>
            ) : (
                <BookReader activeBook={activeBook} />
            )}
            <Drawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} />
            <SearchModal />
            <SadhanaModal />
            <ProductTour />
        </>
    );
};
