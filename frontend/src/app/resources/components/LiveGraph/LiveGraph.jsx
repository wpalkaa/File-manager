'use client';
import { useState, useEffect, useRef } from 'react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useTranslation } from '@/context/LanguageProvider';

import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import './liveGraph.css';

// import io from 'socket.io-client';
import mqtt from 'mqtt';

const graphConfigs = {
    cpu: {
        domain: [0, 100],
        yTickCount: 7,
        unit: '%'
    },
    memory: {
        domain: [0, 8000],
        yTickCount: 9,
        unit: 'MB'
    },
    disk: {
        domain: [0, 500],
        yTickCount: 6,
        unit: 'GB'
    }
};

export default function LiveGraph({ chartId }) {
    
    const { lang } = useTranslation();
    const clientRef = useRef();

    const config = graphConfigs[chartId] || graphConfigs['cpu'];
    const maxPoints = 10;
    const [ isConnected, setIsConnected ] = useState(false);
    
    const [data, setData] = useState(new Array(maxPoints).fill().map( (_, index) => ({
        time: new Date(Date.now() - (maxPoints*2  - (index+1)*2) * 1000).toLocaleTimeString("it-IT"),
        value: 0
    })));


    // ============ WebSocket connection and data handling ============

    // useEffect( () => {
    //     console.log("Connecting to WebSocket for chart ", chartId);
    //     const socket = io(process.env.NEXT_PUBLIC_SERVER_URL);

    //     socket.on("connect", () => {
    //         setIsConnected(true);
    //         console.log("Debug: Graph WebSocket connected.");
    //         console.log("Debug: requested data for: ", chartId);
    //         socket.emit('data request', { chartId: chartId} )
    //     });

    //     socket.on("error", (error) => {
    //         console.error("Error: Graph WebSocket error: \n", error);
    //     });


    //     socket.on("data update", (event) => {
    //         // console.log(`Debug: Received data for chart ${chartId}: \n`, event.data);

    //         setData( (prevData) => {
    //             const newData = [...prevData, event.data];
    //             console.log("Debug: Updated data array: \n", newData);

    //             if( newData.length > maxPoints ) {
    //                 return newData.slice(1) // keep only the last maxPoints entries
    //             }
    //             return newData;
    //         } );
    //     });

    //     return () => {
    //         console.log(`Debug: Cleaning up connection for: ${chartId}`);
    //         socket.removeAllListeners();
    //         socket.disconnect();
    //         console.log(`Debug: Charts ${chartId} WebSocket disconnected.`);
            
    //         setIsConnected(false);
    //     }

    // }, [chartId]);



    // ============ MQTT handler=============
    useEffect( () => {
        const BROKER_URL = process.env.NEXT_PUBLIC_MQTT_BROKER_URL;
        const client = mqtt.connect(BROKER_URL);
        
        clientRef.current = client;

        client.on('connect', () => {
            setIsConnected(true);

            const topic = `stats/${chartId}`;
            client.subscribe(topic, (error) => {
                if(error) console.error(`[Error]: Couldn't subscribe to ${topic}:\n${error}`);
            });
        });

        client.on('message', (topic, message) => {
            if(topic === `stats/${chartId}`) {
                const data = JSON.parse(message);

                setData( (prevData) => {
                    const newData = [...prevData, data];

                    if( newData.length > maxPoints ) {
                        return newData.slice(1) // keep only the last maxPoints entries
                    }
                    return newData;
                });
            };
        })

        return () => {
            if(client) {
                client.removeAllListeners();
                client.end();
            }
            setIsConnected(false);
        }

    }, [chartId]);


    if(!isConnected) {
        return (
            <div className="graph-loading">
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <LineChart width={550} height={400} data={data} className="graph">
            <XAxis dataKey={"time"} angle={-45} height={60} textAnchor="end" />
            <YAxis dataKey={"value"} domain={config.domain} tickCount={config.yTickCount}/>
            <Line dataKey={"value"} isAnimationActive={false} dot={false}/>
            <CartesianGrid stroke="#797979ff" strokeDasharray="1 1" />
            <Tooltip 
                labelFormatter={ (time) => [`${lang?.resources?.graphs?.tooltip?.time || 'Time: '}${time}`]}
                formatter={ (value) => [`${lang?.resources?.graphs?.tooltip?.usage || 'Usage: '}${value.toFixed(2)}${config.unit}`]}
                contentStyle={{
                    backgroundColor: '#1e293b',
                    border: "1px solid #334155"
                }}
                />
        </LineChart>
    )
}