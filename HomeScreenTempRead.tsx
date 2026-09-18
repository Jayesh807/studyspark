import React, { useState } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
import React, { useState } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  RefreshControl,
  Dimensions
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { 
  Menu,
  Bell,
  Search,
  Zap,
  Target,
  ClipboardList,
  Check,
  GraduationCap,
  Clock,
  CalendarDays,
  Sparkles,
  BarChart2,
  Music,
  Calculator,
  Quote,
  RefreshCw,
  TrendingUp,
  Timer,
  AlarmClock,
  CheckCircle2
} from "lucide-react-native";
import { useTheme } from "../../hooks/useTheme";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { analyticsApi } from "../../api/analytics";
import { todosApi } from "../../api/todos";
import { examsApi } from "../../api/exams";
import { Badge } from "../../components/ui/Badge";
import { spacing, fontSize, fontWeight, radius } from "../../theme";
import { daysUntil, formatDate } from "../../utils/date";
import { NotificationCenterModal } from "../../components/notifications/NotificationCenterModal";
import { CalculatorModal } from "../../components/study/CalculatorModal";

const { width } = Dimensions.get("window");
const cardWidth = (width - spacing.lg * 2 - 12) / 2;

export function HomeScreen() {
  const { c, isDark } = useTheme();
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  // Modal States
  const [showNotifs, setShowNotifs] = useState(false);
  const setShowLofi = useAppStore(s => s.setShowLofi);
  const [showCalc, setShowCalc] = useState(false);

  // Queries
  const { data: analytics, isLoading: loadingAnalytics, refetch } = useQuery({
    queryKey: ["analytics"], 
    queryFn: analyticsApi.get, 
    staleTime: 60000,
  });
  const { data: todosData } = useQuery({ 
    queryKey: ["todos"], 
    queryFn: todosApi.list, 
    staleTime: 30000 
  });
  const { data: examsData } = useQuery({ 
    queryKey: ["exams"], 
    queryFn: examsApi.list, 
    staleTime: 60000 
  });

  const stats = analytics?.stats;
  const allTodos = todosData?.todos ?? [];
  const pendingTodos = allTodos.filter((t: any) => t.status !== "completed");
  const completedTodos = allTodos.filter((t: any) => t.status === "completed");
  const upcomingExams = examsData?.exams?.filter((e: any) => daysUntil(e.date) >= 0) ?? [];

  const focusTodayMinutes = stats?.focusTodayMinutes ?? 0;
  const targetMinutes = (profile?.targetHours ?? 6) * 60;
  const remainingMinutes = Math.max(0, targetMinutes - focusTodayMinutes);
  const goalPercent = Math.min(100, Math.round((focusTodayMinutes / targetMinutes) * 100)) || 0;

  const totalTasks = allTodos.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTodos.length / totalTasks) * 100) : 0;

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning," : currentHour < 17 ? "Good afternoon," : "Good evening,";

  // Dynamic Theme Palette (Light & Dark)
  const bg = isDark ? "#0B0E14" : "#F8FAFC";
  const cardBg = isDark ? "#131823" : "#FFFFFF";
  const cardBorder = isDark ? "#1E2638" : "#E2E8F0";
  const textPrimary = isDark ? "#FFFFFF" : "#0F172A";
  const textSecondary = isDark ? "#8E9BAE" : "#64748B";
  const textMuted = isDark ? "#64748B" : "#94A3B8";
  const trackBg = isDark ? "#1A2234" : "#F1F5F9";
  const circleBtnBg = isDark ? "#131823" : "#FFFFFF";
  const circleBtnBorder = isDark ? "#1E2638" : "#E2E8F0";
  const iconColor = isDark ? "#E2E8F0" : "#1E293B";

    const shortcuts = [
    { icon: <Music size={20} color="#C084FC" />, label: "Lofi", onPress: () => setShowLofi(true) },
    { icon: <Calculator size={20} color="#38BDF8" />, label: "Calculator", onPress: () => setShowCalc(true) },
    { icon: <CalendarDays size={20} color="#10B981" />, label: "Calendar", onPress: () => nav.navigate("Calendar") },
    { icon: <ClipboardList size={20} color="#F59E0B" />, label: "Planner", onPress: () => nav.navigate("Planner") },
    { icon: <GraduationCap size={20} color="#8B5CF6" />, label: "Subjects", onPress: () => nav.navigate("Subjects") },
    { icon: <Target size={20} color="#EF4444" />, label: "Exams", onPress: () => nav.navigate("Exams") },
    { icon: <Clock size={20} color="#06B6D4" />, label: "Revision", onPress: () => nav.navigate("Revision") },
    { icon: <BarChart2 size={20} color="#EC4899" />, label: "Analytics", onPress: () => nav.navigate("Analytics") },
        onClose={() => setShowNotifs(false)} 
        onNavigate={(screen) => nav.navigate(screen)} 
      />

      

      {/* Study Calculator */}
      <CalculatorModal 
        visible={showCalc} 
        onClose={() => setShowCalc(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  iconCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleStack: {
    flex: 1,
    marginLeft: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarBorder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#38BDF8",
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#0284C7",
    fontWeight: "800",
    fontSize: 14,
  },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  greetingSub: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  greetingName: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  activeText: {
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: spacing.lg,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    marginLeft: 10,
    fontWeight: "500",
  },
  cmdKey: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
  },
  cmdKeyText: {
    fontSize: 11,
    fontWeight: "700",
  },
  goalCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  goalIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(192, 132, 252, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  goalTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginLeft: 10,
    flex: 1,
  },
  keepGoingBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.35)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  keepGoingText: {
    color: "#F59E0B",
    fontSize: 11,
    fontWeight: "700",
  },
  goalContentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  goalBigNum: {
    fontSize: 34,
    fontWeight: "800",
  },
  goalTargetNum: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 4,
  },
  goalRemainingText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  progressCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: "#38BDF8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(56, 189, 248, 0.08)",
  },
  progressPercent: {
    fontWeight: "800",
    fontSize: 13,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: 18,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: cardWidth,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  statCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statCardTag: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  statIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statBigValue: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  statUnitMuted: {
    fontSize: 16,
    fontWeight: "700",
    color: "#06B6D4",
    marginLeft: 2,
  },
  statSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
    marginBottom: 14,
  },
  statCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 10,
  },
  statFooterMuted: {
    fontSize: 11,
    fontWeight: "600",
  },
  statActionPink: {
    fontSize: 11,
    fontWeight: "800",
    color: "#F472B6",
  },
  statActionGreen: {
    fontSize: 11,
    fontWeight: "800",
    color: "#10B981",
  },
  statActionAmber: {
    fontSize: 11,
    fontWeight: "800",
    color: "#F59E0B",
  },
  statActionCyan: {
    fontSize: 11,
    fontWeight: "800",
    color: "#38BDF8",
  },
  quickAccessSection: {
    marginBottom: spacing.lg,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  shortcutsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "flex-start",
      gap: 12,
    },
  shortcutCard: {
      width: (width - spacing.lg * 2 - 36) / 4,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutIconContainer: {
    marginBottom: 6,
  },
  shortcutLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  previewContainer: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: "hidden",
  },
  todoPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.sm,
  },
  todoBorder: {
    borderBottomWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  todoText: {
    fontSize: 13,
    fontWeight: "600",
  },
  todoDate: {
    fontSize: 11,
    marginTop: 2,
  },
});

