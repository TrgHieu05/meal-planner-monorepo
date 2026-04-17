import { AppProviders } from './src/app/providers/AppProviders';
import { HomeScreen } from './src/features/home/screens/HomeScreen';

export default function App() {
  return (
    <AppProviders>
      <HomeScreen />
    </AppProviders>
  );
}
