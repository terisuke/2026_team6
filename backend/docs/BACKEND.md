# Backend API

ゲーム行動データを収集・分析して、5軸の性格スコアを算出するバックエンドサーバー。

## セットアップ

```bash
npm install
cp .env.example .env  # 環境変数を設定
npm run dev            # 開発サーバー起動 (http://localhost:3001)
```

## 環境変数 (.env)

| 変数名 | 説明 |
|--------|------|
| `PORT` | サーバーポート (デフォルト: 3001) |
| `SUPABASE_URL` | Supabase プロジェクトURL |
| `SUPABASE_KEY` | Supabase anon key |

---

## アーキテクチャ

3層 + 分析層で責務を分離しています。

```
リクエスト → routes/ → services/ → repositories/ → Supabase
                            ↓
                       analysis/
```

```
src/
├── routes/          # HTTPリクエストの受け口（Controller層）
├── services/        # ビジネスロジックの組み立て（Service層）
├── repositories/    # DB操作のみ（Repository層）
│   ├── userRepository.ts
│   ├── gameRepository.ts
│   └── analysisResultRepository.ts  ← 結果キャッシュ用
├── analysis/        # 分析・スコア計算ロジック
├── db/              # Supabase接続クライアント
├── types/           # 型定義（FE/BE共通）
└── index.ts         # エントリーポイント
```

### なぜこの構造？

| 層 | 責務 | ルール |
|----|------|--------|
| **routes/** | HTTP受付 + レスポンス返却 | DB・分析ロジックに直接触らない |
| **services/** | バリデーション + 処理の流れの組み立て | repositories と analysis を呼ぶ |
| **repositories/** | Supabase への読み書き | ビジネスロジックを持たない |
| **analysis/** | スコア計算 + フィードバック生成 | `types/` のみに依存。DB無依存 |

**設計意図:**
- **単一責任の原則 (SRP):** 各層は1つの責務だけを持つ。routes は HTTP、repositories は DB、analysis は分析。
- **依存性逆転の原則 (DIP):** routes → services → repositories の順で依存。上位層が下位層に依存し、逆方向の依存はない。
- **開放閉鎖の原則 (OCP):** ゲーム3の分析追加時は `analysis/scoreCalculator.ts` に関数を追加するだけ。routes や repositories の変更は不要。
- **YAGNI:** 今必要ない抽象化（DI コンテナ、interface の多用など）は入れていない。

### analysis/ の独立性

`analysis/` は **DB やHTTPに一切依存しない** 純粋な計算モジュールです。引数でデータを受け取り、結果を返すだけ。このため：

- 他メンバーが独立して開発・テスト可能
- ユニットテストが書きやすい
- フロントのデータ構造が変わっても、ここだけ修正すればOK

---

## API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| `POST` | `/api/register` | ユーザー登録 + ベースラインスコア保存 |
| `POST` | `/api/games/submit` | ゲームプレイデータ送信 |
| `GET` | `/api/results/:user_id` | 診断結果取得 |
| `GET` | `/health` | ヘルスチェック |

### リクエスト/レスポンス例

<details>
<summary>POST /api/register</summary>

```json
// Request
{
  "mbti": "ENTP",
  "baseline_answers": {
    "q1_caution": "A",
    "q2_cooperativeness": "C",
    "q3_positivity": "A"
  }
}

// Response (201)
{ "user_id": "uuid-xxxx", "status": "success" }
```
</details>

<details>
<summary>POST /api/games/submit</summary>

```json
// Request
{
  "user_id": "uuid-xxxx",
  "game_type": 1,
  "data": { /* ゲーム固有のJSON */ }
}

// Response (200)
{ "status": "success", "message": "Game 1 data saved" }
```
</details>

<details>
<summary>GET /api/results/:user_id</summary>

```json
// Request
// パスパラメータ: user_id（登録時に取得したUUID）
// GET /api/results/uuid-xxxx

// Response (200)
{
  "user_id": "uuid-xxxx",

  // ユーザーが自己申告したMBTIタイプ（スキップ時はnull）
  "self_mbti": "ENTP",

  // MBTI理論値スコア（self_mbtiがnullの場合はnull）
  "mbti_scores": {
    "caution": 40,
    "calmness": 45,
    "logic": 75,
    "cooperativeness": 50,
    "positivity": 70
  },

  // ゲーム行動から算出した実測スコア（0-100）
  "scores": {
    "caution": 38,
    "calmness": 52,
    "logic": 68,
    "cooperativeness": 61,
    "positivity": 73
  },

  // 事前アンケートによる自己申告スコア（0-100）
  "baseline_scores": {
    "caution": 55,
    "calmness": 60,
    "logic": 65,
    "cooperativeness": 70,
    "positivity": 75
  },

  // 実測スコアと自己申告スコアの差分（scores - baseline_scores）
  "gaps": {
    "caution": -17,
    "calmness": -8,
    "logic": 3,
    "cooperativeness": -9,
    "positivity": -2
  },

  // ゲームごとの個別スコア内訳
  "game_breakdown": {
    "swipe_game": {
      "caution": 35,
      "calmness": 50,
      "logic": 72,
      "cooperativeness": 58,
      "positivity": 73
    }
  },

  // AIが生成した診断フィードバック
  "feedback": {
    "title": "慎重派の論理思考タイプ",
    "description": "あなたはデータや規則を重視しながら物事を判断する傾向があります。感情よりも事実に基づいた意思決定を好み、リスクを丁寧に見極めてから行動します。",
    "gap_point": "自己評価より慎重さが低めに出ました。実際の行動では直感的に動く場面も多いようです。"
  },

  // 自己申告との一致度（0-100）
  "accuracy_score": 72,

  // 各ゲームフェーズの行動サマリーテキスト
  "phase_summaries": {
    "warmup": "ウォームアップフェーズでは、画像を慎重に観察してからスワイプする傾向が見られました。",
    "main": "メインフェーズでは、迷いの少ない素早いスワイプで直感的な判断を行っていました。",
    "pressure": "プレッシャーフェーズでは、時間制限下でもブレの少ない安定した操作が見られました。"
  }
}
```
</details>


---

## 分析ロジック

ゲーム3のスコア計算の配線は **実装済み** です。
分析担当は `calculateGame3Scores()` の中身を実装するだけでOK。

**実装済みの配線：**
- `calculateGame3Scores()` のスタブが存在（空 `{}` を返す）
- `combineScores(game1, game2, game3)` に game3 引数が追加済み
- `resultService.ts` で game3 の呼び出しと `game_breakdown.game_3` への格納が済み

**分析担当が実装するファイル：**
- `analysis/scoreCalculator.ts` — 各ゲームのスコア計算ロジック
- `analysis/feedbackGenerator.ts` — フィードバック文生成
- `analysis/phaseSummaryBuilder.ts` — 行動要約テキスト生成

詳細は [ANALYSIS_GUIDE.md](docs/ANALYSIS_GUIDE.md) を参照。

### 結果キャッシュ（analysis_results テーブル）

初回の `GET /api/results/:user_id` で計算→ `analysis_results` に保存。  
2回目以降はキャッシュから返却。`analysisResultRepository.ts` が CRUD を提供。

---

## スクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動（ホットリロード付き） |
| `npm run build` | TypeScript → JavaScript コンパイル |
| `npm start` | 本番サーバー起動 |
