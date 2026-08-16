"use client";

import { ChangeEvent, useMemo, useState } from "react";

type Step = 1 | 2 | 3;
type Listing = { id: number; files: File[]; description: string };
type Analysis = { score: number; decision: string; description: string; checks: Array<[string, string, string]>; questions: string[]; title: string; priceText: string; summary: string; result?: Record<string, unknown> };

const defaultDescription = "아이폰 14 프로 딥퍼플 256기가입니다. 23년 3월 구매했고 케이스 끼고 써서 깨진 곳 없어요. 생활기스 조금 있고 박스랑 충전 케이블 있습니다. 직거래 선호합니다.";
const defaultQuestions = [
  "배터리 성능(최대 용량) 화면을 캡처해서 보내주실 수 있을까요?",
  "침수나 사설 수리, 부품 교체 이력이 있었는지 궁금합니다.",
  "직거래 때 카메라·충전·스피커·터치 기능을 확인해봐도 될까요?",
];
const defaultChecks: Array<[string, string, string]> = [
  ["예산 적합성", "확인됨", "420,000원 · 입력 예산 550,000원 이하"],
  ["외관 상태", "부분 확인", "생활 기스 언급 · 모서리 사진은 더 필요해요"],
  ["구성품", "확인됨", "박스와 충전 케이블이 설명에 포함돼 있어요"],
  ["배터리 성능", "미확인", "배터리 상태 화면 또는 수치가 없어요"],
  ["수리·침수 이력", "미확인", "게시글 설명과 사진에서 확인되지 않아요"],
];
const fieldLabels: Record<string, string> = {
  model: "제품 모델", storage: "저장 용량", price: "가격", battery_health: "배터리 성능",
  screen_condition: "화면 상태", rear_condition: "후면 상태", corner_condition: "모서리 상태",
  camera_lens: "카메라 렌즈", charging_port: "충전 단자", speaker_microphone: "스피커·마이크",
  biometrics: "생체 인증", repair_history: "수리 이력", water_damage: "침수 여부",
  accessories: "구성품", warranty: "보증",
};

function formatPrice(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return `${value.toLocaleString("ko-KR")}원`;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/[^0-9]/g, ""));
    return Number.isFinite(parsed) && parsed > 0 ? `${parsed.toLocaleString("ko-KR")}원` : value;
  }
  return "가격 정보 없음";
}

