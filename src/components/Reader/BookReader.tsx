import React, { useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Carousel, type CarouselRef } from 'react-native-reanimated-carousel';
import { useReaderNav, useReaderSettings, useReaderUI } from '../../context/ReaderContext';
import { ChapterView } from './ChapterView';
import { UtilityBar } from './UtilityBar';
import { ChapterIndexSidebar } from './ChapterIndexSidebar';
import { TourTarget } from './TourTarget';
import { themeVars } from '../../theme/tokens';
import type { Book, Block } from '../../types/book';

interface ReaderPage {
    id: string;
    title: string;
    slug: string;
    blocks: Block[];
    pageIndex: number;
    totalPages: number;
    isCover: boolean;
    isIndex: boolean;
    chapterId: string;
}

const HeaderButton: React.FC<{ label: string; onPress: () => void; children: React.ReactNode }> = ({ label, onPress, children }) => (
    <Pressable
        onPress={onPress}
        accessibilityLabel={label}
        className="w-10 h-10 items-center justify-center rounded-full active:bg-black/5"
    >
        <Text className="text-ink/80 text-lg">{children}</Text>
    </Pressable>
);

function buildReaderPages(activeBook: Book, fontSize: number): ReaderPage[] {
    const firstChapter = activeBook.chapters[0];
    const indexChapterIdx = activeBook.chapters.findIndex(ch => ch.slug === 'index');
    const chaptersToPaginate = indexChapterIdx !== -1
        ? [firstChapter, ...activeBook.chapters.slice(indexChapterIdx)]
        : activeBook.chapters;

    const pages: ReaderPage[] = [];

    const coverChapter = chaptersToPaginate.find(ch =>
        ch.id === 'ch01' || ch.id.endsWith('-ch01') || ch.id.endsWith('ch01') || ch.slug === 'front-cover'
    ) || chaptersToPaginate[0];

    if (coverChapter) {
        pages.push({
            id: coverChapter.id,
            chapterId: coverChapter.id,
            title: coverChapter.title,
            slug: coverChapter.slug,
            blocks: coverChapter.blocks,
            pageIndex: 0,
            totalPages: 1,
            isCover: true,
            isIndex: false,
        });
    }

    const indexChapters = chaptersToPaginate.filter(ch =>
        ch !== coverChapter && (ch.id === 'ch05' || ch.id === 'ch05b' || ch.slug === 'index' || ch.slug === 'index-2' || ch.title?.includes('अनुक्रमणिका'))
    );

    if (indexChapters.length > 0) {
        const allIndexItems: string[] = [];
        const primaryHeadingBlock = indexChapters[0].blocks.find((b) => b.type === 'heading') || {
            id: 'index-header-unified',
            type: 'heading' as const,
            content: 'अनुक्रमणिका',
            metadata: { level: 2 as const },
        };

        indexChapters.forEach(ch => {
            ch.blocks.forEach((b) => {
                if (b.type === 'list' && Array.isArray(b.metadata?.items)) {
                    allIndexItems.push(...b.metadata.items);
                }
            });
        });

        const chunkSize = 24;
        const totalIndexPages = Math.max(1, Math.ceil(allIndexItems.length / chunkSize));

        for (let pIdx = 0; pIdx < totalIndexPages; pIdx++) {
            const chunk = allIndexItems.slice(pIdx * chunkSize, (pIdx + 1) * chunkSize);
            pages.push({
                id: `index-p${pIdx}`,
                chapterId: indexChapters[0].id,
                title: 'अनुक्रमणिका',
                slug: 'index',
                blocks: [
                    { ...primaryHeadingBlock, id: `index-header-p${pIdx}` },
                    { id: `index-list-p${pIdx}`, type: 'list', metadata: { items: chunk } },
                ],
                pageIndex: pIdx,
                totalPages: totalIndexPages,
                isCover: false,
                isIndex: true,
            });
        }
    }

    const regularChapters = chaptersToPaginate.filter(ch => ch !== coverChapter && !indexChapters.includes(ch));

    regularChapters.forEach(chapter => {
        const getBlockWeight = (block: Block) => {
            switch (block.type) {
                case 'heading':
                    return 3;
                case 'paragraph': {
                    const text = block.content || '';
                    const lines = Math.ceil(text.length / 30);
                    return lines + 1.5;
                }
                case 'quote': {
                    const quoteText = block.content || '';
                    const quoteLines = Math.ceil(quoteText.length / 26);
                    return quoteLines + 2.5;
                }
                case 'list': {
                    const items = block.metadata?.items || [];
                    let listWeight = 1;
                    items.forEach((item) => {
                        listWeight += Math.ceil(item.length / 26) + 1;
                    });
                    return listWeight;
                }
                case 'image':
                    return 10;
                case 'separator':
                    return 3;
                default:
                    return 2;
            }
        };

        const getPageLimit = () => {
            const baseLimit = 18;
            const scaleFactor = 16 / fontSize;
            return Math.max(10, Math.floor(baseLimit * scaleFactor));
        };

        const limit = getPageLimit();

        let totalWeight = 0;
        chapter.blocks.forEach((block) => { totalWeight += getBlockWeight(block); });

        if (chapter.blocks.length <= 2 && totalWeight <= limit * 1.3) {
            pages.push({
                id: chapter.id,
                chapterId: chapter.id,
                title: chapter.title,
                slug: chapter.slug,
                blocks: chapter.blocks,
                pageIndex: 0,
                totalPages: 1,
                isCover: false,
                isIndex: false,
            });
            return;
        }

        let currentPageBlocks: Block[] = [];
        let currentWeight = 0;
        const chapterPagesBlocks: Block[][] = [];

        chapter.blocks.forEach((block) => {
            const weight = getBlockWeight(block);

            const hasContentBlock = currentPageBlocks.some(b => {
                const isBHeader = b.type === 'heading' ||
                    (b.type === 'paragraph' && (b.metadata?.className?.includes('italic') || (b.content && b.content.trim().startsWith('('))));
                return !isBHeader;
            });

            if (currentWeight + weight > limit && currentPageBlocks.length > 0 && hasContentBlock) {
                chapterPagesBlocks.push(currentPageBlocks);
                currentPageBlocks = [block];
                currentWeight = weight;
            } else {
                currentPageBlocks.push(block);
                currentWeight += weight;
            }
        });
        if (currentPageBlocks.length > 0) {
            chapterPagesBlocks.push(currentPageBlocks);
        }

        chapterPagesBlocks.forEach((blocks, pIdx) => {
            pages.push({
                id: `${chapter.id}-p${pIdx}`,
                chapterId: chapter.id,
                title: chapter.title,
                slug: chapter.slug,
                blocks,
                pageIndex: pIdx,
                totalPages: chapterPagesBlocks.length,
                isCover: false,
                isIndex: false,
            });
        });
    });

    return pages;
}

