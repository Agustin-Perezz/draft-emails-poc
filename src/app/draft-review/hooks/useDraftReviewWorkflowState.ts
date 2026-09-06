"use client";

import { useCallback, useState } from "react";

import type { WorkflowStatus } from "@/lib/types";
import { WorkflowStatus as Status } from "@/lib/types";

type WorkflowState = {
  status: WorkflowStatus;
  errorMessage: string | null;
};

type WorkflowActions = {
  startDrafting: () => void;
  startReviewing: () => void;
  startSending: () => void;
  markDone: () => void;
  reportError: (message: string) => void;
};

// Transition table: which status may follow which.
const ALLOWED_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  [Status.Idle]: [Status.Drafting],
  [Status.Drafting]: [Status.Reviewing, Status.Error],
  [Status.Reviewing]: [Status.Sending, Status.Drafting, Status.Error],
  [Status.Sending]: [Status.Done, Status.Error],
  [Status.Done]: [Status.Drafting],
  [Status.Error]: [Status.Drafting],
};

export function useDraftReviewWorkflowState(): WorkflowState & WorkflowActions {
  const [state, setState] = useState<WorkflowState>({
    status: Status.Idle,
    errorMessage: null,
  });

  const transition = useCallback(
    (next: Status, message: string | null = null) => {
      setState((current) => {
        if (!ALLOWED_TRANSITIONS[current.status].includes(next)) {
          return current;
        }

        return { status: next, errorMessage: message };
      });
    },
    [],
  );

  const startDrafting = useCallback(
    () => transition(Status.Drafting),
    [transition],
  );
  const startReviewing = useCallback(
    () => transition(Status.Reviewing),
    [transition],
  );
  const startSending = useCallback(
    () => transition(Status.Sending),
    [transition],
  );
  const markDone = useCallback(() => transition(Status.Done), [transition]);
  const reportError = useCallback(
    (message: string) => transition(Status.Error, message),
    [transition],
  );

  return {
    ...state,
    startDrafting,
    startReviewing,
    startSending,
    markDone,
    reportError,
  };
}
