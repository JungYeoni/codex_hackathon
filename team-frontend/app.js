const appState = { expertRequested: false, answered: false };
const questions = [
  ['01 · 필수 조건', '배터리 성능(최대 용량) 화면을 캡처해서 보내주실 수 있을까요?'],
  ['02 · 위험 확인', '침수나 사설 수리, 부품 교체 이력이 있었는지 궁금합니다.'],
  ['03 · 직거래 점검', '직거래 때 카메라·충전·스피커·터치 기능을 확인해봐도 될까요?'],
];
const checks = [
  ['예산 적합성', '확인됨', '420,000원 · 입력 예산 550,000원 이하'],
  ['외관 상태', '부분 확인', '생활 기스 언급 · 모서리 사진은 더 필요해요'],
  ['구성품', '확인됨', '박스와 충전 케이블이 설명에 포함돼 있어요'],
  ['배터리 성능', '미확인', '배터리 상태 화면 또는 수치가 없어요'],
  ['수리·침수 이력', '미확인', '게시글 설명과 사진에서 확인되지 않아요'],
];

function toast(message) {
  const node = document.getElementById('toast');
  if (!node) return;
  node.textContent = message;
  node.classList.add('show');
  window.setTimeout(() => node.classList.remove('show'), 2500);
}

function setScore(score, decision, description) {
  const scoreNode = document.getElementById('score');
  if (!scoreNode) return;
  scoreNode.textContent = String(score);
  document.querySelector('.score-ring').style.background = `conic-gradient(var(--lime) ${score}%,#dce3d7 0)`;
  document.getElementById('decisionText').textContent = decision;
  document.getElementById('decisionDescription').textContent = description;
}

document.querySelectorAll('.category-card, .tag').forEach(button => button.addEventListener('click', () => {
  if (button.classList.contains('category-card')) {
    document.querySelectorAll('.category-card').forEach(card => card.classList.remove('selected'));
  }
  button.classList.toggle('selected');
}));

function attachListingEvents(entry) {
  entry.querySelector('.file-input')?.addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;
    entry.querySelector('.upload-title').textContent = file.name;
    entry.querySelector('.upload-help').textContent = '캡처가 추가됐어요 · 분석 준비 완료';
    entry.querySelector('.upload-zone').style.borderColor = '#17251e';
    toast('캡처를 불러왔어요. 설명과 함께 분석할게요.');
  });
}

function addListing() {
  const list = document.getElementById('listingList');
  const index = list.querySelectorAll('.listing-entry').length + 1;
  const entry = document.createElement('article');
  entry.className = 'listing-entry';
  entry.innerHTML = `<div class="listing-entry-head"><div><span>매물 ${String(index).padStart(2, '0')}</span><strong>${index}번째 비교 후보</strong></div><button class="remove-listing" type="button">이 매물 제외</button></div><div class="listing-layout"><div class="listing-input"><label class="upload-zone"><input type="file" accept="image/*" class="file-input" /><span class="upload-icon">↑</span><strong class="upload-title">판매글 캡처를 올려주세요</strong><small class="upload-help">PNG, JPG · 여러 장 가능</small></label><label class="description-label">판매자 설명<textarea class="listing-description" placeholder="판매자가 작성한 설명을 붙여넣어 주세요."></textarea></label></div><div class="listing-preview compact"><div class="listing-image"><div class="listing-phone"><i></i><span>NEW<br />ITEM</span></div><div class="shine"></div></div><div><p class="preview-label">COMPARISON LISTING</p><h3>새 비교 매물</h3><p class="price">가격 정보 입력 전</p><span class="market-chip">캡처를 올리면 분석해요</span></div></div></div>`;
  entry.querySelector('.remove-listing').addEventListener('click', () => { entry.remove(); toast('비교 목록에서 제외했어요.'); });
  list.append(entry);
  attachListingEvents(entry);
  entry.scrollIntoView({ behavior: 'smooth', block: 'center' });
  toast(`${index}번째 비교 매물을 추가했어요.`);
}

