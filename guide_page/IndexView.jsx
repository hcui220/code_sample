/*
 * 办事指南
 * @时间    2020/04/17
 */
import 'slick-carousel/slick/slick.scss';
import 'slick-carousel/slick/slick-theme.scss';
import React from 'react';
import { View } from 'core';
import { Tabs, Table, Icon, Input, message } from 'antd';
import Slider from 'react-slick';
import moment from 'moment';
import FooterView from '../../../components/FooterView';
import HeaderView from '../../../components/HeaderView';
import Pagination from '../../../components/Pager';

const { TabPane } = Tabs;
let clocker = null;
const queryDelay = 500;
export default class IndexView extends View {
    constructor(props) {
        super(props);
        this.state = {
            curTab: 'type',
            curCate: '全部',
            cates: [],
            curSlide: 0,
            tableList: [],
            queryWord: '',
            listTotal: 0,
            page: 1,
            pageSize: 20,
            ltArrowHovered: false,
            rtArrowHovered: false,
        };
    }

    componentDidMount() {
        this.onTabChange('type');
    }

    onTabChange = (tabType) => {
        this.setState({
            curTab: tabType,
            queryWord: '',
        }, () => {
            this.props.action.getCates({
                groupField: tabType,
            }).then((res) => {
                const {
                    data: {
                        total = 0,
                        groupResult = [],
                    } = {},
                } = res;
                this.setState({
                    curCate: '全部',
                    cates: [
                        {
                            count: total,
                            groupName: '全部',
                        },
                        ...groupResult,
                    ],
                    page: 1,
                }, () => {
                    if (this.slider) this.slider.slickGoTo(0);
                    this.getList();
                });
            }, (error) => {
                message.error(error.msg || error.reason);
            });
        });
    }

    genSlides = () => {
        const { cates = [], curCate } = this.state;
        const pagified = [];
        let page = [];
        let pCount = 0;
        for (let i = 0; i < cates.length; i++) {
            page.push(cates[i]);
            pCount += 1;
            if (pCount === 18) {
                pagified.push([...page]);
                page = [];
                pCount = 0;
                continue;
            }
        }
        if (page.length > 0) pagified.push([...page]);
        return pagified.map((item) => {
            return (
                <div className="cates_slide">
                    {item.map((itm) => {
                        const {
                            count,
                            groupName,
                        } = itm;
                        const classStr = `cate_card ${groupName === curCate ? 'cate_card_selected' : 'cate_card_unselected'}`;
                        return (
                            <div
                                className={classStr}
                                onClick={() => {
                                    this.onCardClick(groupName);
                                }}
                            >
                                <p className="ellip_text">{groupName}</p>
                                <p className="ellip_text">{`(${count})`}</p>
                            </div>
                        );
                    })}
                </div>
            );
        });
    }

    onCardClick = (clicked) => {
        this.setState({
            curCate: clicked,
            queryWord: '',
            page: 1,
        }, this.getList);
    }

    handleLeft = () => {
        const {
            cates = [],
            curSlide = 0,
        } = this.state;
        const lastSlide = Math.floor((cates.length / 18));
        let newSlide = curSlide - 1;
        if (newSlide < 0) newSlide = lastSlide;
        this.slider.slickGoTo(newSlide);
    }

    handleRight = () => {
        const {
            cates = [],
            curSlide = 0,
        } = this.state;
        const lastSlide = Math.floor((cates.length / 18));
        let newSlide = curSlide + 1;
        if (newSlide > lastSlide) newSlide = 0;
        this.slider.slickGoTo(newSlide);
    }

    genCols = () => {
        const { curCate, queryWord } = this.state;
        return [{
            title: `文档 / ${(queryWord && queryWord !== '') ? `搜索结果：${queryWord}` : `${curCate}`}`,
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => {
                const { url = '' } = record;
                return (<div
                    className="list_item_title"
                    onClick={(e) => {
                        e.preventDefault();
                        window.open(url);
                    }}
                >
                    <div className="item_icon" />
                    <p>{text}</p>
                </div>);
            },
        }, {
            title: '作者',
            dataIndex: 'author',
            key: 'author',
            width: 230,
        }, {
            title: '适用范围',
            dataIndex: 'applyScope',
            key: 'applyScope',
            width: 230,
        }, {
            title: '最近更新时间',
            dataIndex: 'recentUpdateTime',
            key: 'recentUpdateTime',
            width: 230,
            render: (text) => {
                return moment(text * 1000).format('YYYY-MM-DD HH:mm:ss');
            },
        }];
    }

    getList = () => {
        const {
            curTab,
            curCate,
            queryWord,
            page,
            pageSize,
        } = this.state;
        const fusionQueryType = (curCate === '全部' || (queryWord && queryWord !== '')) ? '1' : '2';
        const postParams = {
            fusionQueryType,
            // keyWord: queryWord,
            page,
            pageSize,
        };
        if (fusionQueryType === '1') postParams.keyWord = queryWord;
        if (fusionQueryType === '2') {
            postParams.groupField = curTab;
            postParams.groupFieldValue = curCate;
        }
        this.props.action.getList(postParams).then((res) => {
            const {
                data: {
                    totalCount,
                    list = [],
                } = {},
            } = res;
            this.setState({
                tableList: list,
                listTotal: totalCount,
            });
        }, (error) => {
            message.error(error.msg || error.reason);
        });
    }

