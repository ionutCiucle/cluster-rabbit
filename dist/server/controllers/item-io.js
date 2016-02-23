'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _fsPromise = require('fs-promise');

var _fsPromise2 = _interopRequireDefault(_fsPromise);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//we don't need multiple instances of item-controller per process
//it only provides the functionality related to loading data
//therefore, we'll be using a plain object

var itemIo = {
    loadItems: function loadItems(sourceFilePath) {
        return new _bluebird2.default(function (resolve, reject) {
            try {
                _fsPromise2.default.readFile(sourceFilePath).then(function (inputData) {
                    resolve(JSON.parse(inputData.toString()));
                }, function (rejectData) {
                    reject(rejectData);
                });
            } catch (e) {
                reject(e);
            }
        });
    },
    sendItem: function sendItem(item, targetFilePath) {
        return new _bluebird2.default(function (resolve, reject) {
            try {
                _fsPromise2.default.appendFile(targetFilePath, JSON.stringify(item) + '\n').then(function () {
                    console.log('Successfully sent ' + item);
                    resolve();
                }, function (rejectData) {
                    reject(rejectData);
                });
            } catch (e) {
                reject(e);
            }
        });
    }
};

exports.default = itemIo;