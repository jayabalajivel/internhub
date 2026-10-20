// Lightweight icon set for InternHub
import type { SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

const icon =
  (path: string, viewBox = "0 0 24 24") =>
  ({ size = 18, ...props }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {path.split("|").map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  )

const iconFill =
  (path: string) =>
  ({ size = 18, ...props }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d={path} />
    </svg>
  )

export const HomeIcon = icon(
  "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z|M9 22V12h6v10",
)
export const SearchIcon = icon("M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0")
export const BellIcon = icon(
  "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9|M13.73 21a2 2 0 01-3.46 0",
)
export const UserIcon = icon(
  "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2|M12 11a4 4 0 100-8 4 4 0 000 8z",
)
export const UploadIcon = icon(
  "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4|M17 8l-5-5-5 5|M12 3v12",
)
export const BriefcaseIcon = icon(
  "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z|M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2",
)
export const ChartIcon = icon("M18 20V10|M12 20V4|M6 20v-6")
export const StarIcon = icon(
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
)
export const BookmarkIcon = icon(
  "M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z",
)
export const ShareIcon = icon(
  "M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8|M16 6l-4-4-4 4|M12 2v13",
)
export const CheckIcon = icon("M20 6L9 17l-5-5")
export const XIcon = icon("M18 6L6 18|M6 6l12 12")
export const ChevronRightIcon = icon("M9 18l6-6-6-6")
export const ChevronDownIcon = icon("M6 9l6 6 6-6")
export const ArrowRightIcon = icon("M5 12h14|M12 5l7 7-7 7")
export const SparklesIcon = icon(
  "M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z|M19 3l.75 2.25L22 6l-2.25.75L19 9l-.75-2.25L16 6l2.25-.75L19 3z|M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z",
)
export const BrainIcon = icon(
  "M9.5 2A2.5 2.5 0 007 4.5v.5H6a3 3 0 000 6h.5v.5A2.5 2.5 0 009.5 14a2.5 2.5 0 002.5-2.5V11h1v.5a2.5 2.5 0 002.5 2.5 2.5 2.5 0 002.5-2.5V11H18a3 3 0 000-6h-.5v-.5A2.5 2.5 0 0015 2a2.5 2.5 0 00-2.5 2.5V5h-1v-.5A2.5 2.5 0 009.5 2z",
)
export const TrendUpIcon = icon("M23 6l-9.5 9.5-5-5L1 18|M17 6h6v6")
export const MapPinIcon = icon(
  "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z|M12 13a3 3 0 100-6 3 3 0 000 6z",
)
export const ClockIcon = icon(
  "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z|M12 6v6l4 2",
)
export const DollarIcon = icon(
  "M12 1v22|M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
)
export const AwardIcon = icon(
  "M12 15a7 7 0 100-14 7 7 0 000 14z|M8.21 13.89L7 23l5-3 5 3-1.21-9.12",
)
export const LayersIcon = icon(
  "M12 2L2 7l10 5 10-5-10-5z|M2 17l10 5 10-5|M2 12l10 5 10-5",
)
export const ZapIcon = icon("M13 2L3 14h9l-1 8 10-12h-9l1-8z")
export const GlobeIcon = icon(
  "M12 22a10 10 0 100-20 10 10 0 000 20z|M2 12h20|M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
)
export const ShieldIcon = icon("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z")
export const RocketIcon = icon(
  "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z|M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z|M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0|M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5",
)
export const CodeIcon = icon("M16 18l6-6-6-6|M8 6l-6 6 6 6")
export const FilterIcon = icon("M22 3H2l8 9.46V19l4 2v-8.54L22 3z")
export const RefreshIcon = icon(
  "M23 4v6h-6|M1 20v-6h6|M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
)
export const KanbanIcon = icon("M3 3h5v18H3z|M10 3h5v10h-5z|M17 3h4v14h-4z")
export const LogOutIcon = icon(
  "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4|M16 17l5-5-5-5|M21 12H9",
)
export const SettingsIcon = icon(
  "M12 15a3 3 0 100-6 3 3 0 000 6z|M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z",
)
export const FileTextIcon = icon(
  "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z|M14 2v6h6|M16 13H8|M16 17H8|M10 9H8",
)
export const PlusIcon = icon("M12 5v14|M5 12h14")
export const TrashIcon = icon(
  "M3 6h18|M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2",
)
export const EyeIcon = icon(
  "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z|M12 15a3 3 0 100-6 3 3 0 000 6z",
)
export const MessageIcon = icon(
  "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
)
export const LinkedinIcon = icon(
  "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z|M2 9h4v12H2z|M4 6a2 2 0 100-4 2 2 0 000 4z",
)
export const GithubIcon = icon(
  "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22",
)
export const MailIcon = icon(
  "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z|M22 6l-10 7L2 6",
)
export const LockIcon = icon(
  "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z|M7 11V7a5 5 0 0110 0v4",
)
export const MenuIcon = icon("M3 12h18|M3 6h18|M3 18h18")
export const ExternalLinkIcon = icon(
  "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6|M15 3h6v6|M10 14L21 3",
)
export const AlertIcon = icon(
  "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z|M12 9v4|M12 17h.01",
)
export const BookOpenIcon = icon(
  "M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z|M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z",
)
export const CpuIcon = icon(
  "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
)
export const TrophyIcon = icon(
  "M8 21h8|M12 21v-3|M12 18a7 7 0 01-7-7H2l.1-1h19.8l.1 1a7 7 0 01-7 7z|M5 3h14l-1 4H6L5 3z",
)

export const GoogleIcon = ({ size = 18, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
)
