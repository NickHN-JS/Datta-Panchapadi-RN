import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Book } from '../types/book';
import { libraryBooks } from '../data/library';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const APP_VERSION: string = require('../../package.json').version;

export type Theme = 'light' | 'dark' | 'papyrus';
export type FontFamily = 'serif' | 'sans' | 'slab';

function todayStr(): string {
    return new Date().toLocaleDateString('en-CA');
}

function yesterdayStr(): string {
    return new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
}

/**
 * Split into four contexts (instead of one big one) so a click that only
 * matters to one slice of state doesn't re-render everything else. The
 * previous single-context design meant opening the Drawer, toggling theme,
 * or tapping the jap counter re-rendered every mounted reading page (every
 * paragraph/heading/list block), which felt fine on short books and very
 * sluggish on long ones. Swiping stayed smooth throughout because the
 * carousel's animation runs on the UI thread, independent of JS-thread
 * re-render cost — but a button press has no such cushion, so the full
 * re-render cost was directly felt on every tap.
 *
 * - Settings: theme/font — read by content rendering (ChapterView) AND controls.
 * - Nav: which book/chapter is open — read by content + chrome.
 * - UI: modal/drawer open flags — read only by chrome and the modals themselves.
 * - Sadhana: jap counter/streak — changes rapidly during counting, isolated
 *   so it never touches the reading view.
 */

// ---------------------------------------------------------------------------
// Settings (theme, font size, font family)
// ---------------------------------------------------------------------------

interface ReaderSettingsContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    fontSize: number;
    increaseFontSize: () => void;
    decreaseFontSize: () => void;
    resetFontSize: () => void;
    fontFamily: FontFamily;
    cycleFontFamily: () => void;
}

const ReaderSettingsContext = createContext<ReaderSettingsContextType | undefined>(undefined);

export const useReaderSettings = () => {
    const ctx = useContext(ReaderSettingsContext);
    if (!ctx) throw new Error('useReaderSettings must be used within a ReaderProvider');
    return ctx;
};

// ---------------------------------------------------------------------------
// Navigation (active book/chapter)
// ---------------------------------------------------------------------------

interface ReaderNavContextType {
    isReady: boolean;
    activeChapterId: string;
    setActiveChapterId: (id: string) => void;
    activeBookId: string | null;
    setActiveBookId: (id: string | null) => void;
    activeBook: Book | null;
    books: Book[];
}

const ReaderNavContext = createContext<ReaderNavContextType | undefined>(undefined);

export const useReaderNav = () => {
    const ctx = useContext(ReaderNavContext);
    if (!ctx) throw new Error('useReaderNav must be used within a ReaderProvider');
    return ctx;
};

// ---------------------------------------------------------------------------
// UI (modal/drawer open flags, onboarding tour)
// ---------------------------------------------------------------------------

interface ReaderUIContextType {
    isSearchOpen: boolean;
    setSearchOpen: (open: boolean) => void;
    isSadhanaOpen: boolean;
    setSadhanaOpen: (open: boolean) => void;
    sadhanaActiveTab: 'jap' | 'stats';
    setSadhanaActiveTab: (tab: 'jap' | 'stats') => void;
    isDrawerOpen: boolean;
    setDrawerOpen: (open: boolean) => void;
    isChapterIndexOpen: boolean;
    setChapterIndexOpen: (open: boolean) => void;
    isTourActive: boolean;
    setTourActive: (active: boolean) => void;
    tourStep: number;
    setTourStep: (step: number) => void;
}

const ReaderUIContext = createContext<ReaderUIContextType | undefined>(undefined);

export const useReaderUI = () => {
    const ctx = useContext(ReaderUIContext);
    if (!ctx) throw new Error('useReaderUI must be used within a ReaderProvider');
    return ctx;
};

// ---------------------------------------------------------------------------
// Sadhana (jap counter / streak)
// ---------------------------------------------------------------------------

interface SadhanaContextType {
    sadhanaStreak: number;
    sadhanaTodayJap: number;
    recordSadhanaJap: (count: number) => void;
}

const SadhanaContext = createContext<SadhanaContextType | undefined>(undefined);

