import React, { useEffect, useRef } from 'react';
import { View, type ViewStyle } from 'react-native';
import { registerTourTarget, unregisterTourTarget } from '../../lib/tourRegistry';

/**
 * Wrap any existing element to make it a tour spotlight target, mirroring
 * the web version's `id="tour-xxx"` + document.querySelector approach.
 * `collapsable={false}` is required on Android so the view isn't optimized
 * away before measureInWindow can find it.
 */
export const TourTarget: React.FC<{ id: string; children: React.ReactNode; style?: ViewStyle }> = ({ id, children, style }) => {
    const ref = useRef<View>(null);

    useEffect(() => {
        registerTourTarget(id, ref);
        return () => unregisterTourTarget(id, ref);
    }, [id]);

    return (
        <View ref={ref} style={style} collapsable={false}>
            {children}
        </View>
    );
};
