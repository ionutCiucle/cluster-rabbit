'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _queueStakeholder = require('./queue-stakeholder');

var _queueStakeholder2 = _interopRequireDefault(_queueStakeholder);

var _eventTypes = require('../../event-types');

var _eventTypes2 = _interopRequireDefault(_eventTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

//private method
function _doWork(callback, isAsync) {
    var _this = this;

    this.connect(function (err, ch, conn) {
        if (conn) {
            //create queue if it doesn't exist
            ch.assertQueue(_this.queue, { durable: false });

            //no more than one unacknowledged message per worker
            ch.prefetch(1);

            //message consumption logic
            if (!isAsync) {
                ch.consume(_this.queue, function (queueItem) {
                    callback(queueItem);
                    ch.ack(queueItem);
                });
            } else {
                ch.consume(_this.queue, function (queueItem) {
                    callback(queueItem).then(function () {
                        console.log('Sent item...');
                        //console.log(`Successfully sent queue item: ${JSON.stringify(queueItem)}`);
                        ch.ack(queueItem);
                    }, function (rejectData) {
                        console.log('Error sending queue item ' + JSON.stringify(queueItem));
                        console.log(rejectData);
                    });
                });
            }
        }
    }, { noAck: false });
}

var Consumer = function (_QueueStakeholder) {
    _inherits(Consumer, _QueueStakeholder);

    function Consumer(arg) {
        _classCallCheck(this, Consumer);

        var queue = arg.queue;
        var serverUrl = arg.serverUrl;
        var callback = arg.callback;
        var isAsync = arg.isAsync;

        var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(Consumer).call(this, queue, serverUrl));

        _this2.callback = callback;
        _this2.isAsync = isAsync;
        _this2.workSchedule = null;
        _this2.on(_eventTypes2.default.START_CONSUMPTION, function () {
            //bind private method to current object
            _doWork.call(_this2, callback, isAsync);
        });
        _this2.on(_eventTypes2.default.STOP_CONSUMPTION, function () {
            //cancel scheduled work
            if (_this2.workSchedule) {
                clearTimeout(_this2.workSchedule);
                _this2.workSchedule = null;
                console.log('Cleared work schedule');
            }
            //close current AMQP connection
            if (_this2.queueConnection) {
                _this2.queueConnection.close();
            }
        });
        return _this2;
    }

    _createClass(Consumer, [{
        key: 'start',
        value: function start() {
            this.emit(_eventTypes2.default.START_CONSUMPTION);
        }
    }, {
        key: 'stop',
        value: function stop() {
            this.emit(_eventTypes2.default.STOP_CONSUMPTION);
        }
    }]);

    return Consumer;
}(_queueStakeholder2.default);

exports.default = Consumer;