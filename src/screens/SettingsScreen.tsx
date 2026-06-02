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
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EXPERT_TOP_POOL_EASY, EXPERT_TOP_POOL_HARD, EXPERT_TOP_POOL_MEDIUM } from '../utils/aiLogic';
import {
  DEFAULT_INTERMEDIATE_TOP_POOL_SIZE,
  INTERMEDIATE_TOP_POOL_MAX,
  INTERMEDIATE_TOP_POOL_MIN,
  UserSettings,
} from '../services/settings';
import { Language, t } from '../utils/i18n';

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
  const [bgMusicEnabled, setBgMusicEnabled] = useState(initialSettings.bgMusicEnabled);
  const [bgMusicVolume, setBgMusicVolume] = useState(initialSettings.bgMusicVolume);
  const [language, setLanguage] = useState<Language>(initialSettings.language);
  useEffect(() => {
    setUserHandle(initialSettings.userHandle);
    setTimerEnabled(initialSettings.timerEnabled);
    setIntermediateTopPoolSize(initialSettings.intermediateTopPoolSize);
    setExpertTopPool(initialSettings.expertTopPool);
    setBgMusicEnabled(initialSettings.bgMusicEnabled);
    setBgMusicVolume(initialSettings.bgMusicVolume);
    setLanguage(initialSettings.language);
  }, [initialSettings]);

  const nicknameChanged = userHandle.trim() !== initialSettings.userHandle;

  const autoSave = async (patch: Partial<UserSettings>) => {
    try {
      const next: UserSettings = {
        userHandle: userHandle.trim().slice(0, 24),
        timerEnabled,
        intermediateTopPoolSize: sanitizeIntermediateTopPoolSize(intermediateTopPoolSize),
        expertTopPool: sanitizeExpertTopPool(expertTopPool),
        bgMusicEnabled,
        bgMusicVolume,
        language,
        ...patch,
      };
      await onSave(next);
    } catch {
      Alert.alert(t(language, 'error'), t(language, 'failedSaveSettings'));
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
          <Text style={styles.toggleChipText}>{t(language, 'back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t(language, 'settingsTitle')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 24, 24) }]}
        showsVerticalScrollIndicator
      >
        <View style={styles.card}>
          <Text style={styles.label}>{t(language, 'languageSettingLabel')}</Text>
          <View style={styles.chipRow}>
            <TouchableOpacity
              style={[styles.chip, language === 'ko' && styles.chipActive]}
              onPress={() => { setLanguage('ko'); autoSave({ language: 'ko' }); }}
            >
              <Text style={[styles.chipText, language === 'ko' && styles.chipTextActive]}>한국어</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, language === 'en' && styles.chipActive]}
              onPress={() => { setLanguage('en'); autoSave({ language: 'en' }); }}
            >
              <Text style={[styles.chipText, language === 'en' && styles.chipTextActive]}>English</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{t(language, 'nicknameLabel')}</Text>
          <TextInput
            style={styles.input}
            value={userHandle}
            onChangeText={setUserHandle}
            onBlur={handleSaveNickname}
            onSubmitEditing={handleSaveNickname}
            placeholder={t(language, 'nicknamePlaceholder')}
            maxLength={24}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>{t(language, 'nicknameHint')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{t(language, 'bgMusicLabel')}</Text>
          <Text style={styles.hint}>{t(language, 'bgMusicHint')}</Text>
          <View style={styles.chipRow}>
            <TouchableOpacity
              style={[styles.chip, bgMusicEnabled && styles.chipActive]}
              onPress={() => { setBgMusicEnabled(true); autoSave({ bgMusicEnabled: true }); }}
            >
              <Text style={[styles.chipText, bgMusicEnabled && styles.chipTextActive]}>{t(language, 'on')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, !bgMusicEnabled && styles.chipActive]}
              onPress={() => { setBgMusicEnabled(false); autoSave({ bgMusicEnabled: false }); }}
            >
              <Text style={[styles.chipText, !bgMusicEnabled && styles.chipTextActive]}>{t(language, 'off')}</Text>
            </TouchableOpacity>
          </View>
          {bgMusicEnabled && (
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>{t(language, 'volume')}: {bgMusicVolume.toFixed(1)}</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.1}
                value={bgMusicVolume}
                onValueChange={(v) => setBgMusicVolume(Math.round(v * 10) / 10)}
                onSlidingComplete={(v) => {
                  const rounded = Math.round(v * 10) / 10;
                  setBgMusicVolume(rounded);
                  autoSave({ bgMusicVolume: rounded });
                }}
                minimumTrackTintColor="#457B9D"
                maximumTrackTintColor="#D1D5DB"
                thumbTintColor="#457B9D"
              />
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{t(language, 'timerLabel')}</Text>
          <Text style={styles.hint}>{t(language, 'timerHint')}</Text>
          <View style={styles.chipRow}>
            <TouchableOpacity
              style={[styles.chip, timerEnabled && styles.chipActive]}
              onPress={() => { setTimerEnabled(true); autoSave({ timerEnabled: true }); }}
            >
              <Text style={[styles.chipText, timerEnabled && styles.chipTextActive]}>{t(language, 'on')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, !timerEnabled && styles.chipActive]}
              onPress={() => { setTimerEnabled(false); autoSave({ timerEnabled: false }); }}
            >
              <Text style={[styles.chipText, !timerEnabled && styles.chipTextActive]}>{t(language, 'off')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{t(language, 'intermediateModeLabel')}</Text>
          <Text style={styles.hint}>{t(language, 'intermediateModeHint')}</Text>
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
          <Text style={styles.label}>{t(language, 'expertModeLabel')}</Text>
          <Text style={styles.hint}>{t(language, 'expertModeHint')}</Text>
          <View style={styles.chipRow}>
            {([
              { labelKey: 'expertEasy' as const, value: EXPERT_TOP_POOL_EASY },
              { labelKey: 'expertMedium' as const, value: EXPERT_TOP_POOL_MEDIUM },
              { labelKey: 'expertHard' as const, value: EXPERT_TOP_POOL_HARD },
            ]).map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.chip, expertTopPool === option.value && styles.chipActiveExpert]}
                onPress={() => { setExpertTopPool(option.value); autoSave({ expertTopPool: sanitizeExpertTopPool(option.value) }); }}
              >
                <Text style={[styles.chipText, expertTopPool === option.value && styles.chipTextActive]}>
                  {t(language, option.labelKey)}
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
  sliderRow: {
    marginTop: 12,
  },
  sliderLabel: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    marginBottom: 4,
  },
  slider: {
    width: '100%',
    height: 40,
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
