'use client';

import { useEffect } from 'react';
import mqtt from 'mqtt';

/**
 * Subscribes to MQTT topics for file change events and calls onUpdate
 * whenever a relevant message arrives. Cleans up connection on unmount
 * or when currentPath changes.
 */
export function useMqttFileSync(currentPath, onUpdate) {
    useEffect(() => {
        const brokerUrl = process.env.NEXT_PUBLIC_MQTT_BROKER_URL;
        if (!brokerUrl || typeof window === 'undefined') return;

        let client = null;
        try {
            client = mqtt.connect(brokerUrl);

            client.on('connect', () => {
                const topics = ['files/updates', 'files/changed', 'files/events'];
                topics.forEach((topic) => {
                    client.subscribe(topic, (err) => {
                        if (err) console.error(`[MQTT Files]: subscribe error on ${topic}:`, err);
                    });
                });
            });

            client.on('message', (topic) => {
                if (['files/updates', 'files/changed', 'files/events'].includes(topic)) {
                    onUpdate();
                }
            });

            client.on('error', (err) => {
                console.error('[MQTT Files]: connection error:', err);
            });
        } catch (err) {
            console.error('[MQTT Files]: failed to connect:', err);
        }

        return () => {
            if (client) client.end();
        };
    }, [currentPath, onUpdate]);
}
