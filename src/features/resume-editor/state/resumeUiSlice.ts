import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export type ResumeUiState = {
  selectedSectionId: string | null
  focusedFieldPath: string | null
  panelSizes: { left: number; center: number; right: number }
}

const initialState: ResumeUiState = {
  selectedSectionId: null,
  focusedFieldPath: null,
  panelSizes: { left: 20, center: 55, right: 25 },
}

const slice = createSlice({
  name: 'resumeUi',
  initialState,
  reducers: {
    setSelectedSection(state, action: PayloadAction<string | null>) { state.selectedSectionId = action.payload },
    setFocusedField(state, action: PayloadAction<string | null>) { state.focusedFieldPath = action.payload },
    setPanelSizes(state, action: PayloadAction<ResumeUiState['panelSizes']>) { state.panelSizes = action.payload },
  }
})

export const resumeUiActions = slice.actions
export default slice.reducer


