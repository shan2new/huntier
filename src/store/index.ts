import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import { rootReducer } from './rootReducer'
import { rootSaga } from './rootSaga'

export function makeStore() {
  const sagaMiddleware = createSagaMiddleware()
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefault) => getDefault({
      thunk: false,
      serializableCheck: {
        ignoredActions: [
          'resume/IMPORT_PDF_REQUEST',
          'resume/EXPORT_REQUEST',
          'resume/SUGGEST_BULLETS_REQUEST',
          'resume/ENHANCE_SUMMARY_REQUEST',
          'resume/ENHANCE_BULLET_REQUEST',
        ],
        ignoredActionPaths: ['payload.file', 'payload.resolve'],
      },
    }).concat(sagaMiddleware),
    devTools: true,
  })
  sagaMiddleware.run(rootSaga)
  return store
}

export type AppStore = ReturnType<typeof makeStore>
export type AppDispatch = ReturnType<AppStore['dispatch']>
export type RootState = ReturnType<AppStore['getState']>


