import { YStack } from 'tamagui';
import {
    formatProfileValue,
    getProfileItemIcon,
    type ProfileUIConfigItem,
} from '../constants';
import { InfoItem } from './InfoItem';

type UserData = Record<string, unknown>;

interface InfoWrapperProps {
    userData: UserData;
    config: ProfileUIConfigItem[];
}

export const InfoItemWrapper = ({ userData, config }: InfoWrapperProps) => {
    return (
        <YStack br="$radius.xl" overflow="hidden">
            {config.map((fieldConfig, index) => {
                const isLast = index === config.length - 1;
                const valueFromDB = userData[fieldConfig.key];
                const IconComponent = getProfileItemIcon(fieldConfig, valueFromDB);
                const valueToShow = fieldConfig.formatValue?.(valueFromDB) ?? formatProfileValue(valueFromDB);

                return (
                    <YStack key={fieldConfig.key}>
                        <InfoItem
                            isLast={isLast}
                            label={fieldConfig.label}
                            value={valueToShow}
                            Icon={IconComponent}
                        />
                    </YStack>
                );
            })}
        </YStack>
    );
};