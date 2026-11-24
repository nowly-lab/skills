---
name: appstore-screenshot-marketing
description: >-
  App
  Storeのスクリーンショットをマーケター視点（CVR・ASO・メッセージング）で設計・改善・レビューするとき、PPO/CPPの仮説を立てるときに使う。
---
# App Store スクリーンショット — マーケター視点のベストプラクティス

App Store / Mac App Store の製品ページ用スクリーンショットを、**新規作成・全面リライト・レビュー**するときに使う。視点はコンバージョン（製品ページ閲覧→ダウンロード）、ASO、メッセージング、ポジショニング。

根拠は (A) Apple 公式ドキュメント、(B) X 上のマーケ／ASO／インディー成長系の議論、の二層（2026年11月調査）。数字は出典付きでのみ引用する。Apple 未確認の主張は「未検証」と明示する。

---

## いつ使うか

- 新アプリのストア用スクショセットを設計するとき
- CVR（製品ページ閲覧→インストール）が低い、または広告／UGC からの着地が弱いとき
- Product Page Optimization（PPO）や Custom Product Pages（CPP）の仮説を立てるとき
- ローカライズ／リブランド／大型アップデート後にスクショを見直すとき
- 競合の検索結果見え方をベンチマークし、自社セットをレビューするとき

使わない場面: 純粋な UI 実装レビュー、App Review のコード側問題、Google Play 専用仕様（原則は似るがサイズ・テスト機能は別）。

---

## ワークフロー

### 1. 診断 — どこが漏れているか先に決める

| 症状 | まず疑うもの | スクショの優先度 |
|------|--------------|------------------|
| インプレッション自体が少ない | キーワード・需要・タイトル／サブタイトル | 低（先にメタデータ） |
| インプレはあるが製品ページ閲覧が少ない | アイコン・タイトル・**検索結果に出る最初のスクショ** | 高（1枚目） |
| ページは見られるが DL されない | **スクショ一式・評価／レビュー** | 最高 |
| DL 後すぐ削除が多い | 約束と実アプリのギャップ | 高（約束の再設計） |

根拠: X `@emin_builds`、`@fre2dm`、`@storeliftapp`。

### 2. 約束を一文にする

スクショを触る前に、誰向けか／何をどれくらい早く・どう良くするか（アウトカム）／競合と違う一点、を1文で書く。書けなければ1枚目も書けない。

根拠: X `@Jinlikethedrink`、`@ladiff31`。

### 3. セットのストーリーボードを組む

Apple 公式: 検索結果ではプレビューが無いとき、向きに応じ**最初の1〜3枚**が表示される。

1. **SS1（ヒーロー）**: 誰向け・何が得られるか。アウトカム。検索結果でも読める大きな見出し
2. **SS2**: メインユースケース
3. **SS3**: 選ぶ理由（差別化・Before/After・信頼の補強）
4. **SS4〜**: 機能ディープダイブ、ワークフロー、連携、ダークモード、社会的証明など。1枚1メッセージ
5. 最後付近: 補足（対応環境、受賞、安心材料）。**ここまで来る人は少数**という前提

根拠: Apple product-page、X `@iamericpereira`（SplitMetrics引用「ほぼ半数が最初の2枚のみ、5枚目は7%、90%は3枚目以降を見ない」）、`@mackevins100`、`@Jinlikethedrink`、`@asoclimb`。

### 4. コピーとビジュアルの原則を適用する

下記「原則」に沿って各フレームの見出し・UI・レイアウトを決める。

### 5. 検索結果用と製品ページ用を意識する

- 検索結果に出るフレーム（おおむね最初の1–3枚／portrait）は、クロップと文字サイズを検索サムネ前提で確認
- product page header や search result assets もスクショ以外の発見面。スクショだけ最適化して終わりにしない

根拠: Apple、X `@asoclimb`、`@_RoadTo10M`、`@minosdevs`。

### 6. 広告・UGC とフックを揃える

有料／オーガニック動画の約束と **SS1 の見出しを一致**させる（例「[OUTCOME] in [TIME]」）。

根拠: X `@hollyfrick_`、`@Jinlikethedrink`、`@rsalimx`。

