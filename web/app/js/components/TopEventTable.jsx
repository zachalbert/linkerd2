import PropTypes from 'prop-types';
import React from 'react';
import { successRateWithMiniChart } from './util/MetricUtils.jsx';
import { Table } from 'antd';
import { withContext } from './util/AppContext.jsx';
import { directionColumn, srcDstColumn } from './util/TapUtils.jsx';
import { formatLatencySec, numericSort } from './util/Utils.js';

const topMetricColWidth = "85px";
const topColumns = (resourceType, ResourceLink) => [
  {
    title: " ",
    key: "direction",
    dataIndex: "direction",
    width: "60px",
    render: directionColumn
  },
  {
    title: "Name",
    key: "src-dst",
    width: "180px",
    render: d => srcDstColumn(d, resourceType, ResourceLink)
  },
  {
    title: "Path",
    dataIndex: "path",
    sorter: (a, b) => a.path.localeCompare(b.path),
  },
  {
    title: "Count",
    dataIndex: "count",
    className: "numeric",
    width: topMetricColWidth,
    defaultSortOrder: "descend",
    sorter: (a, b) => numericSort(a.count, b.count),
  },
  {
    title: "Best",
    dataIndex: "best",
    className: "numeric",
    width: topMetricColWidth,
    sorter: (a, b) => numericSort(a.best, b.best),
    render: formatLatencySec
  },
  {
    title: "Worst",
    dataIndex: "worst",
    className: "numeric",
    width: topMetricColWidth,
    sorter: (a, b) => numericSort(a.worst, b.worst),
    render: formatLatencySec
  },
  {
    title: "Last",
    dataIndex: "last",
    className: "numeric",
    width: topMetricColWidth,
    sorter: (a, b) => numericSort(a.last, b.last),
    render: formatLatencySec
  },
  {
    title: "Success Rate",
    dataIndex: "successRate",
    className: "numeric",
    width: "128px",
    sorter: (a, b) => numericSort(a.successRate.get(), b.successRate.get()),
    render: d => successRateWithMiniChart(d.get())
  }
];

class TopEventTable extends React.Component {
  static propTypes = {
    api: PropTypes.shape({
      ResourceLink: PropTypes.func.isRequired,
    }).isRequired,
    resourceType: PropTypes.string.isRequired,
    tableRows: PropTypes.arrayOf(PropTypes.shape({})),
  }

  static defaultProps = {
    tableRows: []
  }

  render() {
    return (
      <Table
        dataSource={this.props.tableRows}
        columns={topColumns(this.props.resourceType, this.props.api.ResourceLink)}
        rowKey="key"
        pagination={false}
        className="top-event-table metric-table"
        size="middle" />
    );
  }
}

export default withContext(TopEventTable);
