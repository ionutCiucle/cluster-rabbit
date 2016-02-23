import express from 'express';
import cluster from 'cluster';
import os from 'os';

import rootPath from './utils/rootPath';

import Producer from './controllers/queue-entities/producer';
import Consumer from './controllers/queue-entities/consumer';
import itemIo from './controllers/item-io';
import throttleManager from './throttle-manager';
import eventTypes from './event-types';

const inputFilePath = `${rootPath}/io/data.json`;
const outputFilePath = `${rootPath}/io/output.json`;

const app = express();
const port = 6900;

if (cluster.isMaster) {
    let delegatedWorkerPid = null;
    let currentWorker = null;

    //initial worker spawn
    for (let i = 0; i < os.cpus().length; i++) {
        if (i === 0) {
            // delegate one worker to be used as a hook to send start message ONCE to all workers
            currentWorker = cluster.fork();
            delegatedWorkerPid = currentWorker.process.pid;
        } else {
            cluster.fork();
        }
    }

    cluster.on(eventTypes.ONLINE, (worker) => {
        console.log(`Worker ${worker.process.pid} online...`);

        // when a new worker is online, send message in order to sync workers (stop and start)
        if (worker.process.pid === delegatedWorkerPid) {
            Object.keys(cluster.workers).forEach((key) => {
                cluster.workers[key].send({
                    message: {
                        processes: Object.keys(cluster.workers).length
                    }
                });
            });
        }
    });

    // respawn worker
    cluster.on(eventTypes.EXIT, (worker) => {
        //send current online process amount to each worker
        console.log(`Worker ${worker.process.pid} is done for...`);
        Object.keys(cluster.workers).forEach((key) => {
            cluster.workers[key].send({ message: 'restart' });
        });
        // get new worker's pid for usage in the ONLINE handler
        currentWorker = cluster.fork();
        delegatedWorkerPid = currentWorker.process.pid;
    });

    //set up path for loading static files
    app.use('/js', express.static(`${rootPath}/static/js`));
    app.use('/css', express.static(`${rootPath}/static/css`));

    //set up route
    app.get('/', (req, res) => {
        res.sendFile(`${rootPath}/static/index.html`);
    });

    app.get('/loadQueue', (req, res) => {
        const producer = new Producer({ sourceFilePath: inputFilePath });

        producer.manualPublish().then(
            (publishedItems) => {
                res.json({ message: 'Loaded data to queue' });
            }, (rejectData) => {
                console.log(rejectData);
                res.status(500).send('Internal error occurred while adding items to queue.');
            }
        );
    });

    app.get('/killWorker', (req, res) => {
        cluster.workers[Object.keys(cluster.workers)[0]].kill();
        // cluster.workers['1'].kill();
        res.json({ message: 'Worker offline' });
    });

    //bind server to port
    app.listen(port, () => {
        console.log(`Eavesdropping on port ${port}`);
    });
} else { //worker process logic
    let activeProcesses = null;

    // assign callback to be executed by the consumer, as well as the timeout for throttling
    const consumer = new Consumer({
        callback: (queueItem) => {
            return new Promise((resolve, reject) => {
                consumer.workSchedule = setTimeout(() => {
                    itemIo.sendItem(queueItem, outputFilePath).then(
                        () => {
                            resolve();
                        }, (rejectData) => {
                            reject(rejectData);
                        }
                    );
                }, throttleManager.timeLimit * activeProcesses);
            });
        },
        isAsync: true
    });

    //subscribe worker to master-originated messages
    process.on(eventTypes.MESSAGE, (payload) => {
        //todo: create message type constants for the following two
        if (payload.message.processes) {
            activeProcesses = payload.message.processes;
            consumer.start();
            console.log('Sync-ing workers.');
        }
        if (payload.message === 'restart') {
            console.log(`Worker ${cluster.worker.process.pid} stopped`);
            consumer.stop();
        }
    });
}
