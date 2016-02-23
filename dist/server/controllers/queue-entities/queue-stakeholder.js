'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _callback_api = require('amqplib/callback_api');

var _callback_api2 = _interopRequireDefault(_callback_api);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var QueueStakeholder = function (_EventEmmiter) {
    _inherits(QueueStakeholder, _EventEmmiter);

    function QueueStakeholder() {
        var arg = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        _classCallCheck(this, QueueStakeholder);

        var _arg$queue = arg.queue;
        var queue = _arg$queue === undefined ? 'default' : _arg$queue;
        var _arg$serverUrl = arg.serverUrl;
        var serverUrl = _arg$serverUrl === undefined ? 'amqp://localhost' : _arg$serverUrl;

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(QueueStakeholder).call(this));

        _this.queue = queue;
        _this.serverUrl = serverUrl;
        _this.queueConnection = null;
        return _this;
    }

    _createClass(QueueStakeholder, [{
        key: 'connect',
        value: function connect(callback) {
            var _this2 = this;

            _callback_api2.default.connect(this.serverUrl, function (err, conn) {
                if (conn) {
                    _this2.queueConnection = conn;
                } else {
                    console.log('Couldn\'t establish connection to RabbitMQ Server. Check if the server\'s online.');
                    return;
                }
                conn.createChannel(function (err, ch) {
                    callback(err, ch, conn);
                });
            });
        }
    }]);

    return QueueStakeholder;
}(_events2.default);

exports.default = QueueStakeholder;