import { Slot, usePathname, useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { InteractionManager, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, User, Utensils } from '@tamagui/lucide-icons-2';
import { AnimatePresence, SizableText, Tabs, YStack, useTheme } from 'tamagui';
import type { TabLayout, ViewProps } from 'tamagui';

import { useAppTheme } from '../../providers/AppProviders';

type TabValue = 'home' | 'menu' | 'profile';

const TAB_CONFIG: Array<{
  value: TabValue;
  label: string;
  href: '/' | '/menu' | '/profile';
  icon: typeof Home;
}> = [
  {
    value: 'home',
    label: 'Home',
    href: '/',
    icon: Home,
  },
  {
    value: 'menu',
    label: 'Menu',
    href: '/menu',
    icon: Utensils,
  },
  {
    value: 'profile',
    label: 'Profile',
    href: '/profile',
    icon: User,
  },
];

function resolveActiveTab(pathname: string): TabValue {
  if (pathname === '/menu') {
    return 'menu';
  }

  if (pathname === '/profile') {
    return 'profile';
  }

  return 'home';
}

interface BottomTabBarProps {
  activeTab: TabValue;
  onTabChange: (nextValue: string) => void;
}

function TabsRovingIndicator(props: ViewProps) {
  return (
    <YStack
      pos="absolute"
      bg="$softPrimary"
      opacity={0.9}
      pointerEvents="none"
      transition="quick"
      enterStyle={{
        opacity: 0,
        scale: 0.96,
      }}
      exitStyle={{
        opacity: 0,
        scale: 0.96,
      }}
      {...props}
    />
  );
}

const BottomTabBar = memo(function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  const tabLayoutsRef = useRef<Partial<Record<TabValue, TabLayout>>>({});
  const [activeAt, setActiveAt] = useState<TabLayout | null>(null);

  const updateActiveIndicator = useCallback((nextLayout: TabLayout) => {
    setActiveAt((currentLayout) => {
      if (
        currentLayout &&
        currentLayout.x === nextLayout.x &&
        currentLayout.y === nextLayout.y &&
        currentLayout.width === nextLayout.width &&
        currentLayout.height === nextLayout.height
      ) {
        return currentLayout;
      }

      return nextLayout;
    });
  }, []);

  useEffect(() => {
    const nextLayout = tabLayoutsRef.current[activeTab];

    if (nextLayout) {
      updateActiveIndicator(nextLayout);
    }
  }, [activeTab, updateActiveIndicator]);

  const handleTabLayout = useCallback((tabValue: TabValue, nextLayout: TabLayout) => {
    tabLayoutsRef.current[tabValue] = nextLayout;

    if (tabValue === activeTab) {
      updateActiveIndicator(nextLayout);
    }
  }, [activeTab, updateActiveIndicator]);

  const handleTabInteraction = useCallback((tabValue: TabValue, type: string, nextLayout: TabLayout) => {
    tabLayoutsRef.current[tabValue] = nextLayout;

    if (type === 'select') {
      updateActiveIndicator(nextLayout);
    }
  }, [updateActiveIndicator]);

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} orientation="horizontal" pos="relative" bg="$background">
      <AnimatePresence initial={false}>
        {activeAt ? (
          <TabsRovingIndicator
            key="active-tab-indicator"
            x={activeAt.x}
            y={activeAt.y}
            width={activeAt.width}
            height={activeAt.height}
            br="$radius.md"
          />
        ) : null}
      </AnimatePresence>

      <Tabs.List
        w="100%"
        bg="transparent"
        borderTopWidth={1}
        borderColor="$color.gray6"
        px="$space.sm"
        py="$space.sm"
        gap="$space.sm"
      >
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.value === activeTab;

          return (
            <Tabs.Tab
              key={tab.value}
              value={tab.value}
              f={1}
              bg="transparent"
              br="$radius.md"
              px="$space.sm"
              py="$space.md"
              minHeight={48}
              borderWidth={0}
              onInteraction={(type, layout) => {
                if (!layout) {
                  return;
                }

                handleTabInteraction(tab.value, type, layout);
              }}
              onLayout={({ nativeEvent }) => handleTabLayout(tab.value, nativeEvent.layout)}
            >
              <YStack ai="center" gap="$space.xs" zi={1}>
                <Icon color={isActive ? '$primary' : '$textSubtle'} size={24} />
                <SizableText
                  ff="$body"
                  fos="$sm"
                  fow="$medium"
                  ta="center"
                  col={isActive ? '$primary' : '$textSubtle'}
                >
                  {tab.label}
                </SizableText>
              </YStack>
            </Tabs.Tab>
          );
        })}
      </Tabs.List>
    </Tabs>
  );
});

export default function TabLayout() {
  const theme = useTheme();
  const { themeName } = useAppTheme();
  const isDark = themeName === 'dark';
  const router = useRouter();
  const pathname = usePathname();
  const routeActiveTab = resolveActiveTab(pathname);
  const [visualActiveTab, setVisualActiveTab] = useState<TabValue>(routeActiveTab);
  const pendingNavigationTaskRef = useRef<ReturnType<typeof InteractionManager.runAfterInteractions> | null>(null);

  useEffect(() => {
    setVisualActiveTab(routeActiveTab);
  }, [routeActiveTab]);

  useEffect(() => {
    return () => {
      pendingNavigationTaskRef.current?.cancel();
    };
  }, []);

  const handleTabChange = useCallback((nextValue: string) => {
    const nextTab = TAB_CONFIG.find((tab) => tab.value === nextValue);

    if (!nextTab || nextTab.value === visualActiveTab) {
      return;
    }

    setVisualActiveTab(nextTab.value);

    pendingNavigationTaskRef.current?.cancel();
    pendingNavigationTaskRef.current = InteractionManager.runAfterInteractions(() => {
      router.replace(nextTab.href);
      pendingNavigationTaskRef.current = null;
    });
  }, [router, visualActiveTab]);

  return (
    <SafeAreaView style={[{ width: '100%', height: '100%' }, { backgroundColor: theme.background.val }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <YStack f={1} bg="$background">
        <YStack f={1} minHeight={0}>
          <Slot />
        </YStack>

        <BottomTabBar activeTab={visualActiveTab} onTabChange={handleTabChange} />
      </YStack>

    </SafeAreaView>
  );
}