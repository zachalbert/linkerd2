import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { withContext } from './util/AppContext.jsx';
import 'whatwg-fetch';

class NetworkGraph extends React.Component {
  static defaultProps = {
    namespace: 'default',
    deployments: []
  }

  static propTypes = {
    namespace: PropTypes.string,
    deployments: PropTypes.array
  }

  constructor(props) {
    super(props);
    this.api = this.props.api;
    this.handleApiError = this.handleApiError.bind(this);
    this.loadFromServer = this.loadFromServer.bind(this);

    this.state = {
      pollingInterval: 2000,
      metrics: {},
      pendingRequests: false,
      loaded: false,
      error: ''
    }
  }

  componentDidMount() {
    this.loadFromServer();
    this.timerId = window.setInterval(this.loadFromServer, this.state.pollingInterval);
  }

  componentWillUnmount() {
    window.clearInterval(this.timerId);
    this.api.cancelCurrentRequests();
  }

  loadFromServer() {
    if (this.state.pendingRequests) {
      return; // don't make more requests if the ones we sent haven't completed
    }
    this.setState({ pendingRequests: true });

    let deployments = _.sortBy(_.map(this.props.deployments, 'name'));
    let urls = _.map(this.props.deployments, d => {
      return this.api.fetchMetrics(this.api.urlsForResource("deployment", "") + "&to_name=" + d.name)
    })

    this.api.setCurrentRequests(urls);

    Promise.all(this.api.getCurrentPromises())
      .then(results => {
        let links = [];
        let nodes = [];

        _.map(results, (r, i) => {
          let rows = _.get(r, ["ok", "statTables", 0, "podGroup", "rows"]);
          let dst = deployments[i];
          let src = _.map(rows, row => {
            links.push({
              source: row.resource.name,
              target: dst
            });
            nodes.push({
              id: row.resource.name
            })
          });
          // console.log(i, deployments[i], targets);
        });

        let uniqNodes = _.uniq(nodes);
        console.log(uniqNodes)
        console.log(links);

        this.setState({
          graph: {
            nodes: uniqNodes,
            links: links
          },
          loaded: true,
          pendingRequests: false,
          error: ''
        });
      })
      .catch(this.handleApiError);
  }

  handleApiError(e) {
    if (e.isCanceled) {
      return;
    }

    this.setState({
      pendingRequests: false,
      error: `Error getting data from server: ${e.message}`
    });
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
