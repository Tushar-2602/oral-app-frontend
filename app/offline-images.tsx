import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getDb } from "./third"; // adjust path as needed

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PAGE_SIZE = 20;

// ─── Types ────────────────────────────────────────────────────────────────────

interface OfflineRecord {
  id: string;
  uri: string;
  size?: number;
  fileName?: string;
  patientName?: string;
  patientAge?: number | string;
  patientId?: string;
  patientDescription?: string;
  patientQrData?: string;
  hospitalName?: string;
  attendantDescription?: string;
  savedAt?: string;
}

// ─── DB ───────────────────────────────────────────────────────────────────────

async function fetchOfflineRecords(
  page: number
): Promise<{ data: OfflineRecord[]; total: number }> {
  const db = await getDb();
  const offset = page * PAGE_SIZE;

  const rows = await db.getAllAsync<{ id: string; data: string }>(
    "SELECT id, data FROM saved_records ORDER BY rowid DESC LIMIT ? OFFSET ?;",
    PAGE_SIZE,
    offset
  );

  const countResult = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM saved_records;"
  );

  const data: OfflineRecord[] = rows.map((row) => {
    try {
      const parsed = JSON.parse(row.data);
      return { id: row.id, ...parsed };
    } catch {
      return { id: row.id, uri: "" };
    }
  });

  return { data, total: countResult?.count ?? 0 };
}

async function deleteOfflineRecord(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM saved_records WHERE id = ?;", id);
}

async function uploadAllRecords(): Promise<void> {
  // TODO: implement actual upload logic
  alert("Upload all not yet implemented.");
}

// ─── Patient Info Card ────────────────────────────────────────────────────────

const PATIENT_KEYS: { key: keyof OfflineRecord; label: string }[] = [
  { key: "patientName", label: "Name" },
  { key: "patientId", label: "Patient ID" },
  { key: "patientAge", label: "Age" },
  { key: "hospitalName", label: "Hospital" },
  { key: "patientDescription", label: "Description" },
  { key: "attendantDescription", label: "Attendant Notes" },
  { key: "patientQrData", label: "QR Data" },
];

