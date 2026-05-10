import { useEffect, useState } from 'react';
import { Check } from '@tamagui/lucide-icons-2';
import { Checkbox, SizableText, XStack, YStack } from 'tamagui';

import { InputDate } from '@components';
import { createTodayCalendarDate } from '@features/menu/utils/week-date';

import { TemplatePromptModal } from './TemplatePromptModal';

export interface ApplyTemplateSelection {
    replaceExistingMeals: boolean;
    selectedDate: Date;
}

export interface ApplyTemplateModalProps {
    isSubmitting?: boolean;
    onApply?: (selection: ApplyTemplateSelection) => Promise<void> | void;
    onOpenChange: (open: boolean) => void;
    open: boolean;
    submitError?: string | null;
}

export function ApplyTemplateModal({
    isSubmitting = false,
    onApply,
    onOpenChange,
    open,
    submitError,
}: ApplyTemplateModalProps) {
    const [selectedDate, setSelectedDate] = useState<Date>(() => createTodayCalendarDate());
    const [replaceExistingMeals, setReplaceExistingMeals] = useState(true);

    useEffect(() => {
        if (!open) {
            return;
        }

        setSelectedDate(createTodayCalendarDate());
        setReplaceExistingMeals(true);
    }, [open]);

    const handleApply = () => {
        onApply?.({
            selectedDate,
            replaceExistingMeals,
        });
    };

    const handleCheckedChange = (checked: boolean | 'indeterminate') => {
        setReplaceExistingMeals(checked === true);
    };

    return (
        <TemplatePromptModal
            open={open}
            onOpenChange={onOpenChange}
            title="Apply Template"
            description="Choose the date you want to apply this template to your menu."
            cancelLabel="Cancel"
            confirmLabel="Apply"
            submittingLabel="Applying..."
            isSubmitting={isSubmitting}
            onConfirm={handleApply}
            submitError={submitError}
        >

            <YStack w="100%" gap="$space.lg">
                <YStack w="100%" gap="$space.xs">
                    <SizableText ff="$body" fos="$md" fow="$semiBold" col="$textSubtle">
                        Date to apply
                    </SizableText>
                    <InputDate value={selectedDate} onValueChange={setSelectedDate} />
                </YStack>

                <XStack w="100%" ai="flex-start" gap="$space.sm">
                    <Checkbox h={24} w={24} br="$radius.xs" bw={0} bg="$surface" activeStyle={{bg: "$primary"}} checked={replaceExistingMeals} onCheckedChange={handleCheckedChange}>
                        <Checkbox.Indicator>
                            <Check size={16} color="$textInverse"/>
                        </Checkbox.Indicator>
                    </Checkbox>

                    <YStack f={1} gap={2}>
                        <SizableText ff="$body" fos="$md" fow="$semiBold" col="$text">
                            Replace existing meals
                        </SizableText>
                        <SizableText ff="$body" fos="$sm" col="$textSubtle">
                            If checked, any existing meals during the applied days will be replaced by the template.
                        </SizableText>
                    </YStack>
                </XStack>

            </YStack>
            
        </TemplatePromptModal>
    );
}