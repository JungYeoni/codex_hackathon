"use client";

import { ChangeEvent, useMemo, useState } from "react";

type Status = "verified" | "seller_claim" | "inferred" | "missing" | "uncertain" | "contradictory";

type Evidence = {
  label: string;
  value: string;
  status: Status;
  source?: string;
  note?: string;
};

type Listing = {
  id: string;
  title: string;
  price: number;
  platform: string;
  seller: string;
  age: string;
  images: number;
  fit: number;
  trust: number;
  evidence: Evidence[];
  risk: string;
};

const fieldWeights: Record<string, number> = {
  battery: 5,
  screen: 5,
  repair: 5,
  port: 4,
  storage: 3,
  accessories: 2,
};

const listings: Listing[] = [
  {
    id: "A",
    title: "iPhone 13 128GB 미드나이트",
    price: 438000,
    platform: "당근",
    seller: "김**",
    age: "2년식",
    images: 7,
    fit: 88,
    trust: 91,
    risk: "현재 확인 범위에서 핵심 상태가 충분히 확인됩니다.",
    evidence: [
      { label: "제품 모델", value: "iPhone 13", status: "verified", source: "image_1" },
      { label: "저장용량", value: "128GB", status: "verified", source: "image_2" },
      { label: "가격", value: "438,000원", status: "verified", source: "description" },
      { label: "배터리 성능", value: "89%", status: "verified", source: "image_3", note: "설정 화면에서 숫자 확인" },
      { label: "화면 상태", value: "깨끗함", status: "verified", source: "image_4" },
      { label: "후면 상태", value: "미세 생활기스", status: "seller_claim", source: "description" },
      { label: "모서리 상태", value: "특이사항 없음", status: "verified", source: "image_5" },
      { label: "카메라 렌즈", value: "확인됨", status: "verified", source: "image_6" },
      { label: "충전단자", value: "사진 확인", status: "verified", source: "image_7" },
      { label: "수리이력", value: "없음", status: "seller_claim", source: "description" },
      { label: "침수 여부", value: "확인 불가", status: "missing" },
      { label: "구성품", value: "본체 + 케이블", status: "seller_claim", source: "description" },
    ],
  },
  {
    id: "B",
    title: "iPhone 13 128GB 스타라이트",
    price: 390000,
    platform: "번개장터",
    seller: "박**",
    age: "2년식",
    images: 3,
    fit: 74,
    trust: 54,
    risk: "가장 저렴하지만 핵심 상태 정보가 부족해 가격 비교를 보류합니다.",
    evidence: [
      { label: "제품 모델", value: "iPhone 13", status: "verified", source: "image_1" },
      { label: "저장용량", value: "128GB", status: "seller_claim", source: "description" },
      { label: "가격", value: "390,000원", status: "verified", source: "description" },
      { label: "배터리 성능", value: "정보 없음", status: "missing" },
      { label: "화면 상태", value: "깨짐 없음", status: "contradictory", source: "image_2 + description", note: "설명과 사진 분석 결과가 일치하지 않음" },
      { label: "후면 상태", value: "양호", status: "seller_claim", source: "description" },
      { label: "모서리 상태", value: "확인 불가", status: "uncertain", source: "image_2", note: "하단부가 잘려 있음" },
      { label: "카메라 렌즈", value: "확인 불가", status: "missing" },
      { label: "충전단자", value: "사진 없음", status: "missing" },
      { label: "수리이력", value: "정보 없음", status: "missing" },
      { label: "침수 여부", value: "정보 없음", status: "missing" },
      { label: "구성품", value: "본체만", status: "seller_claim", source: "description" },
    ],
  },
  {
    id: "C",
    title: "iPhone 13 Pro 256GB 시에라 블루",
    price: 515000,
    platform: "당근",
    seller: "이**",
    age: "2년식",
    images: 5,
    fit: 81,
    trust: 76,
    risk: "배터리와 수리 이력 확인 후 비교를 확정할 수 있습니다.",
    evidence: [
      { label: "제품 모델", value: "iPhone 13 Pro", status: "verified", source: "image_1" },
      { label: "저장용량", value: "256GB", status: "verified", source: "image_1" },
      { label: "가격", value: "515,000원", status: "verified", source: "description" },
      { label: "배터리 성능", value: "82%로 추정", status: "inferred", source: "image_3", note: "화면 숫자가 흐려 확정할 수 없음" },
      { label: "화면 상태", value: "미세 스크래치", status: "verified", source: "image_2" },
      { label: "후면 상태", value: "양호", status: "verified", source: "image_4" },
      { label: "모서리 상태", value: "미세 찍힘", status: "verified", source: "image_4" },
      { label: "카메라 렌즈", value: "확인됨", status: "verified", source: "image_5" },
      { label: "충전단자", value: "확인 불가", status: "uncertain", source: "image_5" },
      { label: "수리이력", value: "없음", status: "seller_claim", source: "description" },
      { label: "침수 여부", value: "확인 불가", status: "missing" },
      { label: "구성품", value: "본체 + 박스", status: "seller_claim", source: "description" },
    ],
  },
];

