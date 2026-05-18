import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { api } from '@/lib/api';

// ── Shared modal shell ────────────────────────────────────────────────────────
function ModalShell({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={shell.container}>
        <View style={shell.header}>
          <TouchableOpacity onPress={onClose} style={shell.closeBtn}>
            <Ionicons name="close" size={22} color="#8B96A7" />
          </TouchableOpacity>
          <Text style={shell.title}>{title}</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={shell.body} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Edit Profile Modal ────────────────────────────────────────────────────────
function EditProfileModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState((user as any)?.bio ?? '');
  const [location, setLocation] = useState((user as any)?.location ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    setSaving(true);
    try {
      const { data } = await api.patch('/users/me', { name: name.trim(), bio: bio.trim() || undefined, location: location.trim() || undefined });
      setUser(data);
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      const text = Array.isArray(msg) ? msg.join('\n') : (msg ?? err?.message ?? 'Failed to update profile');
      Alert.alert('Error', text);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={modal.container}>
          <View style={modal.header}>
            <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
              <Ionicons name="close" size={22} color="#8B96A7" />
            </TouchableOpacity>
            <Text style={modal.title}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving} style={modal.saveBtn}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={modal.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={modal.body} keyboardShouldPersistTaps="handled">
            <View style={modal.avatarSection}>
              <View style={modal.avatar}>
                <Text style={modal.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
              </View>
            </View>
            <View style={modal.field}>
              <Text style={modal.label}>Full Name *</Text>
              <TextInput style={modal.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor="#4A5568" autoCorrect={false} />
            </View>
            <View style={modal.field}>
              <Text style={modal.label}>Location</Text>
              <TextInput style={modal.input} value={location} onChangeText={setLocation} placeholder="City, Nepal" placeholderTextColor="#4A5568" autoCorrect={false} />
            </View>
            <View style={modal.field}>
              <Text style={modal.label}>Bio</Text>
              <TextInput style={[modal.input, modal.textarea]} value={bio} onChangeText={setBio} placeholder="Brief bio..." placeholderTextColor="#4A5568" multiline numberOfLines={3} textAlignVertical="top" />
            </View>
            <View style={modal.readonlySection}>
              <Ionicons name="information-circle-outline" size={15} color="#8B96A7" />
              <Text style={modal.readonlyText}>Email and phone number can only be changed by an administrator.</Text>
            </View>
            <View style={modal.readonlyRow}>
              <Text style={modal.readonlyLabel}>Email</Text>
              <Text style={modal.readonlyValue}>{user?.email}</Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── App Settings Modal ────────────────────────────────────────────────────────
function AppSettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { isDark, toggle } = useThemeStore();

  return (
    <ModalShell visible={visible} onClose={onClose} title="App Settings">
      <Text style={setting.sectionTitle}>Appearance</Text>
      <View style={setting.card}>
        <View style={setting.row}>
          <View style={setting.rowLeft}>
            <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={20} color="#8B96A7" />
            <View>
              <Text style={setting.rowLabel}>Dark Mode</Text>
              <Text style={setting.rowDesc}>{isDark ? 'Dark theme active' : 'Light theme active'}</Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={() => { toggle(); }}
            trackColor={{ false: '#D0D9EE', true: '#0D2B6B' }}
            thumbColor={isDark ? '#fff' : '#0D2B6B'}
          />
        </View>
      </View>

      <Text style={setting.sectionTitle}>Language</Text>
      <View style={setting.card}>
        {['English', 'नेपाली'].map((lang, i, arr) => (
          <TouchableOpacity key={lang} style={[setting.row, i < arr.length - 1 && setting.rowBorder]}
            onPress={() => lang !== 'English' && Alert.alert('Coming Soon', 'Nepali language support is coming soon.')}>
            <View style={setting.rowLeft}>
              <Ionicons name="language-outline" size={20} color="#8B96A7" />
              <Text style={setting.rowLabel}>{lang}</Text>
            </View>
            {lang === 'English' && <Ionicons name="checkmark-circle" size={20} color="#3B63BB" />}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={setting.sectionTitle}>About</Text>
      <View style={setting.card}>
        {[['App Version', '1.0.0'], ['Build', 'Production']].map(([label, value], i, arr) => (
          <View key={label} style={[setting.row, i < arr.length - 1 && setting.rowBorder]}>
            <Text style={setting.rowLabel}>{label}</Text>
            <Text style={setting.rowDesc}>{value}</Text>
          </View>
        ))}
      </View>
    </ModalShell>
  );
}

// ── Notifications Modal ───────────────────────────────────────────────────────
function NotificationsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(true);
  const [liveAlerts, setLiveAlerts] = useState(true);
  const [examReminders, setExamReminders] = useState(true);
  const [announcements, setAnnouncements] = useState(true);

  const items = [
    { label: 'Push Notifications', desc: 'Alerts on your device', value: push, onChange: setPush, icon: 'phone-portrait-outline' },
    { label: 'Email Notifications', desc: 'Updates in your inbox', value: email, onChange: setEmail, icon: 'mail-outline' },
    { label: 'Live Class Alerts', desc: 'When a class goes live', value: liveAlerts, onChange: setLiveAlerts, icon: 'radio-outline' },
    { label: 'Exam Reminders', desc: 'Before exam deadlines', value: examReminders, onChange: setExamReminders, icon: 'alarm-outline' },
    { label: 'Announcements', desc: 'Academy-wide updates', value: announcements, onChange: setAnnouncements, icon: 'megaphone-outline' },
  ];

  return (
    <ModalShell visible={visible} onClose={onClose} title="Notifications">
      <View style={setting.card}>
        {items.map((item, i) => (
          <View key={item.label} style={[setting.row, i < items.length - 1 && setting.rowBorder]}>
            <View style={setting.rowLeft}>
              <Ionicons name={item.icon as any} size={20} color="#8B96A7" />
              <View>
                <Text style={setting.rowLabel}>{item.label}</Text>
                <Text style={setting.rowDesc}>{item.desc}</Text>
              </View>
            </View>
            <Switch value={item.value} onValueChange={item.onChange} trackColor={{ false: '#2A3346', true: '#0D2B6B' }} thumbColor="#fff" />
          </View>
        ))}
      </View>
      <Text style={setting.hint}>Notification preferences are saved on this device.</Text>
    </ModalShell>
  );
}

// ── Privacy & Security Modal ──────────────────────────────────────────────────
function PrivacySecurityModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) { Alert.alert('Error', 'Please fill all fields'); return; }
    if (newPw.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters'); return; }
    if (newPw !== confirmPw) { Alert.alert('Error', 'New passwords do not match'); return; }
    setSaving(true);
    try {
      await api.patch('/users/me/password', { currentPassword: currentPw, newPassword: newPw });
      Alert.alert('Success', 'Password changed successfully');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      Alert.alert('Error', Array.isArray(msg) ? msg.join('\n') : (msg ?? 'Failed to change password'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell visible={visible} onClose={onClose} title="Privacy & Security">
      <Text style={setting.sectionTitle}>Change Password</Text>
      <View style={setting.card}>
        <View style={[setting.inputWrap, setting.rowBorder]}>
          <Text style={setting.inputLabel}>Current Password</Text>
          <View style={setting.inputRow}>
            <TextInput style={setting.textInput} value={currentPw} onChangeText={setCurrentPw} secureTextEntry={!showCurrent} placeholder="Enter current password" placeholderTextColor="#4A5568" />
            <TouchableOpacity onPress={() => setShowCurrent(p => !p)}>
              <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={18} color="#8B96A7" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={[setting.inputWrap, setting.rowBorder]}>
          <Text style={setting.inputLabel}>New Password</Text>
          <View style={setting.inputRow}>
            <TextInput style={setting.textInput} value={newPw} onChangeText={setNewPw} secureTextEntry={!showNew} placeholder="Min 8 characters" placeholderTextColor="#4A5568" />
            <TouchableOpacity onPress={() => setShowNew(p => !p)}>
              <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={18} color="#8B96A7" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={setting.inputWrap}>
          <Text style={setting.inputLabel}>Confirm New Password</Text>
          <TextInput style={setting.textInput} value={confirmPw} onChangeText={setConfirmPw} secureTextEntry placeholder="Re-enter new password" placeholderTextColor="#4A5568" />
        </View>
      </View>

      <TouchableOpacity style={setting.primaryBtn} onPress={handleChangePassword} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={setting.primaryBtnText}>Update Password</Text>}
      </TouchableOpacity>

      <Text style={setting.sectionTitle}>Security</Text>
      <View style={setting.card}>
        <TouchableOpacity style={setting.row} onPress={() => Alert.alert('Active Sessions', 'You are currently signed in on this device only.')}>
          <View style={setting.rowLeft}>
            <Ionicons name="desktop-outline" size={20} color="#8B96A7" />
            <View>
              <Text style={setting.rowLabel}>Active Sessions</Text>
              <Text style={setting.rowDesc}>Manage where you're signed in</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#2A3346" />
        </TouchableOpacity>
      </View>
    </ModalShell>
  );
}

// ── Help & Support Modal ──────────────────────────────────────────────────────
const FAQS = [
  { q: 'How do I enroll in a course?', a: 'Go to the Explore tab, find a course, and tap "Enroll". You will be redirected to payment if the course is paid.' },
  { q: 'How do I take an exam?', a: 'Open the Exams tab, select an exam assigned to your course, and tap Start. Answer all questions and submit.' },
  { q: 'Where can I watch lessons?', a: 'Go to My Courses, select a course, then tap any lesson to start watching.' },
  { q: 'How do I join a live class?', a: 'Tap Live in the home screen or bottom bar. Live sessions show a "Join Now" button with a link.' },
  { q: 'I forgot my password, what do I do?', a: 'On the login screen tap "Forgot password?" and enter your email to receive a reset link.' },
  { q: 'How do I contact support?', a: 'Email us at support@shubhayatraacademy.com or call +977-01-XXXXXXX during office hours.' },
];

function HelpSupportModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <ModalShell visible={visible} onClose={onClose} title="Help & Support">
      <Text style={setting.sectionTitle}>Frequently Asked Questions</Text>
      <View style={setting.card}>
        {FAQS.map((faq, i) => (
          <View key={i} style={i < FAQS.length - 1 && setting.rowBorder}>
            <TouchableOpacity style={setting.faqRow} onPress={() => setOpenIndex(openIndex === i ? null : i)}>
              <Text style={setting.faqQ}>{faq.q}</Text>
              <Ionicons name={openIndex === i ? 'chevron-up' : 'chevron-down'} size={16} color="#8B96A7" />
            </TouchableOpacity>
            {openIndex === i && <Text style={setting.faqA}>{faq.a}</Text>}
          </View>
        ))}
      </View>

      <Text style={setting.sectionTitle}>Contact Us</Text>
      <View style={setting.card}>
        {[
          { icon: 'mail-outline', label: 'Email Support', desc: 'support@shubhayatraacademy.com' },
          { icon: 'call-outline', label: 'Phone', desc: '+977-01-XXXXXXX' },
          { icon: 'time-outline', label: 'Office Hours', desc: 'Sun–Fri, 9am–5pm' },
        ].map((item, i, arr) => (
          <View key={item.label} style={[setting.row, i < arr.length - 1 && setting.rowBorder]}>
            <View style={setting.rowLeft}>
              <Ionicons name={item.icon as any} size={20} color="#8B96A7" />
              <View>
                <Text style={setting.rowLabel}>{item.label}</Text>
                <Text style={setting.rowDesc}>{item.desc}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ModalShell>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [editVisible, setEditVisible] = useState(false);
  const [appSettingsVisible, setAppSettingsVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  const SETTINGS = [
    { icon: 'settings-outline', label: 'App Settings', desc: 'Theme, language', onPress: () => setAppSettingsVisible(true) },
    { icon: 'notifications-outline', label: 'Notifications', desc: 'Push & email', onPress: () => setNotificationsVisible(true) },
    { icon: 'shield-outline', label: 'Privacy & Security', desc: 'Password, sessions', onPress: () => setPrivacyVisible(true) },
    { icon: 'help-circle-outline', label: 'Help & Support', desc: 'FAQs, contact us', onPress: () => setHelpVisible(true) },
  ];

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role?.toLowerCase()}</Text>
          </View>
          <Text style={styles.email}>{user?.email}</Text>
          {(user as any)?.location ? <Text style={styles.location}>{(user as any).location}</Text> : null}
          {(user as any)?.bio ? <Text style={styles.bio}>{(user as any).bio}</Text> : null}
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditVisible(true)}>
            <Ionicons name="pencil-outline" size={14} color="#E6EDF3" style={{ marginRight: 6 }} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={styles.settingsCard}>
          {SETTINGS.map(({ icon, label, desc, onPress }) => (
            <TouchableOpacity key={label} style={styles.settingRow} onPress={onPress}>
              <View style={styles.settingIcon}>
                <Ionicons name={icon as any} size={20} color="#8B96A7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>{label}</Text>
                <Text style={styles.settingDesc}>{desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#2A3346" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <EditProfileModal visible={editVisible} onClose={() => setEditVisible(false)} />
      <AppSettingsModal visible={appSettingsVisible} onClose={() => setAppSettingsVisible(false)} />
      <NotificationsModal visible={notificationsVisible} onClose={() => setNotificationsVisible(false)} />
      <PrivacySecurityModal visible={privacyVisible} onClose={() => setPrivacyVisible(false)} />
      <HelpSupportModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#E6EDF3' },
  profileCard: { margin: 20, backgroundColor: '#1C2230', borderRadius: 20, padding: 24, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#2A3346' },
  avatarWrap: { position: 'relative', marginBottom: 4 },
  avatar: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#0D2B6B', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 30, fontWeight: '700', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: '#E6EDF3' },
  roleBadge: { backgroundColor: '#16A34A20', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 20 },
  roleText: { color: '#4ade80', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  email: { fontSize: 13, color: '#8B96A7' },
  location: { fontSize: 12, color: '#8B96A7' },
  bio: { fontSize: 12, color: '#8B96A7', textAlign: 'center', lineHeight: 18 },
  editBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#2A3346', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  editBtnText: { color: '#E6EDF3', fontWeight: '600', fontSize: 14 },
  settingsCard: { marginHorizontal: 20, backgroundColor: '#1C2230', borderRadius: 16, borderWidth: 1, borderColor: '#2A3346', overflow: 'hidden', marginBottom: 12 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: '#2A3346' },
  settingIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#161B22', alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 14, fontWeight: '500', color: '#E6EDF3' },
  settingDesc: { fontSize: 11, color: '#8B96A7', marginTop: 1 },
  logoutBtn: { marginHorizontal: 20, backgroundColor: '#1C2230', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#2A3346' },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#ef4444' },
});

const shell = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2A3346' },
  closeBtn: { padding: 6 },
  title: { fontSize: 17, fontWeight: '700', color: '#E6EDF3' },
  body: { padding: 20, gap: 4, paddingBottom: 40 },
});

const setting = StyleSheet.create({
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#8B96A7', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 16, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: '#1C2230', borderRadius: 16, borderWidth: 1, borderColor: '#2A3346', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#2A3346' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '500', color: '#E6EDF3' },
  rowDesc: { fontSize: 11, color: '#8B96A7', marginTop: 1 },
  hint: { fontSize: 11, color: '#4A5568', marginTop: 8, marginLeft: 4, lineHeight: 16 },
  inputWrap: { padding: 14, gap: 6 },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#8B96A7', textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  textInput: { flex: 1, color: '#E6EDF3', fontSize: 14, padding: 0 },
  primaryBtn: { backgroundColor: '#0D2B6B', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  faqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, gap: 12 },
  faqQ: { fontSize: 14, fontWeight: '500', color: '#E6EDF3', flex: 1 },
  faqA: { fontSize: 13, color: '#8B96A7', lineHeight: 20, paddingHorizontal: 16, paddingBottom: 14 },
});

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2A3346' },
  closeBtn: { padding: 6 },
  title: { fontSize: 17, fontWeight: '700', color: '#E6EDF3' },
  saveBtn: { backgroundColor: '#0D2B6B', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, minWidth: 60, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  body: { padding: 20, gap: 16 },
  avatarSection: { alignItems: 'center', marginBottom: 8 },
  avatar: { width: 72, height: 72, borderRadius: 20, backgroundColor: '#0D2B6B', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: '#8B96A7', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#1C2230', borderWidth: 1, borderColor: '#2A3346', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#E6EDF3', fontSize: 15 },
  textarea: { minHeight: 80, paddingTop: 12 },
  readonlySection: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#1C2230', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#2A3346' },
  readonlyText: { flex: 1, fontSize: 12, color: '#8B96A7', lineHeight: 17 },
  readonlyRow: { backgroundColor: '#1C2230', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2A3346', gap: 4 },
  readonlyLabel: { fontSize: 11, fontWeight: '600', color: '#4A5568', textTransform: 'uppercase', letterSpacing: 0.5 },
  readonlyValue: { fontSize: 14, color: '#8B96A7' },
});
