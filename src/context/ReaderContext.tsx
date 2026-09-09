import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Book } from '../types/book';
import { libraryBooks } from '../data/library';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const APP_VERSION: string = require('../../package.json').version;

export type Theme = 'light' | 'dark' | 'papyrus';
export type FontFamily = 'serif' | 'sans' | 'slab';

interface ReaderContextType {
    isReady: boolean;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    fontSize: number;
    increaseFontSize: () => void;
    decreaseFontSize: () => void;
    resetFontSize: () => void;
    fontFamily: FontFamily;
    cycleFontFamily: () => void;
    activeChapterId: string;
    setActiveChapterId: (id: string) => void;
    activeBookId: string | null;
    setActiveBookId: (id: string | null) => void;
    activeBook: Book | null;
    books: Book[];
    isSearchOpen: boolean;
    setSearchOpen: (open: boolean) => void;
    isSadhanaOpen: boolean;
    setSadhanaOpen: (open: boolean) => void;
    isDrawerOpen: boolean;
    setDrawerOpen: (open: boolean) => void;
    isChapterIndexOpen: boolean;
    setChapterIndexOpen: (open: boolean) => void;
    isTourActive: boolean;
    setTourActive: (active: boolean) => void;
    tourStep: number;
    setTourStep: (step: number) => void;
    sadhanaStreak: number;
    sadhanaTodayJap: number;
    recordSadhanaJap: (count: number) => void;
}

const ReaderContext = createContext<ReaderContextType | undefined>(undefined);

function todayStr(): string {
    return new Date().toLocaleDateString('en-CA');
}

function yesterdayStr(): string {
    return new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
}

