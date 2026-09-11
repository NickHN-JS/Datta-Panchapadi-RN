import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { useReaderNav, useReaderSettings } from '../../context/ReaderContext';
import { TourTarget } from './TourTarget';

interface UtilityBarProps {
    readerPages?: any[];
    currentPageIndex?: number;
    onPrev?: () => void;
    onNext?: () => void;
    onGoToPage?: (page: number) => void;
}

export const UtilityBar: React.FC<UtilityBarProps> = ({
    readerPages, currentPageIndex, onPrev, onNext, onGoToPage,
}) => {
    const { theme, setTheme, fontSize, increaseFontSize, decreaseFontSize, resetFontSize } = useReaderSettings();
    const { activeChapterId, setActiveChapterId, activeBookId, activeBook } = useReaderNav();

    const [pageJumpOpen, setPageJumpOpen] = useState(false);
    const [pageJumpValue, setPageJumpValue] = useState('');
    useEffect(() => {
        setPageJumpOpen(false);
        setPageJumpValue('');
    }, [activeBookId]);

    if (!activeBookId || !activeBook) return null;

    const firstChapter = activeBook.chapters[0];
    const indexChapterIdx = activeBook.chapters.findIndex(ch => ch.slug === 'index');
    const displayChapters = indexChapterIdx !== -1
        ? [firstChapter, ...activeBook.chapters.slice(indexChapterIdx)]
        : activeBook.chapters;

    const isPageLevel = Boolean(readerPages && readerPages.length > 0 && currentPageIndex !== undefined);
    const safeIndex = isPageLevel
        ? (currentPageIndex ?? 0)
        : Math.max(0, displayChapters.findIndex(ch => ch.id === activeChapterId));

    const totalCount = isPageLevel ? readerPages!.length : displayChapters.length;

    const hasPrev = safeIndex > 0;
    const hasNext = safeIndex < totalCount - 1;

    const goToPrev = () => {
        if (onPrev) return onPrev();
        if (safeIndex > 0) setActiveChapterId(displayChapters[safeIndex - 1].id);
    };

    const goToNext = () => {
        if (onNext) return onNext();
        if (safeIndex < displayChapters.length - 1) setActiveChapterId(displayChapters[safeIndex + 1].id);
    };

    const goToPage = (page: number) => {
        if (!Number.isFinite(page)) return;
        const clamped = Math.min(Math.max(1, Math.trunc(page)), totalCount);
        if (onGoToPage) {
            onGoToPage(clamped);
        } else if (isPageLevel) {
            setActiveChapterId(readerPages![clamped - 1].id);
        } else {
            setActiveChapterId(displayChapters[clamped - 1].id);
        }
    };

    const submitPageJump = () => {
        const page = parseInt(pageJumpValue, 10);
        if (Number.isFinite(page)) goToPage(page);
        setPageJumpOpen(false);
        setPageJumpValue('');
    };

    const themeOptions: { key: typeof theme; icon: string }[] = [
        { key: 'light', icon: '☀️' },
        { key: 'dark', icon: '🌙' },
        { key: 'papyrus', icon: '📜' },
    ];

    return (
        <TourTarget id="tour-utility-bar">
        <View className="px-4 pt-3 pb-4 border-t border-ink/10 rounded-t-[28px] bg-surface" style={{ opacity: 0.97 }}>
            <View className="w-12 h-1 bg-ink/15 rounded-full self-center mb-3" />

            <View className="gap-3.5">
                <View className="flex-row items-center justify-between w-full">
                    <Pressable
                        onPress={goToPrev}
                        disabled={!hasPrev}
                        className="px-5 py-2.5 rounded-full border border-ink/10 flex-row items-center gap-2 active:opacity-60"
                        style={{ opacity: hasPrev ? 1 : 0.3 }}
                    >
                        <Text className="font-sans-bold text-ink text-[13.5px]">← मागे</Text>
                    </Pressable>

                    <Pressable
                        onPress={() => {
                            setPageJumpValue(String(safeIndex + 1));
                            setPageJumpOpen(o => !o);
                        }}
                        className="bg-primary-container px-4 py-1.5 rounded-full active:opacity-80"
                    >
                        <Text className="font-sans-bold text-on-primary-container text-xs">
                            {safeIndex + 1} / {totalCount}
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={goToNext}
                        disabled={!hasNext}
                        className="px-5 py-2.5 rounded-full border border-ink/10 flex-row items-center gap-2 active:opacity-60"
                        style={{ opacity: hasNext ? 1 : 0.3 }}
                    >
                        <Text className="font-sans-bold text-ink text-[13.5px]">पुढे →</Text>
                    </Pressable>
                </View>

                {pageJumpOpen && (
                    <View className="flex-row items-center gap-2 w-full">
                        <TextInput
                            value={pageJumpValue}
                            onChangeText={setPageJumpValue}
                            onSubmitEditing={submitPageJump}
                            keyboardType="numeric"
                            autoFocus
                            placeholder={`१ - ${totalCount}`}
                            className="flex-1 px-4 py-2 rounded-full border border-ink/10 font-sans-bold text-center text-ink text-[13.5px]"
                        />
                        <Pressable onPress={submitPageJump} className="px-5 py-2 rounded-full bg-primary active:opacity-80">
                            <Text className="text-on-primary font-sans-bold text-[13.5px]">जा</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => { setPageJumpOpen(false); setPageJumpValue(''); }}
                            className="px-4 py-2 rounded-full border border-ink/10 active:opacity-60"
                        >
                            <Text className="font-sans-bold text-ink text-[13.5px]">रद्द</Text>
                        </Pressable>
                    </View>
                )}

                <View className="w-full h-px bg-ink/10" />

                <View className="flex-row flex-wrap items-center justify-between gap-3 w-full">
                    <View className="flex-row items-center bg-black/5 p-0.5 rounded-full border border-ink/10">
                        {themeOptions.map(opt => (
                            <Pressable
                                key={opt.key}
                                onPress={() => setTheme(opt.key)}
                                className={`px-3 py-1.5 rounded-full ${theme === opt.key ? 'bg-primary' : ''}`}
                            >
                                <Text className="text-xs">{opt.icon}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <View className="flex-row items-center bg-black/5 rounded-full border border-ink/10">
                        <Pressable
                            onPress={decreaseFontSize}
                            disabled={fontSize <= 16}
                            className="w-10 h-7 items-center justify-center rounded-l-full active:opacity-60"
                            style={{ opacity: fontSize <= 16 ? 0.3 : 1 }}
                        >
                            <Text className="font-sans-bold text-ink text-sm">A-</Text>
                        </Pressable>
                        <View className="w-px h-4 bg-ink/10" />
                        <Pressable onPress={resetFontSize} className="px-3.5 h-7 items-center justify-center active:opacity-60">
                            <Text className="font-sans-bold text-primary text-xs">{fontSize}px</Text>
                        </Pressable>
                        <View className="w-px h-4 bg-ink/10" />
                        <Pressable onPress={increaseFontSize} className="w-10 h-7 items-center justify-center rounded-r-full active:opacity-60">
                            <Text className="font-sans-bold text-ink text-base">A+</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </View>
        </TourTarget>
    );
};
