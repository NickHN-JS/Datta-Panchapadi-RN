import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useReaderSettings, useReaderUI, useSadhana } from '../../context/ReaderContext';
import { themeVars } from '../../theme/tokens';
import { TourTarget } from './TourTarget';

function dateStr(d: Date): string {
    return d.toLocaleDateString('en-CA');
}

interface DayStat {
    dateStr: string;
    dayLabel: string;
    active: boolean;
    japs: number;
}

interface SadhanaStats {
    weeklyJaps: number;
    monthlyJaps: number;
    past7Days: DayStat[];
    totalJapsCompleted: number;
}

async function loadSadhanaStats(): Promise<SadhanaStats> {
    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - distanceToMonday);

    const weekDates: string[] = [];
    for (let i = 0; i <= distanceToMonday; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        weekDates.push(dateStr(d));
    }

    const monthDates: string[] = [];
    const year = now.getFullYear();
    const month = now.getMonth();
    for (let i = 1; i <= now.getDate(); i++) {
        monthDates.push(dateStr(new Date(year, month, i)));
    }

    const past7Dates: { dateStr: string; dayLabel: string }[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        past7Dates.push({ dateStr: dateStr(d), dayLabel: d.toLocaleDateString('mr-IN', { weekday: 'short' }) });
    }

    const allDates = Array.from(new Set([...weekDates, ...monthDates, ...past7Dates.map(p => p.dateStr)]));
    const keys = [...allDates.map(d => `sadhana-jap-${d}`), 'sadhana-total-jap', 'sadhana-rounds-completed'];
    const pairs = await AsyncStorage.multiGet(keys);
    const values = Object.fromEntries(pairs);

    const japsFor = (d: string) => parseInt(values[`sadhana-jap-${d}`] || '0', 10);

    return {
        weeklyJaps: weekDates.reduce((sum, d) => sum + japsFor(d), 0),
        monthlyJaps: monthDates.reduce((sum, d) => sum + japsFor(d), 0),
        past7Days: past7Dates.map(p => ({ ...p, active: japsFor(p.dateStr) > 0, japs: japsFor(p.dateStr) })),
        totalJapsCompleted: parseInt(values['sadhana-total-jap'] || '0', 10),
    };
}

const triggerHaptic = (pattern: number | 'success' | 'reset') => {
    try {
        if (pattern === 'success') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (pattern === 'reset') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
            Haptics.impactAsync(pattern <= 30 ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
        }
    } catch (err) {
        console.error('Haptic error', err);
    }
};

