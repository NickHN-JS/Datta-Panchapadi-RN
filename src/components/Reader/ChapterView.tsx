import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import type { Chapter, Book } from '../../types/book';
import { BlockRenderer } from '../blocks/BlockRenderer';
import { useReaderNav, useReaderSettings } from '../../context/ReaderContext';
import { resolveImage } from '../../lib/assets';

interface ChapterViewProps {
    chapter: Chapter;
    book?: Book | null;
}

const coverGradients: Record<string, [string, string]> = {
    sampurna: ['#801815', '#400806'],
    karunatripadi: ['#aa5511', '#663300'],
    guruvarchi: ['#cca01a', '#453603'],
    'kshetra-parichay': ['#4a5a6a', '#1f2937'],
    homepage: ['#d32f2f', '#500000'],
};

const CoverCorner: React.FC<{ position: 'tl' | 'tr' | 'bl' | 'br' }> = ({ position }) => {
    const base = 'absolute w-[30px] h-[30px] border-amber-300';
    const styles: Record<string, string> = {
        tl: 'top-[15px] left-[15px] border-t-4 border-l-4',
        tr: 'top-[15px] right-[15px] border-t-4 border-r-4',
        bl: 'bottom-[15px] left-[15px] border-b-4 border-l-4',
        br: 'bottom-[15px] right-[15px] border-b-4 border-r-4',
    };
    return <View className={`${base} ${styles[position]}`} pointerEvents="none" />;
};

export const ChapterView: React.FC<ChapterViewProps> = ({ chapter, book }) => {
    const { setActiveChapterId, setActiveBookId, activeBook: contextActiveBook } = useReaderNav();
    const { fontSize } = useReaderSettings();
    const activeBook = book !== undefined ? book : contextActiveBook;

    const isHomepageCover = chapter.id === 'homepage-cover' || chapter.slug === 'homepage-cover';
    const isCover = chapter.id === 'ch01' || chapter.id.endsWith('-ch01') || chapter.id.endsWith('ch01') || chapter.slug === 'front-cover' || isHomepageCover;

    if (isCover && activeBook) {
        const coverImage = isHomepageCover
            ? resolveImage('datta-hq.jpg')
            : (activeBook.metadata.coverImageId ? resolveImage(activeBook.metadata.coverImageId) : resolveImage('datta-hq.jpg'));
        const coverTitle = isHomepageCover ? 'पंचपदी' : (activeBook.metadata.title || chapter.title);
        const indexChapter = activeBook.chapters.find(ch => ch.slug === 'index') || activeBook.chapters[1] || activeBook.chapters[0];
        const targetChapterId = indexChapter?.id || activeBook.chapters[0]?.id || '';

        const [gradStart, gradEnd] = isHomepageCover
            ? coverGradients.homepage
            : (coverGradients[activeBook.id] || coverGradients.sampurna);

        const handleStartReading = () => {
            if (book) {
                setActiveBookId(book.id);
                setActiveChapterId(targetChapterId);
            } else {
                setActiveChapterId(targetChapterId);
            }
        };

        return (
            <View className="flex-1 items-center justify-between py-6 px-6 rounded-[28px] overflow-hidden border-[10px] border-amber-500/60">
                <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%">
                    <Defs>
                        <RadialGradient id="coverGrad" cx="50%" cy="50%" r="75%">
                            <Stop offset="0%" stopColor={gradStart} stopOpacity={1} />
                            <Stop offset="100%" stopColor={gradEnd} stopOpacity={1} />
                        </RadialGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#coverGrad)" />
                </Svg>

                <View className="absolute inset-[10px] border-2 border-amber-300/80 rounded-2xl" pointerEvents="none" />
                <CoverCorner position="tl" />
                <CoverCorner position="tr" />
                <CoverCorner position="bl" />
                <CoverCorner position="br" />

                <Text className="text-center font-sans-bold text-amber-300 text-[10px] uppercase tracking-widest mt-3">
                    पारंपारिक नित्य उपासना पंचपदी
                </Text>

                <View className="my-4 w-[190px] h-[240px] rounded-xl overflow-hidden border-4 border-amber-300/60 bg-black/20 p-1 items-center justify-center">
                    <Image
                        source={{ uri: coverImage }}
                        accessibilityLabel={coverTitle}
                        resizeMode="cover"
                        className="w-full h-full rounded-lg"
                    />
                </View>

                <View className="px-4">
                    <Text className="text-center font-slab text-amber-300 tracking-wide" style={{ fontSize: 30 }}>
                        {coverTitle}
                    </Text>
                </View>

                {targetChapterId && (
                    <Pressable
                        onPress={handleStartReading}
                        className="mt-6 px-6 py-2.5 bg-amber-500 rounded-full active:bg-amber-400 active:scale-95"
                    >
                        <Text className="text-black font-sans-bold text-xs tracking-widest uppercase">
                            पंचपदी उघडा • Start Reading
                        </Text>
                    </Pressable>
                )}
            </View>
        );
    }

    const isIndex = Boolean((chapter as any)?.isIndex || chapter.id === 'ch05' || chapter.id === 'ch05b' || chapter.id.startsWith('ch05') || chapter.slug === 'index' || chapter.slug === 'index-2');

    return (
        <View className="flex-1 justify-center">
            <View>
                {chapter.blocks.map((block) => (
                    <BlockRenderer
                        key={block.id}
                        block={block}
                        isIndex={isIndex}
                        fontSize={fontSize}
                        activeBook={activeBook}
                        onNavigate={setActiveChapterId}
                    />
                ))}
            </View>

            {!isIndex && chapter.id !== 'ch02' && chapter.id !== 'ch03' && chapter.id !== 'ch04' && (
                <Text className="mt-8 text-center text-xl text-amber-700/50">❧</Text>
            )}
        </View>
    );
};
