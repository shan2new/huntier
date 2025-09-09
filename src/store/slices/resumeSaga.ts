import { call, put, select, takeEvery, throttle } from 'redux-saga/effects'
import { setSaving, loadSuccess, setHasUnsaved, setAll } from './resumeSlice'
import { createResumeWithRefresh, getResumeWithRefresh, updateResumeWithRefresh } from '@/lib/api'
// import { useAuthToken } from '@/lib/auth'

// Helpers to access token in saga: simple bridge using window to avoid wiring context here
function getToken(): Promise<string> {
  // We expect CopilotProvider/Auth to attach a token getter to window for sagas
  const w: any = typeof window !== 'undefined' ? window : {}
  if (typeof w.__getAuthToken === 'function') return w.__getAuthToken()
  // Fallback: no-op token
  return Promise.resolve('')
}

function* saveResume(_action: any): any {
  try {
    yield put(setSaving(true))
    const state: any = yield select((s: any) => s.resume)
    const token: string = yield call(getToken)
    const payload = state.data
    if (!payload.id) {
      const created: any = yield call(createResumeWithRefresh, payload, async () => token)
      yield put(setAll({ ...payload, id: created.id }))
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', `/resumes/${created.id}`)
      }
    } else {
      yield call(updateResumeWithRefresh, payload.id, payload, async () => token)
    }
    yield put(setHasUnsaved(false))
  } finally {
    yield put(setSaving(false))
  }
}

function* loadResume(action: any): any {
  const resumeId: string = action.payload
  if (!resumeId || resumeId === 'new') return
  const token: string = yield call(getToken)
  const data: any = yield call(getResumeWithRefresh, resumeId, async () => token)
  yield put(loadSuccess(data))
}

export default function* resumeSaga() {
  yield takeEvery('resume/LOAD_REQUEST', loadResume)
  yield throttle(1000, 'resume/SAVE_REQUEST', saveResume)
}