export const SadhanaModal: React.FC = () => {
    const { theme } = useReaderSettings();
    const { isSadhanaOpen, setSadhanaOpen, sadhanaActiveTab: activeTab, setSadhanaActiveTab: setActiveTab } = useReaderUI();
    const { sadhanaStreak, sadhanaTodayJap, recordSadhanaJap } = useSadhana();

    const [localJap, setLocalJap] = useState(0);
    const [rounds, setRounds] = useState(0);
    const [showRoundComplete, setShowRoundComplete] = useState(false);
    const [stats, setStats] = useState<SadhanaStats | null>(null);

    useEffect(() => {
        if (!isSadhanaOpen) return;
        AsyncStorage.getItem('sadhana-rounds-completed').then(v => setRounds(v ? parseInt(v, 10) : 0));
        loadSadhanaStats().then(setStats);
    }, [isSadhanaOpen]);

    const refreshStats = useCallback(() => {
        loadSadhanaStats().then(setStats);
    }, []);

    if (!isSadhanaOpen) return null;

    const handleJapIncrement = () => {
        triggerHaptic(30);
        recordSadhanaJap(1);

        setLocalJap(prev => {
            const next = prev + 1;
            if (next >= 108) {
                triggerHaptic('success');
                const nextRounds = rounds + 1;
                setRounds(nextRounds);
                AsyncStorage.setItem('sadhana-rounds-completed', nextRounds.toString());
                setShowRoundComplete(true);
                refreshStats();
                return 0;
            }
            setShowRoundComplete(false);
            return next;
        });
    };

    const handleResetCounter = () => {
        Alert.alert(
            'काउंटर रीसेट करायचे?',
            'तुम्हाला नक्की काउंटर शून्यावर सेट करायचे आहे का?',
            [
                { text: 'रद्द करा', style: 'cancel' },
                {
                    text: 'रीसेट करा',
                    style: 'destructive',
                    onPress: () => {
                        setLocalJap(0);
                        setRounds(0);
                        setShowRoundComplete(false);
                        AsyncStorage.setItem('sadhana-rounds-completed', '0');
                        triggerHaptic('reset');
                    },
                },
            ]
        );
    };

    const totalRoundsCompleted = stats ? Math.floor(stats.totalJapsCompleted / 108) : 0;

    const handleClose = () => setSadhanaOpen(false);

    return (
        <Modal transparent={false} visible animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
            <SafeAreaView style={themeVars[theme]} className="flex-1 bg-background" edges={['top', 'left', 'right', 'bottom']}>
                <View className="flex-row items-center justify-between border-b border-ink/10 pb-3 px-4">
                    <Pressable
                        onPress={handleClose}
                        accessibilityLabel="मागे"
                        className="w-11 h-11 items-center justify-center rounded-full active:bg-black/5"
                    >
                        <Text className="text-ink text-xl">←</Text>
                    </Pressable>

                    <View className="flex-row bg-black/5 p-1 rounded-full border border-ink/5">
                        <TourTarget id="tour-sadhana-jap-tab">
                            <Pressable
                                onPress={() => setActiveTab('jap')}
                                className={`px-5 py-1.5 rounded-full ${activeTab === 'jap' ? 'bg-primary' : ''}`}
                            >
                                <Text className={`text-xs font-sans-bold ${activeTab === 'jap' ? 'text-on-primary' : 'text-ink/75'}`}>
                                    नामस्मरण
                                </Text>
                            </Pressable>
                        </TourTarget>
                        <TourTarget id="tour-sadhana-stats-tab">
                            <Pressable
                                onPress={() => setActiveTab('stats')}
                                className={`px-5 py-1.5 rounded-full ${activeTab === 'stats' ? 'bg-primary' : ''}`}
                            >
                                <Text className={`text-xs font-sans-bold ${activeTab === 'stats' ? 'text-on-primary' : 'text-ink/75'}`}>
                                    माझी साधना
                                </Text>
                            </Pressable>
                        </TourTarget>
                    </View>

                    <View className="w-11 h-11" />
                </View>

                <ScrollView className="flex-1 mt-6 px-4" contentContainerStyle={{ alignItems: 'center', paddingBottom: 24 }}>
                    {activeTab === 'jap' ? (
                        <View className="w-full items-center gap-5">
                            <TourTarget id="tour-sadhana-mantra" style={{ width: '100%' }}>
                                <View className="w-full bg-surface-container border border-amber-600/20 px-5 py-4 rounded-3xl items-center gap-1.5">
                                    <Text className="text-[10px] font-sans-bold uppercase tracking-widest text-amber-800">
                                        सिद्ध महामंत्र
                                    </Text>
                                    <Text className="text-xl font-serif-bold text-ink text-center" style={{ lineHeight: 32 }}>
                                        ॥ दिगंबरा दिगंबरा श्रीपाद वल्लभ दिगंबरा ॥
                                    </Text>
                                </View>
                            </TourTarget>

                            <View className="items-center gap-3 my-2">
                                <TourTarget id="tour-sadhana-bead">
                                    <Pressable
                                        onPress={handleJapIncrement}
                                        className={`w-40 h-40 rounded-full border-[3px] items-center justify-center ${
                                            showRoundComplete ? 'bg-green-100 border-green-600' : 'bg-surface-container border-amber-600/30'
                                        }`}
                                    >
                                        <Text className={`text-[10px] font-sans-bold uppercase tracking-widest mb-1 ${showRoundComplete ? 'text-green-800/70' : 'text-ink/40'}`}>
                                            टॅप करा (TAP)
                                        </Text>
                                        <Text className={`text-4xl font-black ${showRoundComplete ? 'text-green-900' : 'text-primary'}`}>
                                            {localJap}
                                        </Text>
                                        <View className={`w-9 h-px my-2 ${showRoundComplete ? 'bg-green-900/20' : 'bg-ink/10'}`} />
                                        <Text className={`text-[10px] font-sans-bold ${showRoundComplete ? 'text-green-800' : 'text-ink/60'}`}>
                                            माळ फेऱ्या: {rounds} ({rounds * 108 + localJap} एकूण)
                                        </Text>
                                    </Pressable>
                                </TourTarget>

                                {(localJap > 0 || rounds > 0) && (
                                    <Pressable
                                        onPress={handleResetCounter}
                                        className="px-4 py-1.5 border border-red-500/30 rounded-full active:bg-red-500/5"
                                    >
                                        <Text className="text-xs font-sans-bold text-red-600">🔄 पुनःस्थापन (Reset Counter)</Text>
                                    </Pressable>
                                )}
                            </View>
                        </View>
                    ) : (
                        <TourTarget id="tour-sadhana-stats-content" style={{ width: '100%' }}>
                        <View className="w-full gap-6">
                            <View className="flex-row gap-4 w-full">
                                <View className="flex-1 bg-surface-container p-5 rounded-3xl border border-ink/5 items-center gap-1.5">
                                    <Text className="text-4xl">🔥</Text>
                                    <Text className="text-base font-sans-bold text-ink">{sadhanaStreak} दिवस</Text>
                                    <Text className="text-[10px] font-sans-bold opacity-60 uppercase tracking-wider">सतत नामस्मरण</Text>
                                </View>
                                <View className="flex-1 bg-surface-container p-5 rounded-3xl border border-ink/5 items-center gap-1.5">
                                    <Text className="text-4xl">📿</Text>
                                    <Text className="text-base font-sans-bold text-ink">{sadhanaTodayJap}</Text>
                                    <Text className="text-[10px] font-sans-bold opacity-60 uppercase tracking-wider">आजचा जप</Text>
                                </View>
                            </View>

                            <View className="w-full bg-surface-container p-5 rounded-3xl border border-ink/5 gap-4">
                                <Text className="font-sans-bold text-xs uppercase tracking-wider text-ink/45 pl-1 border-l-2 border-amber-600">
                                    नामस्मरण अहवाल (Chanting Report)
                                </Text>
                                <View className="flex-row gap-2.5">
                                    <View className="flex-1 bg-black/[0.03] p-3.5 rounded-2xl items-center border border-ink/5">
                                        <Text className="text-[10px] font-sans-bold opacity-60 mb-1">☀️ आज</Text>
                                        <Text className="text-xs font-sans-bold text-ink">{sadhanaTodayJap} जप</Text>
                                    </View>
                                    <View className="flex-1 bg-black/[0.03] p-3.5 rounded-2xl items-center border border-ink/5">
                                        <Text className="text-[10px] font-sans-bold opacity-60 mb-1">📅 आठवडा</Text>
                                        <Text className="text-xs font-sans-bold text-ink">{stats?.weeklyJaps ?? 0} जप</Text>
                                    </View>
                                    <View className="flex-1 bg-black/[0.03] p-3.5 rounded-2xl items-center border border-ink/5">
                                        <Text className="text-[10px] font-sans-bold opacity-60 mb-1">📊 महिना</Text>
                                        <Text className="text-xs font-sans-bold text-ink">{stats?.monthlyJaps ?? 0} जप</Text>
                                    </View>
                                </View>
                            </View>

                            <View className="w-full bg-surface-container p-5 rounded-3xl border border-ink/5 gap-4">
                                <Text className="font-sans-bold text-xs uppercase tracking-wider text-ink/40 pl-1 border-l-2 border-amber-600">
                                    एकूण आकडेवारी (Lifetime Totals)
                                </Text>
                                <View className="flex-row">
                                    <View className="flex-1 items-center border-r border-ink/10">
                                        <Text className="text-xs opacity-60 font-sans">एकूण माळ फेऱ्या</Text>
                                        <Text className="text-xl font-sans-bold text-ink mt-1">{totalRoundsCompleted}</Text>
                                    </View>
                                    <View className="flex-1 items-center">
                                        <Text className="text-xs opacity-60 font-sans">एकूण जाप संख्या</Text>
                                        <Text className="text-xl font-sans-bold text-ink mt-1">{stats?.totalJapsCompleted ?? 0}</Text>
                                    </View>
                                </View>
                            </View>

                            <View className="w-full bg-surface-container p-5 rounded-3xl border border-ink/5">
                                <Text className="font-sans-bold text-xs uppercase tracking-wider text-ink/40 mb-4 pl-1 border-l-2 border-amber-600">
                                    गेल्या ७ दिवसांचा इतिहास (Last 7 Days)
                                </Text>
                                <View className="flex-row justify-between">
                                    {(stats?.past7Days ?? []).map((day, idx) => (
                                        <View key={idx} className="items-center gap-2">
                                            <Text className="text-[10px] font-sans-medium opacity-60">{day.dayLabel}</Text>
                                            <View
                                                className={`w-10 h-10 rounded-full items-center justify-center border ${
                                                    day.active ? 'bg-amber-600 border-amber-500' : 'bg-black/[0.03] border-ink/10 opacity-40'
                                                }`}
                                            >
                                                <Text className={day.active ? 'text-white font-bold' : 'text-ink'}>
                                                    {day.active ? '✓' : '•'}
                                                </Text>
                                            </View>
                                            <Text className="text-[8px] opacity-50">{day.japs > 0 ? `${day.japs}` : ''}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                        </TourTarget>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};
