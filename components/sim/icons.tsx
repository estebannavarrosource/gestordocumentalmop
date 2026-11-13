import {
  Archive,
  ArrowRightLeft,
  BadgeCheck,
  Bell,
  Camera,
  CircleCheck,
  Cloud,
  Database,
  Download,
  Eye,
  FileSignature,
  FileText,
  FileWarning,
  Files,
  Fingerprint,
  FolderOpen,
  Hash,
  History,
  Hourglass,
  Inbox,
  KeyRound,
  Layers,
  Library,
  Link2,
  ListTree,
  Lock,
  Network,
  Package,
  RefreshCw,
  Replace,
  Route,
  ScrollText,
  Send,
  Server,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Table2,
  Upload,
  UserCheck,
  UserX,
  Users,
  Workflow,
  Clock,
  Monitor,
  Cpu,
  Search,
  Gauge,
  type LucideIcon,
} from 'lucide-react'

export const ICONS: Record<string, LucideIcon> = {
  Archive,
  ArrowRightLeft,
  BadgeCheck,
  Bell,
  Camera,
  CircleCheck,
  Cloud,
  Clock,
  Database,
  Download,
  Eye,
  FileSignature,
  FileText,
  FileWarning,
  Files,
  Fingerprint,
  FolderOpen,
  Hash,
  History,
  Hourglass,
  Inbox,
  KeyRound,
  Layers,
  Library,
  Link2,
  ListTree,
  Lock,
  Network,
  Package,
  RefreshCw,
  Replace,
  Route,
  ScrollText,
  Send,
  Server,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Table2,
  Upload,
  UserCheck,
  UserX,
  Users,
  Workflow,
  Monitor,
  Cpu,
  Search,
  Gauge,
}

export function SimIcon({ name, className, style }: { name?: string; className?: string; style?: React.CSSProperties }) {
  const Cmp = (name && ICONS[name]) || FileText
  return <Cmp className={className} style={style} aria-hidden="true" />
}

export const STATUS_COLOR = {
  idle: '#9AA9BD',
  running: '#1672B8',
  ok: '#15966B',
  pending: '#F59E0B',
  error: '#D92D32',
} as const

export const STATUS_LABEL = {
  idle: 'En espera',
  running: 'Ejecutando',
  ok: 'Confirmado',
  pending: 'Pendiente',
  error: 'Error',
} as const

export const NAVY = '#102A4C'
export const AZURE = '#1672B8'
export const RED = '#D92D32'
export const AMBER = '#F59E0B'
export const GREEN = '#15966B'

export const OUTCOME_COLOR = { ok: AZURE, error: RED, pending: AMBER, lost: RED } as const

export const TONE_COLOR = { ...STATUS_COLOR, info: NAVY } as const
