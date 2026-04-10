import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
  RefreshControl,
  StatusBar,
  SafeAreaView,
  Platform,
} from "react-native";
import { API_URL, TokenService } from "./index";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const APIURL = `${API_URL}/content/getContent`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface PatientInfo {
  patientId?: string;
  qrData?: string;
  name?: string;
  age?: number;
  gender?: string;
  [key: string]: any;
}

interface ContentRecord {
  contentId: string;
  userId: string;
  timestamp: string;
  signedUrl: string | null;
  patientInfo: PatientInfo | null;
  attendantDescription?: string | null;
  modelReview?: string | null;
  moderatorReview?: string | null;
  [key: string]: any;
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function fetchImages(page: number): Promise<{
  data: ContentRecord[];
  count: number;
  pageSize: number;
}> {
  const accessToken = await TokenService.getAccess();
  const refreshToken = await TokenService.getRefresh();

  const res = await fetch(APIURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      type: "own",
      page,
      accessToken,
      refreshToken,
    }),
  });

  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

async function deleteImage(contentId: string): Promise<void> {
  const accessToken = await TokenService.getAccess();
  const refreshToken = await TokenService.getRefresh();

  const res = await fetch(`${API_URL}/content/deleteContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      contentId,
      accessToken,
      refreshToken,
    }),
  });

  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatKey(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

// ─── Patient Info Card ────────────────────────────────────────────────────────

function PatientCard({ info }: { info: PatientInfo }) {
  const rows = Object.entries(info).filter(
    ([k, v]) =>
      v !== null &&
      v !== undefined &&
      k !== "__v" &&
      k !== "_id" &&
      k !== "contentId" &&
      k !== "createdAt" &&
      k !== "updatedAt"
  );

  if (!rows.length) return null;

  return (
    <View style={styles.patientCard}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionDot, { backgroundColor: TEAL }]} />
        <Text style={[styles.sectionTitle, { color: TEAL }]}>Patient Info</Text>
      </View>
      {rows.map(([key, val]) => (
        <View key={key} style={styles.infoRow}>
          <Text style={styles.infoKey}>{formatKey(key)}</Text>
          <Text style={styles.infoVal} numberOfLines={2}>
            {String(val)}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Review Badge ─────────────────────────────────────────────────────────────

function ReviewBadge({ label, value }: { label: string; value: string | null | undefined }) {
  const isPending = value === null || value === undefined;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoKey}>{label}</Text>
      <View style={[styles.badge, isPending ? styles.badgePending : styles.badgeDone]}>
        <Text style={[styles.badgeText, isPending ? styles.badgeTextPending : styles.badgeTextDone]}>
          {isPending ? "Pending" : value}
        </Text>
      </View>
    </View>
  );
}

// ─── Content Meta Card ────────────────────────────────────────────────────────

function ContentMetaCard({ item }: { item: ContentRecord }) {
  const hasAttendant = item.attendantDescription !== null && item.attendantDescription !== undefined;
  const hasReviews = item.modelReview !== undefined || item.moderatorReview !== undefined;

  if (!hasAttendant && !hasReviews) return null;

  return (
    <View style={styles.metaCard}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionDot, { backgroundColor: PURPLE }]} />
        <Text style={[styles.sectionTitle, { color: PURPLE }]}>Review Info</Text>
      </View>

      {hasAttendant && (
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Attendant Note</Text>
          <Text style={[styles.infoVal, { flex: 2 }]} numberOfLines={3}>
            {item.attendantDescription ?? "—"}
          </Text>
        </View>
      )}

      <ReviewBadge label="Model Review" value={item.modelReview} />
      <ReviewBadge label="Moderator Review" value={item.moderatorReview} />
    </View>
  );
}

// ─── Image Card ───────────────────────────────────────────────────────────────

function ImageCard({
  item,
  onPress,
  onDelete,
}: {
  item: ContentRecord;
  onPress: (item: ContentRecord) => void;
  onDelete: (contentId: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const date = item.timestamp
    ? new Date(item.timestamp).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(item.contentId);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => onPress(item)}
    >
      {/* Delete Button */}
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

      {/* Image */}
      <View style={styles.imageWrap}>
        {item.signedUrl && !imgError ? (
          <Image
            source={{ uri: item.signedUrl }}
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
      </View>

      {/* Patient Info */}
      {item.patientInfo ? (
        <PatientCard info={item.patientInfo} />
      ) : (
        <View style={styles.noPatient}>
          <Text style={styles.noPatientText}>No patient data attached</Text>
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Review / Meta Info */}
      <ContentMetaCard item={item} />
    </TouchableOpacity>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  item,
  onClose,
}: {
  item: ContentRecord | null;
  onClose: () => void;
}) {
  if (!item) return null;
  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent>
      <View style={styles.lightboxBg}>
        <TouchableOpacity style={styles.lightboxClose} onPress={onClose}>
          <Text style={styles.lightboxCloseText}>✕</Text>
        </TouchableOpacity>

        {item.signedUrl ? (
          <Image
            source={{ uri: item.signedUrl }}
            style={styles.lightboxImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.lightboxPlaceholder}>
            <Text style={styles.placeholderIcon}>🖼</Text>
          </View>
        )}

        <View style={styles.lightboxInfo}>
          {item.patientInfo && <PatientCard info={item.patientInfo} />}
          <ContentMetaCard item={item} />
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
        <Text style={[styles.pageBtnText, page === 0 && styles.pageBtnTextDisabled]}>
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
        <Text style={[styles.pageBtnText, !hasMore && styles.pageBtnTextDisabled]}>
          Next →
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function Images() {
  const [records, setRecords] = useState<ContentRecord[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ContentRecord | null>(null);

  const load = useCallback(async (p: number, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const result = await fetchImages(p);
      setRecords(result.data ?? []);
      console.log(result.data ?? []);
      setHasMore((result.data?.length ?? 0) >= result.pageSize);
    } catch (e: any) {
      setError(e.message ?? "Failed to load images.");
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

  const handleDelete = useCallback(async (contentId: string) => {
    try {
      await deleteImage(contentId);
      setRecords((prev) => prev.filter((r) => r.contentId !== contentId));
    } catch (e: any) {
      setError(e.message ?? "Failed to delete.");
    }
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F5F2" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Images</Text>
        {records.length > 0 && (
          <Text style={styles.headerSub}>{records.length} records</Text>
        )}
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
          keyExtractor={(item) => item.contentId}
          renderItem={({ item }) => (
            <ImageCard item={item} onPress={setSelected} onDelete={handleDelete} />
          )}
          contentContainerStyle={styles.list}
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
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>No images found</Text>
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
const PURPLE = "#7B5EA7";
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
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 16 : 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: BG,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: ACCENT,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: MUTED,
    fontWeight: "500",
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
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    margin: 10,
    marginBottom: 4,
    backgroundColor: "#E03E3E",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 90,
    justifyContent: "center",
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

  // Divider
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginHorizontal: 14,
  },

  // Shared section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // Shared info row
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F5",
  },
  infoKey: {
    fontSize: 13,
    color: MUTED,
    fontWeight: "500",
    flex: 1,
  },
  infoVal: {
    fontSize: 13,
    color: ACCENT,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },

  // Patient Card
  patientCard: {
    padding: 14,
    gap: 4,
  },

  // Meta Card (Review Info)
  metaCard: {
    padding: 14,
    gap: 4,
  },

  // Review Badges
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeDone: {
    backgroundColor: "#E8F5E9",
  },
  badgePending: {
    backgroundColor: "#FFF3E0",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  badgeTextDone: {
    color: "#2E7D32",
  },
  badgeTextPending: {
    color: "#E65100",
  },

  // No patient
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
  emptyIcon: { fontSize: 40 },
  emptyText: {
    color: MUTED,
    fontSize: 15,
    fontWeight: "500",
  },
});