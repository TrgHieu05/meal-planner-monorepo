import { TemplatePromptModal } from './TemplatePromptModal';

export interface DeleteTemplateModalProps {
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
    open: boolean;
}

export function DeleteTemplateModal({
    onConfirm,
    onOpenChange,
    open,
}: DeleteTemplateModalProps) {
    return (
        <TemplatePromptModal
            open={open}
            onOpenChange={onOpenChange}
            title="Delete Template?"
            description="This template will be permanently removed from your templates. This action cannot be undone."
            cancelLabel="Cancel"
            confirmLabel="Delete"
            confirmColor="danger"
            onConfirm={onConfirm}
        />
    );
}