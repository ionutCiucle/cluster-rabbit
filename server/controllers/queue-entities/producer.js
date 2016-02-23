import Promise from 'bluebird';
import itemIo from '../item-io';
import QueueStakeholder from './queue-stakeholder';
import eventTypes from '../../event-types';

//private method - in order to maintain consistency
function _publish(sourceFilePath) {
    return new Promise((resolve, reject) => {
        itemIo.loadItems(sourceFilePath).then(
            (items) => {
                this.connect((err, ch, con) => {
                    //create queue if it doesn't exist and destroy it on broker restart
                    ch.assertQueue(this.queue, { durable: false }, (err, ok) => {
                        if (err) {
                            reject(err);
                        }

                        if (ok) {
                            items.forEach((item) => {
                                //push each item to the queue in JSON format
                                ch.sendToQueue(this.queue, new Buffer(JSON.stringify(item)));
                            });
                            resolve(items);
                        }
                    });
                });

            }, (rejectData) => {
                reject(rejectData);
            }
        );
    });
}

class Producer extends QueueStakeholder {
    constructor(arg = {}) {
        const { queue, serverUrl, sourceFilePath } = arg;

        super(queue, serverUrl);
        this.sourceFilePath = sourceFilePath;
        this.on(eventTypes.PUBLISH_TO_QUEUE, () => {
            _publish.call(this, this.sourceFilePath);
        });
    }

    manualPublish() {
        return new Promise((resolve, reject) => {
            _publish.call(this, this.sourceFilePath).then(
                (resolveData) => {
                    resolve(resolveData);
                }, (rejectData) => {
                    reject(rejectData);
                }
            );
        });
    }
}

export default Producer;
