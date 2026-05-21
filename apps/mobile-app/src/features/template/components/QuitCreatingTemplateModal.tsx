import { TemplatePromptModal } from './TemplatePromptModal';

export interface QuitCreatingTemplateModalProps {
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
    open: boolean;
}

export function QuitCreatingTemplateModal({
    onConfirm,
    onOpenChange,
    open,
}: QuitCreatingTemplateModalProps) {
    return (
        <TemplatePromptModal
            open={open}
            onOpenChange={onOpenChange}
            title="Quit Creating Template?"
            description="If you leave now, your current template draft will not be saved."
            cancelLabel="Stay"
            confirmLabel="Quit"
            confirmColor="danger"
            onConfirm={onConfirm}
        />
    );
}