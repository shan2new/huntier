import { combineReducers } from '@reduxjs/toolkit'
import resumeReducer from '@/features/resume-editor/state/resumeEditorSlice'
import resumeUiReducer from '@/features/resume-editor/state/resumeUiSlice'

export const rootReducer = combineReducers({
  resume: resumeReducer,
  resumeUi: resumeUiReducer,
})

export type RootReducer = typeof rootReducer


