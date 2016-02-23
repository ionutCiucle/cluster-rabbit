import amqp from 'amqplib/callback_api';
import EventEmmiter from 'events';

class QueueStakeholder extends EventEmmiter {
    constructor(arg = {}) {
        const {
          queue = 'default',
          serverUrl = 'amqp://localhost',
        } = arg;

        super();

        this.queue = queue;
        this.serverUrl = serverUrl;
        this.queueConnection = null;
    }

    connect(callback) {
        amqp.connect(this.serverUrl, (err, conn) => {
            if (conn) {
                this.queueConnection = conn;
            } else {
                console.log('Couldn\'t establish connection to RabbitMQ Server. Check if the server\'s online.');
                return;
            }
            conn.createChannel((err, ch) => {
                callback(err, ch, conn);
            });
        });
    }
}

export default QueueStakeholder;
