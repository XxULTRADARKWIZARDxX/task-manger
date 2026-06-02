import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import {
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Droplet,
  Dumbbell,
  GraduationCap,
  Menu,
  Moon,
  MoonStar,
  Plus,
  Smartphone,
  Sun,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';

import {
  DAYS_IN_GRID,
  APP_STATE_VERSION,
  FREE_HABIT_LIMIT,
  LIFETIME_UNLOCK_PRICE,
  formatMonthLabel,
  formatReminderTime,
  iconOptions,
  makeDayKey,
  makeHabit,
  makeInitialState,
  moveMonth,
} from './src/data';
import { scheduleDailyReminder } from './src/notifications';
import { loadHabitGridState, saveHabitGridState } from './src/storage';
import { themes, type Theme } from './src/theme';
import type { Habit, IconName, ReminderSettings } from './src/types';

const rowHeight = 86;
const dayCellWidth = 44;
const habitColumnWidth = 136;

const habitIcons: Record<IconName, ComponentType<{ color: string; size: number; strokeWidth?: number }>> = {
  book: BookOpen,
  dumbbell: Dumbbell,
  graduation: GraduationCap,
  moon: MoonStar,
  phone: Smartphone,
  drop: Droplet,
};

export default function App() {
  const systemScheme = useColorScheme();
  const initialMode = systemScheme === 'dark' ? 'dark' : 'light';
  const [state, setState] = useState(() => makeInitialState(initialMode));
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isPlusOpen, setIsPlusOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState<IconName>('book');
  const [reminderDraft, setReminderDraft] = useState<ReminderSettings>(state.reminder);
  const theme = themes[state.themeMode];
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const days = useMemo(() => Array.from({ length: DAYS_IN_GRID }, (_, index) => index + 1), []);

  useEffect(() => {
    let isMounted = true;

    loadHabitGridState()
      .then((savedState) => {
        if (isMounted && savedState) {
          setState(savedState);
        }
      })
      .catch((error) => {
        console.warn('Unable to load habit grid state', error);
      })
      .finally(() => {
        if (isMounted) {
          setIsHydrated(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (state.schemaVersion !== APP_STATE_VERSION) {
      setState(makeInitialState(initialMode));
      return;
    }

    if (!isHydrated) {
      return;
    }

    saveHabitGridState(state).catch((error) => {
      console.warn('Unable to save habit grid state', error);
    });
  }, [isHydrated, state]);

  function toggleTheme() {
    setState((current) => ({
      ...current,
      themeMode: current.themeMode === 'dark' ? 'light' : 'dark',
    }));
  }

  function toggleCheck(habitId: string, day: number) {
    const key = makeDayKey(state.month, day);

    setState((current) => ({
      ...current,
      habits: current.habits.map((habit) => {
        if (habit.id !== habitId) {
          return habit;
        }

        const checks = { ...habit.checks };
        if (checks[key]) {
          delete checks[key];
        } else {
          checks[key] = true;
        }

        return { ...habit, checks };
      }),
    }));
  }

  function addHabit() {
    const trimmedName = newHabitName.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Add a row name before saving.');
      return;
    }

    if (!state.isPlusUnlocked && state.habits.length >= FREE_HABIT_LIMIT) {
      setIsAddHabitOpen(false);
      setIsPlusOpen(true);
      return;
    }

    setState((current) => ({
      ...current,
      habits: [...current.habits, makeHabit(trimmedName, newHabitIcon)],
    }));
    setNewHabitName('');
    setNewHabitIcon('book');
    setIsAddHabitOpen(false);
  }

  function openReminderModal() {
    setReminderDraft(state.reminder);
    setIsReminderOpen(true);
  }

  async function saveReminder() {
    try {
      const notificationId = await scheduleDailyReminder(reminderDraft, state.reminder.notificationId);
      setState((current) => ({
        ...current,
        reminder: {
          ...reminderDraft,
          notificationId,
        },
      }));
      setIsReminderOpen(false);

      if (Platform.OS === 'web' && reminderDraft.enabled) {
        Alert.alert('Native build needed', 'Daily reminders will fire in iOS and Android builds.');
      }
    } catch (error) {
      Alert.alert(
        'Reminder not set',
        error instanceof Error ? error.message : 'Please check notification permissions.'
      );
    }
  }

  function unlockPlusForPreview() {
    setState((current) => ({
      ...current,
      isPlusUnlocked: true,
    }));
    setIsPlusOpen(false);
    setIsAddHabitOpen(true);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <View style={styles.topBar}>
        <IconButton
          accessibilityLabel="Open menu"
          icon={Menu}
          onPress={() => Alert.alert('Habit Grid', 'Menu coming after the MVP launch.')}
          theme={theme}
        />
        <Text style={styles.title}>Habit Grid</Text>
        <View style={styles.topActions}>
          <Pressable
            accessibilityLabel="Daily reminder"
            onPress={openReminderModal}
            style={({ pressed }) => [styles.bellButton, pressed && styles.pressed]}
          >
            <Bell color={theme.text} size={27} strokeWidth={2.2} />
            {state.reminder.enabled ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>1</Text>
              </View>
            ) : null}
          </Pressable>
          <ThemeSwitch isDark={theme.mode === 'dark'} onPress={toggleTheme} theme={theme} />
        </View>
      </View>

      <View style={styles.monthBar}>
        <IconButton
          accessibilityLabel="Previous month"
          icon={ChevronLeft}
          onPress={() => setState((current) => ({ ...current, month: moveMonth(current.month, -1) }))}
          theme={theme}
        />
        <View style={styles.monthLabelWrap}>
          <CalendarDays color={theme.text} size={24} strokeWidth={2.1} />
          <Text style={styles.monthLabel}>{formatMonthLabel(state.month)}</Text>
        </View>
        <IconButton
          accessibilityLabel="Next month"
          icon={ChevronRight}
          onPress={() => setState((current) => ({ ...current, month: moveMonth(current.month, 1) }))}
          theme={theme}
        />
      </View>

      <View style={styles.tableFrame}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.tableRow}>
            <View style={styles.habitColumn}>
              <View style={styles.dayHeaderCell}>
                <Text style={styles.dayHeaderText}>Day</Text>
              </View>
              {state.habits.map((habit) => (
                <HabitLabel key={habit.id} habit={habit} theme={theme} styles={styles} />
              ))}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator bounces={false}>
              <View>
                <View style={styles.daysRow}>
                  {days.map((day) => (
                    <View key={day} style={styles.dayCell}>
                      <Text style={styles.dayNumber}>{day}</Text>
                    </View>
                  ))}
                </View>
                {state.habits.map((habit) => (
                  <View key={habit.id} style={styles.gridRow}>
                    {days.map((day) => {
                      const checked = Boolean(habit.checks[makeDayKey(state.month, day)]);
                      return (
                        <Pressable
                          accessibilityLabel={`${habit.name} day ${day}`}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked }}
                          key={`${habit.id}-${day}`}
                          onPress={() => toggleCheck(habit.id, day)}
                          style={({ pressed }) => [styles.gridCell, pressed && styles.cellPressed]}
                        >
                          <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                            {checked ? (
                              <Check
                                color={theme.mode === 'dark' ? theme.text : theme.inverseText}
                                size={18}
                                strokeWidth={3}
                              />
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </View>

      <View style={styles.bottomBar}>
        <Pressable
          accessibilityLabel="Add habit"
          onPress={() => setIsAddHabitOpen(true)}
          style={({ pressed }) => [styles.bottomAction, styles.addAction, pressed && styles.pressed]}
        >
          <View style={styles.primaryIconBox}>
            <Plus color={theme.inverseText} size={31} strokeWidth={2.4} />
          </View>
          <Text style={styles.bottomActionText}>Add Habit</Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Edit daily reminder"
          onPress={openReminderModal}
          style={({ pressed }) => [styles.bottomAction, styles.middleAction, pressed && styles.pressed]}
        >
          <Clock3 color={theme.text} size={28} strokeWidth={2.1} />
          <View>
            <Text style={styles.bottomActionText}>Daily Reminder</Text>
            <Text style={styles.bottomMetaText}>
              {state.reminder.enabled ? formatReminderTime(state.reminder) : 'Off'}
            </Text>
          </View>
        </Pressable>
      </View>

      <AddHabitModal
        icon={newHabitIcon}
        name={newHabitName}
        onClose={() => setIsAddHabitOpen(false)}
        onIconChange={setNewHabitIcon}
        onNameChange={setNewHabitName}
        onSave={addHabit}
        styles={styles}
        theme={theme}
        visible={isAddHabitOpen}
      />
      <ReminderModal
        draft={reminderDraft}
        onChange={setReminderDraft}
        onClose={() => setIsReminderOpen(false)}
        onSave={saveReminder}
        styles={styles}
        theme={theme}
        visible={isReminderOpen}
      />
      <PlusModal
        onClose={() => setIsPlusOpen(false)}
        onUnlock={unlockPlusForPreview}
        styles={styles}
        theme={theme}
        visible={isPlusOpen}
      />
    </SafeAreaView>
  );
}

type SharedStyles = ReturnType<typeof makeStyles>;

function IconButton({
  accessibilityLabel,
  icon: Icon,
  onPress,
  theme,
}: {
  accessibilityLabel: string;
  icon: ComponentType<{ color: string; size: number; strokeWidth?: number }>;
  onPress: () => void;
  theme: Theme;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        {
          alignItems: 'center',
          height: 46,
          justifyContent: 'center',
          opacity: pressed ? 0.55 : 1,
          width: 46,
        },
      ]}
    >
      <Icon color={theme.text} size={29} strokeWidth={2.15} />
    </Pressable>
  );
}

function ThemeSwitch({ isDark, onPress, theme }: { isDark: boolean; onPress: () => void; theme: Theme }) {
  return (
    <Pressable
      accessibilityLabel="Toggle dark mode"
      onPress={onPress}
      style={({ pressed }) => [
        {
          alignItems: 'center',
          borderColor: theme.strongBorder,
          borderRadius: 22,
          borderWidth: StyleSheet.hairlineWidth,
          flexDirection: 'row',
          height: 43,
          justifyContent: 'space-between',
          opacity: pressed ? 0.72 : 1,
          paddingHorizontal: 6,
          width: 80,
        },
      ]}
    >
      <View
        style={{
          left: isDark ? 43 : 5,
          position: 'absolute',
          top: 5,
        }}
      >
        <View
          style={{
            alignItems: 'center',
            backgroundColor: theme.text,
            borderRadius: 17,
            height: 32,
            justifyContent: 'center',
            width: 32,
          }}
        >
          {isDark ? (
            <Moon color={theme.inverseText} size={18} strokeWidth={2.2} />
          ) : (
            <Sun color={theme.inverseText} size={18} strokeWidth={2.2} />
          )}
        </View>
      </View>
      <Sun color={isDark ? theme.mutedText : theme.inverseText} size={18} strokeWidth={2} />
      <Moon color={isDark ? theme.inverseText : theme.mutedText} size={18} strokeWidth={2} />
    </Pressable>
  );
}

function HabitLabel({ habit, theme, styles }: { habit: Habit; theme: Theme; styles: SharedStyles }) {
  const HabitIcon = habitIcons[habit.icon];

  return (
    <View style={styles.habitLabel}>
      <View style={styles.dragDots}>
        {Array.from({ length: 6 }, (_, index) => (
          <View key={index} style={styles.dragDot} />
        ))}
      </View>
      <View style={styles.habitLabelContent}>
        <HabitIcon color={theme.text} size={29} strokeWidth={1.9} />
        <Text numberOfLines={2} style={styles.habitName}>
          {habit.name}
        </Text>
      </View>
    </View>
  );
}

function AddHabitModal({
  icon,
  name,
  onClose,
  onIconChange,
  onNameChange,
  onSave,
  styles,
  theme,
  visible,
}: {
  icon: IconName;
  name: string;
  onClose: () => void;
  onIconChange: (icon: IconName) => void;
  onNameChange: (name: string) => void;
  onSave: () => void;
  styles: SharedStyles;
  theme: Theme;
  visible: boolean;
}) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}
      >
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Add Habit</Text>
          <TextInput
            autoCapitalize="words"
            onChangeText={onNameChange}
            placeholder="Row name"
            placeholderTextColor={theme.mutedText}
            returnKeyType="done"
            style={styles.textInput}
            value={name}
          />
          <View style={styles.iconGrid}>
            {iconOptions.map((option) => {
              const OptionIcon = habitIcons[option.icon];
              const selected = icon === option.icon;

              return (
                <Pressable
                  accessibilityLabel={option.label}
                  key={option.icon}
                  onPress={() => onIconChange(option.icon)}
                  style={[styles.iconChoice, selected && styles.iconChoiceSelected]}
                >
                  <OptionIcon
                    color={selected ? theme.inverseText : theme.text}
                    size={24}
                    strokeWidth={1.9}
                  />
                  <Text style={[styles.iconChoiceText, selected && styles.iconChoiceTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={onSave} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ReminderModal({
  draft,
  onChange,
  onClose,
  onSave,
  styles,
  theme,
  visible,
}: {
  draft: ReminderSettings;
  onChange: (draft: ReminderSettings) => void;
  onClose: () => void;
  onSave: () => void;
  styles: SharedStyles;
  theme: Theme;
  visible: boolean;
}) {
  function adjustTime(unit: 'hour' | 'minute', delta: number) {
    if (unit === 'hour') {
      onChange({ ...draft, hour: (draft.hour + delta + 24) % 24 });
      return;
    }

    const totalMinutes = draft.hour * 60 + draft.minute + delta;
    const normalized = (totalMinutes + 24 * 60) % (24 * 60);
    onChange({
      ...draft,
      hour: Math.floor(normalized / 60),
      minute: normalized % 60,
    });
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Daily Reminder</Text>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: draft.enabled }}
            onPress={() => onChange({ ...draft, enabled: !draft.enabled })}
            style={styles.switchRow}
          >
            <Text style={styles.switchLabel}>{draft.enabled ? 'On' : 'Off'}</Text>
            <View style={[styles.switchTrack, draft.enabled && styles.switchTrackOn]}>
              <View style={[styles.switchKnob, draft.enabled && styles.switchKnobOn]} />
            </View>
          </Pressable>

          <View style={styles.timePanel}>
            <Clock3 color={theme.text} size={31} strokeWidth={2} />
            <Text style={styles.timeText}>{formatReminderTime(draft)}</Text>
          </View>

          <View style={styles.stepperRow}>
            <Stepper
              iconColor={theme.text}
              label="Hour"
              onDown={() => adjustTime('hour', -1)}
              onUp={() => adjustTime('hour', 1)}
              styles={styles}
            />
            <Stepper
              iconColor={theme.text}
              label="Minute"
              onDown={() => adjustTime('minute', -5)}
              onUp={() => adjustTime('minute', 5)}
              styles={styles}
            />
          </View>

          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={onSave} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PlusModal({
  onClose,
  onUnlock,
  styles,
  visible,
}: {
  onClose: () => void;
  onUnlock: () => void;
  styles: SharedStyles;
  theme: Theme;
  visible: boolean;
}) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Habit Grid Plus</Text>
          <View style={styles.plusPanel}>
            <Text style={styles.plusPrice}>{LIFETIME_UNLOCK_PRICE}</Text>
            <Text style={styles.plusCopy}>One-time lifetime unlock. No subscription.</Text>
            <Text style={styles.plusFinePrint}>
              Free includes {FREE_HABIT_LIMIT} habit rows. Plus unlocks unlimited rows and future
              updates.
            </Text>
          </View>
          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Not Now</Text>
            </Pressable>
            <Pressable onPress={onUnlock} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Unlock Lifetime</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Stepper({
  label,
  iconColor,
  onDown,
  onUp,
  styles,
}: {
  label: string;
  iconColor: string;
  onDown: () => void;
  onUp: () => void;
  styles: SharedStyles;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperButtons}>
        <Pressable accessibilityLabel={`${label} down`} onPress={onDown} style={styles.stepperButton}>
          <ChevronLeft color={iconColor} size={23} strokeWidth={2.2} />
        </Pressable>
        <Pressable accessibilityLabel={`${label} up`} onPress={onUp} style={styles.stepperButton}>
          <ChevronRight color={iconColor} size={23} strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    screen: {
      backgroundColor: theme.bg,
      flex: 1,
    },
    topBar: {
      alignItems: 'center',
      borderBottomColor: theme.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      height: 72,
      justifyContent: 'space-between',
      paddingHorizontal: 14,
    },
    title: {
      color: theme.text,
      fontSize: 24,
      fontWeight: '800',
      left: 0,
      letterSpacing: 0,
      pointerEvents: 'none',
      position: 'absolute',
      right: 0,
      textAlign: 'center',
    },
    topActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'flex-end',
      width: 126,
    },
    bellButton: {
      alignItems: 'center',
      height: 46,
      justifyContent: 'center',
      width: 40,
    },
    badge: {
      alignItems: 'center',
      backgroundColor: theme.text,
      borderColor: theme.bg,
      borderRadius: 10,
      borderWidth: 2,
      height: 22,
      justifyContent: 'center',
      position: 'absolute',
      right: 3,
      top: 2,
      width: 22,
    },
    badgeText: {
      color: theme.inverseText,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0,
    },
    monthBar: {
      alignItems: 'center',
      borderBottomColor: theme.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      height: 58,
      justifyContent: 'space-between',
      paddingHorizontal: 8,
    },
    monthLabelWrap: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
    },
    monthLabel: {
      color: theme.text,
      fontSize: 24,
      fontWeight: '700',
      letterSpacing: 0,
    },
    tableFrame: {
      flex: 1,
    },
    tableRow: {
      flexDirection: 'row',
      minHeight: 1,
    },
    habitColumn: {
      borderRightColor: theme.border,
      borderRightWidth: StyleSheet.hairlineWidth,
      width: habitColumnWidth,
    },
    dayHeaderCell: {
      alignItems: 'center',
      borderBottomColor: theme.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      height: 48,
      justifyContent: 'center',
      width: habitColumnWidth,
    },
    dayHeaderText: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '600',
      letterSpacing: 0,
    },
    habitLabel: {
      alignItems: 'center',
      borderBottomColor: theme.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      height: rowHeight,
      width: habitColumnWidth,
    },
    dragDots: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 3,
      marginLeft: 12,
      marginRight: 10,
      width: 14,
    },
    dragDot: {
      backgroundColor: theme.mutedText,
      borderRadius: 2,
      height: 4,
      width: 4,
    },
    habitLabelContent: {
      alignItems: 'center',
      flex: 1,
      gap: 7,
      justifyContent: 'center',
      paddingRight: 8,
    },
    habitName: {
      color: theme.text,
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: 0,
      lineHeight: 21,
      textAlign: 'center',
    },
    daysRow: {
      borderBottomColor: theme.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      height: 48,
    },
    dayCell: {
      alignItems: 'center',
      borderRightColor: theme.border,
      borderRightWidth: StyleSheet.hairlineWidth,
      height: 48,
      justifyContent: 'center',
      width: dayCellWidth,
    },
    dayNumber: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: 0,
    },
    gridRow: {
      borderBottomColor: theme.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      height: rowHeight,
    },
    gridCell: {
      alignItems: 'center',
      borderRightColor: theme.border,
      borderRightWidth: StyleSheet.hairlineWidth,
      height: rowHeight,
      justifyContent: 'center',
      width: dayCellWidth,
    },
    cellPressed: {
      backgroundColor: theme.surfaceRaised,
    },
    checkbox: {
      alignItems: 'center',
      backgroundColor: theme.emptyBg,
      borderColor: theme.strongBorder,
      borderRadius: 3,
      borderWidth: 1.5,
      height: 25,
      justifyContent: 'center',
      width: 25,
    },
    checkboxChecked: {
      backgroundColor: theme.checkedBg,
      borderColor: theme.checkedBorder,
    },
    bottomBar: {
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderTopColor: theme.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      minHeight: 96,
      paddingBottom: Platform.OS === 'ios' ? 10 : 8,
      paddingHorizontal: 14,
      paddingTop: 12,
    },
    bottomAction: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'column',
      gap: 4,
      justifyContent: 'center',
      minHeight: 64,
    },
    addAction: {
      flex: 1.12,
    },
    middleAction: {
      borderColor: theme.border,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderRightWidth: StyleSheet.hairlineWidth,
      flex: 1.2,
    },
    primaryIconBox: {
      alignItems: 'center',
      backgroundColor: theme.text,
      borderRadius: 13,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    bottomActionText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0,
      lineHeight: 16,
      textAlign: 'center',
    },
    bottomMetaText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0,
      lineHeight: 16,
      textAlign: 'center',
    },
    pressed: {
      opacity: 0.65,
    },
    modalBackdrop: {
      backgroundColor: theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.72)' : 'rgba(0, 0, 0, 0.28)',
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 18,
      padding: 22,
      paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    },
    modalTitle: {
      color: theme.text,
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: 0,
    },
    textInput: {
      backgroundColor: theme.surfaceRaised,
      borderColor: theme.strongBorder,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      color: theme.text,
      fontSize: 18,
      fontWeight: '600',
      height: 52,
      letterSpacing: 0,
      paddingHorizontal: 14,
    },
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    iconChoice: {
      alignItems: 'center',
      borderColor: theme.border,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: 8,
      height: 46,
      justifyContent: 'center',
      minWidth: 108,
      paddingHorizontal: 12,
    },
    iconChoiceSelected: {
      backgroundColor: theme.text,
      borderColor: theme.text,
    },
    iconChoiceText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 0,
    },
    iconChoiceTextSelected: {
      color: theme.inverseText,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 10,
    },
    secondaryButton: {
      alignItems: 'center',
      borderColor: theme.strongBorder,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      flex: 1,
      height: 50,
      justifyContent: 'center',
    },
    secondaryButtonText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: theme.text,
      borderRadius: 8,
      flex: 1,
      height: 50,
      justifyContent: 'center',
    },
    primaryButtonText: {
      color: theme.inverseText,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0,
    },
    switchRow: {
      alignItems: 'center',
      borderColor: theme.border,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      height: 56,
      justifyContent: 'space-between',
      paddingHorizontal: 14,
    },
    switchLabel: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: 0,
    },
    switchTrack: {
      backgroundColor: theme.surfaceRaised,
      borderColor: theme.strongBorder,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      height: 32,
      justifyContent: 'center',
      paddingHorizontal: 3,
      width: 58,
    },
    switchTrackOn: {
      backgroundColor: theme.text,
      borderColor: theme.text,
    },
    switchKnob: {
      backgroundColor: theme.text,
      borderRadius: 13,
      height: 26,
      width: 26,
    },
    switchKnobOn: {
      alignSelf: 'flex-end',
      backgroundColor: theme.inverseText,
    },
    timePanel: {
      alignItems: 'center',
      backgroundColor: theme.surfaceRaised,
      borderColor: theme.border,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'center',
      minHeight: 72,
    },
    timeText: {
      color: theme.text,
      fontSize: 27,
      fontWeight: '800',
      letterSpacing: 0,
    },
    plusPanel: {
      backgroundColor: theme.surfaceRaised,
      borderColor: theme.border,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 8,
      padding: 16,
    },
    plusPrice: {
      color: theme.text,
      fontSize: 34,
      fontWeight: '900',
      letterSpacing: 0,
    },
    plusCopy: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: 0,
      lineHeight: 24,
    },
    plusFinePrint: {
      color: theme.mutedText,
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 0,
      lineHeight: 20,
    },
    stepperRow: {
      flexDirection: 'row',
      gap: 10,
    },
    stepper: {
      borderColor: theme.border,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      flex: 1,
      gap: 10,
      padding: 12,
    },
    stepperLabel: {
      color: theme.mutedText,
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0,
      textTransform: 'uppercase',
    },
    stepperButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    stepperButton: {
      alignItems: 'center',
      backgroundColor: theme.surfaceRaised,
      borderRadius: 8,
      flex: 1,
      height: 42,
      justifyContent: 'center',
    },
  });
}
