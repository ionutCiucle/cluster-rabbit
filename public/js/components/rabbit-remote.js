import React from 'react';
import { Component } from 'react';
import { Button, ButtonToolbar, Well } from 'react-bootstrap';

class RabbitRemote extends Component {
  handleKillWorker() {
    const { onKillWorker } = this.props;
    onKillWorker();
  }

  handleLoadQueue() {
    const { onLoadQueue } = this.props;
    onLoadQueue();
  }

  shouldComponentUpdate(nextProps, nextState) {
    //should be working with immutable.js
    const { message } = this.props;

    if (message === nextProps.message) {
      return false;
    }
    return true;
  }

  render() {
    const { message } = this.props;

    return (
      <div>
        <Well>{ message }</Well>
        <ButtonToolbar>
          <Button
            bsStyle='primary'
            onClick={this.handleLoadQueue.bind(this)}
          >
            Load RabbitMQ
          </Button>
          <Button
            bsStyle='danger'
            onClick={this.handleKillWorker.bind(this)}
          >
            Kill a Worker Process
          </Button>
        </ButtonToolbar>
      </div>
    );
  }
}

export default RabbitRemote;
