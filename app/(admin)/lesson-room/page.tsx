// LiveKit React docs (installation): https://docs.livekit.io/reference/components/react/installation/
// Mock placeholders only; intended to be replaced with LiveKitRoom and VideoConference components.

"use client";

import type { CSSProperties, ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Room,
  RoomEvent,
  Track,
  createLocalVideoTrack,
  type LocalVideoTrack,
  type RemoteVideoTrack,
} from "livekit-client";

type VideoPlaceholderProps = {
  label: string;
  className?: string;
  showSwapButton?: boolean;
  onSwap?: () => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
  labelSize?: "sm" | "md";
  signalActive?: boolean;
};

type CameraFrameProps = {
  label: string;
  className?: string;
  showSwapButton?: boolean;
  onSwap?: () => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
  labelSize?: "sm" | "md";
  signalActive?: boolean;
};

type DragPosition = {
  x: number;
  y: number;
};

type DragState = {
  dragging: boolean;
  offsetX: number;
  offsetY: number;
};

type DockSide = "left" | "right";
type UserRole = "teacher" | "student" | "company";
type CameraSource = "teacher1" | "teacher2" | "student";

const CONTROL_PANEL_WIDTH = 300;
const CONTROL_PANEL_HEIGHT = 88;
const MINIMIZED_WIDTH = 20;
const MINIMIZED_HEIGHT = 64;
const CONTROL_MARGIN = 16;
const CONTROL_RESTORE_INSET = 14;
const CONTROL_PANEL_BOTTOM_OFFSET = 24;
const AUTH_STORAGE_KEY = "sm_user";
const VIEW_ROLE_STORAGE_KEY = "sm_view_role";
const DEFAULT_ROOM_NAME = "lesson-room";
const SOURCE_LABELS: Record<CameraSource, string> = {
  teacher1: "Teacher Camera 1",
  teacher2: "Teacher Camera 2",
  student: "Student Camera",
};

const videoBackdropStyle: CSSProperties = {
  backgroundImage:
    "linear-gradient(180deg, rgba(8, 10, 14, 0.2), rgba(8, 10, 14, 0.78)), radial-gradient(120% 120% at 50% 0%, rgba(85, 102, 130, 0.35), rgba(12, 14, 20, 0.9)), repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0px, rgba(255, 255, 255, 0.06) 10px, rgba(0, 0, 0, 0.08) 10px, rgba(0, 0, 0, 0.08) 20px)",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const VideoPlaceholder = ({
  label,
  className = "",
  showSwapButton = false,
  onSwap,
  videoRef,
  labelSize = "md",
  signalActive = false,
}: VideoPlaceholderProps): ReactElement => {
  const labelClasses =
    labelSize === "sm"
      ? "px-3 py-1.5 text-[11px] rounded-full"
      : "px-4 py-2 text-sm rounded-full";
  return (
    <div
      className={[
        "relative flex h-full w-full flex-col justify-between overflow-hidden",
        "rounded-2xl border border-[var(--c-efece6)]",
        "text-white shadow-[0_25px_60px_-40px_rgba(10,10,12,0.7)]",
        className,
      ].join(" ")}
      style={videoBackdropStyle}
      aria-label={`${label} placeholder`}
    >
      {videoRef ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      <div className="relative flex items-center justify-between px-4 py-3 text-xs uppercase tracking-[0.2em] text-white/80">
        <span className="select-none rounded-full bg-white/20 px-4 py-1.5 text-[11px] font-semibold backdrop-blur-sm">
          Live View
        </span>
        <span className="select-none flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-semibold backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          Recording In Progress
        </span>
      </div>
      <div className="relative flex flex-1" />
      <div className="relative flex items-center justify-between px-4 py-3 text-xs text-white/70">
        <div
          className={`select-none flex items-center gap-2 bg-white/20 font-semibold uppercase tracking-wide text-white/90 backdrop-blur-sm ${labelClasses}`}
          style={{
            clipPath: "inset(0 round 999px)",
          }}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              signalActive ? "bg-emerald-400" : "bg-red-500"
            }`}
          />
          {label}
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/25 px-3 py-1 backdrop-blur-sm bg-white/10">
            16:9
          </span>
          <span className="rounded-full border border-white/25 px-3 py-1 backdrop-blur-sm bg-white/10">
            HD
          </span>
          {showSwapButton ? (
            <button
              type="button"
              title="Swap to main view"
              onClick={onSwap}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/25 text-white/80 transition hover:border-white/40 hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
                <path
                  d="M7 7h10l-2.5-2.5M17 17H7l2.5 2.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const CameraFrame = ({
  label,
  className = "",
  showSwapButton = false,
  onSwap,
  videoRef,
  labelSize,
  signalActive,
}: CameraFrameProps): ReactElement => {
  return (
    <div className={`w-full aspect-video ${className}`}>
      <VideoPlaceholder
        label={label}
        className="h-full w-full"
        showSwapButton={showSwapButton}
        onSwap={onSwap}
        videoRef={videoRef}
        labelSize={labelSize}
        signalActive={signalActive}
      />
    </div>
  );
};

const PanelButton = ({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}): ReactElement => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
    >
      {label}
    </button>
  );
};

const CameraSelect = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: MediaDeviceInfo[];
  onChange: (value: string) => void;
}): ReactElement => {
  return (
    <label className="space-y-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-xs text-[var(--c-3a3935)]"
      >
        {options.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Camera ${device.deviceId.slice(0, 4)}`}
          </option>
        ))}
      </select>
    </label>
  );
};

const PanelSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactElement | ReactElement[];
}): ReactElement => {
  return (
    <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm">
      <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--c-7a776f)]">
        {title}
      </p>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
};

