export const ROLES = [
  { id: 'reporter',   label: 'Reporter',   desc: 'Report someone who needs help' },
  { id: 'helper',     label: 'Helper',     desc: 'Claim cases and find shelters' },
  { id: 'missionary', label: 'Missionary', desc: 'Update shelter bed counts' },
  { id: 'admin',      label: 'Admin',      desc: 'See cases, beds and gaps' },
] as const;