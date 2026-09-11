import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Pressable, Dimensions, Modal } from 'react-native';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import { useReaderNav, useReaderSettings, useReaderUI } from '../../context/ReaderContext';
import { themeVars } from '../../theme/tokens';
import { getTourTargetRef } from '../../lib/tourRegistry';

interface TourStep {
    target: string;
    title: string;
    content: string;
    actionBefore?: () => void;
}

interface Coords {
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOOLTIP_WIDTH = Math.min(320, SCREEN_WIDTH - 32);
const TOOLTIP_HEIGHT = 260;
const MARGIN = 16;

function borderRadiusFor(target: string): number {
    if (target.includes('button') || target.includes('tab') || target.includes('bead')) return 9999;
    if (target.includes('utility')) return 28;
    if (target.includes('card') || target.includes('mantra') || target.includes('books')) return 24;
    return 12;
}

export const ProductTour: React.FC = () => {
    const {
        isTourActive, setTourActive, tourStep, setTourStep,
        setSadhanaOpen, setDrawerOpen, setChapterIndexOpen, setSadhanaActiveTab,
    } = useReaderUI();
    const { setActiveBookId, books } = useReaderNav();
    const { theme } = useReaderSettings();

    const [coords, setCoords] = useState<Coords | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const steps: TourStep[] = [
        {
            target: '',
            title: 'स्वागत आहे! 🪔',
            content: 'श्रीदत्त पंचपदी ॲपमध्ये आपले स्वागत आहे. नित्य उपासना आणि भक्तिभावाने पंचपदी वाचनासाठी तयार केलेले हे आपले वैयक्तिक दालन आहे. चला एका लहान मार्गदर्शकाद्वारे यातील वैशिष्ट्ये समजून घेऊया.',
            actionBefore: () => { setActiveBookId(null); setSadhanaOpen(false); setDrawerOpen(false); },
        },
        {
            target: 'tour-menu-button',
            title: 'मुख्य मेनू ☰',
            content: 'येथून आपण मुख्य वाचनालय, पंचपदी संग्रह, नित्य साधना (Chanting) आणि शोध वैशिष्ट्यांमध्ये प्रवेश करू शकता.',
            actionBefore: () => { setActiveBookId(null); setSadhanaOpen(false); setDrawerOpen(false); },
        },
        {
            target: 'tour-search-button',
            title: 'पंचपदीमध्ये शोध 🔍',
            content: 'येथून आपण कोणत्याही ओवी किंवा पदाला संपूर्ण पंचपदीमध्ये एका सेकंदात शोधू शकता.',
            actionBefore: () => { setActiveBookId(null); setSadhanaOpen(false); setDrawerOpen(false); },
        },
        {
            target: 'tour-drawer-books',
            title: 'पंचपदी संग्रह 📖',
            content: 'येथे आपल्याला वाचनासाठी उपलब्ध असलेल्या सर्व पंचपदी मिळतील. वाचन सुरू करण्यासाठी त्यावर क्लिक करा.',
            actionBefore: () => { setActiveBookId(null); setSadhanaOpen(false); setDrawerOpen(true); },
        },
        {
            target: 'tour-drawer-sadhana',
            title: 'माझी नित्य साधना 📿',
            content: 'तुमचा दैनिक नामजप करण्यासाठी, मंत्रांचे उच्चारण आणि आपल्या साधनेची प्रगती अहवाल जतन करण्यासाठी या साधनाचा वापर करा.',
            actionBefore: () => { setActiveBookId(null); setSadhanaOpen(false); setDrawerOpen(true); },
        },
        {
            target: 'tour-reader-pages',
            title: 'पंचपदी वाचन 📖',
            content: 'येथे आपण पंचपदी वाचन करू शकता. पाने बदलण्यासाठी डावीकडे/उजवीकडे स्वाइप करा.',
            actionBefore: () => {
                setDrawerOpen(false);
                const guruvarchiBook = books.find(b => b.id === 'guruvarchi');
                if (guruvarchiBook) setActiveBookId(guruvarchiBook.id);
                setSadhanaOpen(false);
            },
        },
        {
            target: 'tour-utility-bar',
            title: 'वाचन पर्याय ⚙️',
            content: 'येथून आपण वाचनाची पार्श्वभूमी (Themes - ☀️/🌙/📜) बदलू शकता आणि डोळ्यांच्या सोयीसाठी अक्षरांचा आकार (Font Size) कमी-जास्त करू शकता.',
            actionBefore: () => {
                setDrawerOpen(false);
                const guruvarchiBook = books.find(b => b.id === 'guruvarchi');
                if (guruvarchiBook) setActiveBookId(guruvarchiBook.id);
                setSadhanaOpen(false);
            },
        },
        {
            target: 'tour-chapter-index-panel',
            title: 'अनुक्रमणिका 📜',
            content: 'हेडरमधील अनुक्रमणिका बटणावर टॅप केल्यास येथे या पंचपदीतील सर्व पदांची संपूर्ण यादी दिसते. चालू पद ठळक दिसते आणि कोणत्याही पदावर टॅप करून तुम्ही थेट तिथे पोहोचू शकता.',
            actionBefore: () => {
                setDrawerOpen(false);
                const guruvarchiBook = books.find(b => b.id === 'guruvarchi');
                if (guruvarchiBook) setActiveBookId(guruvarchiBook.id);
                setSadhanaOpen(false);
                setChapterIndexOpen(true);
            },
        },
        {
            target: 'tour-sadhana-mantra',
            title: 'सिद्ध महामंत्र 🌟',
            content: 'येथे श्रीदत्तांचा सिद्ध महामंत्र "दिगंबरा दिगंबरा श्रीपाद वल्लभ दिगंबरा" भक्तीभावाने जपण्यासाठी दिला आहे.',
            actionBefore: () => {
                setActiveBookId(null);
                setDrawerOpen(false);
                setSadhanaActiveTab('jap');
                setSadhanaOpen(true);
            },
        },
        {
            target: 'tour-sadhana-bead',
            title: 'नामजप मणी 📿',
            content: 'प्रत्येक जपानंतर या मण्यावर टॅप करा. १०८ जप पूर्ण झाल्यावर एक माळ पूर्ण होईल आणि व्हायब्रेशनद्वारे सूचित केले जाईल.',
            actionBefore: () => {
                setActiveBookId(null);
                setDrawerOpen(false);
                setSadhanaActiveTab('jap');
                setSadhanaOpen(true);
            },
        },
        {
            target: 'tour-sadhana-stats-tab',
            title: 'साधना अहवाल टॅब 📊',
            content: 'आपल्या साधनेची प्रगती आणि इतिहास पाहण्यासाठी या "माझी साधना" टॅबचा वापर करू शकता.',
            actionBefore: () => {
                setActiveBookId(null);
                setDrawerOpen(false);
                setSadhanaOpen(true);
                setSadhanaActiveTab('stats');
            },
        },
        {
            target: 'tour-sadhana-stats-content',
            title: 'साधना इतिहास 📈',
            content: 'येथे आपल्याला गेल्या ७ दिवसांचा नामजप इतिहास, सतत साधनेचे दिवस (Streaks) आणि एकूण आकडेवारीचा अहवाल सविस्तर पाहायला मिळतो.',
            actionBefore: () => {
                setActiveBookId(null);
                setDrawerOpen(false);
                setSadhanaOpen(true);
                setSadhanaActiveTab('stats');
            },
        },
        {
            target: '',
            title: 'टूर पूर्ण झाली! 🎉',
            content: 'अभिनंदन! आपण श्रीदत्त पंचपदी ॲपची सर्व वैशिष्ट्ये पाहिली आहेत. आता आपण आपली साधना आणि पंचपदी वाचन सुरू करण्यास सज्ज आहात. श्री गुरुदेव दत्त! 🙏',
            actionBefore: () => { setActiveBookId(null); setDrawerOpen(false); setSadhanaOpen(false); },
        },
    ];

    useEffect(() => {
        if (!isTourActive) return undefined;

        const currentStep = steps[tourStep];
        if (!currentStep) return undefined;

        currentStep.actionBefore?.();

        const updateCoords = () => {
            if (!currentStep.target) {
                setCoords(null);
                return;
            }
            const ref = getTourTargetRef(currentStep.target);
            ref?.current?.measureInWindow((x, y, width, height) => {
                if (width > 0 && height > 0) {
                    setCoords({ x, y, width, height, borderRadius: borderRadiusFor(currentStep.target) });
                }
            });
        };

        const delayTimer = setTimeout(updateCoords, 300);
        pollRef.current = setInterval(updateCoords, 400);

        return () => {
            clearTimeout(delayTimer);
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [tourStep, isTourActive]);

    if (!isTourActive) return null;

    const currentStep = steps[tourStep];
    const isLastStep = tourStep === steps.length - 1;

    const handleNext = () => {
        if (isLastStep) setTourActive(false);
        else setTourStep(tourStep + 1);
    };

    const handleBack = () => {
        if (tourStep > 0) setTourStep(tourStep - 1);
    };

    const handleSkip = () => {
        setActiveBookId(null);
        setSadhanaOpen(false);
        setDrawerOpen(false);
        setTourActive(false);
    };

    let tooltipTop: number;
    let tooltipLeft: number;

    if (coords) {
        const spaceBelow = SCREEN_HEIGHT - (coords.y + coords.height);
        const spaceAbove = coords.y;

        if (spaceBelow > TOOLTIP_HEIGHT + MARGIN || spaceBelow > spaceAbove) {
            tooltipTop = coords.y + coords.height + MARGIN;
        } else {
            tooltipTop = coords.y - TOOLTIP_HEIGHT - MARGIN;
        }

        tooltipLeft = coords.x + coords.width / 2 - TOOLTIP_WIDTH / 2;
        if (tooltipLeft < MARGIN) tooltipLeft = MARGIN;
        if (tooltipLeft + TOOLTIP_WIDTH > SCREEN_WIDTH - MARGIN) tooltipLeft = SCREEN_WIDTH - TOOLTIP_WIDTH - MARGIN;
        if (tooltipTop < MARGIN) tooltipTop = MARGIN;
        if (tooltipTop + TOOLTIP_HEIGHT > SCREEN_HEIGHT - MARGIN) tooltipTop = SCREEN_HEIGHT - TOOLTIP_HEIGHT - MARGIN;
    } else {
        tooltipTop = SCREEN_HEIGHT / 2 - TOOLTIP_HEIGHT / 2;
        tooltipLeft = SCREEN_WIDTH / 2 - TOOLTIP_WIDTH / 2;
    }

    return (
        <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={handleSkip}>
        <View style={[themeVars[theme], { flex: 1 }]}>
            <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%">
                <Defs>
                    <Mask id="tourSpotlightMask" x="0" y="0" width="100%" height="100%">
                        <Rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {coords && (
                            <Rect
                                x={coords.x - 6}
                                y={coords.y - 6}
                                width={coords.width + 12}
                                height={coords.height + 12}
                                rx={coords.borderRadius}
                                ry={coords.borderRadius}
                                fill="black"
                            />
                        )}
                    </Mask>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#tourSpotlightMask)" />
            </Svg>

            <View
                className="bg-surface border border-amber-600/30 rounded-3xl p-5"
                style={{ position: 'absolute', top: tooltipTop, left: tooltipLeft, width: TOOLTIP_WIDTH }}
            >
                <View className="h-1 w-full bg-amber-500 rounded-full mb-3" />

                <View className="flex-row items-center justify-between mb-2">
                    <Text className="font-serif-bold text-base text-red-800 flex-1 mr-2">{currentStep.title}</Text>
                    <Text className="font-sans-bold text-[10px] bg-amber-600/10 text-amber-700 px-2 py-0.5 rounded-full">
                        {tourStep + 1} / {steps.length}
                    </Text>
                </View>

                <Text className="font-sans text-xs text-ink/75 leading-relaxed mb-3">{currentStep.content}</Text>

                <View className="flex-row items-center justify-center gap-1 mb-3">
                    {steps.map((_, idx) => (
                        <View
                            key={idx}
                            className={`h-1.5 rounded-full ${idx === tourStep ? 'w-3 bg-amber-600' : 'w-1.5 bg-ink/15'}`}
                        />
                    ))}
                </View>

                <View className="flex-row items-center justify-between pt-2 border-t border-ink/5">
                    <Pressable onPress={handleSkip} className="px-3 py-1.5 rounded-full active:bg-red-500/5">
                        <Text className="font-sans-bold text-xs text-red-600">टूर वगळा (Skip)</Text>
                    </Pressable>

                    <View className="flex-row items-center gap-1.5">
                        {tourStep > 0 && (
                            <Pressable onPress={handleBack} className="px-3 py-1.5 rounded-full border border-ink/15 active:bg-black/5">
                                <Text className="font-sans-bold text-xs text-ink">← मागे</Text>
                            </Pressable>
                        )}
                        <Pressable onPress={handleNext} className="px-3 py-1.5 rounded-full bg-primary active:opacity-80">
                            <Text className="font-sans-bold text-xs text-on-primary">
                                {isLastStep ? 'सुरू करा (Start)' : 'पुढे →'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </View>
        </Modal>
    );
};
