import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Fonts } from '@/constants/theme';
import {
  checkInterval,
  checkStatus,
  dayLengthHours,
  healthAt,
  healthBand,
  seasonFactor,
  type CheckStatus,
  type Climate,
} from '@/lib/care';
import { SAMPLE_PLANTS, sampleLogs } from '@/lib/sample';

// Until onboarding asks where the user lives, assume London.
const CLIMATE: Climate = { latitude: 51.46, humidity: null };

function statusText(s: CheckStatus): string {
  if (s.state === 'none') return 'Nothing logged yet';
  if (s.waterNow) return 'Water now';
  if (s.state === 'late') return `Check overdue by ${-(s.due ?? 0)} d`;
  if (s.state === 'due') return 'Check today';
  return s.due === 1 ? 'Check tomorrow' : `Check in ${s.due} days`;
}

export default function HomeScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = Colors[scheme];

  const { rows, seasonLine } = useMemo(() => {
    const now = new Date();
    const logs = sampleLogs(now);
    const rows = SAMPLE_PLANTS.map((p) => {
      const own = logs.filter((l) => l.plantId === p.id);
      const status = checkStatus(p, own, now, CLIMATE);
      const health = healthAt(p, own, now, CLIMATE);
      return { plant: p, status, health, interval: checkInterval(p, now, CLIMATE) };
    }).sort((a, b) => (a.status.due ?? 99) - (b.status.due ?? 99));
    const longer = Math.round((seasonFactor(now, CLIMATE.latitude) - 1) * 100);
    const seasonLine = `${dayLengthHours(now, CLIMATE.latitude).toFixed(1)} h of daylight today · checks ${longer}% further apart than midsummer`;
    return { rows, seasonLine };
  }, []);

  const tone = (s: CheckStatus) =>
    s.waterNow || s.state === 'late'
      ? { bg: c.lateSoft, fg: c.late }
      : s.state === 'due'
        ? { bg: c.dueSoft, fg: c.due }
        : { bg: c.leafSoft, fg: c.leaf };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.ground }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={[styles.wordmark, { color: c.text, fontFamily: Fonts?.serif }]}>
          Phyto<Text style={{ color: c.leaf }}>Log</Text>
        </Text>
        <Text style={[styles.meta, { color: c.textSecondary }]}>{seasonLine}</Text>

        <View style={[styles.banner, { backgroundColor: c.waterSoft }]}>
          <Text style={[styles.bannerText, { color: c.text }]}>
            Sample plants for now. Adding and logging your own plants comes next.
          </Text>
        </View>

        <Text style={[styles.h2, { color: c.text, fontFamily: Fonts?.serif }]}>Your plants</Text>

        {rows.map(({ plant, status, health, interval }) => {
          const t = tone(status);
          const band = healthBand(health.score);
          return (
            <View key={plant.id} style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.name, { color: c.text }]}>{plant.name}</Text>
                {plant.species ? (
                  <Text style={[styles.species, { color: c.textSecondary }]}>{plant.species}</Text>
                ) : null}
                <Text style={[styles.small, { color: c.textSecondary }]}>
                  Water at ≤{plant.waterAt}% · checks every {interval} days
                  {status.last?.moisture != null ? ` · last read ${status.last.moisture}%` : ''}
                </Text>
                <Text style={[styles.small, { color: c.textSecondary }]}>
                  Health {health.score ?? '–'} · {band}
                </Text>
              </View>
              <View style={[styles.pill, { backgroundColor: t.bg }]}>
                <Text style={[styles.pillText, { color: t.fg }]}>{statusText(status)}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 48, gap: 12 },
  wordmark: { fontSize: 40, marginTop: 8 },
  meta: { fontSize: 14 },
  banner: { borderRadius: 12, padding: 12 },
  bannerText: { fontSize: 14, lineHeight: 20 },
  h2: { fontSize: 24, marginTop: 8 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 14 },
  name: { fontSize: 17, fontWeight: '700' },
  species: { fontSize: 13, fontStyle: 'italic' },
  small: { fontSize: 13 },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, maxWidth: 130 },
  pillText: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
});
