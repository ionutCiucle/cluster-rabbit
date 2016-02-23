import QueueStakeholder from './queue-stakeholder';
import eventTypes from '../../event-types';

//private method
function _doWork(callback, isAsync) {
    this.connect((err, ch, conn) => {
        if (conn) {
            //create queue if it doesn't exist
            ch.assertQueue(this.queue, { durable: false });

            //no more than one unacknowledged message per worker
            ch.prefetch(1);

            //message consumption logic
            if (!isAsync) {
                ch.consume(this.queue, (queueItem) => {
                    callback(queueItem);
                    ch.ack(queueItem);
                });
            } else {
                ch.consume(this.queue, (queueItem) => {
                    callback(queueItem).then(
                        () => {
                            console.log('Sent item...');
                            //console.log(`Successfully sent queue item: ${JSON.stringify(queueItem)}`);
                            ch.ack(queueItem);
                        }, (rejectData) => {
                            console.log(`Error sending queue item ${JSON.stringify(queueItem)}`);
                            console.log(rejectData);
                        }
                    );
                });
            }
        }
    }, { noAck: false });
}

class Consumer extends QueueStakeholder {
    constructor(arg) {
        const { queue, serverUrl, callback, isAsync } = arg;

        super(queue, serverUrl);

        this.callback = callback;
        this.isAsync = isAsync;
        this.workSchedule = null;
        this.on(eventTypes.START_CONSUMPTION, () => {
            //bind private method to current object
            _doWork.call(this, callback, isAsync);
        });
        this.on(eventTypes.STOP_CONSUMPTION, () => {
            //cancel scheduled work
            if (this.workSchedule) {
                clearTimeout(this.workSchedule);
                this.workSchedule = null;
                console.log('Cleared work schedule');
            }
            //close current AMQP connection
            if (this.queueConnection) {
                this.queueConnection.close();
            }
        });
    }

    start() {
        this.emit(eventTypes.START_CONSUMPTION);
    }

    stop() {
        this.emit(eventTypes.STOP_CONSUMPTION);
    }
}

export default Consumer;