export const BookReader: React.FC<{ activeBook: Book }> = ({ activeBook }) => {
    const { theme, fontSize } = useReaderSettings();
    const { activeChapterId, setActiveChapterId, setActiveBookId } = useReaderNav();
    const { setSearchOpen, isChapterIndexOpen, setChapterIndexOpen, setDrawerOpen } = useReaderUI();

    const carouselRef = useRef<CarouselRef>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    const readerPages = useMemo(() => buildReaderPages(activeBook, fontSize), [activeBook, fontSize]);

    const currentIndex = readerPages.findIndex(page =>
        page.id === activeChapterId || (page.chapterId === activeChapterId && page.pageIndex === 0)
    );
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;

    const indexEntries = useMemo(() => (
        readerPages
            .filter(p => !p.isCover && !p.isIndex && p.pageIndex === 0)
            .map(p => ({ id: p.chapterId, title: p.title }))
    ), [readerPages]);

    const activeChapterEntryId = readerPages[safeIndex]?.chapterId;

    const goToChapter = (chapterId: string) => {
        const targetIndex = readerPages.findIndex(p => p.chapterId === chapterId && p.pageIndex === 0);
        if (targetIndex === -1) return;
        if (targetIndex !== safeIndex) {
            carouselRef.current?.scrollTo({ index: targetIndex, animated: true });
            setActiveChapterId(readerPages[targetIndex].id);
        }
        setChapterIndexOpen(false);
    };

    const onLayout = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        if (width !== containerSize.width || height !== containerSize.height) {
            setContainerSize({ width, height });
        }
    };

    return (
        <SafeAreaView style={themeVars[theme]} className="flex-1 bg-background" edges={['top', 'left', 'right', 'bottom']}>
            <View className="w-full border-b border-ink/10 flex-row items-center justify-between px-4 pb-3">
                <View className="flex-row items-center">
                    <TourTarget id="tour-menu-button">
                        <HeaderButton label="मेनू (Menu)" onPress={() => setDrawerOpen(true)}>☰</HeaderButton>
                    </TourTarget>
                    <Pressable
                        onPress={() => setActiveBookId(null)}
                        accessibilityLabel="पंचपदी संग्रह (Panchapadi Home)"
                        className="flex-row items-center gap-1.5 p-2 active:opacity-70"
                    >
                        <Text className="text-ink/80 text-base">←</Text>
                        <Text className="text-ink/75 font-sans-bold text-sm">पंचपदी</Text>
                    </Pressable>
                </View>

                <Text className="font-serif-bold text-sm text-ink text-center flex-1 mx-2" numberOfLines={1}>
                    {activeBook.metadata.title}
                </Text>

                <View className="flex-row items-center">
                    {indexEntries.length > 0 && (
                        <HeaderButton label="अनुक्रमणिका (Index)" onPress={() => setChapterIndexOpen(true)}>📑</HeaderButton>
                    )}
                    <TourTarget id="tour-search-button">
                        <HeaderButton label="शोधा (Search)" onPress={() => setSearchOpen(true)}>🔍</HeaderButton>
                    </TourTarget>
                </View>
            </View>

            <TourTarget id="tour-reader-pages" style={{ flex: 1 }}>
            <View className="flex-1" onLayout={onLayout}>
                {containerSize.width > 0 && containerSize.height > 0 && (
                    <Carousel
                        ref={carouselRef}
                        data={readerPages}
                        loop={false}
                        defaultIndex={safeIndex}
                        animation={{ type: 'timing', duration: 200 }}
                        onConfigurePanGesture={(gesture) => {
                            gesture.activeOffsetX([-10, 10]).failOffsetY([-10, 10]);
                        }}
                        style={{ width: containerSize.width, height: containerSize.height }}
                        onSnapToItem={(index) => {
                            const page = readerPages[index];
                            if (page && page.id !== activeChapterId) {
                                setActiveChapterId(page.id);
                            }
                        }}
                        renderItem={({ item }) => (
                            <View className="flex-1 p-4">
                                <ScrollView
                                    className="flex-1 rounded-[28px] border border-ink/10 bg-surface"
                                    contentContainerStyle={{ padding: 20, flexGrow: 1 }}
                                >
                                    <ChapterView chapter={item} />
                                    {!item.isCover && (
                                        <View className="mt-8 pt-4 border-t border-ink/5 flex-row justify-between opacity-50">
                                            <Text className="text-xs font-sans">{activeBook.metadata.title}</Text>
                                            <Text className="text-xs font-sans">
                                                {item.totalPages > 1 ? `${item.pageIndex + 1} / ${item.totalPages}` : ''}
                                            </Text>
                                        </View>
                                    )}
                                </ScrollView>
                            </View>
                        )}
                    />
                )}
            </View>
            </TourTarget>

            <UtilityBar
                readerPages={readerPages}
                currentPageIndex={safeIndex}
                onPrev={() => carouselRef.current?.prev({ animated: true })}
                onNext={() => carouselRef.current?.next({ animated: true })}
                onGoToPage={(page) => carouselRef.current?.scrollTo({ index: page - 1, animated: true })}
            />

            <ChapterIndexSidebar
                isOpen={isChapterIndexOpen}
                onClose={() => setChapterIndexOpen(false)}
                bookTitle={activeBook.metadata.title}
                items={indexEntries}
                activeItemId={activeChapterEntryId}
                onSelect={goToChapter}
            />
        </SafeAreaView>
    );
};
