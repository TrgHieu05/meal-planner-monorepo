import { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, YStack, XStack, SizableText, useTheme } from 'tamagui';
import { ChevronLeft, Plus, SlidersHorizontal, Grid2x2Plus } from '@tamagui/lucide-icons-2';
import { useRouter } from 'expo-router';

import { Button } from '@components';
import { useSession } from '@/providers/AuthProvider';
import {
    applyTemplate,
    buildApplyTemplatePayload,
    deleteTemplate,
    fetchTemplateListScreenData,
    type TemplateListItemScreenData,
} from '@features/template/api/template.api';
import type { ApplyTemplateSelection } from '@features/template/components/ApplyTemplateModal';
import { TemplateCard } from '@features/template/components/TemplateCard';
import {
    buildTemplateApplySuccessMessage,
    showTemplateSuccessAlert,
    TEMPLATE_ACTION_SUCCESS_MESSAGES,
} from '@features/template/utils/template-success-alert';

function resolveTemplateListErrorMessage(error: unknown, fallbackMessage: string) {
    if (error instanceof Error && error.message.trim()) {
        return error.message.trim();
    }

    return fallbackMessage;
}

export default function TemplateListScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { session } = useSession();
    const [templates, setTemplates] = useState<TemplateListItemScreenData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const isEmpty = !isLoading && !errorMessage && templates.length === 0;

    const loadTemplates = useCallback(async (config: { isActive: () => boolean }) => {
        if (!session?.accessToken) {
            if (!config.isActive()) {
                return;
            }

            setTemplates([]);
            setErrorMessage('Missing access token. Please sign in again.');
            setIsLoading(false);
            return;
        }

        if (!config.isActive()) {
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);

        try {
            const nextTemplates = await fetchTemplateListScreenData({
                accessToken: session.accessToken,
            });

            if (!config.isActive()) {
                return;
            }

            setTemplates(nextTemplates);
        } catch (error) {
            if (!config.isActive()) {
                return;
            }

            setTemplates([]);
            setErrorMessage(
                resolveTemplateListErrorMessage(error, 'Unable to load templates right now.'),
            );
        } finally {
            if (config.isActive()) {
                setIsLoading(false);
            }
        }
    }, [session?.accessToken]);

    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            void loadTemplates({
                isActive: () => isActive,
            });

            return () => {
                isActive = false;
            };
        }, [loadTemplates]),
    );

    const handleRetry = useCallback(() => {
        let isActive = true;

        void loadTemplates({
            isActive: () => isActive,
        });
    }, [loadTemplates]);

    const handleApplyTemplate = useCallback(
        async (templateId: string, selection: ApplyTemplateSelection) => {
            if (!session?.accessToken) {
                throw new Error('Missing access token. Please sign in again.');
            }

            const response = await applyTemplate({
                accessToken: session.accessToken,
                payload: buildApplyTemplatePayload(selection),
                templateId,
            });

            showTemplateSuccessAlert(buildTemplateApplySuccessMessage(response));
        },
        [session?.accessToken],
    );

    const handleDeleteTemplate = useCallback(
        async (templateId: string) => {
            if (!session?.accessToken) {
                throw new Error('Missing access token. Please sign in again.');
            }

            await deleteTemplate({
                accessToken: session.accessToken,
                templateId,
            });

            setTemplates((currentTemplates) =>
                currentTemplates.filter((template) => template.templateId !== templateId),
            );
            showTemplateSuccessAlert(TEMPLATE_ACTION_SUCCESS_MESSAGES.delete);
        },
        [session?.accessToken],
    );

    return (
        <YStack f={1} ai="center" bg="$background" p="$space.md" gap="$space.lg">
            <XStack h={40} ai="center" jc="center" pos="relative" w="100%">
                <XStack
                    pos="absolute"
                    l={0}
                    p="$xs"
                    onPress={() => router.back()}
                    pressStyle={{ opacity: 0.7 }}
                >
                    <ChevronLeft color="$text" size={20} />
                </XStack>
                <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                    Templates
                </SizableText>
            </XStack>

            <XStack w="100%" ai="center" jc="flex-end" gap="$space.sm">
                <Button color="primary" size="medium" br="$radius.pill" onPress={() => router.push('/template/create-template')}>
                    <Button.Icon icon={Plus} />
                    <Button.Text>Create</Button.Text>
                </Button>
            </XStack>

            {isLoading ? (
                <YStack f={1} ai="center" jc="center" px="$space.md" gap="$space.sm">
                    <ActivityIndicator color={theme.primary.val} />
                    <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                        Loading templates
                    </SizableText>
                    <SizableText ff="$body" fos="$md" col="$textSubtle" ta="center">
                        Fetching your latest template list from the server.
                    </SizableText>
                </YStack>
            ) : errorMessage ? (
                <YStack f={1} ai="center" jc="center" px="$space.md" gap="$space.md">
                    <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                        Unable to load templates
                    </SizableText>
                    <SizableText ff="$body" fos="$md" col="$danger" ta="center">
                        {errorMessage}
                    </SizableText>
                    <Button color="secondary" onPress={handleRetry}>
                        <Button.Text>Retry</Button.Text>
                    </Button>
                </YStack>
            ) : !isEmpty ? (
                <ScrollView w="100%" f={1} showsVerticalScrollIndicator={false}>
                    <YStack w="100%" gap="$space.md" pb="$space.xl">
                        {templates.map((template) => (
                            <TemplateCard
                                key={template.templateId}
                                templateId={template.templateId}
                                title={template.title}
                                templateCardImageUrl={template.templateCardImageUrl}
                                dayCount={template.dayCount}
                                nutritionSummary={template.nutritionSummary}
                                onApplyToDate={(selection) => handleApplyTemplate(template.templateId, selection)}
                                onDelete={() => handleDeleteTemplate(template.templateId)}
                            />
                        ))}
                    </YStack>
                </ScrollView>
            ) : null}

            {isEmpty && 
                <YStack f={1} ai="center" jc="center" px="$space.md" gap="$space.lg">
                    <Grid2x2Plus color="$textPrimary" size={240} opacity={0.5}/>
                    <SizableText ff="$body" fos="$md" fow="$semiBold" color="$textSubtle" whiteSpace="pre-line" ta="center">
                        {`You currently have no template. \n Press "+ Create" to create one!`}
                    </SizableText>
                    <YStack h={100}/>
                </YStack>
            }
        </YStack>
    );
}