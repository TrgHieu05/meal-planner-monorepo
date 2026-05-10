import { TemplatePromptModal } from './TemplatePromptModal';

export interface DeleteTemplateModalProps {
    isSubmitting?: boolean;
    onConfirm: () => Promise<void> | void;
    onOpenChange: (open: boolean) => void;
    open: boolean;
    submitError?: string | null;
}

export function DeleteTemplateModal({
    isSubmitting = false,
    onConfirm,
    onOpenChange,
    open,
    submitError,
}: DeleteTemplateModalProps) {
    return (
        <TemplatePromptModal
            open={open}
            onOpenChange={onOpenChange}
            title="Delete Template?"
            description="This template will be permanently removed from your templates. This action cannot be undone."
            cancelLabel="Cancel"
            confirmLabel="Delete"
            submittingLabel="Deleting..."
            confirmColor="danger"
            isSubmitting={isSubmitting}
            onConfirm={onConfirm}
            submitError={submitError}
        />
    );
}