export const ReaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isReady, setIsReady] = useState(false);

    const [theme, setThemeState] = useState<Theme>('light');
    const [fontSize, setFontSizeState] = useState<number>(16);
    const [fontFamily, setFontFamilyState] = useState<FontFamily>('serif');
    const [activeBookId, setActiveBookIdState] = useState<string | null>(null);
    const [activeChapterId, setActiveChapterIdState] = useState<string>('');
    const [sadhanaStreak, setSadhanaStreak] = useState<number>(0);
    const [sadhanaTodayJap, setSadhanaTodayJap] = useState<number>(0);

    const [isSearchOpen, setSearchOpen] = useState<boolean>(false);
    const [isSadhanaOpen, setSadhanaOpen] = useState<boolean>(false);
    const [isDrawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [isChapterIndexOpen, setChapterIndexOpen] = useState<boolean>(false);
    const [isTourActive, setTourActiveState] = useState<boolean>(false);
    const [tourStep, setTourStep] = useState<number>(0);

    // One-time async hydration from AsyncStorage, then run first-install/
    // version-update tour logic and stale-streak validation.
    useEffect(() => {
        (async () => {
            const keys = [
                'reader-theme',
                'reader-font-size',
                'reader-font-family',
                'reader-active-chapter',
                'sadhana-streak',
                'sadhana-today-jap',
                'sadhana-last-active-date',
                'reader-app-version',
            ] as const;

            const pairs = await AsyncStorage.multiGet(keys);
            const values = Object.fromEntries(pairs) as Record<(typeof keys)[number], string | null>;

            if (values['reader-theme']) setThemeState(values['reader-theme'] as Theme);
            if (values['reader-font-size']) {
                setFontSizeState(Math.max(parseInt(values['reader-font-size']!, 10), 16));
            }
            if (values['reader-font-family']) setFontFamilyState(values['reader-font-family'] as FontFamily);
            if (values['reader-active-chapter']) setActiveChapterIdState(values['reader-active-chapter']!);

            const today = todayStr();
            const yesterday = yesterdayStr();
            const lastDate = values['sadhana-last-active-date'] || '';

            let streak = values['sadhana-streak'] ? parseInt(values['sadhana-streak']!, 10) : 0;
            if (lastDate && lastDate !== today && lastDate !== yesterday) {
                streak = 0;
                await AsyncStorage.setItem('sadhana-streak', '0');
            }
            setSadhanaStreak(streak);

            if (lastDate === today && values['sadhana-today-jap']) {
                setSadhanaTodayJap(parseInt(values['sadhana-today-jap']!, 10));
            } else {
                setSadhanaTodayJap(0);
            }

            const lastVersion = values['reader-app-version'];
            if (!lastVersion || lastVersion !== APP_VERSION) {
                setTourActiveState(true);
                setTourStep(0);
                await AsyncStorage.setItem('reader-app-version', APP_VERSION);
                await AsyncStorage.removeItem(`reader-tour-completed-${APP_VERSION}`);
            } else {
                const tourCompleted = await AsyncStorage.getItem(`reader-tour-completed-${APP_VERSION}`);
                if (!tourCompleted) {
                    setTourActiveState(true);
                    setTourStep(0);
                }
            }

            setIsReady(true);
        })();
    }, []);

    const setTourActive = (active: boolean) => {
        setTourActiveState(active);
        if (!active) {
            AsyncStorage.setItem(`reader-tour-completed-${APP_VERSION}`, 'true');
        }
    };

    const recordSadhanaJap = (count: number) => {
        if (count <= 0) return;
        const today = todayStr();

        AsyncStorage.getItem('sadhana-last-active-date').then(async (lastDate) => {
            lastDate = lastDate || '';

            const newTodayJap = sadhanaTodayJap + count;
            setSadhanaTodayJap(newTodayJap);
            await AsyncStorage.setItem('sadhana-today-jap', newTodayJap.toString());
            await AsyncStorage.setItem(`sadhana-jap-${today}`, newTodayJap.toString());

            const totalJapStr = (await AsyncStorage.getItem('sadhana-total-jap')) || '0';
            const newTotalJap = parseInt(totalJapStr, 10) + count;
            await AsyncStorage.setItem('sadhana-total-jap', newTotalJap.toString());

            if (lastDate !== today) {
                const yesterday = yesterdayStr();
                const newStreak = lastDate === yesterday ? sadhanaStreak + 1 : 1;
                setSadhanaStreak(newStreak);
                await AsyncStorage.setItem('sadhana-streak', newStreak.toString());
                await AsyncStorage.setItem('sadhana-last-active-date', today);
            }
        });
    };

    const activeBook = libraryBooks.find(b => b.id === activeBookId) || null;

    const setActiveChapterId = (id: string) => {
        setActiveChapterIdState(id);
        AsyncStorage.setItem('reader-active-chapter', id);
    };

    const setActiveBookId = (id: string | null) => {
        setActiveBookIdState(id);
        if (id) {
            AsyncStorage.setItem('reader-active-book', id);
            const targetBook = libraryBooks.find(b => b.id === id);
            if (targetBook && targetBook.chapters.length > 0) {
                setActiveChapterId(targetBook.chapters[0].id);
            }
        } else {
            AsyncStorage.removeItem('reader-active-book');
            setActiveChapterId('');
        }
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        AsyncStorage.setItem('reader-theme', newTheme);
    };

    const increaseFontSize = () => {
        setFontSizeState(prev => {
            const newValue = Math.min(prev + 2, 24);
            AsyncStorage.setItem('reader-font-size', newValue.toString());
            return newValue;
        });
    };

    const decreaseFontSize = () => {
        setFontSizeState(prev => {
            const newValue = Math.max(prev - 2, 16);
            AsyncStorage.setItem('reader-font-size', newValue.toString());
            return newValue;
        });
    };

    const resetFontSize = () => {
        const resetValue = 16;
        setFontSizeState(resetValue);
        AsyncStorage.setItem('reader-font-size', resetValue.toString());
    };

    const cycleFontFamily = () => {
        setFontFamilyState(prev => {
            let next: FontFamily = 'serif';
            if (prev === 'serif') next = 'sans';
            else if (prev === 'sans') next = 'slab';
            else next = 'serif';

            AsyncStorage.setItem('reader-font-family', next);
            return next;
        });
    };

    return (
        <ReaderContext.Provider value={{
            isReady,
            theme,
            setTheme,
            fontSize,
            increaseFontSize,
            decreaseFontSize,
            resetFontSize,
            fontFamily,
            cycleFontFamily,
            activeChapterId,
            setActiveChapterId,
            activeBookId,
            setActiveBookId,
            activeBook,
            books: libraryBooks,
            isSearchOpen,
            setSearchOpen,
            isSadhanaOpen,
            setSadhanaOpen,
            isDrawerOpen,
            setDrawerOpen,
            isChapterIndexOpen,
            setChapterIndexOpen,
            isTourActive,
            setTourActive,
            tourStep,
            setTourStep,
            sadhanaStreak,
            sadhanaTodayJap,
            recordSadhanaJap
        }}>
            {children}
        </ReaderContext.Provider>
    );
};

export const useReader = () => {
    const context = useContext(ReaderContext);
    if (context === undefined) {
        throw new Error('useReader must be used within a ReaderProvider');
    }
    return context;
};
