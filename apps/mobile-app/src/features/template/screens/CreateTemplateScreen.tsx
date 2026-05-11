import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import { TemplateEditor, type TemplateEditorDraft } from '../components/TemplateEditor';
import { applyTemplateImageMutation } from '../api/template-image.api';
import {
    buildCreateTemplatePayload,
    createTemplate,
    deleteTemplate,
    mapTemplateDaysToUpsertRequests,
    upsertTemplateDay,
} from '../api/template.api';
import { createTemplateDay } from '@features/template/utils/template-screen-data';
import { useSession } from '@/providers/AuthProvider';

export default function CreateTemplateScreen() {
    const router = useRouter();
    const { session } = useSession();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const initialDays = useMemo(() => [createTemplateDay({ dayNumber: 1 })], []);

    const handleClearSubmitError = useCallback(() => {
        setSubmitError(null);
    }, []);

    const handleSubmitDraft = useCallback(
        async (draft: TemplateEditorDraft) => {
            if (isSubmitting) {
                return;
            }

            if (!session?.accessToken) {
                setSubmitError('Missing access token. Please sign in again.');
                return;
            }

            setIsSubmitting(true);
            setSubmitError(null);

            let createdTemplateId: string | null = null;

            try {
                const payload = buildCreateTemplatePayload({
                    description: draft.description,
                    name: draft.templateName,
                });
                const createdTemplate = await createTemplate({
                    accessToken: session.accessToken,
                    payload,
                });

                createdTemplateId = createdTemplate.id;

                await applyTemplateImageMutation({
                    accessToken: session.accessToken,
                    mutation: draft.templateImageMutation,
                    templateId: createdTemplate.id,
                });

                for (const request of mapTemplateDaysToUpsertRequests(draft.days)) {
                    await upsertTemplateDay({
                        accessToken: session.accessToken,
                        dayNumber: request.dayNumber,
                        payload: request.payload,
                        templateId: createdTemplate.id,
                    });
                }

                router.replace(`/template/${createdTemplate.id}`);
            } catch (error) {
                if (createdTemplateId) {
                    try {
                        await deleteTemplate({
                            accessToken: session.accessToken,
                            templateId: createdTemplateId,
                        });
                    } catch {
                        // Ignore rollback failure and surface the original submit error.
                    }
                }

                setSubmitError(resolveTemplateSubmitErrorMessage(error, 'Unable to create this template right now.'));
            } finally {
                setIsSubmitting(false);
            }
        },
        [isSubmitting, router, session?.accessToken],
    );

    return (
        <TemplateEditor
            headerTitle="Create Template"
            isSubmitting={isSubmitting}
            submitLabel="Create"
            submittingLabel="Creating..."
            submitError={submitError}
            onClearSubmitError={handleClearSubmitError}
            onSubmitDraft={handleSubmitDraft}
            quitModalVariant="create"
            initialTemplateName=""
            initialDescription=""
            initialTemplateImageKey={null}
            initialTemplateImageUrl={null}
            initialDays={initialDays}
        />
    );
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