function analysisFromResult(result: Record<string, unknown> | undefined, criteria: string): Analysis {
  if (!result) return { score: 76, decision: "조건부 추천", description: "핵심 조건은 대체로 맞지만, 구매 전 꼭 확인할 정보가 남아 있어요.", checks: defaultChecks, questions: defaultQuestions, title: "분석 결과 없음", priceText: "가격 정보 없음", summary: "분석 결과를 확인해주세요." };
  const evidence = Array.isArray(result.evidence) ? result.evidence as Array<{ field?: string; value?: string; status?: string; reason?: string }> : [];
  const statusText: Record<string, string> = { verified: "확인됨", seller_claim: "판매자 설명", inferred: "부분 확인", missing: "미확인", uncertain: "부분 확인", contradictory: "위험 신호" };
  const findEvidence = (field: string) => evidence.find((item) => item.field === field);
  const model = typeof result.model === "string" && result.model.trim() ? result.model.trim() : findEvidence("model")?.value?.trim() || "상품명 확인 필요";
  const priceText = formatPrice(result.price ?? findEvidence("price")?.value);
  const battery = findEvidence("battery_health");
  const checks = evidence.slice(0, 7).map((item) => [fieldLabels[item.field ?? ""] ?? item.field ?? "분석 항목", statusText[item.status ?? "missing"] ?? "미확인", item.reason ?? item.value ?? "근거를 확인해주세요."] as [string, string, string]);
  const gaps = evidence.filter((item) => ["missing", "uncertain", "contradictory"].includes(item.status ?? ""));
  const requiredBattery = Number(criteria.match(/배터리 성능\s*(\d+)%/)?.[1] ?? 0);
  const batteryValue = Number(battery?.value?.match(/\d+/)?.[0] ?? 0);
  const batteryBelowRequirement = requiredBattery > 0 && batteryValue > 0 && batteryValue < requiredBattery;
  const score = Math.max(48, Math.min(92, 88 - gaps.length * 6 - (batteryBelowRequirement ? 20 : 0)));
  const questionItems = evidence.filter((item) => ["missing", "uncertain", "contradictory", "seller_claim"].includes(item.status ?? ""));
  const questions = questionItems.slice(0, 3).map((item) => `${fieldLabels[item.field ?? ""] ?? item.field ?? "이 항목"}을 확인할 수 있을까요?`);
  const summary = battery?.value ? `배터리 ${battery.value} · ${statusText[battery.status ?? "missing"] ?? "미확인"}` : gaps.length ? "추가 확인 항목이 있어요" : "사진·설명 분석 완료";
  return { score, decision: batteryBelowRequirement || gaps.length > 2 ? "조건부 추천" : "추천", description: `${criteria} 기준으로 분석했어요. ${batteryBelowRequirement ? `배터리 성능이 기준(${requiredBattery}%)보다 낮아요.` : gaps.length ? "구매 전 확인할 정보가 남아 있어요." : "핵심 정보가 대부분 확인됐어요."}`, checks: checks.length ? checks : defaultChecks, questions: questions.length ? questions : defaultQuestions, title: model, priceText, summary, result };
}

function getPreview(file: File) { return URL.createObjectURL(file); }