### 7. 仕様どおりに書き出し、ローカライズする

- 必須デバイスサイズ・最大10枚・透過なしなど Apple 仕様に合わせる
- 主要市場はスクショ内テキストもローカライズ（直訳ではなく市場の検索語に寄せる）

根拠: Apple specs / localization、X `@Zenysi_`、`@hollyfrick_`。

### 8. PPO で検証し、CPP で意図別に展開する

- **PPO**: オリジナルに対し最大3トリートメント。アイコンとスクショを同時に変えない。小さな差分より「1枚目の大きな仮説」から。十分なインプレまで待つ
- **CPP**: 最大70。テーマ別スクショ＋プロモテキスト。キーワード割当でオーガニック検索にも出せる。キャンペーン／UGC 着地用にユニーク URL

根拠: Apple PPO / CPP、X `@asoclimb`、`@Ali_Homsi`、`@appstare_nolan`、`@rsalimx`。

### 9. 出荷後モニタリング

製品ページ閲覧→インストール、検索経由のタップスルー、PPO の信頼度、削除率を見る。製品が変わったらスクショも更新する。

根拠: X `@Jinlikethedrink`、`@emin_builds`。

---

## 原則

出典タグ: **[Apple]** 公式、**[X]** X 投稿、**[X・二次統計]** X が第三者ベンチマークを引用（原レポート未確認）。

- **P1. 勝負はフォールド上（1〜3枚）**。後半は付録。[Apple] / [X・二次統計] `@iamericpereira`
- **P2. 機能ではなくアウトカム**。見出しはベネフィット短文。[X] `@mackevins100`、`@killian_sowa`、`@Jinlikethedrink`、`@ladiff31`、`@ImSohelKabir`
- **P3. 1枚＝1メッセージ、大きな文字**（3–5語目安）。実機の検索サムネで確認。[X] `@ladiff31`、`@asoclimb`、`@namkennic`
- **P4. ユーザー旅程で並べる**（作成→招待→実行→保存など）。[X] `@ladiff31`
- **P5. 本物のUI**。リアルデータ入りの利用中画面。[Apple] Review 2.3.3
- **P6. セット全体の視覚一貫性**。フォント・色・余白・枠・アイコンの色味。[X] `@ladiff31`
- **P7. 縦向き優先**で検索での存在感を取る。[X] `@LTZ__journal`、`@asoclimb`
- **P8. Dark Mode 対応なら1枚はダーク体験**。[Apple]
- **P9. ローカライズは市場の言葉で**。[Apple] / [X] `@Zenysi_`
- **P10. 社会的証明・受賞は短く**。誇張や合算表記は不信を生む。定量根拠は薄いので PPO で測る。[X] `@abhinayguptha`、`@HAKKAGON`
- **P11. キャプションの検索インデックスは未検証**。X 上の ASO ツール報告のみで Apple 公式未確認。ランキング要因とは断定しない。[X・未検証] `@alaajawhareng`
- **P12. テストは大きな仮説・一変更ずつ**。[Apple] PPO / [X] `@asoclimb`、`@appstare_nolan`、`@0wenchoi`
- **P13. CPP で意図別に1枚目の約束を変える**。[Apple] / [X] `@rsalimx`
- **P14. 有料もオーガニックも同じ資産**。入札を上げる前に最初の3枚を直す。[X] `@Jinlikethedrink`、`@killian_sowa`

---

## よくある失敗

- UI を並べただけで、何のアプリか一瞬で分からない
- 1枚目に社内機能名や設定画面
- 文字が検索サムネで潰れる
- 1枚にメッセージを詰め込みすぎ
- スプラッシュ／ログイン画面のみ（Apple 2.3.3 違反リスク）
- アイコン・タイトルは磨いたのに1枚目はシミュレータのまま
- 広告／TikTok の約束と SS1 が不一致
- PPO を使わない／同時に複数要素を変えて学びが消える
- 英語スクショのまま主要市場に出す
- 製品が変わってもスクショが古い

---

## レビューチェックリスト

