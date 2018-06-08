import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { withContext } from './util/AppContext.jsx';
import 'whatwg-fetch';
import * as d3 from 'd3';

const defaultSvgWidth = 574;
const defaultSvgHeight = 375;
const margin = { top: 0, right: 0, bottom: 10, left: 0 };

const simulation = d3.forceSimulation()
.force('charge', d3.forceManyBody().strength(-20))
.force('center', d3.forceCenter(defaultSvgWidth / 2, defaultSvgHeight / 2))
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
    this.updateGraph = this.updateGraph.bind(this);

    this.state = {
      pollingInterval: 5000,
      graph: {
        nodes: [],
        links: []
      },
      pendingRequests: false,
      loaded: false,
      error: ''
    }
  }

  componentDidMount() {
    this.svg = d3.select(".network-graph-container")
    .append("svg")
    .attr("class", "network-graph")
    .attr("width", defaultSvgWidth)
    .attr("height", defaultSvgHeight)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



    this.loadFromServer();
    // this.timerId = window.setInterval(this.loadFromServer, this.state.pollingInterval);
  }

  componentWillUnmount() {
    // window.clearInterval(this.timerId);
    // this.api.cancelCurrentRequests();
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
        // console.log(uniqNodes)
        // console.log(links);
        console.log("setting state")
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

  componentDidUpdate() {
    this.updateGraph();
  }

  updateGraph() {
    console.log("UPDATE");
    console.log(this.state.graph);


    const nodeElements = this.svg.append('g')
    .selectAll('circle')
    .data(this.state.graph.nodes)
    .enter().append('circle')
      .attr('r', 10)
      .attr('fill', 'steelblue')

    const textElements = this.svg.append('g')
    .selectAll('text')
    .data(this.state.graph.nodes)
    .enter().append('text')
      .text(node => node.id)
      .attr('font-size', 15)
      .attr('dx', 15)
      .attr('dy', 4)

      simulation.nodes(this.state.graph.nodes).on("tick", () => {
        nodeElements
          .attr("cx", node => node.x)
          .attr("cy", node => node.y)
        textElements
          .attr("x", node => node.x)
          .attr("y", node => node.y)
      })
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
