import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Language = 'ko' | 'en';

interface Props {
  language: Language;
  onLanguageChange: (language: Language) => void;
  onClose?: () => void;
  standalone?: boolean;
}

const instructionCopy: Record<Language, { title: string; lines: string[]; toggleLabel: string; selectedText: string }> = {
  ko: {
    title: '게임 방법',
    lines: [
      '1. 흑돌이 먼저 시작합니다.',
      '2. 번갈아 빈 칸에 돌을 놓습니다.',
      '3. 가로, 세로, 대각선으로 먼저 5개를 연결하면 승리합니다.',
      '4. 보드가 가득 차도 승자가 없으면 무승부입니다.',
      '5. 보드는 가로/세로 방향으로 스크롤할 수 있습니다.',
      '6. 설정에서 15초 턴 타이머를 활성화하여 턴 시간을 제한할 수 있습니다.',
    ],
    toggleLabel: '언어 선택',
    selectedText: '한국어',
  },
  en: {
    title: 'How to Play',
    lines: [
      '1. Black always goes first.',
      '2. Players take turns placing stones on empty intersections.',
      '3. Connect 5 stones in a row horizontally, vertically, or diagonally to win.',
      '4. If the board is full with no winner, the game is a draw.',
      '5. The board can be scrolled horizontally and vertically.',
      '6. You can enable a 15-second turn timer in Settings to limit each turn.',
    ],
    toggleLabel: 'Language',
    selectedText: 'English',
  },
};

export default function InstructionScreen({ language, onLanguageChange, onClose, standalone = true }: Props) {
  const insets = useSafeAreaInsets();
  const current = instructionCopy[language];
  const isStandalone = standalone;

  return (
    <View style={isStandalone ? styles.container : styles.sectionContainer}>
      {isStandalone ? (
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}> 
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Text style={styles.backText}>{language === 'ko' ? '뒤로' : 'Back'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{current.title}</Text>
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
          <Text style={styles.sectionTitle}>{current.title}</Text>
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
            {current.lines.map((line) => (
              <Text key={line} style={styles.instructionLine}>
                {line}
              </Text>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.content}>
          <View style={styles.instructionsCard}>
            {current.lines.map((line) => (
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
