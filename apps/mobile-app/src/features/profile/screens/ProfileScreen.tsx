import { ScrollView, SizableText, XStack, YStack, View } from 'tamagui';
import { 
    Space, Mail, Mars, Venus, Calendar,
    Utensils, Goal, Earth, Flame, Footprints,
    Ruler, Dumbbell, Percent,
    Pencil, Settings
} from '@tamagui/lucide-icons-2';
import { Tag } from '@components';
import { Link } from 'expo-router';
import { InfoItem } from '../components/InfoItem';

export default function ProfileScreen() {
    const favoriteIngredients = ['Tomatoes', 'Basil', 'Garlic', 'Olive Oil', 'Parmesan Cheese', 'Chicken Breast', 'Salmon', 'Avocado', 'Spinach', 'Mushrooms'];
    const allergies = ['Peanuts', 'Shellfish', 'Gluten', 'Dairy', 'Eggs', 'Soy', 'Tree Nuts', 'Fish', 'Wheat', 'Sesame'];
    return (
        <ScrollView contentInsetAdjustmentBehavior="automatic">
            <YStack f={1} bg="$background">
                <YStack h={200} bg="$softPrimary" bblr="$lg" bbrr="$lg" ai="center" jc="center" overflow="hidden" position="relative">
                    <View h={120} w={120} bw={2} borderColor="$primary" br="$radius.pill" bg="$surface">
                        <XStack h={40} w={40} br="$radius.pill" bg="$background" ai="center" jc="center"  position='absolute' bottom={-8} right={-8} >
                            <Pencil size={20} col="$primary"/>
                        </XStack>
                    </View>
                    <View br="$radius.pill" bg="$color.jade4" opacity={0.5} h={120} w={120} position='absolute' left={-50} bottom={-20}></View>
                    <View br="$radius.pill" bg="$color.jade5" opacity={0.5} h={120} w={120} position='absolute' left={20} bottom={-60}></View>
                    <View br="$radius.pill" bg="$color.jade6" opacity={0.5} h={90} w={90} position='absolute' right={20} top={-60}></View>
                    <View br="$radius.pill" bg="$color.jade5" opacity={0.7} h={120} w={120} position='absolute' right={-40} top={-40}></View>

                    <XStack h={40} w={40} br="$radius.pill" bg="$primary"  ai="center" jc="center"  position='absolute' bottom={16} right={16} >
                        <Settings size={24} col="$textInverse"/>
                    </XStack>
                </YStack>

                <YStack gap="$space.xl" p="$space.md">
                    <YStack gap="$space.xs">
                        <XStack ai="center" jc="space-between">
                            <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                                User Information
                            </SizableText>
                            <Link href="/profile/edit-user-info" asChild>
                                <Pencil size={20} col="$textPrimary" />
                            </Link>
                        </XStack>
                        <YStack br="$radius.md" bg="$surface" overflow="hidden">
                            <InfoItem label="Username" value="john_doe" Icon={Space} />
                            <InfoItem label="Email" value="" Icon={Mail} />
                            <InfoItem label="Gender" value="Male" Icon={Mars} />
                            <InfoItem label="Date of Birth" value="1990-01-01" Icon={Calendar} isLast/>
                        </YStack>
                    </YStack>

                    <YStack gap="$space.xs">
                        <XStack ai="center" jc="space-between">
                            <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                                Preferences & Rules
                            </SizableText>
                            <Link href="/profile/edit-preference" asChild>
                                <Pencil size={20} col="$textPrimary" />
                            </Link>
                        </XStack>
                        <YStack br="$radius.md" bg="$surface" overflow="hidden">
                            <InfoItem label="Diet Type" value="Vegetarian" Icon={Utensils} />
                            <InfoItem label="Goal" value="Weight Loss" Icon={Goal} />
                            <InfoItem label="Cuisine Type" value="Italian" Icon={Earth} />
                            <InfoItem label="Target Calories" value="2000 kcal/day" Icon={Flame} />
                            <InfoItem label="Activity Level" value="Moderate" Icon={Footprints} isLast/>
                        </YStack>
                    </YStack>

                    <YStack gap="$space.xs">
                        <XStack ai="center" jc="space-between">
                            <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                                Metrics
                            </SizableText>
                            <Link href="/profile/edit-preference" asChild>
                                <Pencil size={20} col="$textPrimary" />
                            </Link>
                        </XStack>
                        <YStack br="$radius.md" bg="$surface" overflow="hidden">
                            <InfoItem label="Weight" value="70 kg" Icon={Ruler} />
                            <InfoItem label="Height" value="175 cm" Icon={Dumbbell} />
                            <InfoItem label="BMI" value="22.9" Icon={Percent} isLast/>
                        </YStack>
                    </YStack>

                    <YStack gap="$space.xs">
                        <XStack ai="center" jc="space-between">
                            <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                                Favorite Ingredients
                            </SizableText>
                            <Link href="/profile/edit-preference" asChild>
                                <Pencil size={20} col="$textPrimary" />
                            </Link>
                        </XStack>
                        <XStack flexWrap="wrap" gap="$space.sm">
                            {favoriteIngredients.map((ingredient) => (
                                <Tag key={ingredient} status="brand">
                                    <Tag.Text>{ingredient}</Tag.Text>
                                </Tag>
                            ))}
                        </XStack>
                    </YStack>

                    <YStack gap="$space.xs">
                        <XStack ai="center" jc="space-between">
                            <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                                Allergies
                            </SizableText>
                            <Link href="/profile/edit-preference" asChild>
                                <Pencil size={20} col="$textPrimary" />
                            </Link>
                        </XStack>
                        <XStack flexWrap="wrap" gap="$space.sm">
                            {allergies.map((allergy) => (
                                <Tag key={allergy} status="danger">
                                    <Tag.Text>{allergy}</Tag.Text>
                                </Tag>
                            ))}
                        </XStack>
                    </YStack>

                    
                </YStack>



                
            </YStack>
            
        </ScrollView>
    );
}