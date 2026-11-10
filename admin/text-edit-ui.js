const descriptions = {
  student:{title:'학생 정보', example:'학생 이름을 입력하고 청구 방식을 실제 진행분으로 바꿔줘',
    add:'김가람 학생을 추가하고 이서진 선생님과 수업을 연결해줘'},
  teacher:{title:'선생님 정보', example:'선생님 이름을 입력하고 시간당 강사료를 40,000원으로 바꿔줘',
    add:'이서진 선생님 추가해줘. 수학 담당이고 시간당 강사료는 4만원이야'},
  enrollment:{title:'수업 조건', example:'12월 1일부터 수업 시간을 90분으로 바꿔줘',
    add:'김가람 학생을 이서진 선생님 수학 수업에 연결해줘'},
  session:{title:'수업 일정', example:'학생 이름을 입력하고 12월 4일, 6일 수업은 안 했다고 기록해줘'}
};

function creationDetails(changes,esc) {
  const groups=new Map();
  for (const row of changes) {
    if (!groups.has(row.label)) groups.set(row.label,[]);
    groups.get(row.label).push(row);
  }
  return [...groups].map(([label,rows])=>`<section class="text-create-group">
    <h4>${esc(label)}</h4><dl>${rows.map(row=>`<div><dt>${esc(row.field)}</dt><dd>${esc(row.after)}</dd></div>`).join('')}</dl>
  </section>`).join('');
}

