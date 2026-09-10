// PrepModule — the one place that lists public products, subjects, and people.
// Landing pages hard-code the same ids for now; the request forms validate against this file.
// Ids are the only thing that travels in URLs (spec p.12): never names, emails, or messages.
window.PM = {
  // Where "Send my request" posts. Empty = not connected: the form shows a clear failure and sends nothing.
  // Any endpoint that accepts a JSON POST works — Formspree, a Google Apps Script web app, or your own server.
  submit: { endpoint: '' },

  contact: '[contact@domain]',

  // Text the form produces at runtime, per language. Static copy lives in the page (src/strings).
  i18n: {
    en: {
      selectGrade: 'Select grade', chooseTz: 'Choose your time zone', chooseArea: 'Choose an area', chooseAp: 'Choose your AP subject',
      expertAdm: 'Not sure yet — suggest one', expertTut: 'None — let our team suggest', expertNone: 'Choose a service first',
      labelExpertAdm: 'Preferred expert', labelExpertTut: 'Interested tutor',
      helpExpertAdm: 'Naming an officer records your preference. Availability is confirmed afterwards — if they can’t take a session soon, we’ll say so and suggest an alternative.',
      helpExpertTut: 'Naming a tutor records your interest. It isn’t an assignment — our team confirms availability and fit, and you choose from the shortlist.',
      helpMsgAdm: 'Where you stand, what you’re weighing, or one specific decision. Rough is fine.',
      helpMsgTut: 'Current level (a score, a practice test, or none yet), your goal or test date, and how you like to learn. Rough is fine.',
      helpMsgNone: 'Rough is fine — a few sentences is plenty.',
      names: { admissions: 'Admissions conversation', sat: 'SAT tutoring', ap: 'AP tutoring' },
      rowService: 'Service', rowArea: 'Area', rowAp: 'AP subject', notChosen: 'Not chosen yet', notSure: 'Not sure yet', noneYet: 'None yet', change: 'Change',
      noticeService: '“{v}” isn’t a service we offer. Choose one to start.',
      noticeArea: '“{v}” isn’t a SAT area we list — choose one below.',
      noticeAp: '“{v}” isn’t in our AP subject list — choose one below, or “Not listed” and describe the course.',
      noticeExpert: 'The profile “{v}” isn’t available for this selection, so the expert field was left empty. Naming someone is optional.',
      required: 'This field is required.', emailMsg: 'Enter an email address like name@example.com — it’s how we reply.',
      errOne: '1 field needs attention.', errMany: '{n} fields need attention.', sending: 'Sending…',
      failNotConnected: 'This form isn’t connected to our inbox yet, so nothing was sent. Your answers are still here — please email us at {contact} in the meantime.',
      failGeneric: 'We couldn’t send your request. Nothing was lost — your answers are still here. Please try again, or email us at {contact}.',
      doneExpertAdm: 'Not sure yet — we’ll suggest', doneExpertTut: 'None — our team will suggest'
    },
    ko: {
      selectGrade: '학년 선택', chooseTz: '시간대 선택', chooseArea: '영역 선택', chooseAp: 'AP 과목 선택',
      expertAdm: '아직 모르겠어요 — 추천해 주세요', expertTut: '없음 — 운영팀 추천에 맡길게요', expertNone: '서비스를 먼저 골라 주세요',
      labelExpertAdm: '희망 전문가', labelExpertTut: '관심 있는 튜터',
      helpExpertAdm: '사정관을 적으면 희망 사항으로 기록됩니다. 일정은 그 뒤에 확인하고, 당분간 어렵다면 그렇게 말씀드리고 다른 분을 제안합니다.',
      helpExpertTut: '튜터를 적으면 관심 표시로 기록됩니다. 배정은 아닙니다. 운영팀이 가능 여부와 적합성을 확인하고, 선택은 후보 중에서 직접 하십니다.',
      helpMsgAdm: '지금 위치, 고민 중인 것, 아니면 결정 하나. 대강 적어도 괜찮습니다.',
      helpMsgTut: '현재 수준(점수, 모의고사, 아직 없음), 목표나 시험 날짜, 선호하는 학습 방식. 대강 적어도 괜찮습니다.',
      helpMsgNone: '대강 적어도 괜찮습니다. 몇 문장이면 충분합니다.',
      names: { admissions: '입학사정관 상담', sat: 'SAT 튜터링', ap: 'AP 튜터링' },
      rowService: '서비스', rowArea: '영역', rowAp: 'AP 과목', notChosen: '아직 선택 안 함', notSure: '아직 모르겠어요', noneYet: '아직 없음', change: '변경',
      noticeService: '‘{v}’은(는) 저희가 제공하는 서비스가 아닙니다. 하나를 골라 시작해 주세요.',
      noticeArea: '‘{v}’은(는) 저희 SAT 영역 목록에 없습니다. 아래에서 골라 주세요.',
      noticeAp: '‘{v}’은(는) AP 과목 목록에 없습니다. 아래에서 고르거나 ‘목록에 없음’을 선택하고 과목을 설명해 주세요.',
      noticeExpert: '‘{v}’ 프로필은 이 선택에서 이용할 수 없어 전문가 칸을 비워 두었습니다. 이름은 적지 않아도 됩니다.',
      required: '필수 항목입니다.', emailMsg: 'name@example.com 형식의 이메일을 적어 주세요. 답장은 이메일로 드립니다.',
      errOne: '확인이 필요한 항목이 1개 있습니다.', errMany: '확인이 필요한 항목이 {n}개 있습니다.', sending: '보내는 중…',
      failNotConnected: '이 신청서는 아직 저희 메일함에 연결되지 않아 아무것도 전송되지 않았습니다. 적으신 내용은 그대로 남아 있습니다. 우선 {contact}로 메일 주세요.',
      failGeneric: '신청을 보내지 못했습니다. 적으신 내용은 그대로 남아 있습니다. 다시 시도하시거나 {contact}로 메일 주세요.',
      doneExpertAdm: '아직 미정 — 추천해 드립니다', doneExpertTut: '없음 — 운영팀이 추천합니다'
    }
  },

  officers: [
    { id: 'ao-1', name: '[Name]', name_ko: '[이름]', meta: '[University] · [Role in admissions]', meta_ko: '[대학] · [입학처 직무]' },
    { id: 'ao-2', name: '[Name]', name_ko: '[이름]', meta: '[University] · [Role in admissions]', meta_ko: '[대학] · [입학처 직무]' }
  ],

  tutors: [
    { id: 'sat-1', subject: 'sat', match: ['rw', 'math'], name: '[Name]', name_ko: '[이름]', meta: 'Reading & Writing · Math' },
    { id: 'sat-2', subject: 'sat', match: ['rw'],         name: '[Name]', name_ko: '[이름]', meta: 'Reading & Writing' },
    { id: 'sat-3', subject: 'sat', match: ['math'],       name: '[Name]', name_ko: '[이름]', meta: 'Math' },
    { id: 'ap-1',  subject: 'ap',  match: ['calculus-ab', 'calculus-bc', 'statistics'],        name: '[Name]', name_ko: '[이름]', meta: 'Calculus · Statistics' },
    { id: 'ap-2',  subject: 'ap',  match: ['physics-1', 'physics-c-mechanics', 'chemistry'],   name: '[Name]', name_ko: '[이름]', meta: 'Physics · Chemistry' },
    { id: 'ap-3',  subject: 'ap',  match: ['english-language', 'english-literature', 'us-history'], name: '[Name]', name_ko: '[이름]', meta: 'English · US History' }
  ],

  satAreas: [
    { id: 'rw',     label: 'Reading & Writing' },
    { id: 'math',   label: 'Math' },
    { id: 'both',   label: 'Both sections', label_ko: '두 영역 모두' },
    { id: 'unsure', label: "Not sure yet — help me decide", label_ko: '아직 모르겠어요 — 함께 정해 주세요' }
  ],

  // DEC (spec p.11): replace with the subjects you can actually staff before launch. Keep ids in sync with tutoring/ap/.
  apSubjects: [
    { id: 'calculus-ab',        label: 'Calculus AB',                       group: 'Math & computer science', group_ko: '수학 · 컴퓨터과학' },
    { id: 'calculus-bc',        label: 'Calculus BC',                       group: 'Math & computer science', group_ko: '수학 · 컴퓨터과학' },
    { id: 'statistics',         label: 'Statistics',                        group: 'Math & computer science', group_ko: '수학 · 컴퓨터과학' },
    { id: 'computer-science-a', label: 'Computer Science A',                group: 'Math & computer science', group_ko: '수학 · 컴퓨터과학' },
    { id: 'physics-1',          label: 'Physics 1',                         group: 'Sciences', group_ko: '과학' },
    { id: 'physics-c-mechanics',label: 'Physics C: Mechanics',              group: 'Sciences', group_ko: '과학' },
    { id: 'chemistry',          label: 'Chemistry',                         group: 'Sciences', group_ko: '과학' },
    { id: 'biology',            label: 'Biology',                           group: 'Sciences', group_ko: '과학' },
    { id: 'english-language',   label: 'English Language & Composition',    group: 'English & history', group_ko: '영어 · 역사' },
    { id: 'english-literature', label: 'English Literature & Composition',  group: 'English & history', group_ko: '영어 · 역사' },
    { id: 'us-history',         label: 'US History',                        group: 'English & history', group_ko: '영어 · 역사' },
    { id: 'world-history',      label: 'World History: Modern',             group: 'English & history', group_ko: '영어 · 역사' },
    { id: 'european-history',   label: 'European History',                  group: 'English & history', group_ko: '영어 · 역사' },
    { id: 'microeconomics',     label: 'Microeconomics',                    group: 'Social sciences', group_ko: '사회과학' },
    { id: 'macroeconomics',     label: 'Macroeconomics',                    group: 'Social sciences', group_ko: '사회과학' },
    { id: 'psychology',         label: 'Psychology',                        group: 'Social sciences', group_ko: '사회과학' },
    { id: 'us-government',      label: 'US Government & Politics',          group: 'Social sciences', group_ko: '사회과학' },
    { id: 'other',              label: 'Not listed — I\'ll describe it below', label_ko: '목록에 없음 — 아래에 설명할게요', group: 'Other', group_ko: '기타' }
  ],

  grades: [
    { id: 'g8-',  label: 'Grade 8 or below', label_ko: '8학년 이하' },
    { id: 'g9',   label: 'Grade 9', label_ko: '9학년' },
    { id: 'g10',  label: 'Grade 10', label_ko: '10학년' },
    { id: 'g11',  label: 'Grade 11', label_ko: '11학년' },
    { id: 'g12',  label: 'Grade 12', label_ko: '12학년' },
    { id: 'gap',  label: 'Gap year / transfer / other', label_ko: '갭이어 · 편입 · 기타' }
  ],

  // Fallback when the browser can't list IANA zones itself
  timeZones: ['Asia/Seoul', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Singapore', 'Asia/Kolkata', 'Asia/Dubai',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Toronto', 'America/Vancouver', 'America/Sao_Paulo', 'Australia/Sydney', 'Pacific/Auckland', 'UTC']
};
