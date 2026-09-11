import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReaderNav, useReaderSettings, useReaderUI } from '../../context/ReaderContext';
import { themeVars } from '../../theme/tokens';

interface SearchResult {
    bookId: string;
    bookTitle: string;
    chapterId: string;
    chapterTitle: string;
    blockId: string;
    matchSnippet: string;
}

const searchSuggestions = ['आरती दत्तात्रेयाची', 'करुणात्रिपदी', 'पंचपदी', 'चरित्र', 'शेजारती', 'प्रार्थना'];

function normalizeText(text: string): string {
    return text.replace(/[\s .,/#!$%^&*;:{}=\-_`~()|।]/g, '').toLowerCase();
}

function searchBooks(books: ReturnType<typeof useReaderNav>['books'], query: string): SearchResult[] {
    if (!query || query.trim().length < 2) return [];

    const results: SearchResult[] = [];
    const normalizedQuery = normalizeText(query);

    books.forEach(book => {
        book.chapters.forEach(chapter => {
            chapter.blocks.forEach(block => {
                let matchedText = '';

                if (block.content) {
                    if (normalizeText(block.content).includes(normalizedQuery)) {
                        matchedText = block.content;
                    }
                } else if (block.metadata?.items) {
                    const matchedItem = block.metadata.items.find((item: string) =>
                        normalizeText(item).includes(normalizedQuery)
                    );
                    if (matchedItem) matchedText = matchedItem;
                }

                if (matchedText) {
                    const exists = results.some(r => r.chapterId === chapter.id && r.matchSnippet === matchedText);
                    if (!exists) {
                        results.push({
                            bookId: book.id,
                            bookTitle: book.metadata.title,
                            chapterId: chapter.id,
                            chapterTitle: chapter.title,
                            blockId: block.id,
                            matchSnippet: matchedText,
                        });
                    }
                }
            });
        });
    });

    return results;
}

function HighlightedSnippet({ text, query }: { text: string; query: string }) {
    if (!query) return <Text className="text-sm font-serif text-ink leading-relaxed">{text}</Text>;

    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) {
        return <Text className="text-sm font-serif text-ink leading-relaxed">{text}</Text>;
    }

    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);

    return (
        <Text className="text-sm font-serif text-ink leading-relaxed">
            {before}
            <Text className="bg-amber-300 text-black font-bold">{match}</Text>
            {after}
        </Text>
    );
}

export const SearchModal: React.FC = () => {
    const { isSearchOpen, setSearchOpen } = useReaderUI();
    const { setActiveBookId, setActiveChapterId, books } = useReaderNav();
    const { theme } = useReaderSettings();

    const [searchQuery, setSearchQuery] = useState('');

    if (!isSearchOpen) return null;

    const searchResults = searchBooks(books, searchQuery);
    const hasQuery = searchQuery.trim().length >= 2;

    const handleClose = () => {
        setSearchOpen(false);
        setSearchQuery('');
    };

    return (
        <Modal transparent={false} visible animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
            <SafeAreaView style={themeVars[theme]} className="flex-1 bg-background" edges={['top', 'left', 'right', 'bottom']}>
                <View className="flex-row items-center gap-2 px-4 pt-2">
                    <Pressable
                        onPress={handleClose}
                        accessibilityLabel="मागे (Close)"
                        className="w-11 h-11 items-center justify-center rounded-full active:bg-black/5"
                    >
                        <Text className="text-ink text-xl">←</Text>
                    </Pressable>

                    <View className="flex-1 flex-row items-center bg-surface-container rounded-full px-4 border border-ink/10">
                        <Text className="opacity-40 mr-2.5">🔍</Text>
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="पंचपदीमध्ये शोधा (उदा. दत्त, आरती)..."
                            className="flex-1 py-2.5 text-base text-ink font-serif"
                            autoFocus
                        />
                        {searchQuery.length > 0 && (
                            <Pressable onPress={() => setSearchQuery('')} className="p-1 active:opacity-60">
                                <Text className="text-sm font-bold opacity-60">✕</Text>
                            </Pressable>
                        )}
                    </View>
                </View>

                <ScrollView className="flex-1 mt-6 px-4" contentContainerStyle={{ paddingBottom: 24 }}>
                    {!hasQuery ? (
                        <View className="items-center py-10">
                            <Text className="text-3xl mb-4">📖</Text>
                            <Text className="font-serif-bold text-lg text-ink">शोधण्यास प्रारंभ करा</Text>
                            <Text className="text-xs text-ink/60 mt-1 text-center max-w-xs">
                                किमान २ अक्षरे टाईप करा.
                            </Text>

                            <View className="mt-8 w-full">
                                <Text className="font-sans-bold text-xs uppercase tracking-wider text-ink/50 mb-3">
                                    सजेस्टेड कीवर्ड्स
                                </Text>
                                <View className="flex-row flex-wrap gap-2.5">
                                    {searchSuggestions.map(tag => (
                                        <Pressable
                                            key={tag}
                                            onPress={() => setSearchQuery(tag)}
                                            className="px-4 py-2 border border-ink/15 rounded-full active:bg-black/5"
                                        >
                                            <Text className="text-xs font-sans-bold text-ink">#{tag}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View>
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-xs font-sans-bold uppercase tracking-wider opacity-50">
                                    शोध निकाल ({searchResults.length})
                                </Text>
                                <Text className="text-xs font-serif text-primary font-bold">"{searchQuery}" साठी</Text>
                            </View>

                            {searchResults.length === 0 ? (
                                <View className="items-center py-14">
                                    <Text className="text-2xl mb-3">🔍</Text>
                                    <Text className="font-serif-bold text-lg text-ink">निकाल आढळले नाहीत</Text>
                                    <Text className="text-xs text-ink/60 mt-1">दुसरा शब्द वापरून पहा किंवा स्पेलिंग तपासा.</Text>
                                </View>
                            ) : (
                                searchResults.map((res, index) => (
                                    <Pressable
                                        key={`${res.chapterId}-${index}`}
                                        onPress={() => {
                                            setActiveBookId(res.bookId);
                                            setActiveChapterId(res.chapterId);
                                            handleClose();
                                        }}
                                        className="bg-surface-container border border-ink/5 p-4 rounded-2xl mb-3.5 active:opacity-80"
                                    >
                                        <View className="flex-row items-center justify-between mb-1.5 flex-wrap gap-1">
                                            <Text className="text-[10px] font-sans-bold uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-sm">
                                                {res.bookTitle}
                                            </Text>
                                            <Text className="text-xs font-serif-bold text-ink/75">{res.chapterTitle}</Text>
                                        </View>
                                        <View className="pl-2 border-l-2 border-amber-600/35">
                                            <HighlightedSnippet text={res.matchSnippet} query={searchQuery} />
                                        </View>
                                    </Pressable>
                                ))
                            )}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};
