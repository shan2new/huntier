import { combineReducers } from '@reduxjs/toolkit'
import resumeReducer from './slices/resumeSlice'

export const rootReducer = combineReducers({
  resume: resumeReducer,
})

export type RootReducer = typeof rootReducer