export const useSadhana = () => {
    const ctx = useContext(SadhanaContext);
    if (!ctx) throw new Error('useSadhana must be used within a ReaderProvider');
    return ctx;
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

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
    const [sadhanaActiveTab, setSadhanaActiveTab] = useState<'jap' | 'stats'>('jap');
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

    const setTourActive = useCallback((active: boolean) => {
        setTourActiveState(active);
        if (!active) {
            AsyncStorage.setItem(`reader-tour-completed-${APP_VERSION}`, 'true');
        }
    }, []);

    const recordSadhanaJap = useCallback((count: number) => {
        if (count <= 0) return;
        const today = todayStr();

        AsyncStorage.getItem('sadhana-last-active-date').then(async (storedLastDate) => {
            const lastDate = storedLastDate || '';

            setSadhanaTodayJap(prev => {
                const newTodayJap = prev + count;
                AsyncStorage.setItem('sadhana-today-jap', newTodayJap.toString());
                AsyncStorage.setItem(`sadhana-jap-${today}`, newTodayJap.toString());
                return newTodayJap;
            });

            const totalJapStr = (await AsyncStorage.getItem('sadhana-total-jap')) || '0';
            const newTotalJap = parseInt(totalJapStr, 10) + count;
            await AsyncStorage.setItem('sadhana-total-jap', newTotalJap.toString());

            if (lastDate !== today) {
                const yesterday = yesterdayStr();
                setSadhanaStreak(prev => {
                    const newStreak = lastDate === yesterday ? prev + 1 : 1;
                    AsyncStorage.setItem('sadhana-streak', newStreak.toString());
                    return newStreak;
                });
                await AsyncStorage.setItem('sadhana-last-active-date', today);
            }
        });
    }, []);

    const setActiveChapterId = useCallback((id: string) => {
        setActiveChapterIdState(id);
        AsyncStorage.setItem('reader-active-chapter', id);
    }, []);

    const setActiveBookId = useCallback((id: string | null) => {
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
    }, [setActiveChapterId]);

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        AsyncStorage.setItem('reader-theme', newTheme);
    }, []);

    const increaseFontSize = useCallback(() => {
        setFontSizeState(prev => {
            const newValue = Math.min(prev + 2, 24);
            AsyncStorage.setItem('reader-font-size', newValue.toString());
            return newValue;
        });
    }, []);

    const decreaseFontSize = useCallback(() => {
        setFontSizeState(prev => {
            const newValue = Math.max(prev - 2, 16);
            AsyncStorage.setItem('reader-font-size', newValue.toString());
            return newValue;
        });
    }, []);

    const resetFontSize = useCallback(() => {
        const resetValue = 16;
        setFontSizeState(resetValue);
        AsyncStorage.setItem('reader-font-size', resetValue.toString());
    }, []);

    const cycleFontFamily = useCallback(() => {
        setFontFamilyState(prev => {
            let next: FontFamily = 'serif';
            if (prev === 'serif') next = 'sans';
            else if (prev === 'sans') next = 'slab';
            else next = 'serif';

            AsyncStorage.setItem('reader-font-family', next);
            return next;
        });
    }, []);

    const activeBook = useMemo(() => libraryBooks.find(b => b.id === activeBookId) || null, [activeBookId]);

    const settingsValue = useMemo<ReaderSettingsContextType>(() => ({
        theme, setTheme, fontSize, increaseFontSize, decreaseFontSize, resetFontSize, fontFamily, cycleFontFamily,
    }), [theme, setTheme, fontSize, increaseFontSize, decreaseFontSize, resetFontSize, fontFamily, cycleFontFamily]);

    const navValue = useMemo<ReaderNavContextType>(() => ({
        isReady, activeChapterId, setActiveChapterId, activeBookId, setActiveBookId, activeBook, books: libraryBooks,
    }), [isReady, activeChapterId, setActiveChapterId, activeBookId, setActiveBookId, activeBook]);

    const uiValue = useMemo<ReaderUIContextType>(() => ({
        isSearchOpen, setSearchOpen, isSadhanaOpen, setSadhanaOpen, sadhanaActiveTab, setSadhanaActiveTab,
        isDrawerOpen, setDrawerOpen, isChapterIndexOpen, setChapterIndexOpen, isTourActive, setTourActive, tourStep, setTourStep,
    }), [isSearchOpen, isSadhanaOpen, sadhanaActiveTab, isDrawerOpen, isChapterIndexOpen, isTourActive, setTourActive, tourStep]);

    const sadhanaValue = useMemo<SadhanaContextType>(() => ({
        sadhanaStreak, sadhanaTodayJap, recordSadhanaJap,
    }), [sadhanaStreak, sadhanaTodayJap, recordSadhanaJap]);

    return (
        <ReaderSettingsContext.Provider value={settingsValue}>
            <ReaderNavContext.Provider value={navValue}>
                <ReaderUIContext.Provider value={uiValue}>
                    <SadhanaContext.Provider value={sadhanaValue}>
                        {children}
                    </SadhanaContext.Provider>
                </ReaderUIContext.Provider>
            </ReaderNavContext.Provider>
        </ReaderSettingsContext.Provider>
    );
};