function PatientCard({ record }: { record: OfflineRecord }) {
  const rows = PATIENT_KEYS.filter(
    ({ key }) =>
      record[key] !== null && record[key] !== undefined && record[key] !== ""
  );

  if (!rows.length) return null;

  return (
    <View style={styles.patientCard}>
      <View style={styles.patientHeader}>
        <View style={styles.patientDot} />
        <Text style={styles.patientTitle}>Patient Info</Text>
      </View>
      {rows.map(({ key, label }) => (
        <View key={key} style={styles.patientRow}>
          <Text style={styles.patientKey}>{label}</Text>
          <Text style={styles.patientVal} numberOfLines={1}>
            {String(record[key])}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Image Card ───────────────────────────────────────────────────────────────

function ImageCard({
  item,
  onPress,
  onDelete,
}: {
  item: OfflineRecord;
  onPress: (item: OfflineRecord) => void;
  onDelete: (id: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const date = item.savedAt
    ? new Date(item.savedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(item.id);
    } finally {
      setDeleting(false);
    }
  };

  const handleUpload = () => {
    alert(`Upload not yet implemented for record: ${item.id}`);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => onPress(item)}
    >
      {/* Action Buttons */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload}>
          <Text style={styles.uploadBtnText}>⬆ Upload</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.deleteBtnText}>🗑 Delete</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Image */}
      <View style={styles.imageWrap}>
        {item.uri && !imgError ? (
          <Image
            source={{ uri: item.uri }}
            style={styles.cardImage}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderIcon}>🖼</Text>
            <Text style={styles.placeholderText}>No Preview</Text>
          </View>
        )}
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText}>{date}</Text>
        </View>
        {/* Offline badge */}
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineBadgeText}>OFFLINE</Text>
        </View>
      </View>

      {/* Patient Info */}
      {item.patientName || item.patientId || item.hospitalName ? (
        <PatientCard record={item} />
      ) : (
        <View style={styles.noPatient}>
          <Text style={styles.noPatientText}>No patient data attached</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  item,
  onClose,
}: {
  item: OfflineRecord | null;
  onClose: () => void;
}) {
  if (!item) return null;
  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent>
      <View style={styles.lightboxBg}>
        <TouchableOpacity style={styles.lightboxClose} onPress={onClose}>
          <Text style={styles.lightboxCloseText}>✕</Text>
        </TouchableOpacity>
        {item.uri ? (
          <Image
            source={{ uri: item.uri }}
            style={styles.lightboxImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.lightboxPlaceholder}>
            <Text style={styles.placeholderIcon}>🖼</Text>
          </View>
        )}
        <View style={styles.lightboxInfo}>
          <PatientCard record={item} />
        </View>
      </View>
    </Modal>
  );
}

// ─── Pagination Bar ───────────────────────────────────────────────────────────

function PaginationBar({
  page,
  hasMore,
  loading,
  onPrev,
  onNext,
}: {
  page: number;
  hasMore: boolean;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.pagination}>
      <TouchableOpacity
        style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
        onPress={onPrev}
        disabled={page === 0 || loading}
      >
        <Text
          style={[styles.pageBtnText, page === 0 && styles.pageBtnTextDisabled]}
        >
          ← Prev
        </Text>
      </TouchableOpacity>

      <View style={styles.pageIndicator}>
        <Text style={styles.pageNumber}>Page {page + 1}</Text>
      </View>

      <TouchableOpacity
        style={[styles.pageBtn, !hasMore && styles.pageBtnDisabled]}
        onPress={onNext}
        disabled={!hasMore || loading}
      >
        <Text
          style={[styles.pageBtnText, !hasMore && styles.pageBtnTextDisabled]}
        >
          Next →
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OfflineImages() {
  const router = useRouter();
  const [records, setRecords] = useState<OfflineRecord[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<OfflineRecord | null>(null);
  const [uploadConfirming, setUploadConfirming] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async (p: number, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const result = await fetchOfflineRecords(p);
      setRecords(result.data ?? []);
      setTotal(result.total);
      setHasMore((p + 1) * PAGE_SIZE < result.total);
    } catch (e: any) {
      setError(e.message ?? "Failed to load offline images.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [page]);

  const handleRefresh = () => load(page, true);
  const handlePrev = () => setPage((p) => Math.max(0, p - 1));
  const handleNext = () => setPage((p) => p + 1);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteOfflineRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setTotal((t) => t - 1);
    } catch (e: any) {
      setError(e.message ?? "Failed to delete.");
    }
  }, []);

  const handleUploadAll = async () => {
    if (!uploadConfirming) {
      setUploadConfirming(true);
      return;
    }
    setUploadConfirming(false);
    setUploading(true);
    try {
      await uploadAllRecords();
    } catch (e: any) {
      setError(e.message ?? "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleCancelConfirm = () => {
    if (uploadConfirming) setUploadConfirming(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F5F2" />

      {/* Header */}
      <View style={styles.header}>
        {/* <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          onPressIn={handleCancelConfirm}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Offline Images</Text> */}

        <View style={styles.headerRight}>
          {total > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{total}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.uploadAllBtn,
              uploadConfirming && styles.uploadAllBtnConfirm,
              (uploading || total === 0) && styles.uploadAllBtnDisabled,
            ]}
            onPress={handleUploadAll}
            disabled={uploading || total === 0}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.uploadAllBtnText}>
                {uploadConfirming ? "Confirm?" : "⬆ Upload All"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => load(page)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1A1A2E" />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ImageCard item={item} onPress={setSelected} onDelete={handleDelete} />
          )}
          contentContainerStyle={styles.list}
          onScrollBeginDrag={handleCancelConfirm}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#1A1A2E"
            />
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.centered}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={56}
                  color="#DDDDE8"
                />
                <Text style={styles.emptyText}>No offline images found</Text>
                <Text style={styles.emptySubtext}>
                  Images saved while offline will appear here.
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            records.length > 0 ? (
              <PaginationBar
                page={page}
                hasMore={hasMore}
                loading={loading}
                onPrev={handlePrev}
                onNext={handleNext}
              />
            ) : null
          }
        />
      )}

      {/* Lightbox */}
      <Lightbox item={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_RADIUS = 16;
const ACCENT = "#1A1A2E";
const TEAL = "#0F7B6C";
const BG = "#F7F5F2";
const CARD_BG = "#FFFFFF";
const MUTED = "#8A8A99";
const BORDER = "#EBEBF0";

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 16 : 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: BG,
    gap: 10,
  },
  backBtn: {
    padding: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: ACCENT,
    letterSpacing: -0.5,
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countBadge: {
    backgroundColor: TEAL,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
    minWidth: 28,
    alignItems: "center",
  },
  countBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  uploadAllBtn: {
    backgroundColor: ACCENT,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadAllBtnConfirm: {
    backgroundColor: "#E07B0F",
  },
  uploadAllBtnDisabled: {
    backgroundColor: "#DDDDE8",
  },
  uploadAllBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },

  // Error
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF0F0",
    borderLeftWidth: 3,
    borderLeftColor: "#E03E3E",
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorText: { color: "#C0392B", fontSize: 13, flex: 1 },
  retryText: { color: TEAL, fontWeight: "700", fontSize: 13, marginLeft: 8 },

  // List
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },

  // Card
  card: {
    backgroundColor: CARD_BG,
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    margin: 10,
    marginBottom: 4,
  },
  uploadBtn: {
    backgroundColor: TEAL,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 90,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  deleteBtn: {
    backgroundColor: "#E03E3E",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 90,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  imageWrap: {
    width: "100%",
    height: 200,
    backgroundColor: "#EEEEF4",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  placeholderIcon: { fontSize: 36 },
  placeholderText: { color: MUTED, fontSize: 13 },
  dateBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  dateBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  offlineBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#E07B0F",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  offlineBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  // Patient Card
  patientCard: {
    padding: 14,
    gap: 6,
  },
  patientHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  patientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: TEAL,
  },
  patientTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: TEAL,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  patientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F5",
  },
  patientKey: {
    fontSize: 13,
    color: MUTED,
    fontWeight: "500",
    flex: 1,
  },
  patientVal: {
    fontSize: 13,
    color: ACCENT,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  noPatient: {
    padding: 14,
    alignItems: "center",
  },
  noPatientText: {
    fontSize: 12,
    color: MUTED,
    fontStyle: "italic",
  },

  // Pagination
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  pageBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: ACCENT,
    borderRadius: 10,
  },
  pageBtnDisabled: {
    backgroundColor: "#DDDDE8",
  },
  pageBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  pageBtnTextDisabled: {
    color: MUTED,
  },
  pageIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#EEEEF4",
  },
  pageNumber: {
    fontSize: 13,
    fontWeight: "700",
    color: ACCENT,
  },

  // Lightbox
  lightboxBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  lightboxClose: {
    position: "absolute",
    top: 52,
    right: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  lightboxCloseText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  lightboxImage: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_WIDTH - 32,
    borderRadius: 12,
  },
  lightboxPlaceholder: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_WIDTH - 32,
    borderRadius: 12,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
  lightboxInfo: {
    width: SCREEN_WIDTH - 32,
    marginTop: 12,
    backgroundColor: "#1C1C2E",
    borderRadius: 12,
    overflow: "hidden",
  },

  // States
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    gap: 10,
  },
  loadingText: {
    color: MUTED,
    fontSize: 14,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: MUTED,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#BBBBCC",
    textAlign: "center",
    paddingHorizontal: 24,
  },
});