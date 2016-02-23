import React from 'react';
import { Component } from 'react';
import ReactDOM from 'react-dom';
import xhr from 'xhr';
import RabbitRemote from '../components/rabbit-remote';

class ApplicationContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      message: 'Interact with the service'
    }
  }

  handleKillWorker() {
    xhr.get('/killWorker', (err, res) => {
      let { message } = JSON.parse(res.body);
      if (err) {
        message = 'Problem dismissing worker';
      }
      console.log(this.setState);
      this.setState({ message });
    });
  }

  handleLoadQueue() {
    xhr.get('/loadQueue', (err, res) => {
      let { message } = JSON.parse(res.body);

      if (err) {
        message = 'Problem loading queue'
      }
      this.setState({ message });
    });

  }

  render() {
    const { message } = this.state;

    return (
      <div className='application-container'>
        <RabbitRemote
          message={ message }
          onKillWorker={ this.handleKillWorker.bind(this) }
          onLoadQueue={ this.handleLoadQueue.bind(this) }
        />
      </div>
    );
  }
}

export default ApplicationContainer;
