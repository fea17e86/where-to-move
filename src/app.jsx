import React, { Component } from 'react';
import { render } from 'react-dom';

export default class WhereToMoveApp extends Component {

  state = {}

  render() {
    return <h3>Where To Move?</h3>
  }
};

render(<WhereToMoveApp />, document.getElementById('where-to-move'));
