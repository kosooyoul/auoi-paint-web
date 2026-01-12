# auoi-paint-web Tasks & Suggestions

## Current State
- ✅ Core painting tools (pen, eraser, shapes, fill, picker, selection, lasso, text)
- ✅ Undo/Redo (50 steps)
- ✅ Fill tolerance slider (0-60)
- ✅ Copy/Cut/Paste with positioning
- ✅ Save as PNG
- ✅ Keyboard shortcuts help modal
- ✅ Canvas resize functionality (Scale/Crop modes)
- ✅ Zoom & Pan (10%-500%, Ctrl+Wheel, Space+drag)

## Suggested Next Tasks (Priority Order)

### 0. [CRITICAL] Canvas-Centric UX Redesign 🎯
**Why:** 현재 UI가 윈도우95처럼 구식 - 고정 툴바가 캔버스 공간 낭비, 그리는 영역을 가림
**Effort:** High (8-10 hours)
**Value:** Very High - 모던 페인트 툴의 핵심 경험
**Philosophy:**
- **캔버스가 주인공** - 전체 화면 활용 (90%+)
- **UI는 최소화** - 필요할 때만, 방해하지 않음
- **자유로운 작업 공간** - 드래그 가능한 플로팅 툴박스

**Scope:**

1. **Floating Toolbox (드래그 가능 패널)**
   - 현재 고정 toolbar → 플로팅 패널로 전면 재설계
   - 드래그로 화면 내 자유롭게 이동 (pointerdown/move/up)
   - 최소화/펼치기 토글 버튼
   - 반투명 배경 (backdrop-filter: blur)
   - 도구별 그룹핑: Drawing / Shapes / Selection / Edit / Color
   - localStorage에 위치 저장 (재방문 시 같은 위치)

2. **Full Canvas View**
   - 고정 Header 제거 또는 최소화 (제목만 왼쪽 상단 작게, 플로팅)
   - Status bar 제거 또는 플로팅으로 변경
   - 캔버스가 화면의 90% 이상 차지
   - 배경은 심플 (단색 또는 미묘한 그라디언트)

3. **Emoji Icons (깔끔한 아이콘)**
   - 모든 버튼 아이콘을 이모지로 교체
   - 🖊️ Pen, 🧹 Eraser, 🪣 Fill, 💧 Picker, ⬚ Select, ⚬ Lasso, T Text
   - 버튼 스타일 단순화 (이모지가 메인, 텍스트 라벨 최소화)
   - 짜치는 아이콘 대신 이모지가 훨씬 깔끔

4. **Zoom & Pan (확대/축소/이동) - CRITICAL**
   - Zoom controls: + / - 버튼, Fit to screen 버튼
   - 마우스 휠로 zoom (Ctrl+Wheel 또는 Wheel)
   - Space + 드래그로 pan (손 도구)
   - Zoom level 표시 (25%, 50%, 100%, 200% 등)
   - Canvas transform 또는 CSS scale 사용
   - 좌표 변환 로직 (화면 좌표 → 캔버스 좌표)

5. **Keyboard Shortcuts Enhancement**
   - **Tab**: 툴박스 숨기기/보이기 (전체 화면)
   - **Space** (hold): Pan mode (손 도구)
   - **Ctrl+0**: Fit to screen (100% zoom, 중앙 정렬)
   - **Ctrl + / Ctrl -**: Zoom in/out
   - **Z**: Zoom tool toggle

**Design Reference:**
- **Procreate** (iPad) - 플로팅 툴 패널, 캔버스 중심
- **Figma** - 미니멀 UI, 드래그 가능한 패널
- **Photoshop** - 이동 가능한 도구 팔레트

**Files:**
- `index.html` - 플로팅 구조로 HTML 재구성
- `styles.css` - 플로팅 스타일, 드래그 시각적 피드백, 캔버스 전체 화면
- `main.js` - 드래그 로직, zoom/pan 구현, 좌표 변환 계산