const statusLabels: Record<Status, string> = {
  verified: "확인됨",
  seller_claim: "판매자 설명",
  inferred: "AI 추정",
  missing: "정보 없음",
  uncertain: "불명확",
  contradictory: "충돌",
};

function formatWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function isGap(status: Status) {
  return ["missing", "uncertain", "contradictory"].includes(status);
}

function ListingImage({ label, index, uploaded }: { label: string; index: number; uploaded?: string }) {
  return (
    <div className={`listing-image image-${index}`}>
      {uploaded ? <img src={uploaded} alt={`${label} 업로드 이미지`} /> : <><span className="image-tag">{label}</span><span className="phone-shape" /><span className="image-line" /></>}
      <span className="image-number">0{index}</span>
    </div>
  );
}

export default function Home() {
  const [activeListing, setActiveListing] = useState("A");
  const [budget] = useState(500000);
  const [purpose] = useState("개발·업무");
  const [locked, setLocked] = useState(true);
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [description, setDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const selected = listings.find((item) => item.id === activeListing) ?? listings[0];
  const gaps = useMemo(() => selected.evidence.filter((item) => isGap(item.status)), [selected]);
  const highImpactGaps = useMemo(() => gaps.sort((a, b) => (fieldWeights[a.label === "배터리 성능" ? "battery" : a.label === "화면 상태" ? "screen" : a.label === "수리이력" ? "repair" : a.label === "충전단자" ? "port" : a.label === "저장용량" ? "storage" : "accessories"] ?? 2) - (fieldWeights[b.label === "배터리 성능" ? "battery" : b.label === "화면 상태" ? "screen" : b.label === "수리이력" ? "repair" : b.label === "충전단자" ? "port" : b.label === "저장용량" ? "storage" : "accessories"] ?? 2)), [gaps]);

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 4);
    setUploaded(files.map((file) => URL.createObjectURL(file)));
    setToast(files.length ? `${files.length}장의 캡처를 분석 대기열에 추가했습니다.` : "");
  }

  function copyMessage() {
    const message = "안녕하세요. 구매를 고민하고 있어 몇 가지만 확인 부탁드립니다.\n\n1. 설정 > 배터리 > 배터리 성능 화면과 배터리 교체 이력을 확인할 수 있을까요?\n2. 충전단자와 하단 모서리 사진을 추가로 받을 수 있을까요?\n3. 수리 또는 부품 교체 이력이 있는지 궁금합니다.\n\n확인 후 빠르게 결정하겠습니다. 감사합니다.";
    navigator.clipboard?.writeText(message);
    setToast("판매자 질문 메시지를 복사했습니다.");
  }

  async function analyzeWithRunpod() {
    setIsAnalyzing(true);
    const form = new FormData();
    form.append("description", description);
    const files = document.querySelector<HTMLInputElement>("#listing-images")?.files;
    Array.from(files ?? []).forEach((file) => form.append("images", file));
    try {
      const response = await fetch("/api/analyze", { method: "POST", body: form });
      const result = await response.json() as { fallback?: boolean; message?: string };
      setToast(result.fallback ? `${result.message ?? "실제 분석을 사용할 수 없어"} 데모 결과를 표시합니다.` : "RunPod AI가 캡처를 분석했습니다. 룰 검증을 적용했습니다.");
    } catch {
      setToast("분석 API에 연결할 수 없어 데모 결과를 표시합니다.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">✓</span><span>usedcheck</span><span className="brand-beta">BETA</span></div>
        <div className="top-actions"><span className="saved-dot" /> 분석 저장됨 <button className="avatar">L</button></div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="side-eyebrow">MY CHECKLIST</div>
          <div className="profile-card"><div className="profile-icon">▣</div><div><strong>나의 구매 기준</strong><span>{locked ? "잠금됨 · 스마트폰" : "편집 중"}</span></div><button onClick={() => setLocked(!locked)} aria-label="구매 기준 잠금 변경">{locked ? "⌑" : "⌑"}</button></div>
          <nav className="side-nav"><button className="active"><span>◈</span> 매물 분석</button><button><span>▤</span> 비교 보관함 <small>3</small></button></nav>
          <div className="criteria-box"><div className="criteria-title">구매 기준 <span className="lock-label">{locked ? "잠금" : "편집"}</span></div><div className="criterion"><span>예산</span><strong>{formatWon(budget)} 이하</strong></div><div className="criterion"><span>용도</span><strong>{purpose}</strong></div><div className="criterion"><span>배터리</span><strong>85% 이상</strong></div><div className="criterion"><span>수리 이력</span><strong>없음 선호</strong></div><button className="edit-button" onClick={() => setLocked(!locked)}>{locked ? "기준 보기" : "기준 잠그기"}</button></div>
          <div className="side-footer"><div className="rule-icon">✦</div><div><strong>증거 기반 분석</strong><span>AI는 추출하고<br />룰이 판단합니다.</span></div></div>
        </aside>

        <section className="content">
          <div className="page-heading"><div><div className="breadcrumb">매물 분석 <span>/</span> 스마트폰</div><h1>중고 스마트폰, <em>근거 있게</em> 고르세요.</h1><p>캡처를 올리면 확인된 정보와 비어있는 정보를 나눠서 보여드려요.</p></div><label className="upload-button"><span>＋</span> 캡처 업로드<input type="file" accept="image/*" multiple onChange={handleUpload} /></label></div>

          {toast && <div className="toast" role="status">{toast}<button onClick={() => setToast("")}>닫기</button></div>}

          <div className="stepper"><div className="step done"><span>✓</span><div><small>STEP 01</small><strong>구매 기준</strong></div></div><div className="step-line done" /><div className="step active"><span>2</span><div><small>STEP 02</small><strong>매물 분석</strong></div></div><div className="step-line" /><div className="step"><span>3</span><div><small>STEP 03</small><strong>비교·결정</strong></div></div></div>

          <section className="upload-panel"><div className="panel-title"><div><span className="section-kicker">01 / ADD LISTING</span><h2>판매글 캡처를 추가하세요</h2></div><span className="input-hint">이미지 최대 10장 · JPG, PNG</span></div><label className="dropzone"><div className="drop-icon">↥</div><strong>판매글 화면을 여기에 끌어다 놓거나 클릭하세요</strong><span>사진 속 텍스트와 판매자 설명을 함께 분석해요</span><input id="listing-images" type="file" accept="image/*" multiple onChange={handleUpload} /></label>{uploaded.length > 0 && <div className="uploaded-strip">{uploaded.map((url, index) => <ListingImage key={url} label="업로드" index={index + 1} uploaded={url} />)}</div>}<textarea className="description-input" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="판매자가 작성한 상품 설명을 붙여넣으세요 (선택)" /><div className="source-row"><span>플랫폼</span><button className="source active">당근</button><button className="source">번개장터</button><button className="source">기타</button><span className="link-note">ⓘ 링크 연동은 준비 중이에요</span><button className="analyze-button" onClick={analyzeWithRunpod} disabled={isAnalyzing}>{isAnalyzing ? "AI 분석 중…" : "✦ RunPod AI로 분석"}</button></div></section>

          <div className="analysis-layout"><section className="results-panel"><div className="panel-title result-title"><div><span className="section-kicker">02 / EVIDENCE REVIEW</span><h2>확인된 증거를 검토하세요</h2></div><span className="analysis-status"><i /> 분석 완료 · 3개 매물</span></div><div className="listing-tabs">{listings.map((item) => <button key={item.id} className={activeListing === item.id ? "selected" : ""} onClick={() => setActiveListing(item.id)}><span className="tab-letter">{item.id}</span><span><strong>{item.title}</strong><small>{item.platform} · {formatWon(item.price)}</small></span><b className={item.trust < 60 ? "low" : ""}>{item.trust}</b></button>)}</div><div className="selected-card"><div className="selected-head"><div><span className="listing-label">매물 {selected.id} · {selected.platform}</span><h3>{selected.title}</h3><p>{selected.seller} 판매자 · {selected.age} · 사진 {selected.images}장</p></div><div className="price-block"><strong>{formatWon(selected.price)}</strong><span className={selected.price <= budget ? "under" : "over"}>{selected.price <= budget ? "예산 내" : "예산 초과"}</span></div></div><div className="image-grid">{[1, 2, 3, 4].map((number) => <ListingImage key={number} label={number === 1 ? "제품 정보" : number === 2 ? "화면" : number === 3 ? "배터리" : "외관"} index={number} />)}</div><div className="evidence-grid">{selected.evidence.map((item) => <div className="evidence-row" key={item.label}><span className="evidence-label">{item.label}</span><span className="evidence-value">{item.value}</span><span className={`status-badge ${item.status}`}>{statusLabels[item.status]}</span><span className="evidence-source">{item.source ? `⌁ ${item.source}` : "—"}</span></div>)}</div></div></section>

            <aside className="insight-column"><div className="score-card"><div className="score-heading"><span>비교 가능성</span><span className="info">i</span></div><div className="score-main"><strong>{selected.trust}</strong><span>/ 100</span><div className="score-ring" style={{ ["--score" as string]: `${selected.trust * 3.6}deg` }}><div /></div></div><div className="score-caption">{selected.trust >= 80 ? "비교 가능한 수준" : selected.trust >= 60 ? "일부 확인 필요" : "추가 확인 후 비교"}</div><div className="score-bar"><i style={{ width: `${selected.trust}%` }} /></div><p>제품 상태 점수가 아니라<br /><b>확인된 정보의 충분함</b>을 나타내요.</p></div><div className={`risk-card ${selected.trust < 60 ? "warning" : ""}`}><div className="risk-title"><span>{selected.trust < 60 ? "!" : "✓"}</span><strong>{selected.trust < 60 ? "가격 비교 보류" : "비교 전 확인"}</strong></div><p>{selected.risk}</p></div><div className="gap-card"><div className="gap-title"><span>⌁</span><div><strong>주요 정보 공백</strong><small>{gaps.length}개 항목 · 영향도 순</small></div></div>{highImpactGaps.slice(0, 3).map((gap, index) => <div className="gap-item" key={gap.label}><span>{index + 1}</span><div><strong>{gap.label}</strong><small>{gap.status === "contradictory" ? "설명과 사진이 충돌합니다" : gap.note ?? "판매자에게 확인이 필요합니다"}</small></div><b>{gap.label === "배터리 성능" || gap.label === "화면 상태" || gap.label === "수리이력" ? 5 : 4}</b></div>)}{gaps.length === 0 && <p className="empty-note">현재 주요 정보 공백이 없습니다.</p>}</div></aside></div>

          <section className="next-step"><div className="next-head"><div><span className="section-kicker">03 / NEXT ACTION</span><h2>판매자에게 이것부터 물어보세요</h2><p>의사결정 영향도 × 불확실성 × 답변 가능성을 기준으로 우선순위를 정했어요.</p></div><button className="copy-button" onClick={copyMessage}>▣ 질문 메시지 복사</button></div><div className="questions">{[{ n: 1, title: "배터리 성능 화면 + 교체 이력", desc: "설정 &gt; 배터리 &gt; 배터리 성능 화면과 배터리 교체 이력을 함께 확인해 주세요.", score: "매우 높음", tone: "high" }, { n: 2, title: "충전단자와 하단 모서리 사진", desc: "충전단자와 하단 모서리가 잘 보이는 사진을 추가로 받을 수 있을까요?", score: "높음", tone: "mid" }, { n: 3, title: "수리 또는 부품 교체 이력", desc: "공식·사설 수리나 부품 교체 이력이 있는지 궁금합니다.", score: "높음", tone: "mid" }].map((question) => <div className="question" key={question.n}><span className="question-number">0{question.n}</span><div><strong>{question.title}</strong><p>{question.desc}</p></div><span className={`priority ${question.tone}`}>{question.score}</span></div>)}</div></section>

          <footer className="app-footer"><span>USED CHECK / EVIDENCE-FIRST MARKETPLACE</span><span>분석 기준 v0.1 · 모든 정보는 출처와 함께 표시됩니다.</span></footer>
        </section>
      </div>
    </main>
  );
}
