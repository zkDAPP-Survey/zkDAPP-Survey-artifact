import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { SurveyDetail, QuestionType } from "@/domain/models";

export interface VotingAnswer {
  questionId: string;
  type: QuestionType;
  selectedOptions: string[]; // option IDs for single/multiple choice
  textValue: string;         // for textarea
}

interface VotingState {
  survey: SurveyDetail | null;
  answers: VotingAnswer[];
}

type VotingCtx = {
  state: VotingState;
  setSurvey: (survey: SurveyDetail) => void;
  setAnswer: (answer: VotingAnswer) => void;
  reset: () => void;
};

const defaultState: VotingState = { survey: null, answers: [] };

const VotingContext = createContext<VotingCtx | null>(null);

export function VotingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<VotingState>(defaultState);

  const setSurvey = useCallback((survey: SurveyDetail) => {
    setState({
      survey,
      answers: (survey.questions ?? []).map((q) => ({
        questionId: q.id,
        type: q.type,
        selectedOptions: [],
        textValue: "",
      })),
    });
  }, []);

  const setAnswer = useCallback((answer: VotingAnswer) => {
    setState((prev) => ({
      ...prev,
      answers: prev.answers.map((a) =>
        a.questionId === answer.questionId ? answer : a
      ),
    }));
  }, []);

  const reset = useCallback(() => setState(defaultState), []);

  const value = useMemo(
    () => ({ state, setSurvey, setAnswer, reset }),
    [state, setSurvey, setAnswer, reset]
  );

  return (
    <VotingContext.Provider value={value}>{children}</VotingContext.Provider>
  );
}

export function useVoting() {
  const ctx = useContext(VotingContext);
  if (!ctx) throw new Error("useVoting must be used inside VotingProvider");
  return ctx;
}

