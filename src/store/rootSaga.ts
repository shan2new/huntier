import { all, fork } from 'redux-saga/effects'
import resumeSaga from './slices/resumeSaga'

export function* rootSaga() {
  yield all([
    fork(resumeSaga),
  ])
}


