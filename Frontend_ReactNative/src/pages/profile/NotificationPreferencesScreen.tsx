import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {notificationPreferencesService} from '../../api/services/notificationPreferencesService';
import type {NotificationPreferences} from '../../api/services/notificationPreferencesService';

const NotificationPreferencesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    user_id: 0,
    report_enabled: false,
    report_frequency: 'weekly',
    report_day_of_week: 1, // Monday
    report_day_of_month: 1,
    report_time: '09:00:00',
    notification_method: 'in-app',
  });

  const daysOfWeek = [
    {value: 0, label: 'Domingo'},
    {value: 1, label: 'Segunda'},
    {value: 2, label: 'Terça'},
    {value: 3, label: 'Quarta'},
    {value: 4, label: 'Quinta'},
    {value: 5, label: 'Sexta'},
    {value: 6, label: 'Sábado'},
  ];

  const frequencies = [
    {value: 'daily', label: 'Diário'},
    {value: 'weekly', label: 'Semanal'},
    {value: 'monthly', label: 'Mensal'},
  ];

  const notificationMethods = [
    {value: 'in-app', label: 'No App'},
    {value: 'email', label: 'Por Email'},
    {value: 'both', label: 'Ambos'},
  ];

  const hours = Array.from({length: 24}, (_, i) => i);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await notificationPreferencesService.getPreferences();
      setPreferences(data);
    } catch (err) {
      console.error('Erro ao carregar preferências:', err);
      Alert.alert('Erro', 'Não foi possível carregar as preferências');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      await notificationPreferencesService.updatePreferences({
        report_enabled: preferences.report_enabled,
        report_frequency: preferences.report_frequency,
        report_day_of_week: preferences.report_day_of_week,
        report_day_of_month: preferences.report_day_of_month,
        report_time: preferences.report_time,
        notification_method: preferences.notification_method,
      });
      Alert.alert('Sucesso', 'Preferências salvas com sucesso!');
      navigation.goBack();
    } catch (err) {
      console.error('Erro ao salvar preferências:', err);
      Alert.alert('Erro', 'Não foi possível salvar as preferências');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({...prev, [key]: value}));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Carregando preferências...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📊 Relatórios Periódicos</Text>
          <Text style={styles.sectionDescription}>
            Receba notificações com seus dados de desempenho periodicamente
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Ativar relatórios</Text>
          <Switch
            value={preferences.report_enabled}
            onValueChange={value => updatePreference('report_enabled', value)}
            trackColor={{false: '#ccc', true: '#2196F3'}}
            thumbColor="#fff"
          />
        </View>

        {preferences.report_enabled && (
          <>
            <View style={styles.divider} />

            <Text style={styles.subsectionTitle}>Frequência</Text>
            <View style={styles.optionsContainer}>
              {frequencies.map(freq => (
                <TouchableOpacity
                  key={freq.value}
                  style={[
                    styles.optionButton,
                    preferences.report_frequency === freq.value &&
                      styles.optionButtonActive,
                  ]}
                  onPress={() =>
                    updatePreference('report_frequency', freq.value)
                  }>
                  <Text
                    style={[
                      styles.optionButtonText,
                      preferences.report_frequency === freq.value &&
                        styles.optionButtonTextActive,
                    ]}>
                    {freq.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {preferences.report_frequency === 'weekly' && (
              <>
                <Text style={styles.subsectionTitle}>Dia da Semana</Text>
                <View style={styles.optionsContainer}>
                  {daysOfWeek.map(day => (
                    <TouchableOpacity
                      key={day.value}
                      style={[
                        styles.dayButton,
                        preferences.report_day_of_week === day.value &&
                          styles.dayButtonActive,
                      ]}
                      onPress={() =>
                        updatePreference('report_day_of_week', day.value)
                      }>
                      <Text
                        style={[
                          styles.dayButtonText,
                          preferences.report_day_of_week === day.value &&
                            styles.dayButtonTextActive,
                        ]}>
                        {day.label.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {preferences.report_frequency === 'monthly' && (
              <>
                <Text style={styles.subsectionTitle}>Dia do Mês</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>Dia {preferences.report_day_of_month}</Text>
                  <View style={styles.dayMonthControls}>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={() =>
                        updatePreference(
                          'report_day_of_month',
                          Math.max(1, preferences.report_day_of_month - 1),
                        )
                      }>
                      <Text style={styles.controlButtonText}>−</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={() =>
                        updatePreference(
                          'report_day_of_month',
                          Math.min(31, preferences.report_day_of_month + 1),
                        )
                      }>
                      <Text style={styles.controlButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            <View style={styles.divider} />

            <Text style={styles.subsectionTitle}>Horário</Text>
            <View style={styles.row}>
              <Text style={styles.label}>
                {preferences.report_time.substring(0, 5)}
              </Text>
              <View style={styles.dayMonthControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => {
                    const currentHour = parseInt(preferences.report_time.substring(0, 2));
                    const newHour = (currentHour - 1 + 24) % 24;
                    updatePreference(
                      'report_time',
                      `${String(newHour).padStart(2, '0')}:00:00`,
                    );
                  }}>
                  <Text style={styles.controlButtonText}>−</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => {
                    const currentHour = parseInt(preferences.report_time.substring(0, 2));
                    const newHour = (currentHour + 1) % 24;
                    updatePreference(
                      'report_time',
                      `${String(newHour).padStart(2, '0')}:00:00`,
                    );
                  }}>
                  <Text style={styles.controlButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.subsectionTitle}>Método de Notificação</Text>
            <View style={styles.optionsContainer}>
              {notificationMethods.map(method => (
                <TouchableOpacity
                  key={method.value}
                  style={[
                    styles.optionButton,
                    preferences.notification_method === method.value &&
                      styles.optionButtonActive,
                  ]}
                  onPress={() =>
                    updatePreference('notification_method', method.value)
                  }>
                  <Text
                    style={[
                      styles.optionButtonText,
                      preferences.notification_method === method.value &&
                        styles.optionButtonTextActive,
                    ]}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ℹ️ Você receberá notificações com informações sobre ganhos,
                propostas fechadas e outras estatísticas relevantes.
              </Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={saving}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={savePreferences}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Salvar</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 10,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  optionButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  optionButtonTextActive: {
    color: '#fff',
  },
  dayButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  dayButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  dayMonthControls: {
    flexDirection: 'row',
    gap: 10,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  infoText: {
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    padding: 15,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#90CAF9',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default NotificationPreferencesScreen;