const RightSidebar = ({
  role,
  onRequestPermission,
  devices,
  teacherCamOneId,
  teacherCamTwoId,
  onChangeTeacherCamOne,
  onChangeTeacherCamTwo,
}: {
  role: UserRole;
  onRequestPermission: () => void;
  devices: MediaDeviceInfo[];
  teacherCamOneId: string;
  teacherCamTwoId: string;
  onChangeTeacherCamOne: (value: string) => void;
  onChangeTeacherCamTwo: (value: string) => void;
}): ReactElement => {
  if (role === "student") {
    return (
      <div className="space-y-4">
        <PanelSection title="Session Status">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[var(--c-f7f7f5)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              Live Lesson
            </span>
          </div>
          <div className="text-sm font-semibold text-[var(--c-1f1f1d)]">
            Teacher: Morgan Lee (Mock)
          </div>
          <div className="text-xs text-[var(--c-6f6c65)]">
            Topic: Chord Shapes (Mock)
          </div>
        </PanelSection>

        <PanelSection title="My Notes">
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            My Lesson Notes
          </label>
          <textarea
            className="h-28 w-full resize-none rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-3 text-sm text-[var(--c-3a3935)]"
            placeholder="Write notes here..."
          />
          <PanelButton label="Save Notes" />
        </PanelSection>

        <PanelSection title="Quick Actions">
          <PanelButton label="Request Clarification" />
          <PanelButton label="Mark Favorite Moment" />
          <PanelButton label="Download Practice PDF" />
          <PanelButton label="View Past Recordings" />
        </PanelSection>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PanelSection title="Session Controls">
        <PanelButton label="Mark Highlight" />
        <PanelButton label="Add Timestamp Note" />
        <PanelButton label="Generate AI Summary" />
        <PanelButton label="End Lesson" />
      </PanelSection>

      <PanelSection title="Lesson Tools">
        <details className="rounded-xl border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)]/10 p-4 shadow-sm">
          <summary className="group flex cursor-pointer items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)]">
            Lesson Builder
            <span className="flex items-center gap-1 text-[10px] text-[var(--sidebar-accent-text)]">
              <svg viewBox="0 0 20 20" className="h-3 w-3" aria-hidden="true">
                <path
                  d="M6 8l4 4 4-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </summary>
          <div className="mt-3 space-y-2">
            <PanelButton label="Convert Recording to Lesson Pack" />
            <PanelButton label="Attach PDF" />
            <PanelButton label="Attach Soundslice" />
          </div>
        </details>
        <PanelButton label="Open Student Profile" />
        <PanelButton label="Assign Practice" />
        <PanelButton label="Request Student Permission" onClick={onRequestPermission} />
      </PanelSection>

      <PanelSection title="Camera Inputs">
        <CameraSelect
          label="Teacher Camera 1"
          value={teacherCamOneId}
          options={devices}
          onChange={onChangeTeacherCamOne}
        />
        <CameraSelect
          label="Teacher Camera 2"
          value={teacherCamTwoId}
          options={devices}
          onChange={onChangeTeacherCamTwo}
        />
      </PanelSection>

      <PanelSection title="Session Notes">
        <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
          Session Notes
        </label>
        <textarea
          className="h-28 w-full resize-none rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-3 text-sm text-[var(--c-3a3935)]"
          placeholder="Add session notes..."
        />
        <PanelButton label="Save Notes" />
      </PanelSection>

      <PanelSection title="Student Status Snapshot">
        <div className="grid grid-cols-1 gap-2 text-xs text-[var(--c-6f6c65)]">
          <div className="rounded-lg border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2">
            Skill Level: Intermediate (Mock)
          </div>
          <div className="rounded-lg border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2">
            Last Lesson: Jan 28, 2026 (Mock)
          </div>
          <div className="rounded-lg border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2">
            Practice Score: 82% (Mock)
          </div>
        </div>
      </PanelSection>
    </div>
  );
};

type ControlButton = {
  label: string;
};

const controlButtons: ControlButton[] = [
  { label: "Camera" },
  { label: "Mute" },
  { label: "Switch" },
  { label: "Record" },
  { label: "Share" },
  { label: "Settings" },
];

const controlIcons: Record<string, ReactElement> = {
  Camera: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M4 7.5a2 2 0 0 1 2-2h2.4l1.4-1.5h4.4l1.4 1.5H18a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="12"
        cy="12"
        r="3.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  Mute: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M5 9v6h3l4 3V6L8 9H5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M16 9l3 6M19 9l-3 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  Switch: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M7 7h10l-2.5-2.5M17 17H7l2.5 2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  Record: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" fill="currentColor" />
    </svg>
  ),
  Share: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M12 5v10M8 8l4-4 4 4M6 15v3h12v-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  Settings: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M4.5 12h2m11 0h2M12 4.5v2m0 11v2m-5.2-13.2 1.4 1.4m9.6 9.6 1.4 1.4m0-12.4-1.4 1.4M7.2 17.2l-1.4 1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
};

export default function LessonRoomPage(): ReactElement {
  const cameraAreaRef = useRef<HTMLDivElement | null>(null);
  const [controlPosition, setControlPosition] = useState<DragPosition>({
    x: 0,
    y: 0,
  });
  const [controlsMinimized, setControlsMinimized] = useState(false);
  const [minimizedSide, setMinimizedSide] = useState<DockSide>("right");
  const [restoredPosition, setRestoredPosition] = useState<DragPosition | null>(
    null,
  );
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const layoutWidth = viewportSize.width || 0;
  const isUltraWide = layoutWidth >= 3500;
  const isWide = layoutWidth >= 2000 && layoutWidth < 3500;
  const layoutKey = isUltraWide ? "ultra" : isWide ? "middle" : "compact";
  const [activeRole, setActiveRole] = useState<UserRole>("teacher");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionTermsAgreed, setPermissionTermsAgreed] = useState(false);
  const [teacherTrackOne, setTeacherTrackOne] = useState<LocalVideoTrack | null>(
    null,
  );
  const [teacherTrackTwo, setTeacherTrackTwo] = useState<LocalVideoTrack | null>(
    null,
  );
  const [studentTrack, setStudentTrack] = useState<LocalVideoTrack | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [teacherCamOneId, setTeacherCamOneId] = useState<string>("");
  const [teacherCamTwoId, setTeacherCamTwoId] = useState<string>("");
  const [studentCamId, setStudentCamId] = useState<string>("");
  const [livekitError, setLivekitError] = useState<string | null>(null);
  const [livekitState, setLivekitState] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [participantCount, setParticipantCount] = useState(1);
  const [remoteTracksVersion, setRemoteTracksVersion] = useState(0);
  const [connectionDebug, setConnectionDebug] = useState({
    roomState: "unknown",
    connectionState: "unknown",
    remoteCount: 0,
    roomName: "unknown",
  });
  const [cameraPermission, setCameraPermission] = useState<
    "granted" | "denied" | "prompt" | "unknown"
  >("unknown");
  const roomRef = useRef<Room | null>(null);
  const teacherOneVideoRef = useRef<HTMLVideoElement | null>(null);
  const teacherTwoVideoRef = useRef<HTMLVideoElement | null>(null);
  const mainVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteTracksRef = useRef<RemoteVideoTrack[]>([]);
  const remoteTeacherTracksRef = useRef<Array<RemoteVideoTrack | null>>([
    null,
    null,
  ]);
  const remoteStudentTrackRef = useRef<RemoteVideoTrack | null>(null);
  const [layoutSources, setLayoutSources] = useState({
    compact: { main: "student" as CameraSource, small: ["teacher1", "teacher2"] as CameraSource[] },
    middle: { main: "student" as CameraSource, small: ["teacher1", "teacher2"] as CameraSource[] },
    ultra: { main: "student" as CameraSource, small: ["teacher1", "teacher2"] as CameraSource[] },
  });
  const dragStateRef = useRef<DragState>({
    dragging: false,
    offsetX: 0,
    offsetY: 0,
  });

  const clampControlsPosition = (
    bounds: DOMRect,
    panelWidth: number,
    panelHeight: number,
    position: DragPosition,
    dockSide: DockSide,
  ) => {
    const clampedX = Math.min(Math.max(0, position.x), bounds.width - panelWidth);
    const clampedY = Math.min(Math.max(0, position.y), bounds.height - panelHeight);
    if (!controlsMinimized) {
      return { x: clampedX, y: clampedY };
    }
    const dockX = dockSide === "left" ? 0 : Math.max(0, bounds.width - panelWidth);
    return { x: dockX, y: clampedY };
  };

  useEffect(() => {
    if (!cameraAreaRef.current) {
      return;
    }
    const bounds = cameraAreaRef.current.getBoundingClientRect();
    setControlPosition({
      x: Math.max(0, bounds.width - CONTROL_PANEL_WIDTH - CONTROL_MARGIN),
      y: Math.max(
        0,
        bounds.height - CONTROL_PANEL_HEIGHT - CONTROL_MARGIN - CONTROL_PANEL_BOTTOM_OFFSET,
      ),
    });
  }, []);

  useEffect(() => {
    if (controlsMinimized || !cameraAreaRef.current) {
      return;
    }
    const bounds = cameraAreaRef.current.getBoundingClientRect();
    setControlPosition({
      x: Math.max(0, bounds.width - CONTROL_PANEL_WIDTH - CONTROL_MARGIN),
      y: Math.max(
        0,
        bounds.height - CONTROL_PANEL_HEIGHT - CONTROL_MARGIN - CONTROL_PANEL_BOTTOM_OFFSET,
      ),
    });
  }, [layoutKey, controlsMinimized]);

  useEffect(() => {
    const updatePermission = async () => {
      if (!("permissions" in navigator)) {
        setCameraPermission("unknown");
        return;
      }
      try {
        const status = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        setCameraPermission(status.state ?? "unknown");
        status.onchange = () => {
          setCameraPermission(status.state ?? "unknown");
        };
      } catch {
        setCameraPermission("unknown");
      }
    };
    updatePermission();
  }, []);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((device) => device.kind === "videoinput");
        setVideoDevices(videoInputs);
        if (!teacherCamOneId && videoInputs[0]) {
          setTeacherCamOneId(videoInputs[0].deviceId);
        }
        if (!teacherCamTwoId && videoInputs[1]) {
          setTeacherCamTwoId(videoInputs[1].deviceId);
        }
        if (!studentCamId && videoInputs[0]) {
          setStudentCamId(videoInputs[0].deviceId);
        }
      } catch {
        setVideoDevices([]);
      }
    };
    loadDevices();
  }, [teacherCamOneId, teacherCamTwoId, studentCamId]);

  const stopTrack = (track: LocalVideoTrack | null) => {
    if (track) {
      track.stop();
    }
  };

  const normalizeStateLabel = (value: unknown) => {
    if (value === undefined || value === null) {
      return "unknown";
    }
    const label = String(value);
    return label === "undefined" || label.trim() === "" ? "unknown" : label;
  };

  const isSignalActiveForSource = (source: CameraSource) => {
    if (activeRole === "teacher") {
      const isLocal = source === "teacher1" || source === "teacher2";
      if (isLocal) {
        return cameraPermission === "granted" && livekitState === "connected";
      }
      return Boolean(remoteStudentTrackRef.current) && livekitState === "connected";
    }
    const isLocal = source === "student";
    if (isLocal) {
      return cameraPermission === "granted" && livekitState === "connected";
    }
    return (
      Boolean(
        source === "teacher1"
          ? remoteTeacherTracksRef.current[0]
          : remoteTeacherTracksRef.current[1],
      ) && livekitState === "connected"
    );
  };

  useEffect(() => {
    if (activeRole !== "teacher") {
      stopTrack(teacherTrackOne);
      stopTrack(teacherTrackTwo);
      setTeacherTrackOne(null);
      setTeacherTrackTwo(null);
      return;
    }
    let mounted = true;
    const initTeacherTracks = async () => {
      if (!teacherCamOneId || !teacherCamTwoId) return;
      try {
        const trackOne = await createLocalVideoTrack({
          deviceId: { exact: teacherCamOneId },
        });
        const trackTwo =
          teacherCamTwoId === teacherCamOneId
            ? trackOne
            : await createLocalVideoTrack({
                deviceId: { exact: teacherCamTwoId },
              });
        if (!mounted) {
          trackOne.stop();
          if (trackTwo !== trackOne) trackTwo.stop();
          return;
        }
        stopTrack(teacherTrackOne);
        stopTrack(teacherTrackTwo);
        setTeacherTrackOne(trackOne);
        setTeacherTrackTwo(trackTwo);
      } catch (error) {
        setLivekitError(
          error instanceof Error ? error.message : "Camera init failed.",
        );
      }
    };
    initTeacherTracks();
    return () => {
      mounted = false;
    };
  }, [activeRole, teacherCamOneId, teacherCamTwoId]);

  useEffect(() => {
    if (activeRole !== "student") {
      stopTrack(studentTrack);
      setStudentTrack(null);
      return;
    }
    let mounted = true;
    const initStudentTrack = async () => {
      if (!studentCamId) return;
      try {
        const track = await createLocalVideoTrack({
          deviceId: { exact: studentCamId },
        });
        if (!mounted) {
          track.stop();
          return;
        }
        stopTrack(studentTrack);
        setStudentTrack(track);
      } catch (error) {
        setLivekitError(
          error instanceof Error ? error.message : "Camera init failed.",
        );
      }
    };
    initStudentTrack();
    return () => {
      mounted = false;
    };
  }, [activeRole, studentCamId]);

  const getTrackForSource = (source: CameraSource) => {
    if (activeRole === "student") {
      if (source === "student") return studentTrack;
      const teacherIndex = source === "teacher1" ? 0 : 1;
      return remoteTeacherTracksRef.current[teacherIndex];
    }
    if (source === "student") return remoteStudentTrackRef.current;
    return source === "teacher1" ? teacherTrackOne : teacherTrackTwo;
  };

  const getLabelForSource = (source: CameraSource, isMain: boolean) => {
    if (layoutKey === "middle" && isMain && source.startsWith("teacher")) {
      return "Teacher Camera Focus";
    }
    return SOURCE_LABELS[source];
  };

  const handleSwap = (index: number) => {
    setLayoutSources((current) => {
      const next = { ...current };
      const active = { ...next[layoutKey], small: [...next[layoutKey].small] };
      const targetSource = active.small[index];
      active.small[index] = active.main;
      active.main = targetSource;
      next[layoutKey] = active;
      return next;
    });
  };

  useEffect(() => {
    const updateSize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  useEffect(() => {
    try {
      const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY);
      const storedViewRole = window.localStorage.getItem(VIEW_ROLE_STORAGE_KEY);
      if (storedViewRole === "teacher" || storedViewRole === "student" || storedViewRole === "company") {
        setActiveRole(storedViewRole);
        return;
      }
      if (storedUser) {
        const parsed = JSON.parse(storedUser) as { role?: UserRole };
        if (parsed.role === "teacher" || parsed.role === "student" || parsed.role === "company") {
          setActiveRole(parsed.role);
        }
      }
    } catch {
      setActiveRole("teacher");
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const connectRoom = async () => {
      const publishTrack =
        activeRole === "student" ? studentTrack : teacherTrackOne;
      if (!process.env.NEXT_PUBLIC_LIVEKIT_URL || !publishTrack) {
        return;
      }
      setLivekitError(null);
      setLivekitState("connecting");
      try {
        const identity = `${activeRole}-${Math.random().toString(36).slice(2, 9)}`;
        const response = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            room: DEFAULT_ROOM_NAME,
            identity,
            name: identity,
          }),
        });
        const data = (await response.json()) as { token?: string; error?: string };
        if (!data.token || !mounted) {
          if (data.error) {
            setLivekitError(data.error);
          }
          setLivekitState("disconnected");
          return;
        }
        const room = new Room();
        await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL, data.token);
        await room.localParticipant.publishTrack(publishTrack);
        if (activeRole === "teacher" && teacherTrackTwo && teacherTrackTwo !== publishTrack) {
          await room.localParticipant.publishTrack(teacherTrackTwo);
        }
        if (!mounted) {
          room.disconnect();
          return;
        }
        roomRef.current = room;
        const updateParticipants = () => {
          setParticipantCount(1 + room.remoteParticipants.size);
        };
        const attachExistingRemoteTracks = () => {
          room.remoteParticipants.forEach((participant) => {
            participant.videoTrackPublications.forEach((publication) => {
              const track = publication.track;
              if (!track || track.kind !== Track.Kind.Video) return;
              if (remoteTracksRef.current.includes(track)) return;
              remoteTracksRef.current = [...remoteTracksRef.current, track];
              if (activeRole === "student") {
                const firstEmpty = remoteTeacherTracksRef.current.findIndex(
                  (entry) => !entry,
                );
                if (firstEmpty >= 0) {
                  remoteTeacherTracksRef.current[firstEmpty] = track;
                }
              } else {
                remoteStudentTrackRef.current = track;
              }
            });
          });
          setRemoteTracksVersion((v) => v + 1);
        };
        const handleConnected = () => {
          setLivekitState("connected");
          updateParticipants();
          setConnectionDebug({
            roomState: normalizeStateLabel(room.state),
            connectionState: normalizeStateLabel(room.connectionState),
            remoteCount: room.remoteParticipants.size,
            roomName: room.name || "unknown",
          });
        };
        const handleDisconnected = () => {
          setLivekitState("disconnected");
          updateParticipants();
          setConnectionDebug({
            roomState: normalizeStateLabel(room.state),
            connectionState: normalizeStateLabel(room.connectionState),
            remoteCount: room.remoteParticipants.size,
            roomName: room.name || "unknown",
          });
        };
        const handleParticipantChange = () => updateParticipants();
        const handleTrackSubscribed = (track: RemoteVideoTrack) => {
          if (track.kind !== Track.Kind.Video) return;
          if (remoteTracksRef.current.includes(track)) return;
          remoteTracksRef.current = [...remoteTracksRef.current, track];
          if (activeRole === "student") {
            const firstEmpty = remoteTeacherTracksRef.current.findIndex(
              (entry) => !entry,
            );
            if (firstEmpty >= 0) {
              remoteTeacherTracksRef.current[firstEmpty] = track;
            }
          } else {
            remoteStudentTrackRef.current = track;
          }
          setRemoteTracksVersion((v) => v + 1);
        };
        const handleTrackUnsubscribed = (track: RemoteVideoTrack) => {
          if (track.kind !== Track.Kind.Video) return;
          const index = remoteTracksRef.current.indexOf(track);
          if (index >= 0) {
            remoteTracksRef.current = remoteTracksRef.current.filter(t => t !== track);
            if (remoteStudentTrackRef.current === track) {
              remoteStudentTrackRef.current = null;
            }
            const teacherIndex = remoteTeacherTracksRef.current.findIndex(
              (entry) => entry === track,
            );
            if (teacherIndex >= 0) {
              remoteTeacherTracksRef.current[teacherIndex] = null;
            }
            setRemoteTracksVersion((v) => v + 1);
          }
        };

        room.on(RoomEvent.Connected, handleConnected);
        room.on(RoomEvent.Disconnected, handleDisconnected);
        room.on(RoomEvent.ParticipantConnected, handleParticipantChange);
        room.on(RoomEvent.ParticipantDisconnected, handleParticipantChange);
        room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
        room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);

        setLivekitState(room.state === "connected" ? "connected" : "connecting");
        updateParticipants();
        setConnectionDebug({
          roomState: normalizeStateLabel(room.state),
          connectionState: normalizeStateLabel(room.connectionState),
          remoteCount: room.remoteParticipants.size,
          roomName: room.name || "unknown",
        });
        attachExistingRemoteTracks();
      } catch (error) {
        setLivekitError(
          error instanceof Error ? error.message : "LiveKit connect failed.",
        );
        setLivekitState("disconnected");
        setConnectionDebug({
          roomState: "error",
          connectionState: "error",
          remoteCount: 0,
          roomName: "unknown",
        });
      }
    };
    connectRoom();
    return () => {
      mounted = false;
      setLivekitState("disconnected");
      setParticipantCount(1);
      remoteTracksRef.current.forEach((track) => {
        track.detach();
      });
      remoteTracksRef.current = [];
      remoteTeacherTracksRef.current = [null, null];
      remoteStudentTrackRef.current = null;
      setRemoteTracksVersion((v) => v + 1);
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
      setConnectionDebug({
        roomState: "disconnected",
        connectionState: "disconnected",
        remoteCount: 0,
        roomName: "unknown",
      });
    };
  }, [activeRole, studentTrack, teacherTrackOne, teacherTrackTwo]);

  useEffect(() => {
    if (!roomRef.current) {
      return;
    }
    const slotSources = layoutSources[layoutKey];
    const slots = [
      { ref: teacherOneVideoRef, source: slotSources.small[0], isMain: false },
      { ref: teacherTwoVideoRef, source: slotSources.small[1], isMain: false },
      { ref: mainVideoRef, source: slotSources.main, isMain: true },
    ];
    const allTracks = [
      teacherTrackOne,
      teacherTrackTwo,
      studentTrack,
      remoteStudentTrackRef.current,
      remoteTeacherTracksRef.current[0],
      remoteTeacherTracksRef.current[1],
    ].filter((track): track is LocalVideoTrack | RemoteVideoTrack => Boolean(track));

    slots.forEach(({ ref, source, isMain }) => {
      const element = ref.current;
      if (!element) return;
      allTracks.forEach((track) => track.detach(element));
      const track = getTrackForSource(source);
      if (track) {
        track.attach(element);
      }
    });
  }, [
    layoutKey,
    activeRole,
    remoteTracksVersion,
    teacherTrackOne,
    teacherTrackTwo,
    studentTrack,
    layoutSources,
  ]);

  useEffect(() => {
    if (!showPermissionModal) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showPermissionModal]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragStateRef.current.dragging || !cameraAreaRef.current) {
        return;
      }
      const bounds = cameraAreaRef.current.getBoundingClientRect();
      const panelWidth = controlsMinimized ? MINIMIZED_WIDTH : CONTROL_PANEL_WIDTH;
      const panelHeight = controlsMinimized ? MINIMIZED_HEIGHT : CONTROL_PANEL_HEIGHT;
      const nextX = event.clientX - bounds.left - dragStateRef.current.offsetX;
      const nextY = event.clientY - bounds.top - dragStateRef.current.offsetY;
      const { x: clampedX, y: clampedY } = clampControlsPosition(
        bounds,
        panelWidth,
        panelHeight,
        { x: nextX, y: nextY },
        minimizedSide,
      );
      setControlPosition({ x: clampedX, y: clampedY });
    };

    const handlePointerUp = () => {
      dragStateRef.current.dragging = false;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (!cameraAreaRef.current) {
        return;
      }
      const bounds = cameraAreaRef.current.getBoundingClientRect();
      const panelWidth = controlsMinimized ? MINIMIZED_WIDTH : CONTROL_PANEL_WIDTH;
      const panelHeight = controlsMinimized ? MINIMIZED_HEIGHT : CONTROL_PANEL_HEIGHT;
      setControlPosition(() => {
        if (controlsMinimized) {
          return clampControlsPosition(
            bounds,
            panelWidth,
            panelHeight,
            {
              x: 0,
              y: Math.max(0, (bounds.height - panelHeight) / 2),
            },
            minimizedSide,
          );
        }
        return {
          x: Math.max(0, bounds.width - CONTROL_PANEL_WIDTH - CONTROL_MARGIN),
          y: Math.max(
            0,
            bounds.height -
              CONTROL_PANEL_HEIGHT -
              CONTROL_MARGIN -
              CONTROL_PANEL_BOTTOM_OFFSET,
          ),
        };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [controlsMinimized, minimizedSide]);

  const handleControlsPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!cameraAreaRef.current) {
      return;
    }
    const bounds = cameraAreaRef.current.getBoundingClientRect();
    dragStateRef.current = {
      dragging: true,
      offsetX: event.clientX - bounds.left - controlPosition.x,
      offsetY: event.clientY - bounds.top - controlPosition.y,
    };
  };

  const handleMinimizeControls = () => {
    if (!cameraAreaRef.current) {
      setControlsMinimized(true);
      return;
    }
    setRestoredPosition(controlPosition);
    const bounds = cameraAreaRef.current.getBoundingClientRect();
    const midpoint = bounds.width / 2;
    const nextSide: DockSide =
      controlPosition.x + CONTROL_PANEL_WIDTH / 2 < midpoint ? "left" : "right";
    const dockX =
      nextSide === "left"
        ? 0
        : Math.max(0, bounds.width - MINIMIZED_WIDTH);
    const dockY = Math.min(
      Math.max(0, controlPosition.y),
      Math.max(0, bounds.height - MINIMIZED_HEIGHT),
    );
    setMinimizedSide(nextSide);
    setControlsMinimized(true);
    setControlPosition({ x: dockX, y: dockY });
  };

  const handleRestoreControls = () => {
    if (!cameraAreaRef.current) {
      setControlsMinimized(false);
      return;
    }
    const bounds = cameraAreaRef.current.getBoundingClientRect();
    const fallbackX =
      minimizedSide === "left"
        ? CONTROL_RESTORE_INSET
        : Math.max(0, bounds.width - CONTROL_PANEL_WIDTH - CONTROL_RESTORE_INSET);
    const fallbackY = Math.min(
      Math.max(0, controlPosition.y),
      Math.max(0, bounds.height - CONTROL_PANEL_HEIGHT - CONTROL_MARGIN),
    );
    const nextX = fallbackX;
    const nextY = restoredPosition?.y ?? fallbackY;
    const clampedX = Math.min(
      Math.max(0, nextX),
      bounds.width - CONTROL_PANEL_WIDTH,
    );
    const clampedY = Math.min(
      Math.max(0, nextY),
      bounds.height - CONTROL_PANEL_HEIGHT,
    );
    setControlsMinimized(false);
    setControlPosition({ x: clampedX, y: clampedY });
  };

  return (
    <div className="min-h-screen bg-[color:var(--background)] px-6 py-8 text-[color:var(--foreground)]">
      <div className="mx-auto flex h-full w-full max-w-none flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3 select-none">
          <div>
            <h1 className="text-2xl font-semibold">Lesson Room</h1>
            <p className="text-sm text-[var(--c-6f6c65)]">
              Mock LiveKit layout for teacher + student review.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
            <span className="flex items-center gap-2">
              Live Session
              <span
                className={`h-2 w-2 rounded-full ${
                  livekitState === "connected"
                    ? "bg-emerald-500"
                    : livekitState === "connecting"
                    ? "bg-amber-400"
                    : "bg-[var(--c-6f6c65)]"
                }`}
              />
            </span>
            <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-[var(--c-6f6c65)]">
              LiveKit: {livekitState}
            </span>
            <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-[var(--c-6f6c65)]">
              Participants: {participantCount}
            </span>
            <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-[var(--c-6f6c65)]">
              Room: {connectionDebug.roomName} · {connectionDebug.roomState} · {connectionDebug.connectionState} · {connectionDebug.remoteCount}
            </span>
            <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-[var(--c-6f6c65)]">
              Camera: {cameraPermission}
            </span>
            {livekitError ? (
              <span className="rounded-full border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-[var(--c-8f2f3b)]">
                LiveKit: {livekitError}
              </span>
            ) : null}
            <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-[var(--c-6f6c65)]">
              {viewportSize.width} × {viewportSize.height}
            </span>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6">
          {layoutWidth < 2000 || layoutWidth === 0 ? (
            <div className="flex flex-1 flex-col gap-6 min-[3500px]:hidden">
            <section className="flex flex-col gap-4 min-[2000px]:hidden">
              <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-7a776f)]">
                Teacher Cameras
              </h2>
              <div className="grid min-h-[220px] grid-cols-1 gap-4 md:grid-cols-2">
                  <CameraFrame
                    label={getLabelForSource(layoutSources.compact.small[0], false)}
                    showSwapButton
                    onSwap={() => handleSwap(0)}
                    videoRef={teacherOneVideoRef}
                    labelSize="sm"
                    signalActive={isSignalActiveForSource(layoutSources.compact.small[0])}
                  />
                  <CameraFrame
                    label={getLabelForSource(layoutSources.compact.small[1], false)}
                    showSwapButton
                    onSwap={() => handleSwap(1)}
                    videoRef={teacherTwoVideoRef}
                    labelSize="sm"
                    signalActive={isSignalActiveForSource(layoutSources.compact.small[1])}
                  />
              </div>
            </section>

            <section className="grid flex-1 gap-4 min-[2000px]:hidden lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="flex flex-1 flex-col gap-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-7a776f)]">
                  Student Camera
                </h2>
                <div ref={cameraAreaRef} className="relative w-full overflow-hidden">
                    <CameraFrame
                      label={getLabelForSource(layoutSources.compact.main, true)}
                      className="max-w-full"
                      videoRef={mainVideoRef}
                      signalActive={isSignalActiveForSource(layoutSources.compact.main)}
                    />
                  {controlsMinimized ? (
                    <button
                      type="button"
                      onClick={handleRestoreControls}
                      className={`absolute z-10 flex h-[64px] w-[20px] cursor-pointer items-center justify-center border border-white/25 bg-white/15 text-white/80 shadow-[0_18px_35px_-28px_rgba(0,0,0,0.6)] backdrop-blur-sm ${
                        minimizedSide === "left"
                          ? "rounded-r-lg border-l-0"
                          : "rounded-l-lg border-r-0"
                      }`}
                      style={{ left: controlPosition.x, top: controlPosition.y }}
                      title="Restore controls"
                      aria-label="Restore controls"
                    >
                      <span className="h-6 w-1 rounded-sm bg-white/70" />
                    </button>
                  ) : (
                    <div
                      className="absolute z-10 w-[min(300px,92vw)] cursor-move rounded-2xl border border-white/25 bg-white/15 px-3 py-2 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.6)] backdrop-blur-[4px]"
                      style={{ left: controlPosition.x, top: controlPosition.y }}
                      onPointerDown={handleControlsPointerDown}
                      role="presentation"
                    >
                      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70 select-none">
                        Student Controls
                        <button
                          type="button"
                          onClick={handleMinimizeControls}
                          className="rounded-full border border-white/25 px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-white/70"
                          title="Minimize"
                          aria-label="Minimize controls"
                        >
                          <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
                            <path d="M6 12h12" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        </button>
                      </div>
                      <div className="mt-2 flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-1">
                        {controlButtons.map((button) => (
                          <button
                            key={button.label}
                            type="button"
                            disabled
                            title={button.label}
                            aria-label={button.label}
                            className="group cursor-not-allowed rounded-full border border-white/15 bg-white/5 px-2 py-1.5 text-white/70 transition hover:bg-white/10"
                          >
                            <span className="text-white/85">{controlIcons[button.label]}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
                <aside className="flex flex-col gap-4 pt-[32px]">
                  <RightSidebar
                    role={activeRole}
                    onRequestPermission={() => setShowPermissionModal(true)}
                    devices={videoDevices}
                    teacherCamOneId={teacherCamOneId}
                    teacherCamTwoId={teacherCamTwoId}
                    onChangeTeacherCamOne={setTeacherCamOneId}
                    onChangeTeacherCamTwo={setTeacherCamTwoId}
                  />
                </aside>
            </section>
          </div>
          ) : null}

          {isWide ? (
          <div className="w-full flex-1 gap-8">
            <div className="grid w-full flex-1 grid-cols-[minmax(300px,0.3fr)_minmax(0,0.7fr)_260px] gap-6">
              <section className="flex flex-col gap-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-7a776f)]">
                  Teacher Cameras
                </h2>
                <CameraFrame
                  label={getLabelForSource(layoutSources.middle.small[0], false)}
                  showSwapButton
                  onSwap={() => handleSwap(0)}
                  videoRef={teacherOneVideoRef}
                  labelSize="sm"
                  signalActive={isSignalActiveForSource(layoutSources.middle.small[0])}
                />
                <CameraFrame
                  label={getLabelForSource(layoutSources.middle.small[1], false)}
                  showSwapButton
                  onSwap={() => handleSwap(1)}
                  videoRef={teacherTwoVideoRef}
                  labelSize="sm"
                  signalActive={isSignalActiveForSource(layoutSources.middle.small[1])}
                />
              </section>
              <section className="flex flex-1 flex-col gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-7a776f)]">
                  Teacher Camera Focus
                </h2>
                <div ref={cameraAreaRef} className="relative w-full overflow-hidden">
                  <CameraFrame
                    label={getLabelForSource(layoutSources.middle.main, true)}
                    className="max-w-full"
                    videoRef={mainVideoRef}
                    signalActive={isSignalActiveForSource(layoutSources.middle.main)}
                  />
                  {controlsMinimized ? (
                    <button
                      type="button"
                      onClick={handleRestoreControls}
                      className={`absolute z-10 flex h-[64px] w-[20px] cursor-pointer items-center justify-center border border-white/25 bg-white/15 text-white/80 shadow-[0_18px_35px_-28px_rgba(0,0,0,0.6)] backdrop-blur-sm ${
                        minimizedSide === "left"
                          ? "rounded-r-lg border-l-0"
                          : "rounded-l-lg border-r-0"
                      }`}
                      style={{ left: controlPosition.x, top: controlPosition.y }}
                      title="Restore controls"
                      aria-label="Restore controls"
                    >
                      <span className="h-6 w-1 rounded-sm bg-white/70" />
                    </button>
                  ) : (
                    <div
                    className="absolute z-10 w-[min(300px,92vw)] cursor-move rounded-2xl border border-white/25 bg-white/15 px-3 py-2 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.6)] backdrop-blur-[4px]"
                      style={{ left: controlPosition.x, top: controlPosition.y }}
                      onPointerDown={handleControlsPointerDown}
                      role="presentation"
                    >
                      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70 select-none">
                        Teacher Controls
                        <button
                          type="button"
                          onClick={handleMinimizeControls}
                          className="rounded-full border border-white/25 px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-white/70"
                          title="Minimize"
                          aria-label="Minimize controls"
                        >
                          <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
                            <path d="M6 12h12" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        </button>
                      </div>
                      <div className="mt-2 flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-1">
                        {controlButtons.map((button) => (
                          <button
                            key={button.label}
                            type="button"
                            disabled
                            title={button.label}
                            aria-label={button.label}
                            className="group cursor-not-allowed rounded-full border border-white/15 bg-white/5 px-2 py-1.5 text-white/70 transition hover:bg-white/10"
                          >
                            <span className="text-white/85">{controlIcons[button.label]}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
              <aside className="flex flex-col gap-4 pt-[29px]">
                <RightSidebar
                  role={activeRole}
                  onRequestPermission={() => setShowPermissionModal(true)}
                  devices={videoDevices}
                  teacherCamOneId={teacherCamOneId}
                  teacherCamTwoId={teacherCamTwoId}
                  onChangeTeacherCamOne={setTeacherCamOneId}
                  onChangeTeacherCamTwo={setTeacherCamTwoId}
                />
              </aside>
            </div>
          </div>
          ) : null}

          {isUltraWide ? (
          <div className="w-full flex-1 gap-8 items-center justify-center">
            <div className="grid w-full flex-1 grid-cols-[minmax(240px,1fr)_minmax(420px,1.5fr)_minmax(240px,1fr)_minmax(260px,320px)] gap-6">
              <section className="flex flex-col gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-7a776f)]">
                  Teacher Camera 1
                </h2>
                <CameraFrame
                  label={getLabelForSource(layoutSources.ultra.small[0], false)}
                  showSwapButton
                  onSwap={() => handleSwap(0)}
                  videoRef={teacherOneVideoRef}
                  labelSize="sm"
                  signalActive={isSignalActiveForSource(layoutSources.ultra.small[0])}
                />
              </section>
              <section className="flex flex-col gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-7a776f)]">
                  Student Camera
                </h2>
                <div ref={cameraAreaRef} className="relative w-full overflow-hidden">
                  <CameraFrame
                    label={getLabelForSource(layoutSources.ultra.main, true)}
                    className="max-w-full"
                    videoRef={mainVideoRef}
                    signalActive={isSignalActiveForSource(layoutSources.ultra.main)}
                  />
                  {controlsMinimized ? (
                    <button
                      type="button"
                      onClick={handleRestoreControls}
                      className={`absolute z-10 flex h-[64px] w-[20px] cursor-pointer items-center justify-center border border-white/25 bg-white/15 text-white/80 shadow-[0_18px_35px_-28px_rgba(0,0,0,0.6)] backdrop-blur-sm ${
                        minimizedSide === "left"
                          ? "rounded-r-lg border-l-0"
                          : "rounded-l-lg border-r-0"
                      }`}
                      style={{ left: controlPosition.x, top: controlPosition.y }}
                      title="Restore controls"
                      aria-label="Restore controls"
                    >
                      <span className="h-6 w-1 rounded-sm bg-white/70" />
                    </button>
                  ) : (
                    <div
                    className="absolute z-10 w-[min(300px,92vw)] cursor-move rounded-2xl border border-white/25 bg-white/15 px-3 py-2 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.6)] backdrop-blur-[4px]"
                      style={{ left: controlPosition.x, top: controlPosition.y }}
                      onPointerDown={handleControlsPointerDown}
                      role="presentation"
                    >
                      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70 select-none">
                        Student Controls
                        <button
                          type="button"
                          onClick={handleMinimizeControls}
                          className="rounded-full border border-white/25 px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-white/70"
                          title="Minimize"
                          aria-label="Minimize controls"
                        >
                          <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
                            <path d="M6 12h12" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        </button>
                      </div>
                      <div className="mt-2 flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-1">
                        {controlButtons.map((button) => (
                          <button
                            key={button.label}
                            type="button"
                            disabled
                            title={button.label}
                            aria-label={button.label}
                            className="group cursor-not-allowed rounded-full border border-white/15 bg-white/5 px-2 py-1.5 text-white/70 transition hover:bg-white/10"
                          >
                            <span className="text-white/85">{controlIcons[button.label]}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
              <section className="flex flex-col gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-7a776f)]">
                  Teacher Camera 2
                </h2>
                <CameraFrame
                  label={getLabelForSource(layoutSources.ultra.small[1], false)}
                  showSwapButton
                  onSwap={() => handleSwap(1)}
                  videoRef={teacherTwoVideoRef}
                  labelSize="sm"
                  signalActive={isSignalActiveForSource(layoutSources.ultra.small[1])}
                />
              </section>
              <aside className="space-y-4 pt-[29px]">
                <RightSidebar
                  role={activeRole}
                  onRequestPermission={() => setShowPermissionModal(true)}
                  devices={videoDevices}
                  teacherCamOneId={teacherCamOneId}
                  teacherCamTwoId={teacherCamTwoId}
                  onChangeTeacherCamOne={setTeacherCamOneId}
                  onChangeTeacherCamTwo={setTeacherCamTwoId}
                />
            </aside>
            </div>
          </div>
          ) : null}
        </main>
      </div>
      {showPermissionModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 text-[var(--c-1f1f1d)] shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-7a776f)]">
                  Student Permission
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  Request Lesson Content Usage
                </h2>
              </div>
            </div>
            <p className="mt-4 text-sm text-[var(--c-6f6c65)]">
              Are you ok with this lesson content being used in future lesson
              content provided to other students or teachers?
            </p>
            <div className="mt-5 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4 text-sm text-[var(--c-6f6c65)]">
              <p>
                By agreeing, you allow this lesson recording and related
                materials to be used to improve future lessons and learning
                resources.
              </p>
              <p className="mt-3">
                Your content may be edited for clarity, length, or instructional
                value, and may be shared with other students or teachers as part
                of Simply Music materials.
              </p>
              <p className="mt-3">
                We will never share private account details, and we will take
                reasonable steps to remove sensitive personal information from
                any shared content.
              </p>
              <p className="mt-3">
                You can withdraw your consent at any time by contacting support,
                and we will stop using new versions of the content going
                forward.
              </p>
            </div>
            <label className="mt-4 flex items-start gap-3 text-sm text-[var(--c-6f6c65)]">
              <input
                type="checkbox"
                checked={permissionTermsAgreed}
                onChange={(event) => setPermissionTermsAgreed(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border border-[var(--c-ecebe7)]"
              />
              <span>
                I agree to the terms for using this lesson content in future
                materials.
              </span>
            </label>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowPermissionModal(false)}
                className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Yes, I Agree
              </button>
              <button
                type="button"
                onClick={() => setShowPermissionModal(false)}
                className="rounded-full border border-[var(--c-ecebe7)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                No, Not Now
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
