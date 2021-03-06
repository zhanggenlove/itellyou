import { answerList } from '@/services/reward';
import { setList } from '@/utils/model';

export default {
    namespace: 'answerReward',

    state: {},
    effects: {
        *list({ payload: { append, ...payload } }, { call, put }) {
            const response = yield call(answerList, { ...payload, data_type: 'answer' });
            if (response && response.result) {
                yield put({
                    type: 'setList',
                    payload: { append, ...(response.data || {}) },
                });
            }
        },
    },
    reducers: {
        setList(state, { payload }) {
            return setList('list', payload, state);
        },
    },
};
