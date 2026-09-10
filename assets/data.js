// PrepModule — the one place that lists public products, subjects, and people.
// Landing pages hard-code the same ids for now; the request forms validate against this file.
// Ids are the only thing that travels in URLs (spec p.12): never names, emails, or messages.
window.PM = {
  // Where "Send my request" posts. Empty = not connected: the form shows a clear failure and sends nothing.
  // Any endpoint that accepts a JSON POST works — Formspree, a Google Apps Script web app, or your own server.
  submit: { endpoint: '' },

  contact: '[contact@domain]',

  officers: [
    { id: 'ao-1', name: '[Name]', meta: '[University] · [Role in admissions]' },
    { id: 'ao-2', name: '[Name]', meta: '[University] · [Role in admissions]' }
  ],

  tutors: [
    { id: 'sat-1', subject: 'sat', match: ['rw', 'math'], name: '[Name]', meta: 'Reading & Writing · Math' },
    { id: 'sat-2', subject: 'sat', match: ['rw'],         name: '[Name]', meta: 'Reading & Writing' },
    { id: 'sat-3', subject: 'sat', match: ['math'],       name: '[Name]', meta: 'Math' },
    { id: 'ap-1',  subject: 'ap',  match: ['calculus-ab', 'calculus-bc', 'statistics'],        name: '[Name]', meta: 'Calculus · Statistics' },
    { id: 'ap-2',  subject: 'ap',  match: ['physics-1', 'physics-c-mechanics', 'chemistry'],   name: '[Name]', meta: 'Physics · Chemistry' },
    { id: 'ap-3',  subject: 'ap',  match: ['english-language', 'english-literature', 'us-history'], name: '[Name]', meta: 'English · US History' }
  ],

  satAreas: [
    { id: 'rw',     label: 'Reading & Writing' },
    { id: 'math',   label: 'Math' },
    { id: 'both',   label: 'Both sections' },
    { id: 'unsure', label: "Not sure yet — help me decide" }
  ],

  // DEC (spec p.11): replace with the subjects you can actually staff before launch. Keep ids in sync with tutoring/ap/.
  apSubjects: [
    { id: 'calculus-ab',        label: 'Calculus AB',                       group: 'Math & computer science' },
    { id: 'calculus-bc',        label: 'Calculus BC',                       group: 'Math & computer science' },
    { id: 'statistics',         label: 'Statistics',                        group: 'Math & computer science' },
    { id: 'computer-science-a', label: 'Computer Science A',                group: 'Math & computer science' },
    { id: 'physics-1',          label: 'Physics 1',                         group: 'Sciences' },
    { id: 'physics-c-mechanics',label: 'Physics C: Mechanics',              group: 'Sciences' },
    { id: 'chemistry',          label: 'Chemistry',                         group: 'Sciences' },
    { id: 'biology',            label: 'Biology',                           group: 'Sciences' },
    { id: 'english-language',   label: 'English Language & Composition',    group: 'English & history' },
    { id: 'english-literature', label: 'English Literature & Composition',  group: 'English & history' },
    { id: 'us-history',         label: 'US History',                        group: 'English & history' },
    { id: 'world-history',      label: 'World History: Modern',             group: 'English & history' },
    { id: 'european-history',   label: 'European History',                  group: 'English & history' },
    { id: 'microeconomics',     label: 'Microeconomics',                    group: 'Social sciences' },
    { id: 'macroeconomics',     label: 'Macroeconomics',                    group: 'Social sciences' },
    { id: 'psychology',         label: 'Psychology',                        group: 'Social sciences' },
    { id: 'us-government',      label: 'US Government & Politics',          group: 'Social sciences' },
    { id: 'other',              label: 'Not listed — I\'ll describe it below', group: 'Other' }
  ],

  grades: [
    { id: 'g8-',  label: 'Grade 8 or below' },
    { id: 'g9',   label: 'Grade 9' },
    { id: 'g10',  label: 'Grade 10' },
    { id: 'g11',  label: 'Grade 11' },
    { id: 'g12',  label: 'Grade 12' },
    { id: 'gap',  label: 'Gap year / transfer / other' }
  ],

  // Fallback when the browser can't list IANA zones itself
  timeZones: ['Asia/Seoul', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Singapore', 'Asia/Kolkata', 'Asia/Dubai',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Toronto', 'America/Vancouver', 'America/Sao_Paulo', 'Australia/Sydney', 'Pacific/Auckland', 'UTC']
};