**戦略**
- [ ] 一文の約束（誰×アウトカム）がある
- [ ] SS1–3 だけで約束が伝わる
- [ ] 広告／UGC のフックと SS1 が一致
- [ ] ファネル診断済み（KW問題をスクショで解こうとしていない）

**コピー**
- [ ] 各見出しはベネフィット短文（機能名ではない）
- [ ] 実機の検索結果サイズで読める
- [ ] ユーザーがレビューで使う言葉に寄せている
- [ ] 誇大・価格・無関係メタデータの混入なし（Apple 2.3.7）

**ビジュアル**
- [ ] 利用中のリアルUI
- [ ] フォント・色・余白・枠が統一
- [ ] アイコンの色味と衝突していない
- [ ] Dark Mode 対応ならダーク1枚以上を検討
- [ ] portrait 中心で検索見え方を実機確認

**仕様・運用**
- [ ] 必須デバイスサイズ・最大10枚・透過なし
- [ ] 主要ロケールのスクショ内テキストをローカライズ
- [ ] PPO 仮説は「1変更・大きな差」
- [ ] 必要なら CPP をテーマ別に用意し KW／URL を割当
- [ ] ヘッダー／search result assets も検討

**測定**
- [ ] 成功指標は製品ページ閲覧→インストール
- [ ] テスト期間と最低インプレの目安を決めている

---

## Apple 公式スペック要約（2026年11月時点、必ず現行の ASC ヘルプで再確認）

- デバイスサイズごと **1〜10枚**、JPEG/JPG/PNG、透過・アルファ不可
- iPhone: Dynamic Island 系サイズが必須（例: 1179×2556 / 1206×2622 portrait）
- iPad 対応アプリ: 13" 必須（例: 2064×2752 / 2048×2732）
- 高解像度セットのみでも下位サイズへ自動スケール可
- 検索結果ではプレビューが無いとき最初の1–3枚
- PPO: アイコン／スクショ／プレビューで最大3トリートメント
- CPP: 最大70、スクショ差し替え・KW割当・独自URL
- iPhone Duo 向けスクショは 2027年4月以降（iOS 27.1 SDK 以降）必須予定（ASC specs 注記）

---

## Sources

### Apple
- https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/
- https://developer.apple.com/app-store/product-page/
- https://developer.apple.com/app-store/product-page-optimization/
- https://developer.apple.com/app-store/custom-product-pages/
- https://developer.apple.com/app-store/review/guidelines/

### X
- https://x.com/iamericpereira/status/2110032121393815942
- https://x.com/iamericpereira/status/2110145426481689083
- https://x.com/mackevins100/status/2117983769324036335
- https://x.com/Jinlikethedrink/status/2115161361739055503
- https://x.com/Jinlikethedrink/status/2119494928296194069
- https://x.com/ladiff31/status/2112142875718717897
- https://x.com/killian_sowa/status/2109524520797167818
- https://x.com/emin_builds/status/2110805909521998038
- https://x.com/fre2dm/status/2114557809186799950
- https://x.com/LTZ__journal/status/2115586914602356888
- https://x.com/rsalimx/status/2111793012984500277
- https://x.com/asoclimb/status/2118276945356222910
- https://x.com/asoclimb/status/2118591738768171094
- https://x.com/asoclimb/status/2117985031671201919
- https://x.com/asoclimb/status/2118016461369389102
- https://x.com/Ali_Homsi/status/2118452427435430121
- https://x.com/appstare_nolan/status/2117000876401524931
- https://x.com/hollyfrick_/status/2117617827800621406
- https://x.com/_RoadTo10M/status/2114371410001084445
- https://x.com/minosdevs/status/2115768942123741515
- https://x.com/alaajawhareng/status/2115477441254760485
- https://x.com/Zenysi_/status/2117319395412173254
- https://x.com/storeliftapp/status/2111678975818772866
- https://x.com/ImSohelKabir/status/2108831885216375067
- https://x.com/Tech_amsterdam/status/2118218502284705887
- https://x.com/0wenchoi/status/2117002239818563935
- https://x.com/abhinayguptha/status/2118727902913319090
- https://x.com/Leodan6615/status/2117753699762122827
