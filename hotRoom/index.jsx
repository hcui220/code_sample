import React, { Fragment } from 'react';
import moment from 'moment';
import { Table, Form, Button, DatePicker, Select, message, Input, Divider } from 'antd';
import View from 'core/baseClass/View';
import { Store } from 'core/baseClass';
import ContainerFactory from 'core/baseClass/ContainerFactory';
import HotRoomFlow from '../../../flow/sliderManage/HotRoomFlow';
import HotModal from './hotModal';
import Permission from '../../../components/Permission/Permission';
import Import from '../../../components/Import';
import { FormTool, Decode } from '../../../util';
import './index.less';


const { RangePicker } = DatePicker;
const { Option } = Select;
const FormItem = Form.Item;
const formItemLayout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 18 },
};

const delRender = (text, record = {}) => {
    const { processStatus } = record;
    return (
        <div>
            {processStatus == 3 ? <del>{Decode.decode(text)}</del> : <span>{Decode.decode(text)}</span>}</div>
    );
};

class HotRoom extends View {
    constructor(props) {
        super(props);
        this.state = {
            curRecord: undefined,
            paramType: 1,
        }
    }
    componentDidMount() {
        this.getList();
        this.props.form.setFieldsValue({
            paramType: 1,
        });
    }

    getList = () => {
        this.flow.getListData({
            page: 1,
            pageSize: 15,
        });
    }

    genCols = () => {
        return [{
            title: 'OA号',
            dataIndex: 'processId',
            key: 'processId',
            render: delRender,
        }, {
            title: '提交人',
            dataIndex: 'uname',
            key: 'uname',
            render: delRender,
        }, {
            title: '提交时间',
            dataIndex: 'ctime',
            key: 'ctime',
            render: (text, record) => {
                return delRender(moment(text * 1000).format('YYYY-MM-DD HH:mm:ss'), record);
            },
        }, {
            title: '状态',
            dataIndex: 'oaProcessStatusStr',
            key: 'oaProcessStatusStr',
            render: delRender,
        }, {
            title: '操作',
            dataIndex: 'operate',
            key: 'operate',
            render: (t, record) => {
                const {
                    processBusinessId,
                    oaProcessStatusStr,
                } = record;
                return (
                    <Fragment>
                        <a
                            onClick={() => {
                                window.open(`vrp/apply/redirect?bussinessId=${processBusinessId}`, '_blank');
                            }}
                        >详情</a>
                        {
                            oaProcessStatusStr === '已通过' &&
                            <Permission eventKey="vrp.slider.roompopularity.edit">
                                <Divider type="vertical" />
                                <a
                                    onClick={() => {
                                        this.setState({
                                            curRecord: record,
                                        });
                                    }}
                                >修改</a>
                            </Permission>
                        }
                    </Fragment>
                );
            }
        }];
    }

    onSearch = () => {
        this.props.form.validateFields((err, values) => {
            if (err) return;
            const postParams = {};
            const {
                timeRange = [],
                paramType,
                paramValue,
                oaStatus,
            } = values;
            if (timeRange && timeRange.length === 2) {
                postParams.startTime = moment(timeRange[0]).startOf('day').format('X');
                postParams.endTime = moment(timeRange[1]).add(1, 'days').startOf('day').subtract(1, 'seconds').format('X');
            }
            if (typeof paramType !== 'undefined') postParams.paramType = paramType;
            if (typeof paramValue !== 'undefined') postParams.paramValue = paramValue;
            if (typeof oaStatus !== 'undefined') postParams.oaStatus = oaStatus;
            this.flow.getListData({
                ...postParams,
                page: 1,
                pageSize: 15,
            });
        })
    }

    render() {
        const {
            hotRoom: {
                tableList = [],
                current = 1,
                pageSize,
                total,
                tableLoad = false,
                searchParams = {},
            } = {},
            form: {
                getFieldDecorator,
            } = {},
        } = this.props;
        const { curRecord, paramType } = this.state;
        const { dict = {} } = Store.getInstance().getData('app');
        const processStatus = FormTool.genOptions(dict.processStatus_search || [], 'dictValue', 'dictCode');
        const pagination = {
            total,
            current: current,
            pageSize,
            showTotal: totalNum => `共${totalNum}条记录`,
            onChange: (page) => {
                this.flow.getListData({
                    ...searchParams,
                    page,
                });
            },
        };
        return (
            <div
                style={{ padding: 10 }}
            >
                <div style={{ height: 50 }}>
                    <Form layout="inline" style={{ marginBottom: 20 }}>
                        <Permission eventKey="vrp.slider.roompopularity.add">
                            <FormItem>
                                <Button
                                    onClick={() => {
                                        this.flow.validateAdd().then((res) => {
                                            const {
                                                data: {
                                                    processDefId,
                                                    formId,
                                                    flowCode,
                                                    name,
                                                } = {},
                                            } = res;
                                            window.open(`/#/apply?processDefId=${processDefId}&formId=${formId}&flowCode=${flowCode}&flowName=${name}`);
                                        });
                                    }}
                                    icon="file-add"
                                    type="primary"
                                >新增</Button>
                            </FormItem>
                        </Permission>
                        <div style={{ float: 'right' }}>
                            <FormItem
                                {...formItemLayout}
                            >
                                {getFieldDecorator('timeRange')(
                                    <RangePicker
                                        placeholder={['提交日期', '提交日期']}
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
                                        });
                                    }}
                                    style={{
                                        width: 100,
                                    }}
                                >
                                    <Option value={1}>OA号</Option>
                                    <Option value={2}>提交人</Option>
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
                                        if (curRecord) return;
                                        this.onSearch();
                                    }}
                                    style={{ width: 150 }}
                                />)}
                            </FormItem>
                            <FormItem
                                {...formItemLayout}
                            >
                                {getFieldDecorator('oaStatus')(<Select
                                    placeholder="状态"
                                    style={{
                                        width: 100,
                                    }}
                                >
                                    {processStatus}
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
                                            this.onSearch();
                                        });
                                    }}
                                    style={{ marginRight: 15 }}
                                >清空</Button>
                                <Permission eventKey="vrp.slider.roompopularity.manage">
                                    <Button
                                        type="danger"
                                        onClick={() => {
                                            this.props.history.push('/sliderManage/roompopularitymanage');
                                        }}
                                        className="clone_danger_btn"
                                        style={{ marginLeft: 15 }}
                                    >管理热度</Button>
                                </Permission>
                            </FormItem>
                        </div>
                    </Form>
                </div>
                <Table
                    columns={this.genCols()}
                    dataSource={tableList}
                    loading={tableLoad}
                    pagination={pagination}
                />
                {
                    curRecord &&
                    <HotModal
                        curRecord={curRecord}
                        flow={this.flow}
                        hotRoom={this.props.hotRoom}
                        onCancel={() => {
                            this.setState({
                                curRecord: undefined,
                            });
                        }}
                        callback={this.getList}
                    />
                }
            </div>
        );
    }
}

export default ContainerFactory.genContainer(Form.create()(HotRoom), new HotRoomFlow());


