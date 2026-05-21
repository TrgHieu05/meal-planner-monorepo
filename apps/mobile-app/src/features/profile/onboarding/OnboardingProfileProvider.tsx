import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  createMetricEntry,
  createProfilePreferences,
  fetchProfileOptions,
  fetchProfileOverview,
  type ProfileOptions,
  updateCurrentUser,
  updateProfilePreferences,
} from '../api/profile.api';

import {
  extractFieldErrors,
  hasFieldErrors,
  resolveApiErrorMessage,
  validateOnboardingCuisineTypeStep,
  validateOnboardingDietTypeStep,
  validateOnboardingGoalStep,
  validateOnboardingInfoStep,
  validateOnboardingMetricStep,
} from '../utils/profile-form';

import { isApiErrorWithStatus } from '@/services/api/http-client';
import { useSession } from '@/providers/AuthProvider';

type GenderCode = 'M' | 'F';

export type OnboardingDraft = {
  gender: GenderCode | null;
  dateOfBirth: Date | null;
  dietTypeId: number | null;
  cuisineTypeId: number | null;
  goalId: number | null;
  targetCalories: string;
  weightKg: string;
  heightCm: string;
};

type OnboardingProfileContextValue = {
  draft: OnboardingDraft;
  options: ProfileOptions;
  isLoadingOptions: boolean;
  optionsError: string | null;
  isSubmitting: boolean;
  submitError: string | null;
  updateDraft: (patch: Partial<OnboardingDraft>) => void;
  clearSubmitError: () => void;
  reloadOptions: () => Promise<void>;
  submitOnboarding: () => Promise<void>;
};

const EMPTY_OPTIONS: ProfileOptions = {
  dietTypes: [],
  goals: [],
  cuisineTypes: [],
};

const OnboardingProfileContext =
  createContext<OnboardingProfileContextValue | null>(null);

function createInitialDraft(): OnboardingDraft {
  return {
    gender: null,
    dateOfBirth: null,
    dietTypeId: null,
    cuisineTypeId: null,
    goalId: null,
    targetCalories: '',
    weightKg: '',
    heightCm: '',
  };
}

export function OnboardingProfileProvider({ children }: { children: ReactNode }) {
  const { session, refreshSession } = useSession();
  const [draft, setDraft] = useState<OnboardingDraft>(() => createInitialDraft());
  const [options, setOptions] = useState<ProfileOptions>(EMPTY_OPTIONS);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateDraft = useCallback((patch: Partial<OnboardingDraft>) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      ...patch,
    }));
    setSubmitError(null);
  }, []);

  const clearSubmitError = useCallback(() => {
    setSubmitError(null);
  }, []);

  const reloadOptions = useCallback(async () => {
    setIsLoadingOptions(true);
    setOptionsError(null);

    try {
      const nextOptions = await fetchProfileOptions();
      setOptions(nextOptions);
    } catch (error) {
      setOptions(EMPTY_OPTIONS);
      setOptionsError(
        resolveOnboardingErrorMessage(
          error,
          'Unable to load onboarding options right now.',
        ),
      );
    } finally {
      setIsLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    void reloadOptions();
  }, [reloadOptions]);

  const submitOnboarding = useCallback(async () => {
    const accessToken = session?.accessToken;
    if (!accessToken) {
      const error = new Error('Missing access token. Please sign in again.');
      setSubmitError(error.message);
      throw error;
    }

    let payloads: ReturnType<typeof buildOnboardingPayloads>;
    try {
      payloads = buildOnboardingPayloads(draft);
    } catch (error) {
      const nextFieldErrors = extractFieldErrors(error, [
        'gender',
        'dateOfBirth',
        'dietTypeId',
        'cuisineTypeId',
        'goalId',
        'targetCalories',
        'heightCm',
        'weightKg',
      ] as const);
      setSubmitError(
        hasFieldErrors(nextFieldErrors)
          ? null
          : resolveOnboardingErrorMessage(
              error,
              'Please review the highlighted fields.',
            ),
      );
      throw error;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const overview = await getProfileOverviewOrNull(accessToken);

      await updateCurrentUser({
        accessToken,
        payload: payloads.user,
      });

      if (overview?.preferences == null) {
        await createProfilePreferences({
          accessToken,
          payload: payloads.profile,
        });
      } else {
        await updateProfilePreferences({
          accessToken,
          payload: payloads.profile,
        });
      }

      await createMetricEntry({
        accessToken,
        payload: payloads.metric,
      });

      const nextSession = await refreshSession();
      if (!nextSession?.user.isOnboardingCompleted) {
        throw new Error(
          'Onboarding is not complete yet. Please try again.',
        );
      }
    } catch (error) {
      const nextFieldErrors = extractFieldErrors(error, [
        'gender',
        'dateOfBirth',
        'dietTypeId',
        'cuisineTypeId',
        'goalId',
        'targetCalories',
        'heightCm',
        'weightKg',
      ] as const);
      const message = resolveOnboardingErrorMessage(
        error,
        'Unable to save onboarding data right now.',
      );
      setSubmitError(hasFieldErrors(nextFieldErrors) ? null : message);
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [draft, refreshSession, session?.accessToken]);

  const contextValue = useMemo<OnboardingProfileContextValue>(() => {
    return {
      draft,
      options,
      isLoadingOptions,
      optionsError,
      isSubmitting,
      submitError,
      updateDraft,
      clearSubmitError,
      reloadOptions,
      submitOnboarding,
    };
  }, [
    clearSubmitError,
    draft,
    isLoadingOptions,
    isSubmitting,
    options,
    optionsError,
    reloadOptions,
    submitError,
    submitOnboarding,
    updateDraft,
  ]);

  return (
    <OnboardingProfileContext.Provider value={contextValue}>
      {children}
    </OnboardingProfileContext.Provider>
  );
}

export function useOnboardingProfile() {
  const context = useContext(OnboardingProfileContext);

  if (!context) {
    throw new Error(
      'useOnboardingProfile must be used within OnboardingProfileProvider',
    );
  }

  return context;
}

async function getProfileOverviewOrNull(accessToken: string) {
  try {
    return await fetchProfileOverview({ accessToken });
  } catch (error) {
    if (isApiErrorWithStatus(error, 404)) {
      return null;
    }

    throw error;
  }
}

function buildOnboardingPayloads(draft: OnboardingDraft) {
  const user = validateOnboardingInfoStep({
    gender: draft.gender,
    dateOfBirth: draft.dateOfBirth,
  });
  const dietTypeId = validateOnboardingDietTypeStep({
    dietTypeId: draft.dietTypeId,
  });
  const cuisineTypeId = validateOnboardingCuisineTypeStep({
    cuisineTypeId: draft.cuisineTypeId,
  });
  const goal = validateOnboardingGoalStep({
    goalId: draft.goalId,
    targetCalories: draft.targetCalories,
  });
  const metric = validateOnboardingMetricStep({
    heightCm: draft.heightCm,
    weightKg: draft.weightKg,
  });

  return {
    user,
    profile: {
      dietTypeId,
      goalId: goal.goalId,
      cuisineTypeId,
      targetCalories: goal.targetCalories,
    },
    metric,
  };
}

function resolveOnboardingErrorMessage(error: unknown, fallbackMessage: string) {
  return resolveApiErrorMessage(error, fallbackMessage);
}