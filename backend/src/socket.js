module.exports = ( io ) => {
    io.on('connection', (socket) => {
        console.log("Client successfully connected via WebSocket!");
        socket.send("Server: WebSocket connection established.");

        const activeIntervals = new Set();

        socket.on('message', (message) => {
            console.log("Received message: %s", message);
        });

        socket.on('data request', (msg) => {
            console.log("Data request received for chartId: ", msg.chartId);

            // Simulate sending data updates every 2 seconds
            const intervalId = setInterval( () => {
                const data = {
                    time: new Date().toLocaleTimeString("pl-PL")
                };

                switch( msg.chartId ) {
                    case 'cpu':
                        data.value = Math.random() * 100;
                        break;

                    case 'memory':
                        data.value = Math.random() * 8000;
                        break;
                    
                    case 'disk':
                        data.value = Math.random() * 10;
                        break;
                    
                    default:
                        console.error("Unknown chartId requested: ", msg.chartId);
                        data.value = null;
                        break;
                }

                socket.emit('data update', { data : data } );
            }, 2000);

            activeIntervals.add(intervalId);
        });

        socket.on('disconnect', () => {
            console.log("Client disconnected.");
            activeIntervals.forEach(intervalId => clearInterval(intervalId));
            activeIntervals.clear();
        });
    });
};
