const mqtt = require('mqtt');

const BROKER = process.env.BROKER_URL;

let mqttClient = null;

const MQTTConnect = () => {
    if (!BROKER) return null;
    try {
        const client = mqtt.connect(BROKER);
        mqttClient = client;

        client.on('connect', () => {
            console.log(`[Info]: Server connected to MQTT broker.`);

            setInterval(() => {
                const time = new Date().toLocaleTimeString("pl-PL");

                const cpuData = {
                    time: time,
                    value: Math.random() * 100
                };
                client.publish('stats/cpu', JSON.stringify(cpuData));

                const memData = {
                    time: time,
                    value: Math.random() * 8000
                };
                client.publish('stats/memory', JSON.stringify(memData));

                const diskData = {
                    time: time,
                    value: Math.random() * 10
                };
                client.publish('stats/disk', JSON.stringify(diskData));

            }, 2000);
        });

        client.on('error', (err) => {
            console.error('[MQTT] Connection error:', err);
        });

        return client;
    } catch (err) {
        console.error('[MQTT] Connect exception:', err);
        return null;
    }
};

const publishFileEvent = (eventPayload) => {
    if (mqttClient && mqttClient.connected) {
        try {
            const payload = typeof eventPayload === 'string' ? eventPayload : JSON.stringify(eventPayload);
            mqttClient.publish('files/updates', payload);
            mqttClient.publish('files/events', payload);
        } catch (e) {
            console.error('[MQTT] Publish error:', e);
        }
    }
};

module.exports = MQTTConnect;
module.exports.publishFileEvent = publishFileEvent;
module.exports.MQTTConnect = MQTTConnect;
