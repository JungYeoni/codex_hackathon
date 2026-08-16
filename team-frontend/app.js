const buywiseFavicon = document.createElement('link');
buywiseFavicon.rel = 'icon';
buywiseFavicon.type = 'image/svg+xml';
buywiseFavicon.href = './favicon.svg';
document.head.append(buywiseFavicon);
document.querySelectorAll('.brand').forEach(brand => {
  brand.innerHTML = '<img class="brand-logo" src="./buywise-logo.svg" alt="BuyWise" />';
  brand.setAttribute('aria-label', 'BuyWise 홈');
});

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

function toast(message) { const node = document.getElementById('toast'); if (!node) return; node.textContent = message; node.classList.add('show'); window.setTimeout(() => node.classList.remove('show'), 2500); }

document.querySelectorAll('.tag').forEach(button => button.addEventListener('click', () => button.classList.toggle('selected')));

function attachListingEvents(entry) {
  entry.querySelector('.file-input')?.addEventListener('change', event => {
    const file = event.target.files[0]; if (!file) return;
    entry.querySelector('.upload-title').textContent = file.name;
    entry.querySelector('.upload-help').textContent = '사진과 텍스트를 읽었어요 · 분석 준비 완료';
    entry.querySelector('.upload-zone').style.borderColor = '#17251e';
    toast('캡처 속 사진과 판매글 정보를 찾았어요.');
  });
}

function addListing() {
  const list = document.getElementById('listingList');
  const index = list.querySelectorAll('.listing-entry').length + 1;
  const entry = document.createElement('article');
  entry.className = 'listing-entry';
  entry.innerHTML = `<div class="listing-entry-head"><div><span>매물 ${String(index).padStart(2, '0')}</span><strong>${index}번째 비교 후보</strong></div><button class="remove-listing" type="button">이 매물 제외</button></div><div class="listing-layout"><div class="listing-input"><label class="upload-zone smart-upload"><input type="file" accept="image/*" class="file-input" /><span class="upload-icon">↑</span><strong class="upload-title">판매글 캡처를 올려주세요</strong><small class="upload-help">상품 사진 · 가격 · 판매자 설명을 함께 인식해요</small></label><label class="description-label">추가로 알고 있는 정보<textarea class="listing-description" placeholder="판매자에게 들은 내용이 있다면 추가해 주세요. (선택)"></textarea></label></div><aside class="photo-extract"><p class="eyebrow">AI PHOTO READ</p><h3>캡처에서 찾은 정보</h3><div class="extract-items"><span>상품 사진 인식 대기</span><span>가격 정보 추출 대기</span><span>설명 속 핵심 문장 추출</span></div></aside></div>`;
  entry.querySelector('.remove-listing').addEventListener('click', () => { entry.remove(); toast('비교 목록에서 제외했어요.'); });
  list.append(entry); attachListingEvents(entry); entry.scrollIntoView({ behavior: 'smooth', block: 'center' }); toast(`${index}번째 비교 매물을 추가했어요.`);
}

if (document.getElementById('listingList')) {
  document.querySelectorAll('.listing-entry').forEach(attachListingEvents);
  document.getElementById('addListing').addEventListener('click', addListing);
  document.getElementById('criteriaNext').addEventListener('click', () => localStorage.setItem('salpeobomListingCount', String(document.querySelectorAll('.listing-entry').length)));
}

function renderAnalysis() {
  const count = Math.max(1, Number(localStorage.getItem('salpeobomListingCount')) || 2);
  document.getElementById('listingCount').textContent = String(count);
  document.getElementById('comparisonCards').innerHTML = Array.from({ length: count }, (_, index) => {
    const first = index === 0; const score = first ? 76 : 72 - index;
    return `<article class="comparison-card ${first ? 'selected' : ''}"><span>${index + 1}순위 · 매물 ${String(index + 1).padStart(2, '0')}</span><strong>${first ? '아이폰 14 Pro · 42만 원' : `비교 후보 ${String(index + 1).padStart(2, '0')}`}</strong><p>${first ? '예산 적합 · 수리 이력 미확인' : '사진·설명 분석 완료'}</p><b>${score}점</b></article>`;
  }).join('');
  document.getElementById('questions').innerHTML = questions.map(([priority, content]) => `<div class="question"><small>${priority}</small><p>${content}</p></div>`).join('');
}

if (document.getElementById('comparisonCards')) {
  renderAnalysis();
  document.getElementById('termToggle').addEventListener('click', () => {
    const list = document.getElementById('termList'); const hidden = list.classList.toggle('hidden');
    document.getElementById('termToggle').innerHTML = hidden ? '용어 풀이 열기 <span>＋</span>' : '용어 풀이 닫기 <span>−</span>';
  });
  document.getElementById('copyQuestions').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(questions.map(([, content]) => content).join('\n\n')); toast('판매자에게 보낼 질문을 복사했어요.'); } catch { toast('질문을 선택해서 복사해주세요.'); }
  });
}

if (document.getElementById('applyReply')) {
  document.getElementById('applyReply').addEventListener('click', () => {
    if (!document.getElementById('sellerReply').value.trim()) { toast('판매자 답변을 먼저 입력해주세요.'); return; }
    document.getElementById('answerResult').classList.remove('hidden'); toast('답변을 반영해 구매 적합도를 업데이트했어요.');
  });
}

if (document.getElementById('submitExpert')) {
  document.getElementById('submitExpert').addEventListener('click', () => {
    document.querySelector('.expert-request').classList.add('hidden'); document.getElementById('expertReply').classList.remove('hidden'); toast('민준 전문가의 의견이 도착했어요.');
  });
}
