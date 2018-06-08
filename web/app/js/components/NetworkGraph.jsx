import PropTypes from 'prop-types';
import React from 'react';
import { withContext } from './util/AppContext.jsx';
import 'whatwg-fetch';

class NetworkGraph extends React.Component {
  static defaultProps = {
    namespace: 'default'
  }

  static propTypes = {
    namespace: PropTypes.string
  }

  render() {
    return (
      <div>
        {this.props.namespace}
      </div>
    );
  }
}

export default withContext(NetworkGraph);