**Technical Challenges:**
- Canvas zoom 구현 (CSS transform vs canvas drawImage scale)
- Pan offset 계산 및 제한 (캔버스 밖으로 못 나가게)
- Zoom 시 drawing 좌표 변환 (screen → canvas)
- 드래그 가능한 툴박스 (충돌 방지, 화면 밖으로 못 나가게)
- 성능 최적화 (zoom/pan 시 requestAnimationFrame)

**Verification:**
- ✅ 캔버스가 화면의 90% 이상 차지
- ✅ 툴박스를 화면 어디든 드래그 가능
- ✅ Zoom in/out 부드럽게 작동 (25% ~ 400%)
- ✅ Pan 후 좌표 정확도 (그리기, 선택 등)
- ✅ 툴박스 최소화 시 캔버스 더 넓어짐
- ✅ 이모지 아이콘으로 깔끔한 느낌
- ✅ Space + 드래그로 pan 작동
- ✅ Tab으로 툴박스 숨기기/보이기
- ✅ 모든 도구가 Zoom 상태에서 정확히 작동

**Done when:**
- 고정 툴바가 완전히 제거됨
- 플로팅 툴박스가 드래그 가능
- Zoom/Pan이 정확하고 부드러움
- 캔버스가 작업 공간의 주인공
- UI가 캔버스를 방해하지 않음
- 윈도우95 느낌 완전히 탈피, 모던 페인트 툴 경험

---

### 0.1. [COMPLETED] ~~UI Refinement & Visual Polish~~
**Status:** ✅ Completed but needs redesign (2026-01-09)
- CSS variable system implemented (colors, shadows, transitions)
- Modern purple-blue gradient color palette
- Enhanced button states with hover/active/disabled effects
- Premium canvas styling with checkered background
- **Issue:** 고정 툴바가 캔버스 공간 차지, Canvas-Centric 재설계 필요 (Task #0)

### 1. [COMPLETED] ~~Keyboard Shortcuts Help UI~~
**Status:** ✅ Completed (2026-01-08)
- Help button added to toolbar
- Modal with organized sections (Tools, Shapes, Edit, Help)
- Keyboard toggle with ? or H key
- Clean kbd styling

### 2. [COMPLETED] ~~Canvas Resize Functionality~~
**Status:** ✅ Completed (2026-01-08)
- Width/Height input fields (100-2000px range)
- Resize button with Scale/Crop mode options
- Working implementation verified

### 3. [COMPLETED] ~~Text Tool~~
**Status:** ✅ Completed (2026-01-09)
- Click to place text with overlay input
- Font family selection (5 fonts)
- Font size control (8-200px)
- Text rasterized to canvas on commit

### 4. [COMPLETED] ~~Free-form Selection (Lasso Tool)~~
**Status:** ✅ Completed (2026-01-09)
- Freehand lasso path drawing
- Auto-close path on mouse release
- Ray casting algorithm for point-in-polygon
- Copy/cut/paste with lasso selection
- Marquee persists across tool changes

### 5. [COMPLETED] ~~Zoom & Pan~~
**Status:** ✅ Completed (2026-01-09)
- Zoom range: 10% - 500%
- Zoom methods: Ctrl+Wheel (toward cursor), +/- buttons, slider
- Pan: Space + drag (hand cursor)
- UI: Zoom level display, Fit to Screen, Reset (100%)
- All drawing tools work accurately at any zoom level
- Hybrid CSS transform + coordinate mapping architecture
- GPU-accelerated, smooth performance

### 6. [FUTURE] Layer Support
**Why:** Professional feature
**Effort:** Very High (16+ hours)
**Value:** High for advanced users
**Scope:**
- Multiple canvas layers
- Layer visibility, opacity, order
- Layer panel UI
- Major architecture refactor

## Known Issues / Tech Debt
- None currently blocking

## Notes
- All tasks assume Vanilla JS only, no frameworks
- Performance target: smooth on 800x600 canvas
- Must maintain undo/redo compatibility
- Live Server verification required before merge to main
