'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _cluster = require('cluster');

var _cluster2 = _interopRequireDefault(_cluster);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _rootPath = require('./utils/rootPath');

var _rootPath2 = _interopRequireDefault(_rootPath);

var _producer = require('./controllers/queue-entities/producer');

var _producer2 = _interopRequireDefault(_producer);

var _consumer = require('./controllers/queue-entities/consumer');

var _consumer2 = _interopRequireDefault(_consumer);

var _itemIo = require('./controllers/item-io');

var _itemIo2 = _interopRequireDefault(_itemIo);

var _throttleManager = require('./throttle-manager');

var _throttleManager2 = _interopRequireDefault(_throttleManager);

var _eventTypes = require('./event-types');

var _eventTypes2 = _interopRequireDefault(_eventTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var inputFilePath = _rootPath2.default + '/io/data.json';
var outputFilePath = _rootPath2.default + '/io/output.json';

var app = (0, _express2.default)();
var port = 6900;

if (_cluster2.default.isMaster) {
    (function () {
        var delegatedWorkerPid = null;
        var currentWorker = null;

        //initial worker spawn
        for (var i = 0; i < _os2.default.cpus().length; i++) {
            if (i === 0) {
                // delegate one worker to be used as a hook to send start message ONCE to all workers
                currentWorker = _cluster2.default.fork();
                delegatedWorkerPid = currentWorker.process.pid;
            } else {
                _cluster2.default.fork();
            }
        }

        _cluster2.default.on(_eventTypes2.default.ONLINE, function (worker) {
            console.log('Worker ' + worker.process.pid + ' online...');

            // when a new worker is online, send message in order to sync workers (stop and start)
            if (worker.process.pid === delegatedWorkerPid) {
                Object.keys(_cluster2.default.workers).forEach(function (key) {
                    _cluster2.default.workers[key].send({
                        message: {
                            processes: Object.keys(_cluster2.default.workers).length
                        }
                    });
                });
            }
        });

        // respawn worker
        _cluster2.default.on(_eventTypes2.default.EXIT, function (worker) {
            //send current online process amount to each worker
            console.log('Worker ' + worker.process.pid + ' is done for...');
            Object.keys(_cluster2.default.workers).forEach(function (key) {
                _cluster2.default.workers[key].send({ message: 'restart' });
            });
            // get new worker's pid for usage in the ONLINE handler
            currentWorker = _cluster2.default.fork();
            delegatedWorkerPid = currentWorker.process.pid;
        });

        //set up path for loading static files
        app.use('/js', _express2.default.static(_rootPath2.default + '/static/js'));
        app.use('/css', _express2.default.static(_rootPath2.default + '/static/css'));

        //set up route
        app.get('/', function (req, res) {
            res.sendFile(_rootPath2.default + '/static/index.html');
        });

        app.get('/loadQueue', function (req, res) {
            var producer = new _producer2.default({ sourceFilePath: inputFilePath });

            producer.manualPublish().then(function (publishedItems) {
                res.json({ message: 'Loaded data to queue' });
            }, function (rejectData) {
                console.log(rejectData);
                res.status(500).send('Internal error occurred while adding items to queue.');
            });
        });

        app.get('/killWorker', function (req, res) {
            _cluster2.default.workers[Object.keys(_cluster2.default.workers)[0]].kill();
            // cluster.workers['1'].kill();
            res.json({ message: 'Worker offline' });
        });

        //bind server to port
        app.listen(port, function () {
            console.log('Eavesdropping on port ' + port);
        });
    })();
} else {
    (function () {
        //worker process logic
        var activeProcesses = null;

        // assign callback to be executed by the consumer, as well as the timeout for throttling
        var consumer = new _consumer2.default({
            callback: function callback(queueItem) {
                return new Promise(function (resolve, reject) {
                    consumer.workSchedule = setTimeout(function () {
                        _itemIo2.default.sendItem(queueItem, outputFilePath).then(function () {
                            resolve();
                        }, function (rejectData) {
                            reject(rejectData);
                        });
                    }, _throttleManager2.default.timeLimit * activeProcesses);
                });
            },
            isAsync: true
        });

        //subscribe worker to master-originated messages
        process.on(_eventTypes2.default.MESSAGE, function (payload) {
            //todo: create message type constants for the following two
            if (payload.message.processes) {
                activeProcesses = payload.message.processes;
                consumer.start();
                console.log('Sync-ing workers.');
            }
            if (payload.message === 'restart') {
                console.log('Worker ' + _cluster2.default.worker.process.pid + ' stopped');
                consumer.stop();
            }
        });
    })();
}