// PrepModule — the one place that lists public products, programs, and people.
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
      selectGrade: 'Select grade', chooseTz: 'Choose your time zone', chooseProgram: 'Choose a program',
      expertAdm: 'Not sure yet — suggest one', expertTut: 'None — let our team suggest', expertNone: 'Choose a service first',
      labelExpertAdm: 'Preferred expert', labelExpertTut: 'Interested tutor',
      helpExpertAdm: 'Naming an officer records your preference. Availability is confirmed afterwards — if they can’t take a session soon, we’ll say so and suggest an alternative.',
      helpExpertTut: 'Naming a tutor records your interest. It isn’t an assignment — our team confirms availability and fit, and you choose from the shortlist.',
      helpMsgAdm: 'Where you stand, what you’re weighing, or one specific decision. Rough is fine.',
      helpMsgTut: 'Current level (a grade, a score, or a practice test), your goal or exam date, and how you like to learn. Rough is fine.',
      helpMsgNone: 'Rough is fine — a few sentences is plenty.',
      names: { admissions: 'Admissions conversation', tutoring: 'Subject tutoring' },
      rowService: 'Service', rowProgram: 'Program', rowSubject: 'Subject', notChosen: 'Not chosen yet', notSure: 'Not sure yet', noneYet: 'None yet', change: 'Change',
      noticeService: '“{v}” isn’t a service we offer. Choose one to start.',
      noticeProgram: '“{v}” isn’t a program we list — choose one below, or “Other or not sure”.',
      subjectRequired: 'Tell us the subject — for example “{ex}”.',
      noticeExpert: 'The profile “{v}” isn’t available for this selection, so the expert field was left empty. Naming someone is optional.',
      required: 'This field is required.', emailMsg: 'Enter an email address like name@example.com — it’s how we reply.',
      errOne: '1 field needs attention.', errMany: '{n} fields need attention.', sending: 'Sending…',
      failNotConnected: 'This form isn’t connected to our inbox yet, so nothing was sent. Your answers are still here — please email us at {contact} in the meantime.',
      failGeneric: 'We couldn’t send your request. Nothing was lost — your answers are still here. Please try again, or email us at {contact}.',
      doneExpertAdm: 'Not sure yet — we’ll suggest', doneExpertTut: 'None — our team will suggest'
    },
    ko: {
      selectGrade: '학년 선택', chooseTz: '시간대 선택', chooseProgram: '과정 선택',
      expertAdm: '아직 정하지 않았어요 — 운영팀 추천', expertTut: '없음 — 운영팀 추천', expertNone: '서비스를 먼저 골라 주세요',
      labelExpertAdm: '희망 전문가', labelExpertTut: '희망 튜터',
      helpExpertAdm: '사정관을 지정하면 희망 사항으로 기록돼요. 일정은 신청 후에 확인하고, 어려운 경우 다른 분을 제안해 드려요.',
      helpExpertTut: '튜터를 지정하면 희망 사항으로 기록돼요. 배정이 확정되는 건 아니고, 운영팀이 가능 여부와 적합성을 확인한 뒤 후보 가운데 직접 고르시면 돼요.',
      helpMsgAdm: '지금 준비 상황, 고민하는 부분, 또는 결정하지 못한 문제 하나. 간단히 적어도 돼요.',
      helpMsgTut: '현재 수준(학교 성적, 점수, 모의고사 결과 등), 목표나 시험 날짜, 선호하는 학습 방식. 간단히 적어도 돼요.',
      helpMsgNone: '간단히 적어도 돼요. 몇 문장이면 충분해요.',
      names: { admissions: '입학사정관 상담', tutoring: '교과 튜터링' },
      rowService: '서비스', rowProgram: '과정', rowSubject: '과목', notChosen: '선택 안 함', notSure: '미정', noneYet: '없음', change: '변경',
      noticeService: '‘{v}’은(는) 제공하지 않는 서비스예요. 아래에서 하나를 골라 주세요.',
      noticeProgram: '‘{v}’은(는) 목록에 없는 과정이에요. 아래에서 고르거나 ‘기타 · 잘 모르겠어요’를 선택해 주세요.',
      subjectRequired: '과목을 적어 주세요. 예: {ex}',
      noticeExpert: '‘{v}’ 프로필은 지금 선택에서 지정할 수 없어 비워 두었어요. 지정하지 않아도 돼요.',
      required: '필수 항목이에요.', emailMsg: 'name@example.com 형식으로 적어 주세요. 답장은 이메일로 드려요.',
      errOne: '확인이 필요한 항목이 1개 있어요.', errMany: '확인이 필요한 항목이 {n}개 있어요.', sending: '보내는 중…',
      failNotConnected: '이 신청서는 아직 접수 시스템에 연결되지 않아 전송되지 않았어요. 적으신 내용은 그대로 남아 있어요. 우선 {contact}로 메일을 보내 주세요.',
      failGeneric: '신청서를 보내지 못했어요. 적으신 내용은 그대로 남아 있어요. 다시 시도하거나 {contact}로 메일을 보내 주세요.',
      doneExpertAdm: '미정 — 운영팀이 추천해 드려요', doneExpertTut: '없음 — 운영팀이 추천해 드려요'
    }
  },

  officers: [
    { id: 'ao-1', name: '[Name]', name_ko: '[이름]', meta: '[University] · [Role in admissions]', meta_ko: '[대학] · [입학처 직무]' },
    { id: 'ao-2', name: '[Name]', name_ko: '[이름]', meta: '[University] · [Role in admissions]', meta_ko: '[대학] · [입학처 직무]' }
  ],

  // DEC: placeholder profiles. programs = the program ids each tutor teaches; keep in sync with tutoring/ (data-match).
  tutors: [
    { id: 'tu-1', programs: ['ib', 'alevel', 'igcse'],        name: '[Name]', name_ko: '[이름]', meta: 'Math · Physics',               meta_ko: '수학 · 물리' },
    { id: 'tu-2', programs: ['ap', 'sat'],                    name: '[Name]', name_ko: '[이름]', meta: 'Calculus · SAT Math',          meta_ko: '미적분 · SAT Math' },
    { id: 'tu-3', programs: ['sat', 'toefl', 'ap'],           name: '[Name]', name_ko: '[이름]', meta: 'English · Reading & Writing', meta_ko: '영어 · Reading & Writing' },
    { id: 'tu-4', programs: ['ib', 'alevel', 'igcse', 'ap'],  name: '[Name]', name_ko: '[이름]', meta: 'Chemistry · Biology',          meta_ko: '화학 · 생물' }
  ],

  // Programs on the tutoring page and the request form. required = the form asks for the subject before sending.
  // open = not tied to particular tutors (every tutor is offered); these also link back to the page without ?program=.
  // DEC: confirm the programs, boards and subjects you can staff before launch.
  programs: [
    { id: 'ap',     label: 'AP',      group: 'School curricula', group_ko: '학교 교과 과정', required: true,  ex: 'Calculus BC, Chemistry' },
    { id: 'ib',     label: 'IB',      group: 'School curricula', group_ko: '학교 교과 과정', required: true,  ex: 'Math AA HL, Physics SL' },
    { id: 'alevel', label: 'A-Level', group: 'School curricula', group_ko: '학교 교과 과정', required: true,  ex: 'Maths, Physics (Cambridge)' },
    { id: 'igcse',  label: 'IGCSE',   group: 'School curricula', group_ko: '학교 교과 과정', required: true,  ex: 'Chemistry (Edexcel), Additional Maths' },
    { id: 'sat',    label: 'SAT',     group: 'Tests', group_ko: '시험', required: false, ex: 'Math, Reading & Writing, or both', ex_ko: 'Math, Reading & Writing, 또는 둘 다' },
    { id: 'toefl',  label: 'TOEFL',   group: 'Tests', group_ko: '시험', required: false, ex: 'Speaking and Writing, or the whole test', ex_ko: 'Speaking과 Writing, 또는 전체' },
    { id: 'project',   label: 'Project building', label_ko: '프로젝트', group: 'Beyond the classroom', group_ko: '교과 밖', required: false, open: true, ex: 'a biology research project, an app, a portfolio piece', ex_ko: '생물 리서치 프로젝트, 앱 만들기, 포트폴리오 작업' },
    { id: 'mentoring', label: 'Mentoring',        label_ko: '멘토링',   group: 'Beyond the classroom', group_ko: '교과 밖', required: false, open: true, ex: 'study planning and habits for this term', ex_ko: '이번 학기 공부 계획과 습관 관리' },
    { id: 'other',  label: 'Other or not sure', label_ko: '기타 · 잘 모르겠어요', group: 'Other', group_ko: '기타', required: true, open: true, ex: 'the course or test name', ex_ko: '과목이나 시험 이름' }
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
