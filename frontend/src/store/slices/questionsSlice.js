import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getQuestions as getQuestionsApi, getQuestion as getQuestionApi } from '../../api';

export const fetchQuestions = createAsyncThunk(
  'questions/fetchQuestions',
  async (params, { rejectWithValue }) => {
    try {
      const response = await getQuestionsApi(params);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || '获取问题列表失败'
      );
    }
  }
);

export const fetchQuestion = createAsyncThunk(
  'questions/fetchQuestion',
  async (payload, { rejectWithValue }) => {
    try {
      const { id, countView = true } =
        typeof payload === 'string' ? { id: payload } : payload || {};
      if (!id) {
        return rejectWithValue('问题ID无效');
      }
      const params = countView === false ? { countView: 'false' } : undefined;
      const response = await getQuestionApi(id, params);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || '获取问题详情失败'
      );
    }
  }
);

const questionsSlice = createSlice({
  name: 'questions',
  initialState: {
    questions: [],
    total: 0,
    loading: false,
    error: null,
    currentQuestion: null,
  },
  reducers: {
    clearCurrentQuestion(state) {
      state.currentQuestion = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload.questions || action.payload.data || [];
        state.total = action.payload.total || 0;
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuestion.fulfilled, (state, action) => {
        state.loading = false;
        state.currentQuestion = action.payload.question || action.payload;
      })
      .addCase(fetchQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentQuestion, clearError } = questionsSlice.actions;
export default questionsSlice.reducer;
