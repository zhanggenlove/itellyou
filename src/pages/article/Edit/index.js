import React, { useState, useRef, useCallback, useEffect, useContext } from 'react';
import { history, useSelector, useDispatch } from 'umi';
import { Button, Alert, message, Input, Form, Drawer, Space, Popover, Menu } from 'antd';
import moment from 'moment';
import Editor from '@/components/Editor';
import { RouteContext } from '@/context';
import Timer from '@/components/Timer';
import { Selector } from '@/components/Tag';
import Column from './components/Column';
import Source from './components/Source';
import { EllipsisButton } from '@/components/Button';
import Setting from './components/Setting';
import { Article } from '@/components/Content';
import HistoryExtra from '../components/HistoryExtra';
import { PaidReadSetting } from '@/components/PaidRead';
import styles from './index.less';
import logo from '@/assets/logo.svg';

const { SAVE_TYPE } = Editor.Biz;

function Edit({ match: { params } }) {
    const editor = useRef(null);
    const [id, setId] = useState(params.id ? parseInt(params.id) : null);
    const [settingVisible, setSettingVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [tags, setTags] = useState([]);
    //const [remark, setRemark] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [columnId, setColumnId] = useState(0);
    const [source, setSource] = useState({
        type: 'original',
        data: null,
    });

    const [publishing, setPublishing] = useState(false);
    const [drawerState, setDrawerState] = useState(false);

    const [paidReadSetting, setPaidReadSetting] = useState(false);

    const dispatch = useDispatch();
    const { detail } = useSelector((state) => state.doc);
    const { isMobile } = useContext(RouteContext);
    useEffect(() => {
        if ((id && detail) || !id) {
            if (detail) {
                setTitle(detail.title);
                setTags(detail.tags);
                setColumnId(detail.column ? detail.column.id : 0);
                setSource({ type: detail.source_type, data: detail.source_data });
            }
            setLoading(false);
        }
    }, [dispatch, detail, id]);

    const onTitleChange = (event) => {
        setTitle(event.target.value);
    };

    const onTitleBlur = () => {
        if (title.trim() === '' || saving) {
            return;
        }
        if (detail && detail.title.trim() === title.trim()) {
            return;
        }
        editor.current.onSave(SAVE_TYPE.FORCE, { title });
    };

    const onSave = useCallback(
        (action, res) => {
            if (action === 'begin') {
                setSaving(true);
            } else if (action === 'finish') {
                setSaving(false);
                const { result, data } = res || {};
                if (result && !id) {
                    const historyWin = window.history;
                    setId(data);
                    const url = `/article/${data}/edit`;
                    if (historyWin) {
                        historyWin.pushState(null, null, url);
                    } else {
                        history.replace({
                            pathname: url,
                        });
                    }
                }
            }
        },
        [id],
    );

    const onReverted = () => {
        // 重新加载页面
        window.location.reload();
    };

    const onShowDrawer = () => {
        setDrawerState(true);
    };

    const onHideDrawer = () => {
        setDrawerState(false);
    };

    const renderSaveStatus = () => {
        if (saving) {
            return '保存中...';
        }
        if (detail) {
            return <span>保存于 {moment(detail.updated_time).format('H:mm:ss')}</span>;
        }

        if (!loading && detail) {
            return (
                <span>
                    最后更改于
                    <Timer time={detail.updated_time} />
                </span>
            );
        }
    };

    /*const onModifyReasonChange = event => {
    setRemark(event.target.value);
  };

  const renderRemark = () => {
    return (
      <Form.Item label="修改原因" colon={false}>
        <Input.TextArea
          value={remark}
          onChange={onModifyReasonChange}
          autoSize={{
            minRows: 2,
            maxRows: 6,
          }}
          maxLength="150"
        />
      </Form.Item>
    );
  };*/

    const getError = () => {
        if (title.trim() === '') {
            return '你还没有添加标题';
        }

        const engine = editor.current.getEngine();
        const content = engine ? engine.getPureContent() : '';
        if (Editor.Utils.isBlank(content)) {
            return '请输入正文';
        }

        if (tags.length === 0) {
            return '请至少添加一个标签';
        }

        //if (doc && doc.published && remark === '') {
        //return '请填写修改原因';
        //}
    };

    const onPublish = () => {
        setPublishing(true);
        if (editor.current) {
            editor.current.onPublish({
                tags: tags.map((tag) => tag.id),
                columnId,
                sourceType: source.type,
                sourceData: source.data,
                //remark,
            });
        }
    };

    const onPublished = useCallback((res) => {
        setPublishing(false);
        if (!res.result) {
            return;
        }

        message.info('发布成功', 1, () => {
            window.location.href = '/article/' + res.data.id;
        });
    }, []);

    const onPaidReadSubmit = (value) => {
        return new Promise((resolve) => {
            dispatch({
                type: 'doc/paidread',
                payload: {
                    data: { ...value, id },
                    type: 'article',
                },
            }).then(({ result }) => {
                if (result) {
                    setPaidReadSetting(false);
                    message.success('设置成功');
                }
                resolve();
            });
        });
    };

    const error = getError();
    return (
        <>
            {!loading && (
                <header className={styles.header}>
                    <div className={styles.container}>
                        <div className={styles.logo}>
                            <a href="/">
                                <img src={logo} alt="" />
                            </a>
                        </div>
                        {!isMobile && (
                            <div className={styles['sub-title']}>
                                文章编辑<span>-</span>
                                {title}
                            </div>
                        )}
                        <div className={styles['save-status']}>{renderSaveStatus()}</div>
                        <Space className={styles.right}>
                            {!isMobile && detail && (
                                <Button onClick={() => editor.current.showHistory()}>历史</Button>
                            )}
                            <Button type="primary" onClick={onShowDrawer}>
                                发布
                            </Button>
                            <Popover
                                overlayClassName={'popover-menu'}
                                placement="bottomLeft"
                                arrowPointAtCenter
                                content={
                                    <Menu className={styles['more-menu']}>
                                        {id && (
                                            <Menu.Item onClick={() => setSettingVisible(true)}>
                                                文章设置
                                            </Menu.Item>
                                        )}
                                        {id && (
                                            <Menu.Item onClick={() => setPaidReadSetting(true)}>
                                                付费阅读
                                            </Menu.Item>
                                        )}
                                        {id && (
                                            <Menu.Item>
                                                <Article.Delete
                                                    id={id}
                                                    title={title}
                                                    icon={null}
                                                    text="删除文章"
                                                    callback={(res) => {
                                                        if (res && res.result) {
                                                            window.location.href = '/dashboard';
                                                        } else {
                                                            message.error(res.message);
                                                        }
                                                    }}
                                                />
                                            </Menu.Item>
                                        )}
                                        <Menu.Item>
                                            <a href="/dashboard">退出编辑</a>
                                        </Menu.Item>
                                    </Menu>
                                }
                            >
                                <EllipsisButton className={styles['ellipsis-button']} />
                            </Popover>
                        </Space>
                    </div>
                </header>
            )}
            <div className={styles.container}>
                <div className={styles['editor']}>
                    <Editor
                        type={isMobile ? 'mini' : 'full'}
                        ref={editor}
                        id={id}
                        ot={false}
                        dataType="article"
                        toolbar={
                            isMobile
                                ? [
                                      ['heading', 'bold'],
                                      ['codeblock'],
                                      ['orderedlist', 'unorderedlist'],
                                      ['image', 'video', 'file'],
                                  ]
                                : null
                        }
                        toc={isMobile ? false : true}
                        header={
                            <div className={styles['title']}>
                                <Input
                                    className={styles['input']}
                                    size="large"
                                    placeholder="请输入标题(最多50个字)"
                                    value={title}
                                    onChange={onTitleChange}
                                    onBlur={onTitleBlur}
                                    maxLength={50}
                                />
                            </div>
                        }
                        historyExtra={(data) => <HistoryExtra {...data} />}
                        onSave={onSave}
                        onReverted={onReverted}
                        onPublished={onPublished}
                    />
                </div>
            </div>
            <Drawer
                title="发布"
                placement="right"
                visible={drawerState}
                onClose={onHideDrawer}
                width={isMobile ? '100%' : 430}
            >
                <Form>
                    <Form.Item
                        label="设置标签"
                        extra="合适的标签，能方便分类检索，也更容易让读者发现。"
                        colon={false}
                    >
                        <Selector values={tags} onChange={setTags} />
                    </Form.Item>
                    <Form.Item label="&nbsp;&nbsp;&nbsp;发布到" colon={false}>
                        <Column value={columnId} onChange={setColumnId} />
                    </Form.Item>
                    <Form.Item label="文章来源" colon={false}>
                        <Source value={source} onChange={setSource} />
                    </Form.Item>

                    {error && <Alert description={error} type="error" showIcon />}
                    {!error && (
                        <Form.Item
                            extra="您将对提供的内容负有法律责任，对虚假和恶意营销，我们将保留追究法律责任的权利！"
                            colon={false}
                        >
                            <Button
                                disabled={error ? true : false}
                                loading={publishing}
                                type="primary"
                                onClick={onPublish}
                                style={{ width: '100%' }}
                            >
                                {publishing ? '提交中...' : '发布'}
                            </Button>
                        </Form.Item>
                    )}
                </Form>
            </Drawer>
            {detail && (
                <Setting
                    visible={settingVisible}
                    id={id}
                    custom_description={detail.custom_description}
                    description={detail.description}
                    cover={detail.cover}
                    onCancel={() => setSettingVisible(false)}
                />
            )}
            {detail && (
                <PaidReadSetting
                    dataSource={detail.paid_read}
                    visible={paidReadSetting}
                    onCancel={() => setPaidReadSetting(false)}
                    onSubmit={onPaidReadSubmit}
                />
            )}
        </>
    );
}
Edit.getInitialProps = async ({ isServer, store }) => {
    const { getState } = store;

    if (isServer) return getState();
};
export default Edit;
