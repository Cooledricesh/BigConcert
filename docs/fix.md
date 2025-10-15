# BigConcert 문서 업데이트 계획

## 개요
프로젝트 문서의 일관성을 높이고 개발 과정에서의 혼선을 방지하기 위한 문서 업데이트 계획입니다.
제안사항 중 "설정값 관리 방안"은 현재대로 하드코딩한 상태로 유지합니다.

## 우선순위별 수정 사항

### 🔴 긴급 (Critical) - 즉시 수정 필요

#### 1. 예약 조회 시 비밀번호 검증 로직 불일치 수정
**파일**: `005/spec.md`
**문제점**:
- 본문: "입력된 비밀번호를 해시 처리하여 검증" ✅ (올바름)
- SQL 예시: `b.password_hash = $2` ❌ (잘못됨 - 평문 비교)

**수정 방안**:
```sql
-- 기존 (잘못된 예시)
WHERE b.phone_number = $1
  AND b.password_hash = $2  -- 이 부분 삭제

-- 수정안
WHERE b.phone_number = $1
-- 비밀번호 검증은 애플리케이션 레벨에서 bcrypt.compare() 사용
```

**구현 방법**:
1. 전화번호로 예약 정보 조회
2. 애플리케이션 코드에서 `bcrypt.compare(inputPassword, storedHash)` 실행
3. 검증 실패 시 적절한 에러 메시지 반환

---

### 🟡 중요 (High) - 개발 시작 전 수정 권장

#### 2. API 명세 용어 통일
**영향 파일**: 모든 `spec.md` 파일
**문제점**: `id`, `concert_id`, `booking_id` 등 혼용

**통일 규칙**:
- **Naming Convention**: `camelCase` 사용
- **ID 필드명 규칙**:
  - 단독 사용: `id` (해당 리소스 자체의 ID)
  - 참조 사용: `{resourceName}Id` (예: `concertId`, `seatId`, `bookingId`)
- **응답 필드**: 모두 `camelCase`로 통일

**변경 예시**:
```json
// 기존
{
  "concert_id": 1,
  "total_price": 50000,
  "booking_id": "B12345"
}

// 수정
{
  "concertId": 1,
  "totalPrice": 50000,
  "bookingId": "B12345"
}
```

#### 3. 유스케이스 트리거 수정
**파일**: `002/spec.md`
**수정 내용**: 트리거 섹션에서 "예약하기 버튼 클릭" 항목 삭제
- 예약하기 버튼은 상세 조회의 결과물
- 클릭 시 `003/spec.md` (좌석 선택) 기능으로 이동

---

### 🟢 개선 (Medium) - MVP 이후 고려

#### 4. 동시성 제어 UX 개선 방안 추가
**파일**: `003/spec.md`, `004/spec.md`
**추가 섹션**: "향후 확장 가능성"

**내용**:
```markdown
### 향후 확장 가능성

#### 좌석 임시 선점 기능
현재 MVP에서는 트랜잭션과 Row Lock을 통해 데이터 정합성을 보장합니다.
향후 사용자 경험 개선을 위해 다음 기능을 고려할 수 있습니다:

- **임시 선점 시간**: 좌석 선택 후 10분간 독점
- **자동 해제**: 10분 내 예약 미완료 시 자동 해제
- **실시간 업데이트**: WebSocket을 통한 좌석 상태 실시간 반영
- **선점 연장**: 추가 시간이 필요한 경우 1회 연장 가능
```

#### 5. 시간대 처리 정책 명시
**파일**: `database.md`, `001/spec.md`
**추가 섹션**: "시스템 시간대 정책"

**내용**:
```markdown
### 시스템 시간대 정책

#### 기본 원칙
- **기준 시간대**: 한국 표준시(KST, UTC+9)
- **저장 형식**: `TIMESTAMP WITH TIME ZONE`
- **API 통신**: ISO 8601 형식 (예: `2024-12-31T20:00:00+09:00`)

#### 구현 가이드라인
- 데이터베이스 서버 시간대: KST 설정
- 애플리케이션 서버: KST로 초기화
- 클라이언트: 사용자 로컬 시간대로 표시, 서버 통신 시 KST 변환

#### 주의사항
- `NOW()` 함수 사용 시 서버 시간대 확인 필수
- 날짜 비교 연산 시 시간대 고려
- 일광절약시간(DST)는 한국에서 미적용
```

