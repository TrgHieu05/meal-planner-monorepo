import { TemplatePromptModal } from './TemplatePromptModal';

export interface QuitEditingTemplateModalProps {
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
    open: boolean;
}

export function QuitEditingTemplateModal({
    onConfirm,
    onOpenChange,
    open,
}: QuitEditingTemplateModalProps) {
    return (
        <TemplatePromptModal
            open={open}
            onOpenChange={onOpenChange}
            title="Quit Editing Template?"
            description="If you leave now, your changes to this template will not be saved."
            cancelLabel="Stay"
            confirmLabel="Quit"
            confirmColor="danger"
            onConfirm={onConfirm}
        />
    );
}