export function createTextEditUI({esc,icon,modal,month,db,isStale,preview,post}) {
  let current;
  const find = selector => document.querySelector(selector);

  function start(spec) {
    current = {mode:'edit',...spec,month:month(),history:[],proposal:null};
    const {title,example,add} = descriptions[spec.scope];
    const isNew=current.mode==='create';
    return {
      title:title+(isNew?' 채팅으로 추가':' 채팅으로 수정'),
      content:`
        ${spec.targetLabel ? `<div class="text-edit-target">${esc(spec.targetLabel)}</div>` : ''}
        <div id="text-chat-log" class="text-chat-log" role="log" aria-label="채팅 대화"></div>
        <div id="text-edit-result" class="text-edit-result" aria-live="polite"></div>
        <form id="text-preview-form">
          <div class="field">
            <label for="text-edit-request">채팅 메시지</label>
            <textarea id="text-edit-request" name="request" maxlength="1000" rows="2" required aria-describedby="text-edit-help" placeholder="${esc(isNew?add:example)}"></textarea>
            <small id="text-edit-help">월을 생략하면 ${esc(current.month)} 기준입니다. 대화는 OpenAI로 보냅니다. 연락처·생년월일·계좌번호는 넣지 마세요.</small>
          </div>
        </form>
        <button type="button" class="text-btn" data-action="text-edit-reset">새 대화</button>
        <form id="text-apply-form"></form>`,
      footer:`<button class="btn" data-action="close">닫기</button>
        <button class="btn" type="submit" form="text-preview-form">${icon('arrow')}보내기</button>
        <button class="btn primary" id="text-edit-save" type="submit" form="text-apply-form" hidden>${icon('check')}${isNew?'네, 추가':'네, 저장'}</button>`
    };
  }

  function clearPreview() {
    if (!current) return;
    current.proposal = null;
    const result = find('#text-edit-result'), save = find('#text-edit-save');
    if (result) result.replaceChildren();
    if (save) save.hidden = true;
  }

  function addTurn(role,text) {
    const log=find('#text-chat-log');
    if(!log)return;
    const line=document.createElement('div');
    line.className='text-chat-turn '+role;
    const who=document.createElement('strong');
    who.textContent=role==='user'?'나':'PrepModule';
    const message=document.createElement('p');
    message.textContent=text;
    line.append(who,message);
    log.append(line);
    log.scrollTop=log.scrollHeight;
  }

  function reset() {
    if(!current)return;
    current.history=[];
    clearPreview();
    find('#text-chat-log')?.replaceChildren();
    const input=find('#text-edit-request');
    if(input){input.value='';input.focus();}
    const error=find('#modal-error');
    if(error)error.style.display='none';
  }

  function switchMode(mode) {
    const root = find('.modal');
    if (!root?.querySelector('[data-text-mode]')) return;
    for (const item of root.querySelectorAll('[data-text-pane]')) item.hidden = item.dataset.textPane !== mode;
    for (const button of root.querySelectorAll('[data-text-mode]')) {
      button.setAttribute('aria-pressed', String(button.dataset.textMode === mode));
    }
    const error = find('#modal-error');
    if (error) error.style.display = 'none';
    if (mode === 'text') find('#text-edit-request')?.focus();
  }

  async function review(text) {
    const editor = current;
    if (!editor || !text?.trim()) throw new Error('채팅 메시지를 입력해 주세요.');
    if (isStale() || editor.month !== month()) throw new Error('최신 내용을 불러온 뒤 다시 확인해 주세요.');
    if(editor.history.length>=16)throw new Error('대화가 길어졌습니다. 새 대화를 시작해 주세요.');
    clearPreview();
    const result = find('#text-edit-result'), input = find('#text-edit-request');
    const revision = db().revision;
    input.readOnly = true;
    result.textContent = '등록된 기록과 대조하고 있어요…';
    try {
      const response = await preview({
        scope:editor.scope, mode:editor.mode, targetId:editor.targetId ?? null, month:editor.month,
        revision, text, history:editor.history
      });
      if (editor !== current) return;
      if (response.revision !== db()?.revision || isStale()) throw new Error('데이터가 바뀌었습니다. 최신 내용을 불러와 다시 확인해 주세요.');
      if (!response.question && (!response.plan || !Array.isArray(response.changes) || !response.changes.length)) {
        throw new Error('확인할 변경안이 없습니다. 수정할 항목을 구체적으로 입력해 주세요.');
      }
      const reply=response.question || (editor.mode==='create'?'이 내용으로 추가할까요?':'이렇게 변경할까요?');
      editor.history.push({role:'user',text},{role:'assistant',text:reply});
      addTurn('user',text);
      addTurn('assistant',reply);
      input.value='';
      if(response.question){result.replaceChildren();return;}
      editor.proposal = response;
      const isNew=editor.mode==='create';
      result.innerHTML = `<div class="text-edit-review-head"><h3 tabindex="-1">${esc(reply)}</h3><p>고칠 내용이 있으면 채팅을 이어가세요.</p></div>
        ${isNew?creationDetails(response.changes,esc):`<div class="table-wrap"><table><thead><tr><th>대상 · 항목</th><th>현재</th><th>변경 후</th></tr></thead><tbody>
        ${response.changes.map(row=>`<tr><td><strong>${esc(row.label)}</strong><small>${esc(row.field)}</small></td><td>${esc(row.before)}</td><td><strong>${esc(row.after)}</strong></td></tr>`).join('')}
        </tbody></table></div>`}`;
      const save=find('#text-edit-save');
      save.hidden=false;save.disabled=false;
    } catch (error) {
      if (editor === current) result.replaceChildren();
      throw error;
    } finally {
      input.readOnly = false;
      if(editor===current)(result.querySelector('h3')||input).focus();
    }
  }

  return {
    clear:()=>{current=undefined;},
    button:scope=>`<button class="btn" data-action="text-edit-open" data-scope="${esc(scope)}">${icon('spark')}채팅으로 수정</button>`,
    open(scope) {
      if (!Object.hasOwn(descriptions,scope)) return;
      const spec = {scope};
      const editor = start(spec);
      modal(editor.title,'요청을 입력하고 저장할 내용을 확인하세요.',editor.content,editor.footer,'wide');
      find('#text-edit-request')?.focus();
    },
    inline(spec, content, footer) {
      const editor = start(spec);
      return {
        content:`<div class="text-edit-modes" aria-label="${spec.mode==='create'?'추가 방식':'수정 방식'}">
          <button type="button" class="btn" data-action="text-edit-mode" data-text-mode="manual" aria-pressed="true">직접 입력</button>
          <button type="button" class="btn" data-action="text-edit-mode" data-text-mode="text" aria-pressed="false">${icon('spark')}${spec.mode==='create'?'채팅으로 추가':'채팅으로 수정'}</button>
        </div><div data-text-pane="manual">${content}</div><div data-text-pane="text" hidden>${editor.content}</div>`,
        footer:`<div class="text-edit-actions" data-text-pane="manual">${footer}</div>
          <div class="text-edit-actions" data-text-pane="text" hidden>${editor.footer}</div>`
      };
    },
    switchMode,
    reset,
    input:event=>{
      if(event.target.id!=='text-edit-request')return;
      const save=find('#text-edit-save');
      if(save && !save.hidden)save.disabled=!!event.target.value.trim();
    },
    review,
    async apply() {
      const response = current?.proposal;
      if (!response) throw new Error('추가 또는 변경할 내용을 먼저 확인해 주세요.');
      if(find('#text-edit-request')?.value.trim())throw new Error('입력한 채팅 메시지를 먼저 보내주세요.');
      if (response.revision !== db()?.revision || isStale() || current.month !== month()) {
        clearPreview();
        throw new Error('데이터가 바뀌었습니다. 최신 내용을 불러와 다시 확인해 주세요.');
      }
      await post('text-edit',{plan:response.plan});
    }
  };
}
