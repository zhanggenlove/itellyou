import { history } from 'umi';
import {
    find,
    create,
    search,
    query,
    group,
    list,
    auditList,
    auditVersion,
} from '@/services/tag/index';
import { setList, replaceItem } from '@/utils/model';

export default {
    namespace: 'tag',

    state: {
        list: null,
        group: null,
        search: null,
        auditList: null,
        detail: {},
    },

    effects: {
        *find({ payload }, { call, put }) {
            const response = yield call(find, payload);
            const { result, status, data } = response;
            if (result) {
                yield put({
                    type: 'updateDetail',
                    payload: response.data,
                });
            } else if (status > 200) {
                history.push(`/${status}`);
            }

            return response;
        },
        *create({ payload }, { call }) {
            const response = yield call(create, payload);
            return response;
        },
        *query({ payload }, { call, put }) {
            const response = yield call(query, payload);
            yield put({
                type: 'updateDetail',
                payload: response.data,
            });
            return response;
        },
        *search({ payload }, { call, put }) {
            const { create, ...params } = payload;
            if (payload.w === '') return;
            const response = yield call(search, params);
            if (response && response.result) {
                const { w } = payload;
                const { data } = response;
                let searchData = [];
                if (create && data.length === 0 && w.trim() !== '') {
                    searchData.push({
                        id: create,
                        name: w.trim(),
                    });
                } else {
                    searchData = data;
                }
                yield put({
                    type: 'setSearch',
                    payload: searchData,
                });
            }
            return response;
        },
        *group({ payload }, { call, put }) {
            const response = yield call(group, payload);
            yield put({
                type: 'updateGroup',
                payload: response.data || null,
            });
        },
        *list({ payload: { append, ...payload } }, { call, put }) {
            const response = yield call(list, payload);
            yield put({
                type: 'updateList',
                payload: { ...(response.data || {}), append },
            });
        },
        *auditList({ payload }, { call, put }) {
            const response = yield call(auditList, payload);
            yield put({
                type: 'updateAuditList',
                payload: response.data || [],
            });
        },
        *auditVersion({ payload }, { call }) {
            const response = yield call(auditVersion, payload);
            return response;
        },
    },
    reducers: {
        setSearch(state, { payload }) {
            return {
                ...state,
                search: payload,
            };
        },
        updateDetail(state, { payload }) {
            return {
                ...state,
                detail: {
                    ...state.detail,
                    [payload.id]: { ...state.detail[payload.id], ...payload },
                },
            };
        },
        updateList(state, { payload }) {
            return setList('list', payload, state);
        },
        replaceItem(state, { payload }) {
            return replaceItem('list', payload, state);
        },
        updateAuditList(state, { payload }) {
            return {
                ...state,
                auditList: payload,
            };
        },
        updateGroup(state, { payload }) {
            return {
                ...state,
                group: payload,
            };
        },
    },
};