export default function Home() {
  const [step, setStep] = useState<Step>(1);
  const [category, setCategory] = useState("스마트폰");
  const [purpose, setPurpose] = useState("일상·학업용");
  const [budget, setBudget] = useState("550000");
  const [tags, setTags] = useState(["배터리 성능 85% 이상", "수리 이력 없음"]);
  const [listings, setListings] = useState<Listing[]>([{ id: 1, files: [], description: "" }]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expertRequested, setExpertRequested] = useState(false);
  const [expertAdopted, setExpertAdopted] = useState(false);
  const [sellerReply, setSellerReply] = useState("");
  const [toast, setToast] = useState("");
  const [activeNav, setActiveNav] = useState("new-analysis");

  const criteria = useMemo(() => `목적: ${purpose} · 예산: ${Number(budget || 0).toLocaleString("ko-KR")}원 이하 · 필수: ${tags.join(", ")}`, [purpose, budget, tags]);
  const firstAnalysis = analyses[0] ?? analysisFromResult(undefined, criteria);

  function showToast(message: string) { setToast(message); window.setTimeout(() => setToast(""), 2500); }
  function toggleTag(tag: string) { setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]); }
  function updateListing(id: number, changes: Partial<Listing>) { setListings((current) => current.map((listing) => listing.id === id ? { ...listing, ...changes } : listing)); }
  function handleFiles(id: number, event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setListings((current) => current.map((listing) => listing.id === id ? {
      ...listing,
      files,
      // The initial text is only a demo. Do not send it alongside a real upload.
      description: files.length && listing.description === defaultDescription ? "" : listing.description,
    } : listing));
    if (files.length) showToast(`${files.length}장의 캡처를 추가했어요.`);
  }
  function addListing() { setListings((current) => [...current, { id: Date.now(), files: [], description: "" }]); showToast("비교할 매물을 추가했어요."); }
  function removeListing(id: number) { setListings((current) => current.filter((listing) => listing.id !== id)); }

  async function analyzeListings() {
    setIsAnalyzing(true);
    const next: Analysis[] = [];
    const nextListings = listings.map((listing) => ({ ...listing }));
    for (const listing of listings) {
      const form = new FormData();
      form.append("category", category);
      form.append("criteria", criteria);
      form.append("description", listing.description);
      listing.files.forEach((file) => form.append("images", file));
      try {
        const response = await fetch("/api/analyze", { method: "POST", body: form });
        const payload = await response.json() as { result?: Record<string, unknown>; fallback?: boolean; invalidListing?: boolean; message?: string; missing?: string[] };
        if (payload.invalidListing) {
          setIsAnalyzing(false);
          showToast(payload.message ?? "업로드한 사진과 선택한 카테고리가 달라 분석할 수 없어요.");
          return;
        }
        if (payload.fallback) {
          showToast(payload.message ?? `분석 설정을 확인해주세요${payload.missing?.length ? `: ${payload.missing.join(", ")}` : ""}`);
        }
        const extractedDescription = typeof payload.result?.extracted_description === "string"
          ? payload.result.extracted_description.trim()
          : "";
        const listingIndex = nextListings.findIndex((item) => item.id === listing.id);
        if (!listing.description.trim() && extractedDescription && listingIndex >= 0) {
          nextListings[listingIndex].description = extractedDescription;
          showToast("캡처에서 판매자 설명을 추출했어요.");
        }
        next.push(analysisFromResult(payload.result, criteria));
      } catch {
        next.push(analysisFromResult(undefined, criteria));
      }
    }
    setListings(nextListings);
    setAnalyses(next);
    setStep(3);
    setIsAnalyzing(false);
    showToast("매물 분석이 완료됐어요.");
  }

  function applySellerReply() {
    if (!sellerReply.trim()) { showToast("판매자 답변을 먼저 입력해주세요."); return; }
    setAnalyses((current) => current.map((analysis) => ({ ...analysis, score: Math.min(97, analysis.score + 13), decision: "추천", description: "판매자 답변을 반영했어요. 직거래에서 기능만 마지막으로 점검해보세요.", checks: analysis.checks.map((check, index) => index > 2 ? [check[0], "확인됨", `판매자 답변: ${sellerReply.slice(0, 70)}`] : check) as Array<[string, string, string]> })));
    showToast("판매자 답변을 반영해 구매 적합도가 올라갔어요.");
  }

  async function copyQuestions() { try { await navigator.clipboard.writeText(firstAnalysis.questions.join("\n\n")); showToast("판매자에게 보낼 질문을 복사했어요."); } catch { showToast("질문을 선택해서 복사해주세요."); } }

  return <main className="app-shell">
    <nav className="topbar"><button className="brand ghost-button" onClick={() => { setActiveNav("new-analysis"); setStep(1); }}><span className="brand-mark">S</span>살펴봄</button><div className="nav-progress"><span className="pulse" />{step === 1 ? "구매 판단을 더 선명하게" : step === 2 ? "여러 후보를 함께 비교해요" : "구매 판단을 더 선명하게"}</div><span className="page-label">{step === 1 ? "구매 기준" : step === 2 ? "매물 등록" : "비교 판단"}</span></nav>
    <div className="app-body"><aside className="app-sidebar"><div className="sidebar-caption">WORKSPACE</div><div className="sidebar-profile"><span className="sidebar-avatar">S</span><div><strong>살펴봄</strong><small>개인 구매 판단</small></div><span className="sidebar-status" /></div><nav className="sidebar-nav"><button className={activeNav === "new-analysis" ? "active" : ""} onClick={() => { setActiveNav("new-analysis"); setStep(1); }}><span>＋</span> 새 구매 분석</button><button className={activeNav === "compare" ? "active" : ""} onClick={() => { setActiveNav("compare"); setStep(3); }}><span>▦</span> 비교상품 모아보기 <b>{listings.length}</b></button><button className={activeNav === "expert" ? "active" : ""} onClick={() => { setActiveNav("expert"); setStep(3); setExpertRequested(true); }}><span>✦</span> 전문가 답변</button><button className={activeNav === "criteria" ? "active" : ""} onClick={() => { setActiveNav("criteria"); setStep(1); }}><span>⚙</span> 내 구매 기준</button></nav><div className="sidebar-section-title">최근 비교상품</div><button className="saved-listing" onClick={() => { setActiveNav("compare"); setStep(3); }}><span className="saved-thumb">14</span><span><strong>iPhone 14 Pro</strong><small>42만 원 · 조건부 추천</small></span><b>76</b></button><button className="saved-listing" onClick={() => { setActiveNav("compare"); setStep(3); }}><span className="saved-thumb laptop">⌘</span><span><strong>MacBook Air M1</strong><small>68만 원 · 확인 필요</small></span><b>72</b></button><button className="sidebar-add" onClick={() => { setActiveNav("new-analysis"); setStep(2); }}>＋ 비교상품 추가</button><div className="sidebar-bottom"><span className="rule-badge">✦</span><span><strong>근거 기반 분석</strong><small>AI가 추출하고<br />룰이 판단합니다.</small></span></div></aside><div className="app-main">
    {step === 1 && <section className="hero compact-hero"><div className="hero-copy"><p className="eyebrow">SECONDHAND DECISION ASSISTANT</p><h1>중고 거래,<br /><em>감</em> 대신 근거로.</h1><p className="hero-description">내게 중요한 기준부터 정하면, 여러 매물도 흔들리지 않고 비교할 수 있어요.</p></div><div className="hero-card"><p className="card-kicker">HOW IT WORKS</p><div className="hero-steps"><span>기준 설정</span><span>매물 등록</span><span>비교 판단</span></div></div></section>}
    <section className="workspace single-page"><section className="stage">
      {step === 1 && <div className="panel active"><div className="panel-heading"><p className="eyebrow">STEP 01</p><h2>어떤 물건을 찾고 있나요?</h2><p>이 기준은 이후 모든 매물 비교에 동일하게 적용됩니다.</p></div><div className="category-grid">{[["스마트폰", "◒", "아이폰 · 갤럭시"], ["노트북", "⌘", "개발 · 학업용"], ["악기", "♫", "기타 · 키보드"], ["기타", "＋", "카메라 · 게임기 등"]].map(([name, icon, desc]) => <button key={name} className={`category-card ${category === name ? "selected" : ""}`} onClick={() => setCategory(name)}><span>{icon}</span><strong>{name}</strong><small>{desc}</small></button>)}</div><div className="criteria-grid"><label>구매 목적<select value={purpose} onChange={(event) => setPurpose(event.target.value)}><option>일상·학업용</option><option>입문용</option><option>업무·전문 작업용</option><option>되팔기용</option></select></label><label>최대 예산<div className="input-suffix"><input type="number" value={budget} onChange={(event) => setBudget(event.target.value)} min="0" /><span>원</span></div></label></div><fieldset><legend>절대 포기할 수 없는 조건 <span>복수 선택</span></legend><div className="tag-options">{["배터리 성능 85% 이상", "수리 이력 없음", "정품 구성품 보유", "직거래 가능", "생활 기스 이하"].map((tag) => <button key={tag} className={`tag ${tags.includes(tag) ? "selected" : ""}`} onClick={() => toggleTag(tag)}>{tag}</button>)}</div></fieldset><button className="primary-button page-next" onClick={() => setStep(2)}>매물 등록으로 가기 <span>→</span></button></div>}
      {step === 2 && <div className="panel active"><div className="panel-heading"><p className="eyebrow">STEP 02</p><h2>비교할 매물을 모아주세요.</h2><p>판매글 캡처만 올려도 AI가 사진 속 판매자 설명을 읽어 자동으로 채워드려요.</p></div><div className="listing-list">{listings.map((listing, index) => <article className="listing-entry" key={listing.id}><div className="listing-entry-head"><div><span>매물 {String(index + 1).padStart(2, "0")}</span><strong>{index === 0 ? "첫 번째 후보" : `${index + 1}번째 비교 후보`}</strong></div>{index === 0 ? <small>분석 비교 대상에 자동 추가</small> : <button className="remove-listing" onClick={() => removeListing(listing.id)}>이 매물 제외</button>}</div><div className="listing-layout"><div className="listing-input"><label className="upload-zone"><input type="file" accept="image/*" multiple onChange={(event) => handleFiles(listing.id, event)} /><span className="upload-icon">↑</span><strong>{listing.files.length ? `${listing.files.length}장의 캡처가 추가됐어요` : "판매글 캡처를 올려주세요"}</strong><small>{listing.files.length ? "분석 준비 완료" : "PNG, JPG · 여러 장 가능"}</small></label><label className="description-label">판매자 설명<textarea value={listing.description} onChange={(event) => updateListing(listing.id, { description: event.target.value })} placeholder="캡처에서 추출한 판매자 설명이 여기에 자동으로 채워져요. 필요하면 직접 수정할 수 있어요." /></label></div><div className="listing-preview"><div className="listing-image">{listing.files[0] ? <img src={getPreview(listing.files[0])} alt="업로드한 판매글 캡처" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div className="listing-phone"><i /><span>14<br />PRO</span></div>}<div className="shine" /></div><div><p className="preview-label">{listing.files.length ? "UPLOADED LISTING" : "DEMO LISTING"}</p><h3>{listing.files.length ? "업로드한 판매글" : index === 0 ? <>아이폰 14 Pro<br />256GB 딥퍼플</> : "새 비교 매물"}</h3><p className="price">{listing.files.length ? "분석 후 실제 가격 표시" : index === 0 ? "420,000원" : "가격 정보 입력 전"}</p><span className="market-chip">{listing.files.length ? "캡처 분석 준비 완료" : "캡처를 올리면 분석해요"}</span></div></div></div></article>)}</div><div className="listing-actions"><button className="add-listing" onClick={addListing}>＋ 비교할 매물 더 추가</button><button className="text-button" onClick={() => updateListing(listings[0].id, { description: defaultDescription })}>예시 매물 정보 다시 불러오기</button></div><button className="primary-button page-next" onClick={analyzeListings} disabled={isAnalyzing}>{isAnalyzing ? "AI가 분석 중이에요…" : "매물 비교 분석하기"} <span>↗</span></button></div>}
      {step === 3 && <div className="panel active"><section className="comparison-summary"><div><p className="eyebrow">MULTI-LISTING COMPARE</p><h3><span>{listings.length}</span>개 매물을 같은 기준으로 비교했어요.</h3></div><div className="comparison-cards">{listings.map((_, index) => { const analysis = analyses[index]; return <article className={`comparison-card ${index === 0 ? "selected" : ""}`} key={index}><span>매물 {String(index + 1).padStart(2, "0")}</span><strong>{analysis ? `${analysis.title} · ${analysis.priceText}` : `비교 후보 ${String(index + 1).padStart(2, "0")}`}</strong><p>{analysis?.summary ?? "분석 결과를 불러오는 중이에요"}</p><b>{analysis?.score ?? "-"}점</b></article>; })}</div></section><div className="result-header"><div><p className="eyebrow">STEP 03 · ANALYSIS COMPLETE</p><h2>1순위 매물은 <em>{firstAnalysis.decision}</em>이에요.</h2><p>{firstAnalysis.description}</p></div><div className="score-ring" style={{ background: `conic-gradient(var(--lime) ${firstAnalysis.score}%,#dce3d7 0)` }}><span>{firstAnalysis.score}</span><small>/ 100</small><b>구매 적합도</b></div></div>{!expertRequested ? <section className="expert-trigger"><div className="expert-orbit">✦</div><div><p className="eyebrow">EXPERT SIGNAL</p><h3>사진만으로 확신하기 어려운 항목이 있어요.</h3><p>수리 이력과 가격 적정성은 실거래 경험이 있는 전문가의 의견을 받아보면 더 선명해져요.</p></div><button className="expert-button" onClick={() => setExpertRequested(true)}>전문가 의견 받기 <span>→</span></button></section> : <section className="expert-flow"><div className="expert-flow-head"><div><p className="eyebrow">EXPERT REVIEW</p><h3>민준 전문가의 조건부 추천</h3></div><button className="close-expert" onClick={() => setExpertRequested(false)}>×</button></div><div className="expert-flow-grid"><article className="expert-profile"><div className="avatar">M</div><div><span className="online-dot">답변 가능</span><h4>민준 · {category} 중고 거래 전문가</h4><p>답변 채택률 94% · 평균 18분</p></div><div className="profile-tags"><span>{category}</span><span>시세·상태</span><span>광고·협찬 없음</span></div></article><div className="expert-reply" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}><div className="opinion-grid"><div><b>사실 확인</b><p>설명상 구성품과 외관 정보는 평균적인 중고 매물 수준입니다.</p></div><div><b>경험 기반 조언</b><p>현재 가격은 나쁘지 않지만, 핵심 상태 확인 후 구매를 권합니다.</p></div><div><b>추가 확인 필요</b><p>사설 수리 여부와 기능 테스트는 판매자에게 꼭 확인하세요.</p></div></div><div className="expert-actions"><span>이 답변을 채택하면 전문가에게 <strong>+20 크레딧</strong>이 지급됩니다.</span><button className="adopt-button" onClick={() => { setExpertAdopted(true); showToast("답변을 채택했어요. 전문가에게 20 크레딧이 지급됩니다."); }}>{expertAdopted ? "답변 채택 완료 · +20 크레딧" : "도움됐어요 · 답변 채택"}</button></div></div></div></section>}<div className="result-grid"><article className="checklist-card"><div className="card-title"><h3>1순위 매물 체크리스트</h3><span>근거 포함</span></div>{firstAnalysis.checks.map(([title, status, evidence]) => <div className="check-item" key={title}><div className="check-top"><span>{title}</span><span className={`status ${status === "확인됨" ? "good" : status === "부분 확인" ? "partial" : "unknown"}`}>{status}</span></div><p className="evidence">{evidence}</p></div>)}</article><article className="question-card"><div className="card-title"><h3>판매자에게 먼저 물어볼 것</h3><span className="count-badge">{firstAnalysis.questions.length}</span></div>{firstAnalysis.questions.map((question, index) => <div className="question" key={question}><small>0{index + 1} · {index === 0 ? "필수 조건" : "위험 확인"}</small><p>{question}</p></div>)}<button className="copy-button" onClick={copyQuestions}>질문 한 번에 복사</button></article></div><section className="reply-box"><div><p className="eyebrow">ANSWER UPDATE</p><h3>판매자 답변을 받았나요?</h3><p>답변을 붙여넣으면 체크리스트와 판단이 업데이트돼요.</p></div><div className="reply-controls"><textarea value={sellerReply} onChange={(event) => setSellerReply(event.target.value)} placeholder="예: 배터리 성능은 89%이고, 수리한 적 없어요. 직거래 때 기능 확인 가능합니다." /><button className="secondary-button" onClick={applySellerReply}>답변 반영하기</button></div></section><div className="next-actions"><button className="text-button" onClick={() => setStep(2)}>매물 다시 추가</button><button className="primary-button" onClick={() => showToast("직거래 전, 카메라 · 충전 · 스피커 · 화면 터치를 확인하세요.")}>구매 전 최종 점검 보기 <span>→</span></button></div></div>}
    </section></section><footer>살펴봄 · 중고 거래를 위한 개인 구매 판단 도우미</footer></div></div><div className={`toast ${toast ? "show" : ""}`} role="status">{toast}</div>
  </main>;
}
