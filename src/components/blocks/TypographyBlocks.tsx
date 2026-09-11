import React from 'react';
import { Text, View, Pressable, Linking } from 'react-native';
import type { Book } from '../../types/book';

/**
 * Typography Primitives
 *
 * The web app scales all typography with CSS `em` units relative to a
 * user-adjustable base font size (ReaderContext.fontSize). React Native has
 * no font-size inheritance, so each primitive here recomputes its own pixel
 * size from the same em ratios as index.css / TypographyBlocks.tsx.
 *
 * fontSize (and, for the index list, activeBook/onNavigate) are passed down
 * as props from ChapterView rather than read via useReader() here. Reading
 * context directly in every block would subscribe every single paragraph/
 * heading in a chapter to the whole ReaderContext, so any unrelated state
 * change (theme, sadhana counter, search query) re-renders every block in
 * every currently-mounted page — very noticeable on long chapters. Only
 * ChapterView (one per page) subscribes to context; these stay React.memo'd
 * plain components.
 */

const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;

export const Paragraph = React.memo<{ content: string; className?: string; align?: 'left' | 'center' | 'right' | 'justify'; fontSize: number }>(
    ({ content, className, align, fontSize }) => {
        const renderContent = () => {
            if (!content) return null;
            const parts = content.split(emailRegex);
            if (parts.length === 1) return content;

            return parts.map((part, idx) => {
                if (part.match(emailRegex)) {
                    const email = part;
                    return (
                        <Text
                            key={idx}
                            onPress={() => Linking.openURL(`mailto:${email}`)}
                            className="font-sans-bold text-primary"
                        >
                            {email}
                        </Text>
                    );
                }
                return part;
            });
        };

        return (
            <Text
                className={className ?? 'text-ink/90'}
                style={{
                    fontSize: fontSize * 0.75,
                    lineHeight: fontSize * 0.75 * 1.5,
                    textAlign: align ?? 'justify',
                    marginBottom: 16,
                    paddingHorizontal: 8,
                    fontWeight: '700',
                }}
            >
                {renderContent()}
            </Text>
        );
    }
);

const headingStyles = {
    1: { scale: 1.5, className: 'font-slab text-red-800 text-center' },
    2: { scale: 0.75, className: 'font-slab text-ink/90 text-center border-b border-ink/5 pb-2' },
    3: { scale: 1.15, className: 'font-serif text-ink/80 text-center' },
};

export const Heading = React.memo<{ content: string; level: 1 | 2 | 3; className?: string; fontSize: number }>(
    ({ content, level, className, fontSize }) => {
        const cfg = headingStyles[level] || headingStyles[1];

        return (
            <Text
                className={className ?? cfg.className}
                style={{
                    fontSize: fontSize * cfg.scale,
                    fontWeight: level === 3 ? '500' : '700',
                    marginTop: level === 1 ? 32 : level === 2 ? 24 : 16,
                    marginBottom: level === 1 ? 16 : level === 2 ? 12 : 8,
                }}
            >
                {content}
            </Text>
        );
    }
);

export const Quote = React.memo<{ content: string; author?: string; fontSize: number }>(
    ({ content, author, fontSize }) => (
        <View className="my-6 px-4 py-3 mx-2 border-l-4 border-amber-600/60 bg-black/[0.02] rounded-r-md">
            <Text
                className="text-ink/95 text-center italic"
                style={{ fontSize: fontSize * 1.1, lineHeight: fontSize * 1.1 * 1.5 }}
            >
                {content}
            </Text>
            {author && (
                <Text
                    className="mt-3 text-amber-900/80 font-sans-bold text-right uppercase tracking-widest"
                    style={{ fontSize: fontSize * 0.8 }}
                >
                    — {author}
                </Text>
            )}
        </View>
    )
);

interface UnorderedListProps {
    items: string[];
    className?: string;
    isIndex?: boolean;
    fontSize: number;
    activeBook?: Book | null;
    onNavigate?: (chapterId: string) => void;
}

