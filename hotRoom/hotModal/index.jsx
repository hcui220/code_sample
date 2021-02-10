import { Component } from 'react';
import moment from 'moment';
import { Modal, Table, Form, message, Input } from 'antd';
import SearchTable from './searchTable';
import './index.less';

const FormItem = Form.Item;

const renderTime = (t) => {
    return moment(t * 1000).format('YYYY-MM-DD HH:mm');
}

class HotModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            modList: [],
            modMap: {},
        };
    }

    genCols = () => {
        const { getFieldDecorator } = this.props.form;
        return [{
            title: '房间ID',
            dataIndex: 'roomId',
            key: 'roomId',
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
        }, {
            title: '增加额外热度(调整前)',
            dataIndex: 'extraPopularity',
            key: 'extraPopularity',
        }, {
            title: '增加额外热度(调整后)',
            dataIndex: 'adjust',
            key: 'adjust',
            render: (t, record) => {
                const { id, extraPopularity } = record;
                return (
                    <FormItem>
                        {getFieldDecorator(`adjust.[${id}]`, {
                            rules: [{
                                required: true,
                                message: '不能为空',
                            }, {
                                pattern: /^(5000000|[1-4]\d{6}|[1-9]\d{0,5}|0|-[1-4]\d{6}|-[1-9]\d{0,5}|-5000000)$/,
                                message: '-5,000,000~5,000,000之间',
                            }, {
                                pattern: /^([1-9]\d*|-[1-9]\d*)$/,
                                message: '不能为0',
                            }, {
                                validator: (rule, value, callback) => {
                                    if (value >= extraPopularity) callback('只能向下调整');
                                    callback();
                                },
                            }]
                        })(<Input
                            />)}
                    </FormItem>
                )
            },
        }, {
            title: '操作',
            dataIndex: 'operate',
            key: 'operate',
            render: (text, record) => {
                return (<a
                    onClick={() => {
                        this.onDelete(record.id);
                    }}
                >删除</a>)
            }
        }];
    }

    updateSelection = (arr) => {
        const { modMap } = this.state;
        const newModList = [];
        const savedValues = {...this.props.form.getFieldsValue()};
        for (let i = 0; i < arr.length; i++) {
            if (modMap[arr[i].id]) continue;
            newModList.push(arr[i]);
        }
        this.setState({
            modList: [...newModList],
        }, () => {
            this.props.form.setFieldsValue(savedValues);
        });
    }

    onDelete = (id) => {
        const { modList = [] } = this.state;
        const savedValues = {...this.props.form.getFieldsValue()};
        const newModList = modList.filter((item) => {
            return item.id !== id;
        });
        this.setState({
            modList: [...newModList],
        }, () => {
            this.props.form.setFieldsValue(savedValues);
        });
    }

    onSubmit = () => {
        const {
            curRecord: {
                processBusinessId: bussinessId,
            } = {},
        } = this.props;
        const { modList = [] } = this.state;
        if (modList.length <= 0) {
            message.error('至少填写一行调整记录');
            return;
        }
        this.props.form.validateFields((err, values) => {
            if (err) return;
            console.info(values);
            const { modList = [] } = this.state;
            this.props.flow.adjustHot({
                adjustExtraPopularity: modList.map((item) => {
                    const aVal = values.adjust[item.id];
                    return aVal ? parseInt(aVal, 10) : 0;
                }),
                id: modList.map(item => item.id),
                bussinessId,
            }).then(() => {
                message.success('操作成功');
                this.props.callback();
                this.props.onCancel();
            });
        });
    }

    render() {
        const {
            curRecord,
            flow,
            hotRoom,
            onCancel,
        } = this.props;
        const { processId } = curRecord;
        const { modList = [] } = this.state;
        return (
            <Modal
                title="调整热度"
                onCancel={onCancel}
                onOk={this.onSubmit}
                width={1150}
                maskClosable={false}
                visible
            >
                <SearchTable
                    curRecord={curRecord}
                    flow={flow}
                    hotRoom={hotRoom}
                    updateSelection={this.updateSelection}
                    selectedRows={modList}
                />
                <Table
                    columns={this.genCols()}
                    dataSource={modList}
                    className="hot_adjust_table"
                    pagination={false}
                />
                <div>
                    <div
                        style={{
                            marginTop: 10,
                            color: '#d9d9d9',
                        }}
                    >{`OA号: ${processId}`}</div>
                </div>
            </Modal>
        )
    }
}

export default Form.create()(HotModal);
