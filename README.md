# MockStock

주식 종목을 검색하고 가격 차트 및 기술적 지표(이동평균, RSI)를 기반으로
매수/매도/관망 신호를 보여주는 간단한 웹앱입니다.

## 구성

- `client/`: React + Vite 프론트엔드
- `server/`: Express 백엔드 (Yahoo Finance 데이터 사용)

## 주요 기능

- 종목 검색 (미국/한국 주식 및 ETF)
- 기간별 가격 차트 조회
- 이동평균(5/20일) 및 RSI 기반 신호 표시

## 기술 스택

- Frontend: React, Vite, Recharts, Axios
- Backend: Node.js, Express, yahoo-finance2

## 실행 방법

### 0) 사전 준비

- Node.js 18+ 권장
- npm 사용

### 1) 서버 실행

```
cd server
npm install
npm run dev
```

서버는 기본적으로 `http://localhost:5000`에서 실행됩니다.

### 2) 클라이언트 실행

새 터미널을 열고 아래 명령을 실행합니다.

```
cd client
npm install
npm run dev
```

브라우저에서 `http://localhost:5173`로 접속합니다.

### 실행 요약

- 터미널 1: `server/`에서 `npm run dev`
- 터미널 2: `client/`에서 `npm run dev`
- 접속: `http://localhost:5173`

## API

- `GET /api/search?query=...`
  - 종목 검색
- `GET /api/stock/:symbol?period=1mo`
  - 기간별 차트 데이터 및 신호

### period 옵션

`1w`, `1mo`, `3mo`, `6mo`, `1y`, `5y`

## 참고

- 프론트엔드는 `client/src/App.jsx`에서 API 베이스 주소를
  `http://localhost:5000/api`로 고정해 사용합니다.