    _render() {
        const { userInfo = {} } = this.props;
        const { user = '', logout_url: logoutUrl, login_url: loginUrl, isManager = false, isVisitor = 1 } = userInfo;
        if (!user) return <div />;
        const {
            curTab,
            cates = [],
            queryWord = '',
            tableList = [],
            page = 1,
            pageSize = 20,
            listTotal = 0,
            ltArrowHovered = false,
            rtArrowHovered = false,
        } = this.state;
        const showSlideControl = cates.length > 18;
        return (
            <div className="index_wrap">
                <HeaderView
                    cur={'guide'}
                    user={user}
                    logoutUrl={logoutUrl}
                    loginUrl={loginUrl}
                    admin={isManager}
                    isVisitor={isVisitor}
                />
                <div className="guide_banner" />
                <div className="layout content">
                    <div className="cate_nav">
                        <div className="title_area">
                            <div className="guide_icon" />
                            <p
                                onClick={(e) => {
                                    e.preventDefault();
                                    window.open('http://doc.dz11.com/ddse/preview/share/7ec1b5abe6e0aad4677e?sid=722&shareType=2');
                                }}
                                style={{ cursor: 'pointer' }}
                            >指南事项目录</p>
                        </div>
                        <Tabs
                            activeKey={curTab}
                            onChange={(key) => {
                                this.onTabChange(key);
                            }}
                        >
                            <TabPane
                                tab="按类型"
                                key="type"
                            />
                            <TabPane
                                tab="按部门"
                                key="dept"
                            />
                            <TabPane
                                tab="按适用范围"
                                key="applyScope"
                            />
                        </Tabs>
                    </div>
                    <div className="carousel-wrapper">
                        {
                            cates.length > 0 &&
                            (
                                <Slider
                                    dots={showSlideControl}
                                    infinite
                                    afterChange={(index) => {
                                        this.setState({ curSlide: index });
                                    }}
                                    ref={(slid) => {
                                        this.slider = slid;
                                    }}
                                    draggable={false}
                                >
                                    {this.genSlides(cates)}
                                </Slider>
                            )
                        }
                        {showSlideControl &&
                            <div
                                className="slide-control slide-control-left"
                                onClick={this.handleLeft}
                                onMouseEnter={() => {
                                    this.setState({ ltArrowHovered: true });
                                }}
                                onMouseLeave={() => {
                                    this.setState({ ltArrowHovered: false });
                                }}
                                style={ltArrowHovered ? {
                                    backgroundColor: '#f70',
                                } : undefined}
                            />
                        }
                        {showSlideControl &&
                            <Icon
                                type="left"
                                className="slide-arrow slide-arrow-left"
                                onClick={this.handleLeft}
                                onMouseEnter={() => {
                                    this.setState({ ltArrowHovered: true });
                                }}
                                onMouseLeave={() => {
                                    this.setState({ ltArrowHovered: false });
                                }}
                            />
                        }
                        {showSlideControl &&
                            <div
                                className="slide-control slide-control-right"
                                onClick={this.handleRight}
                                onMouseEnter={() => {
                                    this.setState({ rtArrowHovered: true });
                                }}
                                onMouseLeave={() => {
                                    this.setState({ rtArrowHovered: false });
                                }}
                                style={rtArrowHovered ? {
                                    backgroundColor: '#f70',
                                } : undefined}
                            />
                        }
                        {
                            showSlideControl &&
                            <Icon
                                type="right"
                                className="slide-arrow slide-arrow-right"
                                onClick={this.handleRight}
                                onMouseEnter={() => {
                                    this.setState({ rtArrowHovered: true });
                                }}
                                onMouseLeave={() => {
                                    this.setState({ rtArrowHovered: false });
                                }}
                            />
                        }
                    </div>
                    <div className="list_nav">
                        {tableList.length ?
                            <div className="list_total">
                                <p>共{listTotal}篇指南文档</p>
                            </div> : <div />
                        }
                        <Input
                            value={queryWord}
                            onChange={(e) => {
                                this.setState({
                                    queryWord: e.target.value,
                                }, () => {
                                    if (clocker === null) {
                                        clocker = setTimeout(this.getList, queryDelay);
                                        return;
                                    }
                                    clearTimeout(clocker);
                                    clocker = setTimeout(this.getList, queryDelay);
                                });
                            }}
                            placeholder="请输入文档名/作者进行筛选"
                            style={{ width: '40%' }}
                        />
                    </div>
                    {tableList.length ?
                        <Table
                            dataSource={tableList}
                            columns={this.genCols()}
                            pagination={false}
                            style={{ marginTop: 15 }}
                        /> : <div className="list_no_data">
                            <img src="../static/img/nodata.png" alt="" />
                            <p>暂时没有相关内容，换个关键词试试？</p>
                        </div>
                    }
                    {tableList.length &&
                        (<div className="pager_wrapper">
                            <div className="pager">
                                <Pagination
                                    showQuickJumper
                                    showSizeChanger
                                    defaultPageSize={pageSize}
                                    current={page}
                                    onChange={(pg) => {
                                        this.setState({ page: pg }, this.getList);
                                    }}
                                    total={listTotal}
                                />
                            </div>
                        </div>)
                    }
                </div>
                <FooterView admin={isManager} />
            </div>
        );
    }
}

