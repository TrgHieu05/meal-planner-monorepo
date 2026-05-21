import { SizableText, XStack, YStack } from 'tamagui';

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

export interface WeekDateStripProps {
  days: Date[];
  selectedDate: Date;
  today: Date;
  onDayPress?: (date: Date) => void;
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function WeekDateStrip({ days, selectedDate, today, onDayPress }: WeekDateStripProps) {
  return (
    <XStack w="100%" jc="space-between">
      {days.map((day, index) => {
        const isSelected = isSameDay(day, selectedDate);
        const isToday = isSameDay(day, today);

        return (
          <YStack
            key={day.toISOString()}
            w={40}
            h={80}
            ai="center"
            pt={10}
            gap="$space.md"
            bg={isSelected ? '$primary' : 'transparent'}
            br="$pill"
            onPress={() => onDayPress?.(day)}
            pressStyle={{ opacity: 0.86 }}
          >
            <SizableText
              ff="$body"
              fos="$sm"
              fow="$bold"
              color={isSelected ? '$textInverse' : '$textSubtle'}
            >
              {WEEKDAY_LABELS[index]}
            </SizableText>

            {isSelected ? (
              <XStack w={32} h={32} ai="center" jc="center" bg="$background" br="$pill">
                <SizableText ff="$body" fos="$md" fow="$bold" color="$primary">
                  {day.getDate()}
                </SizableText>
              </XStack>
            ) : (
              <SizableText
                ff="$body"
                fos="$md"
                fow="$semiBold"
                color={isToday ? '$textPrimary' : '$text'}
              >
                {day.getDate()}
              </SizableText>
            )}
          </YStack>
        );
      })}
    </XStack>
  );
}