export const UnorderedList = React.memo<UnorderedListProps>(({ items, isIndex, fontSize, activeBook, onNavigate }) => {
    const normalizeText = (text: string): string =>
        text.replace(/[\s .,/#!$%^&*;:{}=\-_`~()|।]/g, '').toLowerCase();

    const findChapterIdForIndexItem = (item: string): string | null => {
        if (!activeBook) return null;
        const normItem = normalizeText(item);
        if (!normItem) return null;

        let match = activeBook.chapters.find(ch => normalizeText(ch.title) === normItem);
        if (match) return match.id;

        match = activeBook.chapters.find(ch => {
            const normCh = normalizeText(ch.title);
            return normCh.includes(normItem) || normItem.includes(normCh);
        });
        if (match) return match.id;

        const getLeadingNum = (str: string) => {
            const m = str.match(/^([0-9१२३४५६७८९०]+)/);
            return m ? m[1] : null;
        };

        const itemNum = getLeadingNum(normItem);
        if (itemNum) {
            const englishMap: { [key: string]: string } = {
                '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9', '०': '0',
            };
            const toEnglish = (numStr: string) => numStr.split('').map(c => englishMap[c] || c).join('');
            const engNum = toEnglish(itemNum);

            match = activeBook.chapters.find(ch => {
                const chNum = getLeadingNum(normalizeText(ch.title));
                if (!chNum) return false;
                return toEnglish(chNum) === engNum;
            });
            if (match) return match.id;
        }

        return null;
    };

    if (isIndex) {
        return (
            <View className="w-full my-6">
                {items.map((item, idx) => {
                    const targetId = findChapterIdForIndexItem(item);
                    const match = item.match(/^(\s*)((?:[0-9१२३४५६७८९०.\-\s ]+)|(?:[अबकड]\.?[\s ]+))?(.*)$/);
                    const numberPrefix = match ? match[2] || '' : '';
                    const mainText = match ? match[3] || '' : item;
                    const cleanNum = numberPrefix.replace(/[.\-\s ]/g, '').trim();
                    const displayBadge = cleanNum || 'ॐ';

                    return (
                        <Pressable
                            key={idx}
                            disabled={!targetId}
                            onPress={() => targetId && onNavigate?.(targetId)}
                            className={
                                'flex-row items-center justify-between min-h-[56px] py-3 px-4 my-1 rounded-2xl border border-ink/5 ' +
                                (targetId ? 'bg-surface-container active:opacity-80' : 'bg-black/[0.02] opacity-80')
                            }
                        >
                            <View className="flex-row items-center flex-1">
                                <View className="w-10 h-10 rounded-full bg-primary-container items-center justify-center mr-3.5 border border-primary/10">
                                    <Text className="font-sans-bold text-on-primary-container text-[13px]">{displayBadge}</Text>
                                </View>
                                <Text
                                    className="font-serif-bold text-ink flex-1 pr-2"
                                    style={{ fontSize: fontSize * 1.05, lineHeight: fontSize * 1.05 * 1.3 }}
                                >
                                    {mainText.replace(/[|।]/g, '').trim()}
                                </Text>
                            </View>
                            <View className="w-8 h-8 rounded-full bg-black/[0.03] items-center justify-center opacity-70">
                                <Text className="text-xs font-sans-bold">{targetId ? '📖' : '•'}</Text>
                            </View>
                        </Pressable>
                    );
                })}
            </View>
        );
    }

    return (
        <View className="mb-6 pl-2">
            {items.map((item, idx) => (
                <View key={idx} className="flex-row mb-2 pr-2">
                    <Text className="text-amber-700/50 mr-2" style={{ fontSize: fontSize * 0.75 }}>{'•'}</Text>
                    <Text className="text-ink/90 flex-1" style={{ fontSize: fontSize * 0.75, lineHeight: fontSize * 0.75 * 1.5 }}>
                        {item}
                    </Text>
                </View>
            ))}
        </View>
    );
});

export const LinkButton = React.memo<{ content: string; url: string; fontSize: number }>(
    ({ content, url, fontSize }) => (
        <View className="items-center my-5 px-2">
            <Pressable
                onPress={() => Linking.openURL(url)}
                className="flex-row items-center gap-2 px-5 py-2.5 rounded-full border border-amber-600/30 bg-primary-container active:opacity-80"
            >
                <Text className="text-on-primary-container font-sans-bold" style={{ fontSize: fontSize * 0.8 }}>
                    {content} {'↗'}
                </Text>
            </Pressable>
        </View>
    )
);

export const Separator = React.memo(() => (
    <View className="items-center my-8">
        <View className="w-16 h-1 bg-amber-700/20 rounded-full" />
    </View>
));
