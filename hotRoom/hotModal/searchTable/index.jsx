import { Component } from 'react';
import moment from 'moment';
import { Table, Form, Button, DatePicker, Select, Input } from 'antd';

const { RangePicker } = DatePicker;
const { Option } = Select;
const FormItem = Form.Item;
const formItemLayout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 18 },
};

const renderTime = (t) => {
    return moment(t * 1000).format('YYYY-MM-DD HH:mm');
}
class SearchTable extends Component {
    constructor(props) {
        super(props);
        this.state = {
            paramType: 1,
        };
    }
    componentDidMount() {
        this.props.flow.clearSearchList();
        this.props.flow.getSupportList();
        this.props.form.setFieldsValue({
            paramType: 1,
        });
    }

    genCols = () => {
        return [{
            title: '房间ID',
            dataIndex: 'roomId',
            key: 'roomId',
        }, {
            title: '增加额外热度',
            dataIndex: 'extraPopularity',
            key: 'extraPopularity',
        }, {
            title: '生效时间段',
            dataIndex: 'timeRange',
            key: 'ctimeRange',
            render: (t, record)=> {
                const {
                    startTime,
                    endTime,
                } = record;
                return `${renderTime(startTime)} ~ ${renderTime(endTime)}`;
            }, 
        }, {
            title: '扶持类型',
            dataIndex: 'supportTypeStr',
            key: 'supportTypeStr',
        }, {
            title: '平滑时间',
            dataIndex: 'smoothTimeStr',
            key: 'smoothTimeStr',
        }, {
            title: '申请人',
            dataIndex: 'applyUname',
            key: 'applyUname',
        }];
    }

    onSearch = () => {
        const {
            curRecord: {
                processBusinessId: bussinessId,
            } = {},
        } = this.props;
        this.props.form.validateFields((err, values) => {
            if (err) return;
            const postParams = {};
            const {
                timeRange = [],
                paramType,
                paramValue,
                supportType,
            } = values;
            if (timeRange && timeRange.length === 2) {
                postParams.startTime = moment(timeRange[0]).startOf('day').format('X');
                postParams.endTime = moment(timeRange[1]).add(1, 'days').startOf('day').subtract(1, 'seconds').format('X');
            }
            if (paramType) postParams.paramType = paramType;
            if (paramValue) postParams.paramValue = paramValue;
            if (supportType || supportType === 0) postParams.supportType = supportType;
            this.props.flow.getSearchListData({
                ...postParams,
                page: 1,
                pageSize: 10,
                bussinessId,
            });
        })
    }

    render() {
        const { paramType } = this.state;
        const {
            hotRoom: {
                searchTableList = [],
                searchCurrent = 1,
                searchPageSize,
                searchTableLoad = false,
                searchTotal = 0,
                searchSearchParams = {},
                supportList = [],
            } = {},
            selectedRows = [],
            form: {
                getFieldDecorator,
            } = {},
        } = this.props;
        const rowSelection = {
            selectedRowKeys: selectedRows.map(item => item.id),
            onChange: (selectedRowKeys, selectedRows) => {
                this.props.updateSelection(selectedRows);
            },
        };
        const pagination = {
            total: searchTotal,
            current: searchCurrent,
            pageSize: searchPageSize,
            showTotal: totalNum => `共${totalNum}条记录`,
            onChange: (page) => {
                this.props.flow.getSearchListData({
                    ...searchSearchParams,
                    page,
                });
            },
            pageSizeOptions: ['5', '10', '20', '50', '100', '500', '1000'],
            showSizeChanger: true,
            onShowSizeChange: (page, pSize) => {
                this.props.flow.getSearchListData({
                    ...searchSearchParams,
                    page,
                    pageSize: pSize,
                });
            }
        };
        return (
            <div
                style={{
                    background: '#e8e8e8',
                    padding: 15,
                    marginBottom: 10,
                }}
            >
                <Form layout="inline">
                    <FormItem
                        {...formItemLayout}
                    >
                        {getFieldDecorator('timeRange')(
                            <RangePicker
                                placeholder={['生效日期','生效日期']}
                                style={{ width: 300 }}
                            />
                        )}
                    </FormItem>
                    <FormItem
                        {...formItemLayout}
                    >
                        {getFieldDecorator('paramType')(<Select
                            onChange={(val) => {
                                this.setState({ paramType: val }, () => {
                                    this.props.form.resetFields(['paramValue']);
                                })
                            }}
                            style={{
                                width: 100,
                            }}
                            allowClear
                        >
                            <Option value={1}>房间号</Option>
                            <Option value={2}>申请人</Option>
                        </Select>)}
                    </FormItem>
                    <FormItem
                        {...formItemLayout}
                    >
                        {getFieldDecorator('paramValue', {
                                rules: paramType === 1 ? [{
                                    pattern: /^\d*$/,
                                    message: '请输入数字',
                                }] : [],
                            })(<Input
                            onPressEnter={() => {
                                this.onSearch();
                            }}
                            style={{ width: 150 }}    
                        />)}
                    </FormItem>
                    <FormItem
                        {...formItemLayout}
                    >
                        {getFieldDecorator('supportType')(<Select
                            placeholder="扶持类型"
                            style={{
                                width: 130,
                            }}
                            allowClear
                        >
                            {
                                (supportList || []).map((item) => {
                                    return (<Option
                                        value={item.id}
                                        key={item.id}
                                    >{item.supportType}</Option>);
                                })
                            }
                        </Select>)}
                    </FormItem>
                    <FormItem>
                        <Button
                            icon="search"
                            type="primary"
                            onClick={() => {
                                this.onSearch();
                            }}
                            style={{ marginRight: 15 }}
                        >查询</Button>
                        <Button
                            icon="redo"
                            onClick={() => {
                                this.props.form.resetFields();
                                this.setState({
                                    paramType: 1,
                                }, () => {
                                    this.props.form.setFieldsValue({
                                        paramType: 1,
                                    });
                                    this.props.flow.clearSearchList();
                                });
                            }}
                        >清空</Button>
                    </FormItem>
                </Form>
                <Table
                    columns={this.genCols()}
                    dataSource={searchTableList}
                    loading={searchTableLoad}
                    rowKey="id"
                    rowSelection={rowSelection}
                    pagination={pagination}
                    style={{
                        marginTop: 15,
                        background: 'white',
                    }}
                />
                <div
                    style={{
                        margin: '10px 0',
                        color: 'red',
                    }}
                >先查询出要调整的热度申请记录</div>
            </div>
        );
    }
}

export default Form.create()(SearchTable);


