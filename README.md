# Atom & Ion (화학 암기 게임)

화학 입문을 위한 필수 암기 요소(원소 기호, 이온식 등)를 게임 형태로 쉽고 재미있게 학습할 수 있도록 돕는 프로젝트입니다.

## 🚀 주요 기능 (예정)
* 원소 기호 및 이온식 암기 퀴즈
* 인터랙티브한 게임 방식의 학습 환경 제공

## 🛠 기술 스택
* **Language:** TypeScript
* **Build Tool:** Vite
* **Package Manager:** Bun (또는 npm)
* **Hosting/Backend:** Firebase (예정)

## 💻 로컬 실행 방법

프로젝트를 로컬 환경에서 실행하려면 아래 명령어를 사용하세요.

```bash
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드 (dist 생성)
npm run build
```

---

## 🌐 GitHub Pages 배포 가이드 (공백 화면 해결 방법)

`coffee_menu`와 달리 React & TypeScript 프로젝트가 빈 화면(흰색 화면)으로 뜨는 이유는 **브라우저가 TypeScript(`.tsx`) 파일을 직접 실행할 수 없기 때문**입니다.

따라서 질문해주신 것처럼 **"모든 코드와 스타일을 하나의 완성된 HTML 파일로 합쳐서 업로드"**하거나, **"GitHub Actions로 자동 빌드 배포"**하는 두 가지 명쾌한 방법이 있습니다!

---

### 💡 방법 1. 단일 HTML 파일 1개로 배포하기 (가장 쉬움! `coffee_menu`와 동일 방식)

복잡한 빌드 도구나 GitHub Actions 설정 없이, **완성된 단일 `index.html` 파일 1개만 저장소에 올리는 방법**입니다.

1. 터미널에서 다음 명령어를 실행합니다:
   ```bash
   npm run build:single
   ```
2. 실행이 완료되면 `dist-single/index.html` 파일이 생성됩니다.
   - 이 파일 하나 안에 모든 자바스크립트(JS), 스타일(CSS), 이온 데이터가 100% 인라인으로 포함되어 있습니다.
   - 별도의 서버나 빌드 도구 없이 내 컴퓨터에서 더블 클릭해도 즉시 실행됩니다!
3. 이 `dist-single/index.html` 파일의 내용을 GitHub 저장소의 최상단 `index.html`로 덮어쓰기하여 푸시(업로드)합니다.
4. GitHub Pages **Settings → Pages**에서 기본값인 `Deploy from a branch` (Branch: `main`, `/ (root)`) 상태 그대로 두시면, `coffee_menu`처럼 즉시 화면이 나타납니다!

---

### ⚙️ 방법 2. GitHub Actions 자동 빌드 배포 사용하기 (설정 30초 완료)

저장소의 소스 코드(TypeScript 원본)를 그대로 유지하면서, GitHub이 알아서 빌드해서 배포하도록 하는 방법입니다. 본 프로젝트에는 이미 `.github/workflows/deploy.yml` 설정이 포함되어 있습니다.

1. GitHub 저장소 상단 메뉴에서 **Settings**를 클릭합니다.
2. 왼쪽 사이드바 메뉴에서 **Pages**를 클릭합니다.
3. **Build and deployment** 항목의 **Source** 드롭다운을 확인합니다.
4. 기본값인 `Deploy from a branch` 대신 **`GitHub Actions`** 를 선택합니다.
5. 상단 **Actions** 탭으로 가셔서 `Deploy to GitHub Pages` 워크플로우를 실행(Run workflow)하거나, 새로 커밋을 푸시하면 GitHub 서버가 자동으로 빌드하여 배포를 완료합니다!
