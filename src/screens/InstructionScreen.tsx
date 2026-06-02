import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Language, t, translations } from '../utils/i18n';

interface Props {
  language: Language;
  onLanguageChange: (language: Language) => void;
  onClose?: () => void;
  standalone?: boolean;
}

export default function InstructionScreen({ language, onLanguageChange, onClose, standalone = true }: Props) {
  const insets = useSafeAreaInsets();
  const lines = translations[language].instructionLines;
  const isStandalone = standalone;

  return (
    <View style={isStandalone ? styles.container : styles.sectionContainer}>
      {isStandalone ? (
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}> 
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Text style={styles.backText}>{t(language, 'back')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t(language, 'instructionsTitle')}</Text>
          <View style={styles.toggleGroupSmall}>
            <TouchableOpacity
              style={[styles.toggleChip, language === 'ko' && styles.toggleChipActive]}
              onPress={() => onLanguageChange('ko')}
            >
              <Text style={[styles.toggleChipText, language === 'ko' && styles.toggleTextActive]}>KO</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleChip, language === 'en' && styles.toggleChipActive]}
              onPress={() => onLanguageChange('en')}
            >
              <Text style={[styles.toggleChipText, language === 'en' && styles.toggleTextActive]}>EN</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t(language, 'instructionsTitle')}</Text>
          <View style={styles.toggleGroupSmall}>
            <TouchableOpacity
              style={[styles.toggleChip, language === 'ko' && styles.toggleChipActive]}
              onPress={() => onLanguageChange('ko')}
            >
              <Text style={[styles.toggleChipText, language === 'ko' && styles.toggleTextActive]}>KO</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleChip, language === 'en' && styles.toggleChipActive]}
              onPress={() => onLanguageChange('en')}
            >
              <Text style={[styles.toggleChipText, language === 'en' && styles.toggleTextActive]}>EN</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isStandalone ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator>
          <View style={styles.instructionsCard}>
            {lines.map((line) => (
              <Text key={line} style={styles.instructionLine}>
                {line}
              </Text>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.content}>
          <View style={styles.instructionsCard}>
            {lines.map((line) => (
              <Text key={line} style={styles.instructionLine}>
                {line}
              </Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3EFE7',
  },
  sectionContainer: {
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: '#F3EFE7',
    marginBottom: 14,
    borderRadius: 12,
    paddingHorizontal: 0,
    marginHorizontal: 0,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
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
    padding: 4,
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
    paddingVertical: 6,
    paddingHorizontal: 0,
    gap: 10,
    width: '100%',
    alignSelf: 'stretch',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  toggleGroupSmall: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
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
  toggleTextActive: {
    color: '#ffffff',
  },
  selectedLanguage: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
  },
  instructionsCard: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  instructionLine: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 22,
    marginBottom: 12,
  },
});
