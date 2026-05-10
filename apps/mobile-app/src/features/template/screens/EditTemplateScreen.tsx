import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SizableText, YStack } from 'tamagui';

import { Button } from '@components';

import { TemplateEditor, type TemplateEditorDraft } from '../components/TemplateEditor';
import {
    buildTemplateEditDayPlan,
    buildUpdateTemplatePayload,
    deleteTemplateDay,
    fetchTemplateEditorData,
    type TemplateEditorData,
    updateTemplate,
    upsertTemplateDay,
} from '../api/template.api';
import { useSession } from '@/providers/AuthProvider';

export default function EditTemplateScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string | string[] }>();
    const { session } = useSession();
    const [editorData, setEditorData] = useState<TemplateEditorData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const templateId = useMemo(() => normalizeTemplateIdParam(id), [id]);

    const loadEditorData = useCallback(async () => {
        if (!templateId) {
            setEditorData(null);
            setIsLoading(false);
            setLoadError('Template not found.');
            return;
        }

        if (!session?.accessToken) {
            setEditorData(null);
            setIsLoading(false);
            setLoadError('Missing access token. Please sign in again.');
            return;
        }

        setIsLoading(true);
        setLoadError(null);
        setSubmitError(null);

        try {
            const result = await fetchTemplateEditorData({
                accessToken: session.accessToken,
                templateId,
            });

            setEditorData(result);
        } catch (error) {
            setEditorData(null);

            if (axios.isAxiosError(error) && error.response?.status === 404) {
                setLoadError('Template not found.');
            } else {
                setLoadError(resolveTemplateSubmitErrorMessage(error, 'Unable to load this template right now.'));
            }
        } finally {
            setIsLoading(false);
        }
    }, [session?.accessToken, templateId]);

    useEffect(() => {
        void loadEditorData();
    }, [loadEditorData]);

    const handleClearSubmitError = useCallback(() => {
        setSubmitError(null);
    }, []);

    const handleSubmitDraft = useCallback(
        async (draft: TemplateEditorDraft) => {
            if (isSubmitting) {
                return;
            }

            if (!templateId) {
                setSubmitError('Template not found.');
                return;
            }

            if (!editorData) {
                setSubmitError('Template data is still loading. Please try again.');
                return;
            }

            if (!session?.accessToken) {
                setSubmitError('Missing access token. Please sign in again.');
                return;
            }

            setIsSubmitting(true);
            setSubmitError(null);

            try {
                const dayPlan = buildTemplateEditDayPlan({
                    currentDays: draft.days,
                    initialDays: editorData.initialDays,
                });

                await updateTemplate({
                    accessToken: session.accessToken,
                    payload: buildUpdateTemplatePayload({
                        description: draft.description,
                        name: draft.templateName,
                    }),
                    templateId,
                });

                for (const request of dayPlan.daysToUpsert) {
                    await upsertTemplateDay({
                        accessToken: session.accessToken,
                        dayNumber: request.dayNumber,
                        payload: request.payload,
                        templateId,
                    });
                }

                for (const dayNumber of dayPlan.dayNumbersToDelete) {
                    await deleteTemplateDay({
                        accessToken: session.accessToken,
                        dayNumber,
                        templateId,
                    });
                }

                router.replace(`/template/${templateId}`);
            } catch (error) {
                setSubmitError(resolveTemplateSubmitErrorMessage(error, 'Unable to save this template right now.'));
            } finally {
                setIsSubmitting(false);
            }
        },
        [editorData, isSubmitting, router, session?.accessToken, templateId],
    );

    if (isLoading) {
        return (
            <YStack f={1} bg="$background" ai="center" jc="center" px="$space.md" gap="$space.sm">
                <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                    Loading template editor
                </SizableText>
            </YStack>
        );
    }

    if (!editorData) {
        return (
            <YStack f={1} bg="$background" ai="center" jc="center" px="$space.md" gap="$space.md">
                <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                    Unable to open template
                </SizableText>
                {loadError ? (
                    <SizableText ff="$body" fos="$md" ta="center" col="$textSubtle">
                        {loadError}
                    </SizableText>
                ) : null}
                <Button size="medium" color="primary" onPress={() => void loadEditorData()}>
                    <Button.Text>Retry</Button.Text>
                </Button>
            </YStack>
        );
    }

    return (
        <TemplateEditor
            headerTitle="Edit Template"
            isSubmitting={isSubmitting}
            submitLabel="Save"
            submittingLabel="Saving..."
            submitError={submitError}
            onClearSubmitError={handleClearSubmitError}
            onSubmitDraft={handleSubmitDraft}
            quitModalVariant="edit"
            initialTemplateName={editorData.initialTemplateName}
            initialDescription={editorData.initialDescription}
            initialDays={editorData.initialDays}
        />
    );
}

function normalizeTemplateIdParam(value?: string | string[]) {
    const templateId = Array.isArray(value) ? value[0] : value;

    if (!templateId) {
        return null;
    }

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(templateId)
        ? templateId
        : null;
}

function resolveTemplateSubmitErrorMessage(error: unknown, fallbackMessage: string) {
    if (error instanceof Error) {
        const message = error.message.trim();

        if (message.length > 0) {
            return message;
        }
    }

    return fallbackMessage;
}