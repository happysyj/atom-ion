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

React와 TypeScript로 구성된 프로젝트는 브라우저가 직접 `.tsx` 파일을 해석할 수 없으므로, **빌드 과정(`npm run build`)을 거쳐 생성된 `dist/` 폴더**가 배포되어야 정상 동작합니다.

본 저장소에는 GitHub Pages 자동 빌드 워크플로우(`.github/workflows/deploy.yml`)와 상대 경로(`base: './'`) 설정이 이미 적용되어 있습니다.

### 📌 가장 간단한 배포 설정 (추천: 1분 완료)

1. GitHub 저장소 상단 메뉴에서 **Settings**를 클릭합니다.
2. 왼쪽 사이드바 메뉴에서 **Pages**를 클릭합니다.
3. **Build and deployment** 항목의 **Source** 드롭다운을 확인합니다.
4. 기본값인 `Deploy from a branch` 대신 **`GitHub Actions`** 를 선택합니다.
5. 설정이 완료되면 저장소에 푸시될 때마다 GitHub Actions가 자동으로 프로젝트를 빌드(`npm run build`)하여 GitHub Pages에 배포합니다!
   * 상단 **Actions** 탭에서 `Deploy to GitHub Pages` 워크플로우 진행 상황을 실시간으로 확인하실 수 있습니다.
   * 작업이 완료되면 표시되는 링크로 접속하시면 공백 없이 완벽하게 동작합니다.
