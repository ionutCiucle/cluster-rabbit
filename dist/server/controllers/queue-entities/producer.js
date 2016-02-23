'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _itemIo = require('../item-io');

var _itemIo2 = _interopRequireDefault(_itemIo);

var _queueStakeholder = require('./queue-stakeholder');

var _queueStakeholder2 = _interopRequireDefault(_queueStakeholder);

var _eventTypes = require('../../event-types');

var _eventTypes2 = _interopRequireDefault(_eventTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

//private method - in order to maintain consistency
function _publish(sourceFilePath) {
    var _this = this;

    return new _bluebird2.default(function (resolve, reject) {
        _itemIo2.default.loadItems(sourceFilePath).then(function (items) {
            _this.connect(function (err, ch, con) {
                //create queue if it doesn't exist and destroy it on broker restart
                ch.assertQueue(_this.queue, { durable: false }, function (err, ok) {
                    if (err) {
                        reject(err);
                    }

                    if (ok) {
                        items.forEach(function (item) {
                            //push each item to the queue in JSON format
                            ch.sendToQueue(_this.queue, new Buffer(JSON.stringify(item)));
                        });
                        resolve(items);
                    }
                });
            });
        }, function (rejectData) {
            reject(rejectData);
        });
    });
}

var Producer = function (_QueueStakeholder) {
    _inherits(Producer, _QueueStakeholder);

    function Producer() {
        var arg = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        _classCallCheck(this, Producer);

        var queue = arg.queue;
        var serverUrl = arg.serverUrl;
        var sourceFilePath = arg.sourceFilePath;

        var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(Producer).call(this, queue, serverUrl));

        _this2.sourceFilePath = sourceFilePath;
        _this2.on(_eventTypes2.default.PUBLISH_TO_QUEUE, function () {
            _publish.call(_this2, _this2.sourceFilePath);
        });
        return _this2;
    }

    _createClass(Producer, [{
        key: 'manualPublish',
        value: function manualPublish() {
            var _this3 = this;

            return new _bluebird2.default(function (resolve, reject) {
                _publish.call(_this3, _this3.sourceFilePath).then(function (resolveData) {
                    resolve(resolveData);
                }, function (rejectData) {
                    reject(rejectData);
                });
            });
        }
    }]);

    return Producer;
}(_queueStakeholder2.default);

exports.default = Producer;