#### 6. 예약 완료 후 뒤로가기 방지 구현 상세화
**파일**: `006/spec.md`
**추가 내용**: 기술 구현 방법 구체화

**내용**:
```markdown
### 뒤로가기 방지 구현

#### 브라우저 히스토리 조작
```javascript
// 예약 완료 후 실행
history.replaceState(null, '', '/booking/complete');

// 또는 React Router 사용 시
navigate('/booking/complete', { replace: true });
```

#### 페이지 이탈 경고
```javascript
useEffect(() => {
  const handleBeforeUnload = (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = '';
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasUnsavedChanges]);
```

#### 세션 스토리지 활용
- 예약 진행 상태를 세션 스토리지에 저장
- 완료 후 해당 데이터 삭제
- 뒤로가기로 재진입 시 상태 확인 후 리다이렉트
```

---

## 실행 계획

### Phase 1: 긴급 수정 (즉시)
- [x] `005/spec.md` 비밀번호 검증 로직 수정 ✅ (2025-10-15 완료)

### Phase 2: 중요 수정 (개발 시작 전)
- [x] 모든 `spec.md` 파일의 API 용어 통일 ✅ (2025-10-15 완료)
- [x] `002/spec.md` 트리거 항목 수정 ✅ (2025-10-15 완료)

### Phase 3: 개선 사항 (MVP 개발 중/후)
- [x] `003/spec.md`, `004/spec.md` 향후 확장 섹션 추가 ✅ (2025-10-15 완료)
- [x] `database.md`, `001/spec.md` 시간대 정책 추가 ✅ (2025-10-15 완료)
- [x] `006/spec.md` 구현 상세 추가 ✅ (2025-10-15 완료)

## 문서 업데이트 시 체크리스트

- [ ] 수정 사항이 다른 문서와 일관성 있는지 확인
- [ ] API 명세 변경 시 프론트엔드/백엔드 영향도 확인
- [ ] 데이터베이스 스키마 변경 시 migration 파일 확인
- [ ] 비즈니스 로직 변경 시 엣지 케이스 재검토
- [ ] 각 문서의 버전 히스토리 업데이트

## 작업 완료 현황

### 📊 진행 상태 요약
- **완료**: 6개 항목 (100%)
- **보류**: 0개 항목 (0%)
- **완료일**: 2025-10-15

### ✅ 완료된 수정 사항

#### Phase 1 (긴급)
1. **005/spec.md** - 비밀번호 검증 로직 수정
   - SQL WHERE 절에서 평문 비교 제거
   - 애플리케이션 레벨 bcrypt.compare() 사용 명시

#### Phase 2 (중요)
1. **모든 spec.md 파일** - API 명세 용어 통일
   - 모든 API 요청/응답 필드를 snake_case에서 camelCase로 변환
   - 001/spec.md ~ 006/spec.md 파일의 API 명세 통일
   - 예: `concert_id` → `concertId`, `total_price` → `totalPrice`

2. **002/spec.md** - 트리거 항목 수정
   - "예약하기 버튼 클릭" 항목 삭제

#### Phase 3 (개선)
1. **003/spec.md, 004/spec.md** - 동시성 제어 UX 개선
   - 좌석 임시 선점 기능 상세 추가 (10분 타임아웃, WebSocket, Redis TTL)

2. **database.md, 001/spec.md** - 시스템 시간대 정책
   - 한국 표준시(KST, UTC+9) 기준 명시
   - NOW() 함수 사용 시 주의사항 포함

3. **006/spec.md** - 뒤로가기 방지 로직
   - history.replaceState() 구체적 구현
   - useBlockBack 커스텀 훅 예시 추가

### ✨ 추가 완료된 사항
- **API 명세 용어 통일** - 모든 spec.md 파일에 대한 camelCase 전환 완료
  - `.ruler/AGENTS.md` 가이드라인에 따라 일관된 명명 규칙 적용
  - 프론트엔드/백엔드 간 일관성 확보

## 참고 사항

- 설정값(좌석 등급별 가격, 좌석 범위 등)은 현재 하드코딩 상태 유지
- MVP 범위를 벗어나는 기능은 "향후 확장" 섹션으로 분리
- 문서 수정 시 한국어 UTF-8 인코딩 확인 필수