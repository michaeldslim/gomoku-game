# GitHub Release로 Android / iOS 설치 파일 배포 가이드

이 문서는 **gomoku-game** (Expo + React Native) 프로젝트에서 빌드한 Android·iOS 설치 파일을 [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)에 올리는 전체 과정을 정리합니다.

- **저장소:** `michaeldslim/gomoku-game`
- **앱 버전:** `app.json` → `expo.version` (현재 `2.1.2`)
- **Android 패키지:** `com.mike008.gomokugame`
- **iOS 번들 ID:** `com.mike008.gomokugame`
- **EAS 프로젝트 ID:** `174f040a-54d5-40cd-927a-c7a304b8d90a`

---

## 목차

1. [GitHub Release란?](#1-github-release란)
2. [배포 전 체크리스트](#2-배포-전-체크리스트)
3. [버전 번호 맞추기](#3-버전-번호-맞추기)
4. [Android 빌드 (APK / AAB)](#4-android-빌드-apk--aab)
5. [iOS 빌드 (IPA)](#5-ios-빌드-ipa)
6. [GitHub Release 생성 및 파일 업로드](#6-github-release-생성-및-파일-업로드)
7. [사용자 설치 방법](#7-사용자-설치-방법)
8. [GitHub Actions로 자동화 (선택)](#8-github-actions로-자동화-선택)
9. [문제 해결](#9-문제-해결)

---

## 1. GitHub Release란?

GitHub Release는 **Git 태그**에 연결된 공개 다운로드 페이지입니다.

| 항목 | 설명 |
|------|------|
| **태그** | `v2.1.2` 같은 버전 식별자 (보통 `v` + 시맨틱 버전) |
| **Release 노트** | 변경 사항, 설치 방법, 알려진 이슈 |
| **Assets (첨부 파일)** | APK, AAB, IPA 등 설치 파일 |

Release URL 예시:

```
https://github.com/michaeldslim/gomoku-game/releases/tag/v2.1.2
```

---

## 2. 배포 전 체크리스트

릴리스 전에 아래를 반드시 확인하세요.

- [ ] `src/constants/scoring.ts`에서 `USE_TEST_MASTER_THRESHOLD`가 **`false`**
- [ ] `app.json`의 `expo.version`과 `runtimeVersion`이 의도한 릴리스 버전과 일치
- [ ] `package.json`의 `version`도 동일하게 맞춤
- [ ] Android `android/app/build.gradle`의 `versionCode`를 **이전 릴리스보다 1 증가**
- [ ] Android **릴리스 서명 키** 설정 (현재 `build.gradle`은 debug keystore 사용 중 — 프로덕션 배포 전 교체 필요)
- [ ] iOS: Apple Developer 계정, 인증서, 프로비저닝 프로파일 준비
- [ ] `main` 브랜치에 릴리스할 커밋이 머지됨
- [ ] CHANGELOG 또는 Release 노트 초안 작성

> **Android 서명 주의:** `android/app/build.gradle`의 `release` 빌드가 현재 `signingConfigs.debug`를 사용합니다. GitHub에 올리는 APK도 **프로덕션 keystore**로 서명해야 업데이트 호환이 유지됩니다.

---

## 3. 버전 번호 맞추기

이 프로젝트에서 버전은 여러 파일에 분산되어 있습니다.

| 파일 | 필드 | 용도 |
|------|------|------|
| `app.json` | `expo.version` | 사용자에게 보이는 앱 버전 |
| `app.json` | `expo.runtimeVersion` | Expo OTA 업데이트 호환 버전 |
| `package.json` | `version` | npm 패키지 버전 |
| `android/app/build.gradle` | `versionName` | Android 표시 버전 |
| `android/app/build.gradle` | `versionCode` | Android 정수 빌드 번호 (매 릴리스 +1) |

### 3.1 runtimeVersion 동기화

네이티브 변경이 있을 때:

```bash
npm run bump:runtime -- 2.2.0
```

`app.json`의 `runtimeVersion`과 Android `strings.xml`이 함께 갱신됩니다.

### 3.2 수동으로 맞출 때 (예: 2.2.0)

1. `app.json` → `"version": "2.2.0"`, `"runtimeVersion": "2.2.0"`
2. `package.json` → `"version": "2.2.0"`
3. `android/app/build.gradle` → `versionName "2.2.0"`, `versionCode` 증가 (예: `2` → `3`)

### 3.3 Git 태그 생성

태그는 Release와 1:1로 연결합니다. **`v` + 시맨틱 버전** 형식을 권장합니다 (예: `v2.2.0`).

#### 방법 A — GitHub Release 페이지에서 생성 (권장, CLI 불필요)

[새 Release 작성 페이지](https://github.com/michaeldslim/gomoku-game/releases/new)에서 태그를 **동시에** 만들 수 있습니다.  
Release를 Publish할 때 태그가 자동으로 생성·푸시됩니다.

> **전제:** 태그가 가리킬 **커밋이 이미 `main`에 push**되어 있어야 합니다.  
> 버전 번호 변경 커밋을 먼저 push한 뒤 Release 페이지로 이동하세요.

Release 페이지의 **Choose a tag** 드롭다운에서:

1. `Find or create a new tag` 입력란에 `v2.2.0` 입력
2. 목록에 없으면 **`Create new tag: v2.2.0 on publish`** 가 표시됨
3. **Target**을 `main`(또는 릴리스할 브랜치)으로 선택 — 태그가 이 커밋에 붙음
4. 아래 [6.1 GitHub 웹 UI — 순서대로 입력하기](#61-방법-a--github-웹-ui-순서대로)에서 Release를 완료하면 태그도 함께 생성됨

#### 방법 B — 로컬 Git CLI

```bash
git add app.json package.json android/app/build.gradle
git commit -m "chore: bump version to 2.2.0"
git push origin main
git tag v2.2.0
git push origin v2.2.0
```

이미 태그를 push했다면 Release 페이지에서 **Choose a tag**에 `v2.2.0`을 **선택**만 하면 됩니다 (새로 만들 필요 없음).

---

## 4. Android 빌드 (APK / AAB)

### 4.1 어떤 파일을 올릴까?

| 파일 | 확장자 | 용도 |
|------|--------|------|
| **APK** | `.apk` | GitHub Release에서 **직접 설치** (사이드로드) |
| **AAB** | `.aab` | Google Play 스토어 업로드용 (GitHub에도 보관 가능) |

GitHub Release의 주 목적이 **사용자 직접 설치**라면 **APK**가 필수입니다.

### 4.2 방법 A — 로컬 Gradle 빌드 (android 폴더 있음)

**사전 요구:** JDK, Android SDK, `npm install` 완료

```bash
cd /path/to/gomoku-game
npm install

# APK (릴리스)
cd android
./gradlew assembleRelease

# AAB (Play Store용)
./gradlew bundleRelease
```

**출력 경로 (이 프로젝트의 파일명 규칙 적용 후):**

```
android/app/build/outputs/apk/release/Gomoku-app-release.apk
android/app/build/outputs/bundle/release/Gomoku-app-release.aab
```

> `build.gradle`에서 APK/AAB 파일명이 `Gomoku-` 접두사로 자동 변경됩니다.

### 4.3 방법 B — EAS Build (클라우드, 권장)

Expo EAS를 쓰면 Mac 없이도 Android·iOS를 한곳에서 빌드할 수 있습니다.

**최초 1회 설정:**

```bash
npm install -g eas-cli
eas login
eas init   # app.json에 projectId가 있으면 연결만 확인
```

**`eas.json` 예시** (프로젝트 루트에 생성):

```json
{
  "cli": {
    "version": ">= 16.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false
      }
    },
    "production-aab": {
      "extends": "production",
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

**빌드 실행:**

```bash
# APK
eas build --platform android --profile production

# AAB
eas build --platform android --profile production-aab
```

빌드 완료 후 EAS 대시보드 또는 CLI에서 `.apk` / `.aab`를 다운로드합니다.

```bash
eas build:list
# 완료된 빌드 URL에서 다운로드
```

### 4.4 Android 릴리스 서명 (프로덕션)

로컬 빌드 시 `android/keystore.properties`와 release `signingConfig`를 설정합니다.

1. keystore 생성 (최초 1회):

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore gomoku-release.keystore \
  -alias gomoku -keyalg RSA -keysize 2048 -validity 10000
```

2. `android/keystore.properties` (**.git에 커밋하지 마세요**):

```properties
storeFile=../gomoku-release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=gomoku
keyPassword=YOUR_KEY_PASSWORD
```

3. `android/app/build.gradle`의 `signingConfigs.release`에 연결

EAS Build 사용 시:

```bash
eas credentials
```

에서 keystore를 EAS에 업로드·관리할 수 있습니다.

---

## 5. iOS 빌드 (IPA)

이 저장소에는 **`ios/` 폴더가 없습니다.** Expo **prebuild** 또는 **EAS Build**로 생성합니다.

### 5.1 iOS 배포의 제약 (중요)

| 배포 방식 | GitHub Release IPA | 일반 사용자 설치 |
|-----------|-------------------|------------------|
| **App Store** | ❌ (스토어 경유) | ✅ |
| **TestFlight** | ❌ (Apple 링크) | ✅ (테스터) |
| **Ad Hoc** | ✅ | ⚠️ UDID 등록된 기기만 |
| **Enterprise** | ✅ | ⚠️ 기업 인증서 필요 |

GitHub에 IPA를 올려도 **대부분의 iPhone 사용자는 바로 설치할 수 없습니다.**  
실사용 배포는 **TestFlight** 또는 **App Store**가 일반적이고, GitHub Release IPA는 **내부·Ad Hoc 테스터**용으로 생각하세요.

### 5.2 방법 A — EAS Build (권장)

```bash
eas build --platform ios --profile production
```

- Apple Developer 계정 연동 필요 (`eas credentials`)
- 완료 후 `.ipa` 다운로드

### 5.3 방법 B — 로컬 Xcode (Mac 필요)

```bash
npx expo prebuild --platform ios
cd ios
pod install
```

Xcode에서 `Gomoku.xcworkspace` 열기 → **Product → Archive** → **Distribute App** → Ad Hoc 또는 Development로 IPA export.

### 5.4 iOS 빌드 번호

`app.json`에 추가하거나 EAS `appVersionSource: "remote"`로 관리:

```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.mike008.gomokugame",
  "buildNumber": "3"
}
```

App Store / TestFlight 업로드 시 **buildNumber는 매 빌드마다 증가**해야 합니다.

---

## 6. GitHub Release 생성 및 파일 업로드

### 6.0 Release 페이지 열기 전 — 준비물 (순서)

GitHub 웹 UI만 사용할 때, [releases/new](https://github.com/michaeldslim/gomoku-game/releases/new)에 들어가기 **전에** 아래를 순서대로 완료하세요.

| 순서 | 할 일 | 결과물 |
|------|--------|--------|
| 1 | [배포 전 체크리스트](#2-배포-전-체크리스트) 확인 | 테스트 플래그 off, 서명 키 등 |
| 2 | [버전 번호 맞추기](#3-버전-번호-맞추기) (`app.json`, `package.json`, `build.gradle`) | 예: `2.1.2` |
| 3 | 변경 사항을 `main`에 **commit & push** | GitHub에 최신 코드 반영 |
| 4 | [Android APK 빌드](#4-android-빌드-apk--aab) (필수) | `Gomoku-app-release.apk` |
| 5 | AAB / iOS IPA 빌드 (선택) | `.aab`, `.ipa` |
| 6 | 업로드용 파일명 정리 (권장) | `Gomoku-2.1.2-android.apk` 등 |
| 7 | Release 노트 초안 작성 | 변경 사항, 설치 방법 |

**Release 페이지에 가져갈 파일 (최소):**

- `Gomoku-2.1.2-android.apk` — Android 직접 설치용 (**필수**)

**선택 첨부:**

- `Gomoku-2.1.2-android.aab` — Play Store용 보관
- `Gomoku-2.1.2-ios.ipa` — Ad Hoc 테스터용

---

### 6.1 방법 A — GitHub 웹 UI (순서대로)

페이지: **[https://github.com/michaeldslim/gomoku-game/releases/new](https://github.com/michaeldslim/gomoku-game/releases/new)**

GitHub에 로그인한 뒤, 아래 항목을 **위에서 아래로** 채웁니다.

#### ① Choose a tag (태그 선택 또는 생성)

| 입력 | 예시 | 설명 |
|------|------|------|
| 태그 이름 | `v2.1.2` | `v` + `app.json`의 `expo.version` 권장 |

- **처음 릴리스:** 태그 이름 입력 → **`Create new tag: v2.1.2 on publish`** 선택
- **이미 태그가 있음:** 드롭다운에서 기존 `v2.1.2` 선택

> 이 단계에서 **Git 태그를 따로 만들 필요 없음**. Publish 시 GitHub가 태그를 생성합니다.

#### ② Target (태그가 붙을 브랜치/커밋)

| 입력 | 권장 값 | 설명 |
|------|---------|------|
| Target | `main` | 방금 push한 릴리스 커밋이 있는 브랜치 |

드롭다운에서 `main`을 고르면 **현재 `main` 최신 커밋**에 태그가 붙습니다.  
특정 이전 커밋에 태그를 달려면 Target 옆 브랜치/커밋 선택기에서 커밋을 지정하세요.

#### ③ Release title (릴리스 제목)

| 입력 | 예시 |
|------|------|
| 제목 | `Gomoku v2.1.2` |

사용자에게 보이는 릴리스 이름입니다. 태그와 같을 필요는 없지만 맞추면 찾기 쉽습니다.

#### ④ Describe this release (릴리스 노트)

| 입력 | 내용 |
|------|------|
| Description | 변경 사항, 다운로드·설치 방법 |

- **Generate release notes** 버튼: 최근 PR/커밋 기반 초안 자동 생성 (있으면 활용)
- 직접 작성 시 [6.3 Release 노트 템플릿](#63-release-노트-템플릿) 참고

#### ⑤ Attach binaries (설치 파일 첨부)

| 항목 | 필수 여부 |
|------|-----------|
| Android APK | **필수** |
| Android AAB | 선택 |
| iOS IPA | 선택 |

- **Attach binaries by dropping them here or selecting them** 영역에 파일 드래그 앤 드롭
- 또는 **selecting them** 클릭 후 탐색기에서 선택
- 여러 파일 동시 업로드 가능

#### ⑥ 옵션 (페이지 하단)

Release 작성 페이지에는 보통 **Pre-release** 체크박스만 보입니다. **Latest**는 별도 체크박스가 없는 경우가 많습니다.

| 옵션 | 보이는 위치 | 설명 |
|------|-------------|------|
| **This is a pre-release** | 새 Release / 편집 | 베타·검증용. **안정 버전이면 체크하지 않음** |
| **Latest** 배지 | 자동 부여 | GitHub가 **자동**으로 결정 (아래 참고) |

##### Latest 배지는 어떻게 붙나?

GitHub는 **Pre-release가 아닌** 공개 Release 중에서 **시맨틱 버전이 가장 높은 태그**에 `Latest` 배지를 자동으로 붙입니다.

| 상황 | Latest 결과 |
|------|-------------|
| 첫 번째 안정 Release Publish | 자동으로 **Latest** |
| Pre-release **체크 안 함** + 태그가 가장 높은 버전 | 자동으로 **Latest** |
| Pre-release **체크함** | Latest **불가** (의도된 동작) |
| 예전 버전(`v2.0.0`)을 나중에 Publish | `v2.1.2`이 더 높으면 Latest는 `v2.1.2` 유지 |

**즉, Latest를 수동으로 고를 필요가 없습니다.** 안정 버전을 올릴 때는 **Pre-release만 체크 해제**하면 됩니다.

##### Latest를 바꿔야 할 때

웹 UI에 **Set as latest release**가 안 보이면 CLI로 지정할 수 있습니다.

```bash
# 이 Release를 Latest로 지정
gh release edit v2.1.2 --latest

# Latest에서 제외
gh release edit v2.1.2 --latest=false
```

또는 해당 Release **편집(Edit)** 화면을 열어 **Set as latest release** 옵션이 있는지 확인하세요. (저장소·UI 버전에 따라 **편집 시에만** 나타나기도 합니다.)

> 공식 문서: [Managing releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository) — *"If you do not select Set as latest release, the latest release label will automatically be assigned based on semantic versioning."*

#### ⑦ Publish release (게시)

| 버튼 | 동작 |
|------|------|
| **Publish release** | 태그 생성 + Release 공개 + 파일 업로드 완료 |
| **Save draft** | 임시 저장. 나중에 수정·게시 가능 |

**Publish 후 확인:**

- Release URL: `https://github.com/michaeldslim/gomoku-game/releases/tag/v2.1.2`
- **Code → Tags**에서 `v2.1.2` 태그 생성 여부 확인

---

#### 한눈에 보는 입력 체크리스트

Release 페이지에서 채울 때 이 순서대로 확인하세요.

```
[ ] 1. Choose a tag     → v2.1.2  (Create new tag on publish)
[ ] 2. Target           → main
[ ] 3. Release title    → Gomoku v2.1.2
[ ] 4. Description      → 변경 사항 + Android 설치 방법
[ ] 5. Attach binaries  → Gomoku-2.1.2-android.apk (+ 선택 AAB/IPA)
[ ] 6. Pre-release      → 안정 버전이면 **체크 안 함** (Latest는 자동 부여)
[ ] 7. Publish release  → 클릭
[ ] 8. (확인) Releases 목록에 **Latest** 배지 붙었는지 확인
```

### 6.2 방법 B — GitHub CLI (`gh`)

`gh` 설치: https://cli.github.com/

```bash
# 로그인 (최초 1회)
gh auth login

# 릴리스 생성 + 파일 첨부 (draft)
gh release create v2.1.2 \
  --repo michaeldslim/gomoku-game \
  --title "Gomoku v2.1.2" \
  --notes-file RELEASE_NOTES.md \
  --draft \
  android/app/build/outputs/apk/release/Gomoku-app-release.apk

# 검토 후 공개
gh release edit v2.1.2 --draft=false

# 기존 릴리스에 파일 추가
gh release upload v2.1.2 ./Gomoku-app-release.aab ./Gomoku.ipa
```

**한 줄로 notes 지정:**

```bash
gh release create v2.1.2 \
  --title "Gomoku v2.1.2" \
  --notes "## 변경 사항
- AI 난이도 조정
- 버그 수정

## Android 설치
APK 다운로드 후 설치 (출처 알 수 없는 앱 허용 필요)" \
  Gomoku-app-release.apk
```

### 6.3 Release 노트 템플릿

```markdown
## Gomoku v2.1.2

### 변경 사항
- (여기에 변경 내용)

### 다운로드

| 플랫폼 | 파일 | 설치 방법 |
|--------|------|-----------|
| Android | `Gomoku-2.1.2-android.apk` | APK 다운로드 → 설치 (알 수 없는 출처 허용) |
| Android (Play) | `Gomoku-2.1.2.aab` | 개발자용 / Play Console 업로드 |
| iOS | TestFlight 링크 또는 IPA | Ad Hoc 기기만 IPA 직접 설치 가능 |

### 요구 사항
- Android 8.0+ (minSdk는 프로젝트 설정 따름)
- iOS 15.0+ (Expo SDK 53 기준, 실제 값은 빌드 설정 확인)

### 체크섬 (선택)
SHA256 (APK): `shasum -a 256 Gomoku-app-release.apk`
```

### 6.4 권장 파일 이름

```
Gomoku-2.1.2-android.apk
Gomoku-2.1.2-android.aab
Gomoku-2.1.2-ios.ipa
```

버전·플랫폼이 파일명에 들어가면 사용자가 구분하기 쉽습니다.

---

## 7. 사용자 설치 방법

### 7.1 Android (APK)

1. GitHub Release 페이지에서 APK 다운로드
2. 기기에서 파일 열기
3. **설정 → 보안 → 알 수 없는 앱 설치** 허용 (기기/OS마다 문구 다름)
4. 설치 완료

### 7.2 iOS

- **TestFlight:** Release 노트에 Apple TestFlight 초대 링크 안내 (권장)
- **Ad Hoc IPA:** iTunes/Finder, Apple Configurator, 또는 MDM으로 등록된 기기에만 설치
- 일반 사용자에게는 GitHub IPA보다 **TestFlight URL**이 현실적입니다

---

## 8. GitHub Actions로 자동화 (선택)

태그 push 시 Android APK를 빌드해 Release에 올리는 예시입니다.  
(iOS는 macOS runner + Apple 인증서 시크릿이 필요해 별도 워크플로 권장)

**`.github/workflows/release-mobile.yml`** (예시 — 필요 시 프로젝트에 추가):

```yaml
name: Mobile Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  android-release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Set up JDK
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17

      - name: Build release APK
        run: |
          cd android
          chmod +x gradlew
          ./gradlew assembleRelease

      - name: Upload to GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            android/app/build/outputs/apk/release/Gomoku-app-release.apk
          generate_release_notes: true
```

**시크릿 (프로덕션 서명 시):**

| Secret | 용도 |
|--------|------|
| `ANDROID_KEYSTORE_BASE64` | keystore 파일 (base64) |
| `ANDROID_KEYSTORE_PASSWORD` | store 비밀번호 |
| `ANDROID_KEY_ALIAS` | key alias |
| `ANDROID_KEY_PASSWORD` | key 비밀번호 |

> 현재 저장소의 `.github/workflows/gomoku.yml`은 **Docker 이미지** 빌드용입니다. 모바일 Release는 별도 워크플로로 추가하세요.

---

## 9. 문제 해결

### APK 설치 시 "앱이 설치되지 않음"

- 이전에 **다른 서명**으로 설치한 동일 패키지가 있으면 제거 후 재설치
- `versionCode`가 이전보다 낮으면 업데이트 실패 → `versionCode` 증가

### `assembleRelease` 실패

```bash
cd android && ./gradlew assembleRelease --stacktrace
```

- `ANDROID_HOME` / SDK 경로 확인
- `npm install` 후 다시 시도

### iOS IPA를 일반 사용자가 설치 못함

- 정상 동작입니다. TestFlight 또는 App Store 사용

### EAS 빌드 실패

```bash
eas build:view
eas credentials
```

- Apple / Google 계정 연동 상태 확인

### Release에 파일이 안 보임

- Draft release인지 확인 (`gh release view v2.1.2`)
- `gh release upload`로 재업로드

---

## 빠른 참조 — 전체 흐름 요약

### GitHub 웹 UI만 사용 (태그도 페이지에서 생성)

```
1. 체크리스트 (테스트 플래그 off, 버전 bump, versionCode +1)
2. 버전 파일 수정 → git commit → git push origin main
3. Android APK 빌드 (./gradlew assembleRelease 또는 eas build)
4. (선택) AAB / iOS IPA 빌드, 파일명 정리
5. https://github.com/michaeldslim/gomoku-game/releases/new 열기
6. Tag vX.Y.Z 생성 + Target main + 제목 + 노트 + APK 첨부
7. Publish release → 태그·Release·파일 한 번에 완료
```

### Git CLI로 태그를 먼저 만드는 경우

```
1~4. 위와 동일
5. git tag vX.Y.Z && git push origin vX.Y.Z
6. releases/new 에서 기존 태그 vX.Y.Z 선택 → 나머지 입력 → Publish
```

---

## 관련 문서

- [README.md](../README.md) — EAS OTA, 로컬 실행
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [GitHub Releases 문서](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Android 앱 서명](https://developer.android.com/studio/publish/app-signing)

---

*마지막 업데이트: 2026-07-12 · gomoku-game v2.1.2 기준*
