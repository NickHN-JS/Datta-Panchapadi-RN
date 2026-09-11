import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { Carousel, Pagination } from 'react-native-reanimated-carousel';
import { useReaderNav, useReaderSettings, useSadhana } from '../../context/ReaderContext';
import { ChapterView } from './ChapterView';
import { themeInkHex, themePrimaryHex } from '../../theme/tokens';
import type { Chapter } from '../../types/book';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_WIDTH = Math.min(SCREEN_WIDTH - 24, 420);
const CAROUSEL_HEIGHT = 520;

export const Bookshelf: React.FC = () => {
    const { books } = useReaderNav();
    const { theme } = useReaderSettings();
    const { sadhanaStreak } = useSadhana();
    const progress = useSharedValue(0);

    const targetBook = books.find(b => b.id === 'sampurna') || books[0];
    const indexChapterIdx = targetBook.chapters.findIndex(ch => ch.slug === 'index');

    const homepageTitleChapter: Chapter = {
        id: 'homepage-cover',
        title: 'पंचपदी',
        slug: 'homepage-cover',
        blocks: [],
    };

    const prefaceChapters: Chapter[] = indexChapterIdx !== -1
        ? [homepageTitleChapter, ...targetBook.chapters.slice(1, indexChapterIdx)]
        : [homepageTitleChapter];

    return (
        <View className="w-full py-4 px-3 items-center">
            <View className="items-center mb-4">
                <View className="px-3 py-0.5 bg-primary/10 rounded-full mb-1">
                    <Text className="text-primary font-sans-bold text-[11px] tracking-widest uppercase">
                        श्री गुरुदेव दत्त
                    </Text>
                </View>

                <Text className="font-slab text-primary tracking-wide mb-1" style={{ fontSize: 30 }}>
                    श्रीदत्त पंचपदी
                </Text>

                <Text className="text-[11px] text-ink/60 font-sans tracking-wider uppercase mb-2">
                    नित्य उपासना आणि भक्ती पंचपदी संग्रह
                </Text>

                {sadhanaStreak > 0 && (
                    <View className="flex-row items-center gap-1 px-3 py-0.5 bg-primary/10 rounded-full">
                        <Text className="text-primary font-sans-bold text-xs">
                            🔥 {sadhanaStreak} दिवस सतत नामस्मरण साधना
                        </Text>
                    </View>
                )}
            </View>

            <View className="w-full items-center">
                <View
                    className="overflow-hidden rounded-[28px]"
                    style={{ width: CAROUSEL_WIDTH, height: CAROUSEL_HEIGHT }}
                >
                    <Carousel
                        data={prefaceChapters}
                        loop={false}
                        style={{ width: CAROUSEL_WIDTH, height: CAROUSEL_HEIGHT }}
                        progress={progress}
                        renderItem={({ item }) => (
                            <View className="flex-1 p-0.5">
                                <View
                                    className="flex-1 bg-surface p-5 rounded-[28px] border border-ink/10"
                                    style={{ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 }}
                                >
                                    <ChapterView chapter={item} book={targetBook} />
                                </View>
                            </View>
                        )}
                    />
                </View>

                <Pagination
                    progress={progress}
                    count={prefaceChapters.length}
                    dotStyle={{ width: 9, height: 9, borderRadius: 9999, backgroundColor: themeInkHex[theme], opacity: 0.35 }}
                    activeDotStyle={{ width: 24, height: 9, borderRadius: 9999, backgroundColor: themePrimaryHex[theme], opacity: 1 }}
                    containerStyle={{ gap: 8, marginTop: 16, marginBottom: 8 }}
                />

                <View className="pb-8 pt-1 items-center">
                    <Text className="text-xs text-ink/75 font-sans-medium italic text-center tracking-wide">
                        डावीकडे / उजवीकडे स्वाइप करा
                    </Text>
                </View>
            </View>
        </View>
    );
};