if (document.getElementById('listingList')) {
  document.querySelectorAll('.listing-entry').forEach(attachListingEvents);
  document.getElementById('addListing').addEventListener('click', addListing);
  document.getElementById('demoFill').addEventListener('click', () => {
    document.querySelector('.listing-description').value = '아이폰 14 프로 딥퍼플 256기가입니다. 23년 3월 구매했고 케이스 끼고 써서 깨진 곳 없어요. 생활기스 조금 있고 박스랑 충전 케이블 있습니다. 직거래 선호합니다.';
    toast('예시 매물 정보를 다시 채웠어요.');
  });
  document.getElementById('analyzeButton').addEventListener('click', () => {
    localStorage.setItem('salpeobomListingCount', String(document.querySelectorAll('.listing-entry').length));
  });
}

function renderAnalysis() {
  const count = Math.max(1, Number(localStorage.getItem('salpeobomListingCount')) || 2);
  document.getElementById('listingCount').textContent = String(count);
  document.getElementById('comparisonCards').innerHTML = Array.from({ length: count }, (_, index) => {
    const first = index === 0;
    const score = first ? 76 : 72 - index;
    return `<article class="comparison-card ${first ? 'selected' : ''}"><span>매물 ${String(index + 1).padStart(2, '0')}</span><strong>${first ? '아이폰 14 Pro · 42만 원' : `비교 후보 ${String(index + 1).padStart(2, '0')}`}</strong><p>${first ? '예산 적합 · 수리 이력 미확인' : '설명 입력됨 · 사진 분석 대기'}</p><b>${score}점</b></article>`;
  }).join('');
  document.getElementById('checklist').innerHTML = checks.map(([title, status, evidence]) => {
    const kind = status === '확인됨' ? 'good' : status === '부분 확인' ? 'partial' : 'unknown';
    return `<div class="check-item"><div class="check-top"><span>${title}</span><span class="status ${kind}">${status}</span></div><p class="evidence">${evidence}</p></div>`;
  }).join('');
  document.getElementById('questions').innerHTML = questions.map(([priority, content]) => `<div class="question"><small>${priority}</small><p>${content}</p></div>`).join('');
}

if (document.getElementById('comparisonCards')) {
  renderAnalysis();
  document.getElementById('requestExpert').addEventListener('click', () => {
    document.getElementById('expertTrigger').classList.add('hidden');
    document.getElementById('expertFlow').classList.remove('hidden');
  });
  document.getElementById('closeExpert').addEventListener('click', () => {
    document.getElementById('expertFlow').classList.add('hidden');
    document.getElementById('expertTrigger').classList.remove('hidden');
  });
  document.getElementById('submitExpert').addEventListener('click', () => {
    appState.expertRequested = true;
    document.querySelector('.expert-request').classList.add('hidden');
    document.getElementById('expertReply').classList.remove('hidden');
    setScore(80, '조건부 추천', 'AI 분석과 전문가 의견을 합쳤어요. 배터리와 수리 이력만 확인되면 더 안전해요.');
    toast('민준 전문가의 의견이 도착했어요.');
  });
  document.getElementById('adoptExpert').addEventListener('click', event => {
    event.currentTarget.textContent = '답변 채택 완료 · +20 크레딧';
    event.currentTarget.disabled = true;
    toast('답변을 채택했어요. 전문가에게 20 크레딧이 지급됩니다.');
  });
  document.getElementById('applyReply').addEventListener('click', () => {
    if (!document.getElementById('sellerReply').value.trim()) { toast('판매자 답변을 먼저 입력해주세요.'); return; }
    checks[3] = ['배터리 성능', '확인됨', '판매자 답변: 배터리 성능 89%'];
    checks[4] = ['수리·침수 이력', '확인됨', '판매자 답변: 수리·침수 이력 없음'];
    setScore(appState.expertRequested ? 92 : 89, '추천', '핵심 조건이 확인됐어요. 직거래에서 기능만 마지막으로 점검해보세요.');
    renderAnalysis();
    toast('판매자 답변을 반영해 구매 적합도가 올라갔어요.');
  });
  document.getElementById('copyQuestions').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(questions.map(([, content]) => content).join('\n\n')); toast('판매자에게 보낼 질문을 복사했어요.'); }
    catch { toast('질문을 선택해서 복사해주세요.'); }
  });
  document.getElementById('completeButton').addEventListener('click', () => toast('직거래 전, 카메라 · 충전 · 스피커 · 화면 터치를 확인하세요.'));
}
