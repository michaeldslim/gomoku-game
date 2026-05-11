import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EXPERT_TOP_POOL_EASY, EXPERT_TOP_POOL_HARD, EXPERT_TOP_POOL_MEDIUM } from '../utils/aiLogic';
import {
  DEFAULT_INTERMEDIATE_TOP_POOL_SIZE,
  INTERMEDIATE_TOP_POOL_MAX,
  INTERMEDIATE_TOP_POOL_MIN,
  UserSettings,
} from '../services/settings';

interface Props {
  initialSettings: UserSettings;
  onBack: () => void;
  onSave: (next: UserSettings) => Promise<void> | void;
}

const INTERMEDIATE_OPTIONS = [1, 2, 3, 4, 5];

const EXPERT_OPTIONS: { label: string; value: number }[] = [
  { label: 'Easy', value: EXPERT_TOP_POOL_EASY },
  { label: 'Medium', value: EXPERT_TOP_POOL_MEDIUM },
  { label: 'Hard', value: EXPERT_TOP_POOL_HARD },
];

const sanitizeIntermediateTopPoolSize = (value: number): number => {
  if (!Number.isFinite(value)) return DEFAULT_INTERMEDIATE_TOP_POOL_SIZE;
  const clamped = Math.min(INTERMEDIATE_TOP_POOL_MAX, Math.max(INTERMEDIATE_TOP_POOL_MIN, Math.floor(value)));
  return clamped;
};

const sanitizeExpertTopPool = (value: number): number => {
  if (value !== EXPERT_TOP_POOL_EASY && value !== EXPERT_TOP_POOL_MEDIUM && value !== EXPERT_TOP_POOL_HARD) {
    return EXPERT_TOP_POOL_EASY;
  }

  return value;
};

export default function SettingsScreen({ initialSettings, onBack, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const [userHandle, setUserHandle] = useState(initialSettings.userHandle);
  const [timerEnabled, setTimerEnabled] = useState(initialSettings.timerEnabled);
  const [intermediateTopPoolSize, setIntermediateTopPoolSize] = useState(initialSettings.intermediateTopPoolSize);
  const [expertTopPool, setExpertTopPool] = useState(initialSettings.expertTopPool);
  useEffect(() => {
    setUserHandle(initialSettings.userHandle);
    setTimerEnabled(initialSettings.timerEnabled);
    setIntermediateTopPoolSize(initialSettings.intermediateTopPoolSize);
    setExpertTopPool(initialSettings.expertTopPool);
  }, [initialSettings]);

  const nicknameChanged = userHandle.trim() !== initialSettings.userHandle;

  const autoSave = async (patch: Partial<UserSettings>) => {
    try {
      const next: UserSettings = {
        userHandle: userHandle.trim().slice(0, 24),
        timerEnabled,
        intermediateTopPoolSize: sanitizeIntermediateTopPoolSize(intermediateTopPoolSize),
        expertTopPool: sanitizeExpertTopPool(expertTopPool),
        ...patch,
      };
      await onSave(next);
    } catch {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const handleSaveNickname = async () => {
    if (nicknameChanged) {
      await autoSave({ userHandle: userHandle.trim().slice(0, 24) });
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}> 
        <TouchableOpacity onPress={onBack} style={[styles.toggleChip, styles.backButton]}>
          <Text style={styles.toggleChipText}>뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚙️ Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 24, 24) }]}
        showsVerticalScrollIndicator
      >
        <View style={styles.card}>
          <Text style={styles.label}>Nickname</Text>
          <TextInput
            style={styles.input}
            value={userHandle}
            onChangeText={setUserHandle}
            onBlur={handleSaveNickname}
            onSubmitEditing={handleSaveNickname}
            placeholder="Your nickname"
            maxLength={24}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>Used for future profile/leaderboard labeling.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Timer</Text>
          <Text style={styles.hint}>Enable 15-second turn timer for human turns.</Text>
          <View style={styles.chipRow}>
            <TouchableOpacity
              style={[styles.chip, timerEnabled && styles.chipActive]}
              onPress={() => { setTimerEnabled(true); autoSave({ timerEnabled: true }); }}
            >
              <Text style={[styles.chipText, timerEnabled && styles.chipTextActive]}>ON</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, !timerEnabled && styles.chipActive]}
              onPress={() => { setTimerEnabled(false); autoSave({ timerEnabled: false }); }}
            >
              <Text style={[styles.chipText, !timerEnabled && styles.chipTextActive]}>OFF</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Intermediate Mode Pool (Score &lt; 80)</Text>
          <Text style={styles.hint}>1 = hardest, 5 = easier</Text>
          <View style={styles.chipRow}>
            {INTERMEDIATE_OPTIONS.map((value) => (
              <TouchableOpacity
                key={value}
                style={[styles.chip, intermediateTopPoolSize === value && styles.chipActive]}
                onPress={() => { setIntermediateTopPoolSize(value); autoSave({ intermediateTopPoolSize: sanitizeIntermediateTopPoolSize(value) }); }}
              >
                <Text style={[styles.chipText, intermediateTopPoolSize === value && styles.chipTextActive]}>{value}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Expert Mode Pool (Score &gt;= 80)</Text>
          <Text style={styles.hint}>Select one: Easy, Medium, Hard</Text>
          <View style={styles.chipRow}>
            {EXPERT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.chip, expertTopPool === option.value && styles.chipActiveExpert]}
                onPress={() => { setExpertTopPool(option.value); autoSave({ expertTopPool: sanitizeExpertTopPool(option.value) }); }}
              >
                <Text style={[styles.chipText, expertTopPool === option.value && styles.chipTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3EFE7',
  },
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD8CE',
  },
  backButton: {
    marginRight: 6,
  },
  backText: {
    fontSize: 15,
    color: '#457B9D',
    fontWeight: '600',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#212529',
    backgroundColor: '#F8FAFC',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minWidth: 42,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: '#457B9D',
    borderColor: '#457B9D',
  },
  chipActiveExpert: {
    backgroundColor: '#E63946',
    borderColor: '#E63946',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  toggleChip: {
    minWidth: 44,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleChipActive: {
    backgroundColor: '#457B9D',
    borderColor: '#457B9D',
  },
  toggleChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: '#457B9D',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
