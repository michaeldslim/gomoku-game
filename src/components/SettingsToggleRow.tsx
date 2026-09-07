import { StyleSheet, Switch, Text, View } from 'react-native';
import { colors } from '../constants/colors';

interface SettingsToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function SettingsToggleRow({
  label,
  description,
  value,
  onValueChange,
}: SettingsToggleRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.chipBorder, true: colors.gold }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  text: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
