const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const Icon = ({ children, size = 22, ...rest }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...base} {...rest}>
    {children}
  </svg>
)

export const HomeIcon = (p) => (
  <Icon {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5.5 9.5V20a1 1 0 0 0 1 1H10v-5.5h4V21h3.5a1 1 0 0 0 1-1V9.5" />
  </Icon>
)

export const CalendarIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="16" rx="4" />
    <path d="M8 3v4M16 3v4M3 10h18" />
    <path d="M8 14.5h.01M12 14.5h.01M16 14.5h.01M8 17.5h.01M12 17.5h.01" />
  </Icon>
)

export const SparkIcon = (p) => (
  <Icon {...p}>
    <path d="M12 3.5 13.6 8 18 9.6 13.6 11.2 12 15.6 10.4 11.2 6 9.6 10.4 8 12 3.5Z" />
    <path d="M18.5 15.5l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7.7-1.9Z" />
    <path d="M5.5 15l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5L3.4 17.1l1.5-.6.6-1.5Z" />
  </Icon>
)

export const FlowerIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="2.6" />
    <path d="M12 9.4c0-2.2-.9-4.4-2.6-5.4 2.4-.7 5 .4 5.9 2.6.9-2.2 3.5-3.3 5.9-2.6C19.5 5 18.6 7.2 18.6 9.4" />
    <path d="M14.6 12c2.2 0 4.4-.9 5.4-2.6.7 2.4-.4 5-2.6 5.9 2.2.9 3.3 3.5 2.6 5.9-1.7-1-3.9-.1-5.4 1.3" />
    <path d="M9.4 12c-2.2 0-4.4-.9-5.4-2.6-.7 2.4.4 5 2.6 5.9-2.2.9-3.3 3.5-2.6 5.9 1.7-1 3.9-.1 5.4 1.3" />
  </Icon>
)

export const GearIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
  </Icon>
)

export const PencilIcon = (p) => (
  <Icon {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7.5 18.5 3 20l1.5-4.5Z" />
  </Icon>
)

export const ChevronDown = (p) => (
  <Icon {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
)

export const ChevronRight = (p) => (
  <Icon {...p}>
    <path d="m9 6 6 6-6 6" />
  </Icon>
)

export const PlusIcon = (p) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)

export const LockIcon = (p) => (
  <Icon {...p}>
    <rect x="4" y="10.5" width="16" height="10.5" rx="3.2" />
    <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
  </Icon>
)

export const CheckIcon = (p) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
)

export const XIcon = (p) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
)

export const TrashIcon = (p) => (
  <Icon {...p}>
    <path d="M4 7h16" />
    <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
    <path d="M6.5 7 7.4 19a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9L17.5 7" />
  </Icon>
)

export const ClockIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </Icon>
)

export const BellIcon = (p) => (
  <Icon {...p}>
    <path d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5Z" />
    <path d="M13.7 19a2 2 0 0 1-3.4 0" />
  </Icon>
)

export const CameraIcon = (p) => (
  <Icon {...p}>
    <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2a2 2 0 0 0 1.7-.9l.6-1A1.5 1.5 0 0 1 11.4 3h1.2a1.5 1.5 0 0 1 1.4 1.1l.6 1a2 2 0 0 0 1.7.9h1.2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5Z" />
    <circle cx="12" cy="12.5" r="3.4" />
  </Icon>
)

export const PhoneIcon = (p) => (
  <Icon {...p}>
    <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4 1.5v3A2.5 2.5 0 0 1 17.5 20 14.5 14.5 0 0 1 4 6.5a2.5 2.5 0 0 1 2.5-3Z" />
  </Icon>
)

export const DownloadIcon = (p) => (
  <Icon {...p}>
    <path d="M12 4v10" />
    <path d="m8 11 4 4 4-4" />
    <path d="M4.5 17.5A2 2 0 0 0 6.5 20h11a2 2 0 0 0 2-2.5" />
  </Icon>
)

export const MilkIcon = (p) => (
  <Icon {...p}>
    <path d="M9.5 3h5v2.2l1.6 3.1V19a2 2 0 0 1-2 2H9.9a2 2 0 0 1-2-2V8.3L9.5 5.2Z" />
    <path d="M8.2 12h7.6" />
  </Icon>
)

export const MoonIcon = (p) => (
  <Icon {...p}>
    <path d="M20 14.5A8.2 8.2 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" />
  </Icon>
)

export const SyringeIcon = (p) => (
  <Icon {...p}>
    <path d="m14 4 6 6" />
    <path d="m17 7-8.5 8.5L5 19l-2-2 1.5-3.5L13 5" />
    <path d="m10.5 8.5 2 2M12.5 6.5l2 2M8.5 10.5l2 2" />
  </Icon>
)

export const NoteIcon = (p) => (
  <Icon {...p}>
    <path d="M5 4.5h14v11l-4.5 4.5H5Z" />
    <path d="M19 15.5h-4.5V20" />
    <path d="M8.5 9h7M8.5 12.5h4" />
  </Icon>
)

export const ScheduleIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5.2l3.2 1.9" />
  </Icon>
)
