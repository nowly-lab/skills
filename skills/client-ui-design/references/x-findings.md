# X調査メモ：クライアントワーク向け UIデザイナー skill の材料

- 調査日: 2026-11-01（JST）
- 方法: `x` MCP（search_posts_all / get_posts_by_ids）で日英の投稿を検索し、長文は全文を取得。リポストは除外。
- 本文中で引用したユニーク投稿: 113件（99アカウント。下の「出典一覧」を参照）。投稿ID・handle は取得データと照合済み。投稿からの引用はすべて取得した本文によるもので、要約は筆者による。
- 注意: 検索インデックスは直近（2026年8〜10月）の投稿が中心で、それより古い投稿は期間指定を付けたときだけ拾えた。宣伝目的の投稿（ツール紹介・DM誘導）は「どこがAIっぽく見えるか」の材料としてだけ使い、ツールの評価はしていない。

---

## 0. 全体を通した結論（skill の背骨にする）

1. **「AIっぽさ」は装飾ではなく、判断が抜けた結果として出る。** AIは決まっていないところを「平均」や「無難な既定値」で埋めるので、無難な選択が積み重なって見た目が均質になる。色やフォントを差し替えても（パラメータを調整しても）、それだけでは消えない。
   - [@revolvtech](https://x.com/revolvtech/status/2111623282420277383)（①平均に寄る ②決めていない部分が既定値で埋まる ③文字を「絵」として描く）
   - [@ecsite_produce](https://x.com/ecsite_produce/status/2075164820073238577)「AI臭さの正体は安全策の集合」／[続き](https://x.com/ecsite_produce/status/2075735829679661459)「人間味＝意思決定の跡が見える状態」
   - [@vikktorrrre](https://x.com/vikktorrrre/status/2092618580902728176)（プロンプトにデザイン上の強い意見がないと、ランディングページの統計的平均になる）
2. **だから直すのは見た目より先に「誰に・何を・どの順で」。** 情報設計 → 白黒ワイヤー → デザイン、の順番を守る。
   - [@hide_arugana](https://x.com/hide_arugana/status/2089510313054114278)、[@yuhei_design](https://x.com/yuhei_design/status/2088430490080682131)
3. **CVを動かすのは見た目より構成・論理・読み手の感情（不安）。**
   - [@enoyann](https://x.com/enoyann/status/1921707391152009489)「LP改善はデザインではなく、論理構成×感情設計が9割」、[@bradsmith](https://x.com/bradsmith/status/2055281011491999871)
4. **クライアントワークでは「なぜこのデザインか」を言葉にできることが価値になる。**「AIで作れるのに、なぜあなたに頼むのか」への答えにもなる。
   - [@halukik_0520](https://x.com/halukik_0520/status/1993912295802728957)、[@kanna_design2](https://x.com/kanna_design2/status/2092024906640736397)、[@misatoo_zukai](https://x.com/misatoo_zukai/status/2115380736044015856)（クライアントから「AIでも作れる時代に何で作ってるの？」と聞かれた話）

---

## 1. AIっぽさをなくす

### 1-1. 原則

| # | 原則 | 根拠となる投稿 |
|---|---|---|
| A1 | 「何を作るか」に加えて「どう作るか」（配色・書体・構成・余白のルール）を先に決めて渡す。決めていない部分はAIの既定値で埋まる | [@revolvtech](https://x.com/revolvtech/status/2111623282420277383), [@_yu_tanaka_](https://x.com/_yu_tanaka_/status/2116364729849724974) |
| A2 | 配色をいじる前に「全部が主役になっていないか」を確認する。最初に読ませるものを1つに絞る | [@kawai_design](https://x.com/kawai_design/status/2113027556009988318) |
| A3 | 装飾そのものは悪くない。消すべきなのは「なんとなく足した装飾」。意味を説明できない枠・影・アイコンは減らす | [@kawai_design](https://x.com/kawai_design/status/2113027556009988318) |
| A4 | 色に役割を持たせる（見出し／補足／行動）。中立色が画面の8〜9割、アクセント色は「一番うるさい色を一番少なく」使い、CTAに視線を集める | [@kawai_design](https://x.com/kawai_design/status/2113027556009988318), [@itsolelehmann](https://x.com/itsolelehmann/status/2039370884897534337)（Google Stitch のデザイナーの手順の紹介） |
| A5 | フォントを増やす前に、サイズと太さで強弱（ジャンプ率）をつける | [@kawai_design](https://x.com/kawai_design/status/2113027556009988318), [@revolvtech](https://x.com/revolvtech/status/2112868300673937786) |
| A6 | 関連する情報は近づけ、話が変わるところは余白を広げる（余白に強弱をつける）。AI生成はフォントも余白も大きくなりがちなので、小さく詰めてみる | [@kawai_design](https://x.com/kawai_design/status/2113027556009988318), [@okamoto_yuma_](https://x.com/okamoto_yuma_/status/2031417412009210197) |
| A7 | どこかでグリッドを意図して1か所だけ崩す、そのブランドにしか使えない写真を使う、情報に意図的な優先順位をつける。こうした「非対称な判断」を入れる | [@ecsite_produce](https://x.com/ecsite_produce/status/2075735829679661459), [@FSkifor](https://x.com/FSkifor/status/2074734531458851310) |
| A8 | ヒーローには「実際のプロダクト（実物）」を見せ、1つのディテールをページ全体に通す。誰の記憶にも残らないページを作らない | [@denizdoingstuff](https://x.com/denizdoingstuff/status/2114407641963237633) |
| A9 | 最初に感情（共感）から入る。誰のサイトで、着地した瞬間にどう感じてほしいか → その感情を素材・質感の言葉に置き換える（例：「スポーティ」ではなく「建築的な石灰岩」「紙にインク」）→ デザインシステムに落とす | [@itsolelehmann](https://x.com/itsolelehmann/status/2039370884897534337) |
| A10 | AIは想像させるより模倣させる方が得意。手描きワイヤー、好きなセクションのスクショ、ムードボードを先に渡し、「clean にして」とは言わずに clean の見本を見せる | [@om_patel5](https://x.com/om_patel5/status/2025705776434520284) |
| A11 | 参考はレイアウトを真似ず、余白・文字サイズ・色の「ルール」だけ合わせる。参考サイトのロジックや構成は学ぶが、文言・ビジュアル・色はコピーしない | [@iavinashtr](https://x.com/iavinashtr/status/2115096059966083243), [@askOkara](https://x.com/askOkara/status/2074112982859264274) |
| A12 | 参考を3つ集めたら、タイポ・色・余白・階層に加えて「その参考があえて避けていること」も抜き出す。最後に参考と並べて比べ、写真・コピー・ボタン配置で「自分のもの」にする | [@milesdeutscher](https://x.com/milesdeutscher/status/2101099200780116104) |
| A13 | 修正は範囲を絞って小さく何度も回す（例：「余白だけ」「色は変えずにコントラストだけ」）。範囲を絞らないとAIは全体を作り直してしまう | [@kieranklaassen](https://x.com/kieranklaassen/status/1992815691339100420) |
| A14 | AIに「AIっぽさをなくして」「もっとおしゃれに」と頼んでも、別の無難なテンプレートに寄っていくだけ。「どこをどう直すか」を具体的に指示し、文言は変えさせない | [@revolvtech](https://x.com/revolvtech/status/2112868300673937786), [@kawai_design](https://x.com/kawai_design/status/2113027556009988318), [@ecsite_produce](https://x.com/ecsite_produce/status/2075735829679661459) |
| A15 | 生成時に縛るだけでは不十分。モデルは平均へ戻っていくので、出来上がった後の監査（重大度順のチェックリスト）を別工程として設ける | [@notEgoyard](https://x.com/notEgoyard/status/2099520609986154745) |
| A16 | AIはたたき台までは速い。そこから人の目で違和感を見つけて仕上げる（写真の不自然なツヤ、均一すぎる質感なども直す） | [@revolvtech](https://x.com/revolvtech/status/2111728996266496383) |
| A17 | 「AIっぽい」と一言で済ませず、どこがどう悪いかを言葉にする。目的は「人に見せるときに余計な認知負荷をかけないこと」 | [@koi_zoom1](https://x.com/koi_zoom1/status/2112415770844221788), [@kgsi](https://x.com/kgsi/status/2099414308832866474), [@_syukuya](https://x.com/_syukuya/status/2112794870004044223) |
| A18 | 人間のデザイナーも無意識にAI的な「安全な選択」へ寄っていくことがある。自分らしさ（判断）を意識的に入れる | [@ecsite_produce](https://x.com/ecsite_produce/status/2092474702426210648) |
| A19 | 一方で、ICP（理想の顧客像）が見慣れたレイアウトを選ぶことも大事。奇抜さそのものは目的ではない（ファッション系の見た目をメールマーケ会社に使うのは誤り） | [@hewarsaber](https://x.com/hewarsaber/status/1830594909230747981) |

### 1-2. 「AIっぽさ」チェックリスト（見え方 → 直し方）

| 見え方（AI-look tell） | 直し方 | 出典 |
|---|---|---|
| 紫→青（インディゴ）のグラデーション、光るエフェクト、背景のグロー | 単色＋役割を決めた配色（中立色8〜9割／アクセントはCTAに）。グラデーションは意味がある場合だけ使う | [@so_ainsight](https://x.com/so_ainsight/status/2112743182744404033), [@FSkifor](https://x.com/FSkifor/status/2074734531458851310), [@vinicsr](https://x.com/vinicsr/status/2111109782622912623), [@MrBallaz](https://x.com/MrBallaz/status/2024071716763242781) |
| Inter（既定のサンセリフ）をあらゆるサイズに使う | 性格のある書体を1ペアだけ選ぶ。和文はターゲットや印象に合わせて選ぶ | [@denizdoingstuff](https://x.com/denizdoingstuff/status/2114407641963237633), [@iavinashtr](https://x.com/iavinashtr/status/2115096059966083243), [@DesignerTomomi](https://x.com/DesignerTomomi/status/1958276972217602472) |
| 流行のイタリックセリフ（「バイブコーディングで作った」の新しい目印になりつつある） | 流行りものを避け、ブランドの理由で書体を選ぶ | [@jamesm](https://x.com/jamesm/status/2106311114967380176) |
| 中央寄せヒーロー＋同じ形の機能カード3枚、ベントグリッド | 情報の優先順位でレイアウトを決める。非対称や意図的な崩しを入れる | [@notEgoyard](https://x.com/notEgoyard/status/2099520609986154745), [@FSkifor](https://x.com/FSkifor/status/2074734531458851310), [@DevaiahShrithan](https://x.com/DevaiahShrithan/status/2111540255350554743), [@wwardenn](https://x.com/wwardenn/status/2113039393493749925) |
| カードの入れ子、角丸カード、すりガラス、左に色線の付いたカード | 枠で区切らず、余白と近接でまとめる。説明できない枠や影は削る | [@so_ainsight](https://x.com/so_ainsight/status/2112743182744404033), [@vikktorrrre](https://x.com/vikktorrrre/status/2092618580902728176), [@FSkifor](https://x.com/FSkifor/status/2074734531458851310), [@kawai_design](https://x.com/kawai_design/status/2113027556009988318) |
| 色付き背景の上にグレーの文字 | コントラストを確保する（アクセシビリティ） | [@so_ainsight](https://x.com/so_ainsight/status/2112743182744404033), [@pifagor_dao](https://x.com/pifagor_dao/status/2114420110031003974) |
| 見出し→アイコン→テキストの繰り返し、完全に対称なグリッド、きっちり均等な余白 | 余白に強弱をつけ、セクションごとにリズムを変える | [@ecsite_produce](https://x.com/ecsite_produce/status/2075164820073238577), [@revolvtech](https://x.com/revolvtech/status/2112098930825773098) |
| 見出しの上に毎回付くeyebrow（小見出し）、バッジ、ピル、ステータス表示 | 本当に必要な場所だけに残す | [@FSkifor](https://x.com/FSkifor/status/2074734531458851310), [@vinicsr](https://x.com/vinicsr/status/2111109782622912623) |
| アイコン代わりの絵文字、どこにでも Lucide アイコン | アイコンは意味があるときだけ使い、セットを統一する（Phosphor や Streamline の SVG など、既定以外のセット） | [@vikktorrrre](https://x.com/vikktorrrre/status/2092618580902728176), [@denizdoingstuff](https://x.com/denizdoingstuff/status/2114407641963237633), [@MrBallaz](https://x.com/MrBallaz/status/2024071716763242781) |
| shadcn の既定のグレーで、ブランドカラーがない | ブランドカラーをトークンとして定義し、コンポーネントをカスタマイズする | [@denizdoingstuff](https://x.com/denizdoingstuff/status/2114407641963237633), [@MrBallaz](https://x.com/MrBallaz/status/2024071716763242781) |
| ボタンのスタイルが6種類ある、ページごとに見た目がぶれる | 1画面に主ボタン1つ。ボタン・入力欄・カードのスタイルを洗い出して1種類ずつに統合し、8pxの余白スケールに揃える | [@iavinashtr](https://x.com/iavinashtr/status/2115096059966083243), [@om_patel5](https://x.com/om_patel5/status/2025705776434520284) |
| 「Transform your workflow」「Unlock your potential」「シームレス」「革新的」のような中身のないコピー | 具体的な数字・対象者・変化を書く（コピーを具体的に、CTAの文言を改善する） | [@vikktorrrre](https://x.com/vikktorrrre/status/2092618580902728176), [@iavinashtr](https://x.com/iavinashtr/status/2115096059966083243), [@FSkifor](https://x.com/FSkifor/status/2074734531458851310), [@revolvtech](https://x.com/revolvtech/status/2112098930825773098) |
| 不自然な改行・文字間隔、英数字の違和感（和文で特に目立つ） | 改行位置を手で直す。字間・英数字の書体とサイズを調整する | [@revolvtech](https://x.com/revolvtech/status/2112098930825773098), [@revolvtech](https://x.com/revolvtech/status/2111680621424918863) |
| 写真の光や質感の不一致、ツヤや焼き目が均一すぎる、主役と背景で質感がずれる | 光を統一し、質感を揃え、構図を見直す | [@revolvtech](https://x.com/revolvtech/status/2112098930825773098), [@revolvtech](https://x.com/revolvtech/status/2111728996266496383) |
| ブランドと関係のないストック画像やAI画像（「いかにも素材」、海外感、架空っぽさ） | 第一候補はオリジナル撮影。素材を使う場合は「本当にこの会社にありそうか」「日本の企業や店舗の空気に合うか」で選ぶ | [@ll_n_a_o_ll](https://x.com/ll_n_a_o_ll/status/2009746503074783557), [@FSkifor](https://x.com/FSkifor/status/2074734531458851310), [@syo_izumi](https://x.com/syo_izumi/status/2034630388560412943) |
| 偽のダッシュボード画像、プロダクトの実物がないヒーロー | 実際のプロダクト画面や実物の写真を使う | [@jc_coder1](https://x.com/jc_coder1/status/2051938108728361109), [@denizdoingstuff](https://x.com/denizdoingstuff/status/2114407641963237633) |
| 明朝体＋青紫系＋カード型の組み合わせ（日本語サイトでの目印の例） | ブランドの理由で書体と色を選び直す | [@xxx_UTI_xxx](https://x.com/xxx_UTI_xxx/status/2107120740432846942) |
| 文字が小さすぎるボタン、長すぎる1行 | タップしやすいサイズにし、1行の長さを制御する。375px幅で確認する | [@PartyStraw](https://x.com/PartyStraw/status/2115859480952913984), [@iavinashtr](https://x.com/iavinashtr/status/2115096059966083243) |
| 空の状態・読み込み中・エラーの画面がない | リストやフォームごとに3つの状態をデザインする | [@iavinashtr](https://x.com/iavinashtr/status/2115096059966083243) |

### 1-3. AIと一緒に作るときの流れ（実務者のワークフローから組み立て）

1. 製品・読み手・トーンを先に書き出す（例：Impeccable の `init`。PRODUCT.md / DESIGN.md に保存しておく）。[@so_ainsight](https://x.com/so_ainsight/status/2112743182744404033), [@ReignSwords](https://x.com/ReignSwords/status/2115901370197057731), [@PrakashS720](https://x.com/PrakashS720/status/2040725071145377817)
2. 作る前に、プロダクトの考え・ユーザーの痛み・ビジュアルのムード・ページ構成・技術的な制約を渡す。[@jc_coder1](https://x.com/jc_coder1/status/2051938108728361109)
3. 情報設計 → 白黒ワイヤー（手描きでもよい）→ ビジュアル。[@hide_arugana](https://x.com/hide_arugana/status/2089510313054114278), [@om_patel5](https://x.com/om_patel5/status/2025705776434520284)
4. デザインシステム（色の役割、書体1ペア、余白スケール、コンポーネント）を先に固める。[@om_patel5](https://x.com/om_patel5/status/2025705776434520284), [@Design_emotto](https://x.com/Design_emotto/status/2111007308906205380)（デザインシステムをほぼ渡さずAIに任せた部分は納得できず、結局手で作り直した検証）
5. 生成したら範囲を絞って反復し、最後に監査（チェックリスト1-2を使う）。[@kieranklaassen](https://x.com/kieranklaassen/status/1992815691339100420), [@notEgoyard](https://x.com/notEgoyard/status/2099520609986154745)
6. 参考と並べて比べ、写真・コピー・ディテールで固有のものにする。[@milesdeutscher](https://x.com/milesdeutscher/status/2101099200780116104)

---

## 2. 情報設計（IA）

### 原則
| # | 原則 | 根拠となる投稿 |
|---|---|---|
| I1 | デザインに入る前にワイヤーフレームで「誰に、何を、どんな順番で伝えるか」を決める | [@mamafuri_school](https://x.com/mamafuri_school/status/2108382161489502539), [@hide_arugana](https://x.com/hide_arugana/status/2089510313054114278) |
| I2 | 情報量が多いこと自体は問題ではない。問題は「すべての要素が同じ強さで主張していること」。減らす前に優先順位を整える | [@yuhei_design](https://x.com/yuhei_design/status/2088430490080682131) |
| I3 | 上手な人の流れ：①訴求内容に優先順位をつけて細かく分ける ②情報のコントラスト（強弱）を意図して設計する ③ターゲットと目的から主役を決める ④レイアウト・文字組・余白の一つひとつに意図を持たせる | [@yuhei_design](https://x.com/yuhei_design/status/1834698587055464536) |
| I4 | 迷ったら目的に戻る：誰に届けるか／どんな順番で読んでもらうか／どの感情を動かしたいか／意図や目的からぶれていないか | [@CW_kumi](https://x.com/CW_kumi/status/1999393934599217581) |
| I5 | 白黒ワイヤーの段階で見るのは、視線誘導・情報の優先順位・余白・重心。色や写真を先に考えると「なんとなくそれっぽい」に引っ張られる | [@hide_arugana](https://x.com/hide_arugana/status/2089510313054114278) |
| I6 | 流し読みでも伝わるようにする（強弱やあしらいで、スクロールしていても要点が目に止まる）。Z型・F型の視線を意識する | [@DesignerTomomi](https://x.com/DesignerTomomi/status/1958276972217602472), [@hug_design_hp](https://x.com/hug_design_hp/status/1888872308007469420), [@manaberu_ad](https://x.com/manaberu_ad/status/1892178103545508329) |
| I7 | 視線誘導は「読ませる技術」にすぎない。成果には「行動させる設計」（共感 → 次が気になるストーリー → 安心材料つきのCTA）が要る | [@yu_webdesigner](https://x.com/yu_webdesigner/status/1887686325996036415) |
| I8 | LPの各ブロックの「勝ち」は、次のブロックを読み進めてもらうこと。各ブロックで読み手がどう感じるか（興味→不安→疑い→安心→ワクワク→期待→面倒→驚き→行動）を設計する | [@KAZ51501118](https://x.com/KAZ51501118/status/1765664828574834783) |
| I9 | サイトマップとワイヤーを手順どおりに確定させると、途中の「やっぱりこれを追加して」「元に戻して」が減る。サイトマップ：リサーチ→構造設計→案→社内レビュー→提案→確定。ワイヤー：画面構造→取材→撮影→原稿のコンセプト→原稿→WF案→社内レビュー→提案→確定 | [@Okamoto_Lexa](https://x.com/Okamoto_Lexa/status/1897231984105255049) |
| I10 | 構成案やワイヤーの受け止め方はクライアントによって違う。最初の段階で各手順を丁寧にすり合わせる | [@irick_web](https://x.com/irick_web/status/1990377405060620573) |
| I11 | 採用サイトは「会社紹介」ではなく「求職者と自分との接点」（どんな仕事か、どんな人がいるか、自分が働くイメージを持てるか）を必要な順番で届ける | [@arai_artpeace](https://x.com/arai_artpeace/status/2048900000290340951), [@kei_ssoken](https://x.com/kei_ssoken/status/1942365513306251398) |
| I12 | 見に来る人の目的が違うなら導線を分ける（採用で来た人は働く環境を、顧客は実績を知りたい。混ぜるとどちらも途中で帰ってしまう） | [@likg_0126_mk](https://x.com/likg_0126_mk/status/2114883328679567407) |
| I13 | 情報量の多いコーポレートサイトは、図解やポイント整理で強みを直感的に伝え、迷わない導線にする。事例ページにはフィルターや検索を付ける | [@a_mamamochi](https://x.com/a_mamamochi/status/1949574239549612400), [@_mmmm512_](https://x.com/_mmmm512_/status/1972442553422336132) |
| I14 | 派手なビジュアルより、情報設計とコンテンツの階層を優先する。先にスタイルや情報密度の原則を調べ、それを制約（skill）にしてから作る | [@muratcan](https://x.com/muratcan/status/1989099477894922679) |

### IAの進め方（skill用に整理）
1. 目的とCVの定義（下の3章のヒアリングで決める）
2. 読み手の解像度を上げる：ペルソナ × 心理的なハードル（不安・抵抗感）× カスタマージャーニー（[@msdesign1213](https://x.com/msdesign1213/status/2037280934928531752), [@booksoccermark](https://x.com/booksoccermark/status/1977936146551157115)）
3. 競合調査と自社の強みの整理（[@ukamai_design](https://x.com/ukamai_design/status/2068849416245772525), [@file_webcreator](https://x.com/file_webcreator/status/2107592989153321292)）
4. 伝える内容を洗い出して優先順位をつけ、主役を1つ決める（I2・I3）
5. 構成（セクション順）を感情の流れで並べる（I8、4章の構成テンプレ）
6. サイトマップ → 白黒ワイヤーで、視線・余白・重心・CTA位置を確認（I5・I9）
7. クライアントとすり合わせて確定（I10）→ その後にビジュアルデザイン
8. 流し読みテスト：見出しだけを追って話が通じるか（I6）

---

## 3. 読み手とクライアントを理解する

### 原則
| # | 原則 | 根拠となる投稿 |
|---|---|---|
| U1 | 「どんなデザインが好きですか？」より「今どんなことに困っていますか？」を聞く | [@chi_design_0303](https://x.com/chi_design_0303/status/2110513733793378409) |
| U2 | 参考サイトを見せられたら、色やフォントを決める前に「どこが気に入ったか」を聞く（「ボタンが分かりやすい」→ CVのしやすさを重視している、と読み取る） | [@kazm_n18](https://x.com/kazm_n18/status/2106217719670682038) |
| U3 | 感覚のずれをなくす：参考デザイン20個を一緒に点数化して「なぜそう感じたか」を言葉にする／好きなブランドや車を聞いて美意識をつかむ／「なぜそれがいいのか」まで深掘りする／理念を聞いたうえで、理由を添えて逆提案する | [@gun_designer](https://x.com/gun_designer/status/2044398383377649912) |
| U4 | 目的は「問い合わせを増やしたい」で止めずに絞り込む（どんな人から、メールか電話か）。「老若男女みんなに」は誰にも刺さらない。本当の競合はヒアリングで掘り出す（和食店の本当の競合は隣のお弁当・食料品直売所だった） | [@nagataprogram](https://x.com/nagataprogram/status/2066305946406486386) |
| U5 | 「30代女性向け」だけではデザインの根拠にならない。ペルソナに心理的なハードルを掛け合わせる（例：敏感肌で「肌荒れして失敗したくない」→ FVに「パッチテスト済み」「30日間返金保証」を置く、という論理が生まれる） | [@msdesign1213](https://x.com/msdesign1213/status/2037280934928531752) |
| U6 | 事業がうまくいっているクライアントほど、自分のお客様を高い解像度で語れる。クライアントのお客様像を聞き出すことが制作の要 | [@peachpic37](https://x.com/peachpic37/status/1920755227713556858) |
| U7 | CVRの相談では、施策の前に「どんな人が来るのか／その人に買う気はあるのか／そういう人がどこにどれだけいるのか」を考える | [@EC_hyokori](https://x.com/EC_hyokori/status/2109406186751832076) |
| U8 | 読み手の本音（悩み・嫉妬・焦り）は匿名のQ&Aサイトなどの生の声から拾う | [@ai_kisuke](https://x.com/ai_kisuke/status/1998879237705707808) |
| U9 | ペルソナは具体的な1人として描き（名前・年齢・家族・仕事）、「この人ならここで不安になるか？」と何度も立ち止まる（例：口コミやQ&Aを厚くする、施術者の人柄を見せる） | [@ukamai_design](https://x.com/ukamai_design/status/2068849416245772525), [@sosod_44](https://x.com/sosod_44/status/1983292705678430655) |
| U10 | デザイナーは「なぜこのデザインか」を言葉にし、経営者の悩み（売上・採用・ブランディング）に関心を持ち、「それ本当に必要ですか？」と言える発注者目線を持つ | [@halukik_0520](https://x.com/halukik_0520/status/1993912295802728957), [@hashiRdesign_ri](https://x.com/hashiRdesign_ri/status/1806285516976844968) |
| U11 | AIに置き換えられにくいのは、クライアントがまだ言葉にできていない課題を引き出せる、ブランドの世界観や文脈を保てる、複数案を出して一緒に考えられるデザイナー | [@kanna_design2](https://x.com/kanna_design2/status/2092024906640736397) |
| U12 | ステップアップの壁は「なんとなく作る」から「設計で作る（ターゲット・目的・競合を踏まえて理由を説明できる）」への移行。超えるには情報設計の知識が要る | [@kazm_n18](https://x.com/kazm_n18/status/2082231382089290188), [@kazm_n18](https://x.com/kazm_n18/status/2089477627409277333) |
| U13 | クライアントの事業や業界の知識が質を決める。営業資料を読み込み、内容を理解してから書く | [@minaWeb0728](https://x.com/minaWeb0728/status/1969674406512488848), [@a_mamamochi](https://x.com/a_mamamochi/status/1949574239549612400) |
| U14 | 「デザインの目的はお客様の課題解決」。デザイナーはアーティストではなくコンサルタントに近い。「なぜ」を何度も問う | [@sakuao_Dz](https://x.com/sakuao_Dz/status/2017804153142317280) |

### ヒアリング質問リスト（投稿をまとめ、重複を除いたもの）
**事業・目的**（[@nocodestyle](https://x.com/nocodestyle/status/1913725219254280453), [@erika_webdesign](https://x.com/erika_webdesign/status/1748919308800102664), [@nagataprogram](https://x.com/nagataprogram/status/2066305946406486386)）
- 事業やサービスの概要、理念や想い。今いちばん困っていること（課題）
- このサイトやLPで何を達成したいか（集客／採用／ブランディング／販売）
- CV（成果）の定義：何をもって成功とするか。どんな人から、どの手段（フォーム・電話・LINE・予約）で
- 新規かリニューアルか。今のサイトのどこが課題か
- 公開希望日、予算感

**読み手（クライアントのお客様）**（[@peachpic37](https://x.com/peachpic37/status/1920755227713556858), [@msdesign1213](https://x.com/msdesign1213/status/2037280934928531752), [@EC_hyokori](https://x.com/EC_hyokori/status/2109406186751832076)）
- いちばん来てほしいお客様は具体的にどんな人か（実在する上位顧客の話を聞く）
- その人が申し込む前に感じる不安・抵抗感・「でも…」は何か
- どこからサイトに来るか（広告・検索・SNS・紹介）。来たときにどれくらい買う気があるか
- お客様がよく口にする言葉、よく受ける質問

**競合・強み**（[@nagataprogram](https://x.com/nagataprogram/status/2066305946406486386), [@nocodestyle](https://x.com/nocodestyle/status/1913725219254280453)）
- 本当にライバルだと思っている相手（業種が違う相手も含む）
- 他社と違うところ、推したい魅力。それを証明できるもの（数字・実績・お客様の声・メディア掲載・資格）

**デザインの方向性**（[@kazm_n18](https://x.com/kazm_n18/status/2106217719670682038), [@gun_designer](https://x.com/gun_designer/status/2044398383377649912), [@erika_webdesign](https://x.com/erika_webdesign/status/1748919308800102664)）
- 参考サイトの「どこが」好きか、その理由
- 参考を5〜20個見せて点数をつけてもらい、理由を言葉にする
- 好きなブランドや車など、デザイン以外での好み
- ブランドカラーやトーン、避けたい印象

**素材・運用・環境**（[@nocodestyle](https://x.com/nocodestyle/status/1913725219254280453), [@nagataprogram](https://x.com/nagataprogram/status/2107037833244397575)）
- ロゴ、写真（撮影できるか）、イラスト、原稿（もらうか作るか）
- 必要な機能（フォーム、動画、アニメーション、CMSと更新頻度）
- サーバーとドメインの契約者、今の保守契約、公開後に更新するのは誰か
- SNSアカウント、SEO・MEO・解析の希望

---

## 4. CVにつながる画面設計

### 原則
| # | 原則 | 根拠となる投稿 |
|---|---|---|
| C1 | FVで「誰の、どんな悩みを、どう解決するか」が一目で伝わるか。おしゃれだが具体性のないキャッチは✕ | [@enoyann](https://x.com/enoyann/status/1921707391152009489) |
| C2 | ヒーローを見て5〜7秒で何のサービスか分からなければ失敗。ヒーローに入れるもの：見出し、用途を書いたサブ見出し、流し読みできるベネフィット、CTA、社会的証明 | [@askOkara](https://x.com/askOkara/status/2074112982859264274), [@Frontend_Prince](https://x.com/Frontend_Prince/status/2085706733616312340), [@hewarsaber](https://x.com/hewarsaber/status/1830594909230747981) |
| C3 | 社会的証明（評価・レビュー数・ロゴ・利用者数）はページ上部、見出しより前に置いてもよい | [@tobiframe](https://x.com/tobiframe/status/2037733918946779353), [@Frontend_Prince](https://x.com/Frontend_Prince/status/2085706733616312340), [@SammyLandix4o](https://x.com/SammyLandix4o/status/2107844134346375598) |
| C4 | 広告と着地先の約束・言葉を揃える（メッセージマッチ）。1ページに1オファー、1CTA | [@bradsmith](https://x.com/bradsmith/status/2055281011491999871), [@JunTakeda11](https://x.com/JunTakeda11/status/2022415484361281857) |
| C5 | CTAは1種類に絞り、ページ内で2〜3回繰り返す。各セクションの下に分かりやすいCTAを置く | [@askOkara](https://x.com/askOkara/status/2074112982859264274), [@enoyann](https://x.com/enoyann/status/1921707391152009489) |
| C6 | CTAの文言は製品名ではなく結果を売る（"Shop Now" より "Brew Your Best Sleep"）。「今すぐ登録する」→「今すぐ体験してみる」でクリック率+31%という報告 | [@tobiframe](https://x.com/tobiframe/status/2037733918946779353), [@ryouma_ad](https://x.com/ryouma_ad/status/1987477768775336349) |
| C7 | CTAの近くに安心材料を置く：マイクロコピー（「簡単1分で入力完了」「キャンセルOK」「3,000人が体験」）、ボタンの下に保証。フォームの下に「※途中で離脱しても料金は発生しません」を入れてCVR+23%という報告 | [@manaberu_ad](https://x.com/manaberu_ad/status/1849998544163463610), [@yu_webdesigner](https://x.com/yu_webdesigner/status/1887686325996036415), [@ryouma_ad](https://x.com/ryouma_ad/status/1987477768775336349), [@tobiframe](https://x.com/tobiframe/status/2037733918946779353) |
| C8 | 不安は離脱につながる。読み手の「でも…」に一つずつ先回りして答える（「こんな方にはおすすめしません」、全額返金保証、FAQ） | [@enoyann](https://x.com/enoyann/status/1921707391152009489), [@enoyann](https://x.com/enoyann/status/1922598261485174853), [@akane_furuno](https://x.com/akane_furuno/status/1908742967646707820) |
| C9 | 機能ではなくベネフィット（使った後の生活の変化）を書く | [@enoyann](https://x.com/enoyann/status/1921707391152009489), [@SammyLandix4o](https://x.com/SammyLandix4o/status/2107844134346375598) |
| C10 | 構成の型の例：共感 → 理想の未来 → なぜ今必要か → 解決策（商品）→ 信頼・実績 → 不安の払拭（FAQ）→ CTA（今買う理由）。この順に変えてCV率が0.4%→1.8%になったという報告 | [@akane_furuno](https://x.com/akane_furuno/status/1908742967646707820) |
| C11 | 高額商品は「不安との戦い」。機能を並べる・安さを推す・即決を煽るのは✕。意思決定者の不安を解消し、導入実績と効果を詳しく見せ、検討の過程に寄り添う | [@yuki_web0322](https://x.com/yuki_web0322/status/1868113753767887061) |
| C12 | 「足す」より「引く」。FVを着用写真1枚＋キャッチコピーにし、購入ボタンの周りのバナーを外したらCVRが上がった例 | [@MakeShop_furuya](https://x.com/MakeShop_furuya/status/2030773053119189224) |
| C13 | 権威・信頼：メディア掲載、リピート率、お客様の声、顔出し。第三者の評価で「信じてよい」と思える空気をつくる | [@enoyann](https://x.com/enoyann/status/1921707391152009489), [@rinko3_17](https://x.com/rinko3_17/status/1801561647279898735) |
| C14 | フォーム（EFO）：項目を「今取得しないと困る情報」と「後から確認できる情報」に分ける。エラー表示を分かりやすく、スマホで入力しやすく | [@promo_one_2025](https://x.com/promo_one_2025/status/2110151643283194321), [@official74049](https://x.com/official74049/status/1938066506069512219), [@Design_to2](https://x.com/Design_to2/status/1809699995609911360) |
| C15 | CVR改善の10項目：ペルソナのずれ／広告・LP・コンテンツの訴求の一致／CVハードル（購買意欲に応じて）／CV導線／CTAの見た目／文言とマイクロコピー／EFO／FV／モバイル／表示速度 | [@JunTakeda11](https://x.com/JunTakeda11/status/2022415484361281857) |
| C16 | どこで落ちているかを指標の階層で特定する（CTRが低い→広告文・クリエイティブ、CVRが低い→LPのFVやフォーム）。数値だけでは理由が分からないので、ヒートマップなどで仮説を立て、一つずつ改善する | [@natsu_aiaiai](https://x.com/natsu_aiaiai/status/2106512126357713166), [@signalz_jp](https://x.com/signalz_jp/status/2110602186795126905), [@anytimeAndante](https://x.com/anytimeAndante/status/2113042651075518822) |
| C17 | CVの質を見る（CVは増えたが商談や受注につながらない、という状態に注意） | [@IA_kubota](https://x.com/IA_kubota/status/2108674806912868675) |
| C18 | ペルソナごとに訴求を変えたLPと広告を作り分ける（AIで量産のコストが下がった） | [@ryo_mktg](https://x.com/ryo_mktg/status/2106671834108404119) |
| C19 | モバイル／D2C：社会的証明と星評価をファーストビュー内に、摩擦のない信頼シグナルをすぐ下に置く（本文は途中で切れていて、位置の詳細は未確認） | [@williamdtc2y](https://x.com/williamdtc2y/status/2107828902894751899) |
| C20 | 短い構成で勝つ例もある（動画＋お客様の声5件＋申込ボタンだけ。「LPは短く、証拠は多く」） | [@xNATSUGONx](https://x.com/xNATSUGONx/status/1988219915439141304) |
| C21 | トラフィックを増やす前にページを直す（CVRが1%→2%になればリード数は倍） | [@bradsmith](https://x.com/bradsmith/status/2055281011491999871) |

### CVチェックリスト
- [ ] FVだけで「誰向けか／何が得られるか／次に何をするか」が分かる（5〜7秒テスト）
- [ ] 見出しは具体的（対象者・数字・変化）。中身のない常套句がない
- [ ] 広告や流入元の言葉とFVの言葉が一致している
- [ ] 社会的証明（評価・件数・ロゴ・掲載実績）が上部にある
- [ ] CTAは1種類で、2〜3回繰り返している。文言は結果を表す動詞
- [ ] CTAの近くにマイクロコピーと保証がある（所要時間・費用が発生しない・キャンセル可・返金）
- [ ] ペルソナの不安を洗い出し、それぞれにページ内で答えている（FAQ・保証・「おすすめしない人」）
- [ ] 感情の流れ（共感→理想→根拠→安心→行動）が途切れない
- [ ] CTAの周りに迷わせる要素（余計なバナーやリンク）がない
- [ ] フォームの項目は必須なものだけ。エラー表示は分かりやすく、スマホで入力しやすい
- [ ] 375px幅で、文字サイズ・行間・ボタンサイズに問題がない。表示が速い
- [ ] 計測できる状態で、どの指標の段階で落ちているかを特定できる

---

## 5. その他の強いテーマ

- **デザインを「言葉にすること」自体が商品になる**：「作業」を売るのではなく「売上を上げるデザイン」を提案する（[@kazm_n18](https://x.com/kazm_n18/status/2068306631340040216), [@gun_designer](https://x.com/gun_designer/status/2002307566722818421)）。AIで作った原稿やデザイン案を持ち込まれたとき、デザイナーとして何ができるか（[@miGraphic](https://x.com/miGraphic/status/2111442468252315756)）。
- **センス（taste）は判断として現れる**：AIエージェントはセンスをなくすのではなく、センスがあるかどうかを露わにする（レイアウトが退屈なとき、余白がおかしいとき、デザインに物語がないときに気づけるか）（[@jc_coder1](https://x.com/jc_coder1/status/2051938108728361109)）。
- **AIデザイン用 skill の流行**：Anthropic の frontend-design、Impeccable（init / critique / audit / polish ＋ 決定論的な検出ルール約60）、UI UX Pro Max、Hallmark など、「AIっぽい見た目」を事前に禁止する、または事後に監査する skill が多数出回っている（[@adiix_official](https://x.com/adiix_official/status/2077760072109666579), [@pifagor_dao](https://x.com/pifagor_dao/status/2114420110031003974), [@chenzeling4](https://x.com/chenzeling4/status/2077453398472011867), [@sitin_dev](https://x.com/sitin_dev/status/2008353873342472229)）。一方で「みんなが同じ skill を使えば、それが新しいAIっぽさになるのでは」という指摘もある（[@tkglabs](https://x.com/tkglabs/status/2116509753333674316)）→ 禁止リストだけでなく、案件固有の判断（ブランド・読み手・実物の素材）を必ず入れること。
- **プロンプトに入れるべき観点**：視線導線、情報の優先順位、ジャンプ率、余白設計、コピーライティング、タイポグラフィ、写真のディレクション、配色とライティング、世界観の言語化（[@ane5mama](https://x.com/ane5mama/status/2074604542298292287)）。

---

## 6. ギャップと注意点
- 日本の著名なUI/UXデザイナーやエージェンシーによる、情報設計の深い長文スレッドはあまり拾えなかった（実務者の投稿は「制作実績」や「学習記録」が中心）。IAの理論面（カードソート、ユーザーテストなど）は書籍や記事で補う必要がある。
- 数値つきの改善報告（CVR+23%、0.4%→1.8% など）は投稿者の自己申告で、検証されていない。skill では「事例」として扱い、保証された数字としては使わない。
- 英語圏の「AI slop」関連はツール宣伝の投稿が多い。見え方の列挙は多くの投稿で一致するので信頼できるが、ツールの効果は検証していない。
- 一部の投稿（@revolvtech の18選など）は、詳細が画像内にあり本文では取得できなかった。本文に書かれた項目だけを使っている。
- BtoBのリード獲得型（資料請求やホワイトペーパー）や、BtoBサイトの比較検討向けの設計に特化した投稿は少なかった。アクセシビリティ（コントラスト・フォーカスなど）を正面から扱った投稿もごく少数（Impeccable の audit で触れられる程度）。
- 意見が割れる点：[@MrBallaz](https://x.com/MrBallaz/status/2024071716763242781) はグラスモーフィズムや動きの多いマイクロインタラクションを勧めるが、@FSkifor はグラスモーフィズムを避けるべきものに挙げ、[@melfoy_work](https://x.com/melfoy_work/status/2068276960158011740) は（skill の構成例として）モーションを250ms以内に抑える。skill では「ブランドの理由があれば使ってよい」という判断基準で扱うのが妥当。

---

## 出典一覧（handle → 投稿）
revolvtech: 2111623282420277383, 2111680621424918863, 2112098930825773098, 2112868300673937786, 2111728996266496383 / kawai_design: 2113027556009988318 / ecsite_produce: 2075164820073238577, 2075735829679661459, 2092474702426210648 / ane5mama: 2074604542298292287 / so_ainsight: 2112743182744404033 / okamoto_yuma_: 2031417412009210197 / hide_arugana: 2089510313054114278 / yuhei_design: 2088430490080682131, 1834698587055464536 / CW_kumi: 1999393934599217581 / _yu_tanaka_: 2116364729849724974 / koi_zoom1: 2112415770844221788 / kgsi: 2099414308832866474 / _syukuya: 2112794870004044223 / xxx_UTI_xxx: 2107120740432846942 / Design_emotto: 2111007308906205380 / tkglabs: 2116509753333674316 / misatoo_zukai: 2115380736044015856 / miGraphic: 2111442468252315756 / ll_n_a_o_ll: 2009746503074783557 / syo_izumi: 2034630388560412943
vikktorrrre: 2092618580902728176 / om_patel5: 2025705776434520284 / kieranklaassen: 1992815691339100420 / notEgoyard: 2099520609986154745 / MrBallaz: 2024071716763242781 / iavinashtr: 2115096059966083243 / denizdoingstuff: 2114407641963237633 / vinicsr: 2111109782622912623 / DevaiahShrithan: 2111540255350554743 / jamesm: 2106311114967380176 / FSkifor: 2074734531458851310 / jc_coder1: 2051938108728361109 / milesdeutscher: 2101099200780116104 / itsolelehmann: 2039370884897534337 / muratcan: 1989099477894922679 / wwardenn: 2113039393493749925 / melfoy_work: 2068276960158011740 / pifagor_dao: 2114420110031003974 / ReignSwords: 2115901370197057731 / PartyStraw: 2115859480952913984 / PrakashS720: 2040725071145377817 / adiix_official: 2077760072109666579 / chenzeling4: 2077453398472011867 / sitin_dev: 2008353873342472229 / hewarsaber: 1830594909230747981 / askOkara: 2074112982859264274 / bradsmith: 2055281011491999871
mamafuri_school: 2108382161489502539 / DesignerTomomi: 1958276972217602472 / hug_design_hp: 1888872308007469420 / manaberu_ad: 1892178103545508329, 1849998544163463610 / yu_webdesigner: 1887686325996036415 / KAZ51501118: 1765664828574834783 / Okamoto_Lexa: 1897231984105255049 / irick_web: 1990377405060620573 / arai_artpeace: 2048900000290340951 / kei_ssoken: 1942365513306251398 / likg_0126_mk: 2114883328679567407 / a_mamamochi: 1949574239549612400 / _mmmm512_: 1972442553422336132 / booksoccermark: 1977936146551157115 / file_webcreator: 2107592989153321292
chi_design_0303: 2110513733793378409 / kazm_n18: 2106217719670682038, 2082231382089290188, 2089477627409277333, 2068306631340040216 / gun_designer: 2044398383377649912, 2002307566722818421 / nagataprogram: 2066305946406486386, 2107037833244397575 / msdesign1213: 2037280934928531752 / peachpic37: 1920755227713556858 / EC_hyokori: 2109406186751832076 / ai_kisuke: 1998879237705707808 / ukamai_design: 2068849416245772525 / sosod_44: 1983292705678430655 / halukik_0520: 1993912295802728957 / hashiRdesign_ri: 1806285516976844968 / kanna_design2: 2092024906640736397 / minaWeb0728: 1969674406512488848 / sakuao_Dz: 2017804153142317280 / nocodestyle: 1913725219254280453 / erika_webdesign: 1748919308800102664
enoyann: 1921707391152009489, 1922598261485174853 / Frontend_Prince: 2085706733616312340 / tobiframe: 2037733918946779353 / SammyLandix4o: 2107844134346375598 / JunTakeda11: 2022415484361281857 / ryouma_ad: 1987477768775336349 / akane_furuno: 1908742967646707820 / yuki_web0322: 1868113753767887061 / MakeShop_furuya: 2030773053119189224 / rinko3_17: 1801561647279898735 / promo_one_2025: 2110151643283194321 / official74049: 1938066506069512219 / Design_to2: 1809699995609911360 / natsu_aiaiai: 2106512126357713166 / signalz_jp: 2110602186795126905 / anytimeAndante: 2113042651075518822 / IA_kubota: 2108674806912868675 / ryo_mktg: 2106671834108404119 / williamdtc2y: 2107828902894751899 / xNATSUGONx: 1988219915439141304

---

## 追記 2026-11-02（X公開検索、2026-10-25以降の投稿 25件）

**BtoBのリード獲得**
- 広告から来た人にいきなり相談を求めない。依頼前に専門性・実績を確かめたい人がいる（[@ntcreation_web](https://x.com/ntcreation_web/status/2116363781366276422)）。すべてのコンテンツを「book a demo」で締めるのは早すぎる（[@pranavpiyush](https://x.com/pranavpiyush/status/2116274051324821812)）。「比べている人」に答える記事が問い合わせにつながった（[@HolyTech_Inc](https://x.com/HolyTech_Inc/status/2116371597745614876)、記事への誘導投稿で自己申告）。
- フォーム送信後の体験：「追って連絡します」ではなく、いつ・誰から返事が来るか、予約したい人の方法を書き、確認メールも同じ約束を守る（[@OpenAIGPT5](https://x.com/OpenAIGPT5/status/2116811218694586824)）。デモ依頼の直後にその人のタイムゾーンで予約枠を出す（[@clozqcom](https://x.com/clozqcom/status/2115067677853290669)、予約ツール事業者）。
- 項目数は意見が割れる：名前とメールだけに絞り詳細は後で聞いたら離脱が減った（[@daisuke_hiraoka](https://x.com/daisuke_hiraoka/status/2115005636505391306)）一方、予約フォーム前に予算の質問を1つ足したら見込みの薄い商談が64%減った（[@nadolconverts](https://x.com/nadolconverts/status/2116636481821556926)、自己申告）。「今日予約した理由は？」の自由記述1つで動機が分かる（[@odedra_tarun](https://x.com/odedra_tarun/status/2116357124590903740)）。→ 質を絞る質問は1問まで、で統合。

**EFO（確認・完了画面、スマホ入力）**
- 確認画面は送信直前にもう一度迷いが出る場所。入力内容以外の1行は迷う人への答えとして読まれる。「修正する」で入力値を残す（[@okada_drm](https://x.com/okada_drm/status/2116002173087834597), [同](https://x.com/okada_drm/status/2116124471300166096), [同](https://x.com/okada_drm/status/2115941781825331654)）。送信完了画面を初めてちゃんと見た、という制作者の声（[@tanaka8shouten](https://x.com/tanaka8shouten/status/2114688996085313882)）。
- 電話番号欄で数字キーボードが出ない、メールで@が打ちにくい（[@aiteamos_jp](https://x.com/aiteamos_jp/status/2115753008491544839)）。空のまま送信してエラーの場所が分かるか試す（[@yuitech_ai](https://x.com/yuitech_ai/status/2115707708842127627)）。半角カタカナ強制の項目に利用者が苦情（[@annnnnnnnnnnnna](https://x.com/annnnnnnnnnnnna/status/2114612494140596598)）。

**アクセシビリティ**
- モーダルの閉じるボタンがTabでフォーカスされ、Enterで閉じられるか（[@yama_plugins](https://x.com/yama_plugins/status/2114901105419379058)）。tabindexは0と-1だけ（[@FE_Tips_labo](https://x.com/FE_Tips_labo/status/2115079769842925817)）。
- AIが「Button」という名前のボタンを出し、スクリーンリーダー利用者には何のボタンか分からない（[@releu1](https://x.com/releu1/status/2116596504785744071)）。低コントラスト・ラベルのない入力欄・壊れたキーボード操作（[@designwthmuanya](https://x.com/designwthmuanya/status/2115629000605282669)）。

**AIっぽさ**
- 名前を伏せて判定すると、記号（紫グラデ等）を消しても「AIっぽい」ままだった（[@yutafuru](https://x.com/yutafuru/status/2114322499982725545)）→ 背骨1「判断の欠如」を補強。
- unslopは直す前に方向を見せて止まり、良い画面への直しは2〜3個にとどめる（[@s_kashiwakura](https://x.com/s_kashiwakura/status/2116483642583368148)）。主観的な批評（「もっとすっきり」）だけでUIを反復すると、角丸の調整やコントラストを薄くする堂々巡りになる（[@Kizuno18](https://x.com/Kizuno18/status/2114283893679411320)）。
- 「Frontend Designっぽさ」が新しいAIっぽさになる懸念は今回も再掲（[@tkglabs](https://x.com/tkglabs/status/2116509753333674316)）。スキル紹介・宣伝投稿（MotionSites、Hallmark、Impeccable）は多数あったが効果は未検証のため不採用。

**LP/CVR（既存ルールの再確認のみ）**
- 広告と見出しをできれば一語一句合わせる（[@JustKindling](https://x.com/JustKindling/status/2116834860081762485)）。最大の反論をFVで答える、価格の前に価格の文脈を見せる（[@HaruWealth](https://x.com/HaruWealth/status/2116148702834565543)）。700件の監査で取りこぼしの8割が1画面目（[@binatecagency](https://x.com/binatecagency/status/2114648089705554367)、代理店の自己申告）。

---

## 追記 2026-11-05（X公開検索、2026-11-02以降の投稿 約30件を採用・参照）

**AIっぽさ**
- 「AIっぽさを避ける工夫」そのものが次の年のAIっぽさになる、というQiita記事（Impeccableを読み解き4通り比較）が拡散。紫グラデ→クリーム→太い黒枠という流れ（[@koder_dev](https://x.com/koder_dev/status/2117557900118012105), [@nekoruri](https://x.com/nekoruri/status/2117904029351383496)）。Hallmark等の除去スキルが広まれば「Hallmarkっぽい」が新しい型になる懸念（[@takeda_wataru](https://x.com/takeda_wataru/status/2117536445854519680), [@mogugu8888](https://x.com/mogugu8888/status/2117651586831036820)）。Photoshopっぽさを避ける流行と同じ構図（[@gladdesign](https://x.com/gladdesign/status/2117078475941294454)）。かつての「ブートストラップっぽい」と同じ感覚（[@koudenpa](https://x.com/koudenpa/status/2117528897457983880)）。
- Next.jsの既定フォント（Geist）がバイブコーディングLPの定番書体になりつつある（[@Rubyto](https://x.com/Rubyto/status/2117902338992251391)）。
- 見出しごとの小さなeyebrow、見出しの一語だけ色違い、紫グラデのヒーロー（[@xtools262600](https://x.com/xtools262600/status/2117524934633140318)、ツール紹介）。紫グラデ・角丸カード・機能アイコン3つ（[@BlackShibaShop](https://x.com/BlackShibaShop/status/2117415322495881236)）。
- 実在のデザインを先に作り、エージェントはそれに合わせて組む（[@AyCodeAI](https://x.com/AyCodeAI/status/2117304662860963870)、自社宣伝寄り）。方向性を具体的に伝える（[@kichijojiSINGI](https://x.com/kichijojiSINGI/status/2117887936326943031)）。「いい感じのメニュー」ではなく部品名で指示する（[@shun_nakaoka](https://x.com/shun_nakaoka/status/2118108530377122001)、教材宣伝）。
- unslopの作者自身が、日本語だと採点が思ったほど上がらないと書いていた（[@AIBizNavigator](https://x.com/AIBizNavigator/status/2117587613905293513)）→ 英語圏の除去スキルは和文組版に効きにくい可能性。和文行は人の目で直す前提を維持。
- unslopのチェックで26項目落ち、9回に分けて直して監査リストで再確認（[@themuscleai](https://x.com/themuscleai/status/2117315680211263874)、自己申告）。
- 宣伝・セミナー感想（AI社員SUMMIT関連の複数投稿、hallmark/impeccableのスター数紹介）は効果未検証のため不採用。

**BtoBのリード獲得**
- 問い合わせ前にサイトで見る1位は料金、「価格や費用の目安がわかる」を期待（HubSpot Japan調査の紹介、[@goen_marketer](https://x.com/goen_marketer/status/2117768806210924594), [同](https://x.com/goen_marketer/status/2117829202020110530)）。前回の「価格の前に価格の文脈」（@HaruWealth）と合わせて採用。
- BtoB 351サイトの72%で問い合わせ後の返信目安・流れが確認できず（アスレバ調査、[@logi_today](https://x.com/logi_today/status/2117857306130210931)。調査元はAI商談の事業者なので割り引く）。送信ボタンの手前に「送信後、2営業日以内にメールでご連絡します」（[@samudai_oza](https://x.com/samudai_oza/status/2117052370169602385)）。→ 完了画面だけでなく送信前にも書く。
- 製薬製造のBtoBで、見た目の良いマルチステップフォームのLPより、文章の多い素朴なページ＋短いフォームが勝った。見出しを「売っているものそのもの」に変えたらCVR 6.35%→12.31%（[@CiaranKeady_](https://x.com/CiaranKeady_/status/2117904953796706738)、自己申告）。
- CPLは指標として不十分、商談化まで見る（[@neil_992](https://x.com/neil_992/status/2117225220054356252)）。商談化率は獲得から何日経った分で評価するか営業とそろえる（[@kz_nakagawa](https://x.com/kz_nakagawa/status/2117814107512463735)）。
- タクシー広告で問い合わせが増えなかった。ターゲットは正しかったが「その人の1日」を見ていなかった（[@astrolabinc](https://x.com/astrolabinc/status/2117829193119768639)、1件のため候補止まり）。

**アクセシビリティ**
- Lighthouse 100でもスクリーンリーダーで使えるとは限らない。フォーカス順と状態の読み上げで人もエージェントも迷う（[@dunnohten](https://x.com/dunnohten/status/2117252576462655690)）。操作完了がスクリーンリーダーに通知されない例（[@captechsolution](https://x.com/captechsolution/status/2117251860449137045)）。決済などの主要導線をキーボード・スクリーンリーダーでテストに入れる（[@does_qa](https://x.com/does_qa/status/2118025727253549465)）。ラベルのないボタンはエージェントにも見えない（[@arturlinnikm](https://x.com/arturlinnikm/status/2117272661545902081), [@KeyoAPI](https://x.com/KeyoAPI/status/2117226846198866237)）。カスタム部品はNVDAで試す（[@sahildarz](https://x.com/sahildarz/status/2117538868602011824)）。

**ヒアリング**
- 「悩みは何ですか」ではなく「今は何点？一番の悩みは？それが解決したら何点？」と聞き、点数の理由と理想を語る言葉を見出しに使う（[@sunchysan](https://x.com/sunchysan/status/2117490203631788063)、1件のため候補止まり）。

**LP/CVR（既存ルールの再確認）**
- 広告の約束とLP見出しのズレ（[@LeoDalaz](https://x.com/LeoDalaz/status/2117271917010817435)）。5秒テスト・CTA数・フォーム項目を1つ削る（[@CloudPlaySol](https://x.com/CloudPlaySol/status/2117618850674196563)）。モバイル6秒の表示で多くがフォーム前に離脱（[@deloodin](https://x.com/deloodin/status/2117892674829132275)）。

---

## 追記 2026-11-09（X公開検索、2026-11-05以降の投稿 約35件を採用・参照）

**AIっぽさと直し方**
- 「LPをAI slopに見せない方法は？」という質問（[@callmidavid](https://x.com/callmidavid/status/2119040670933684360)、いいね526・返信107）への返信で多かったのは、形容詞でなく制約を渡すこと：書体1ペア・3色・実在の参考サイト、グラデと絵文字アイコン禁止、スクショを撮って自己批評させてから次へ（[@cbatinberk](https://x.com/cbatinberk/status/2119369222757265623)）、参考2〜3サイト・書体1つ・アクセント1色（[@iamdeepoo](https://x.com/iamdeepoo/status/2119322175471849910)）、「少なく頼む」入れ子カード禁止など（[@NixonPerinchery](https://x.com/NixonPerinchery/status/2119316771224293504)）、ムードボード（[@OdeyemiKevin](https://x.com/OdeyemiKevin/status/2119502811322818650)）、型の尺度・余白リズム・実際の原稿（[@tweaklify](https://x.com/tweaklify/status/2119364789675950366)、自社ツール宣伝）、書体と余白がいちばん効く（[@devfaizanali](https://x.com/devfaizanali/status/2119372760870965260)）、UI以外（車のメーター）も書体の参考にした（[@JakobyMorore](https://x.com/JakobyMorore/status/2119311105700876660)）。
- 先にプロトタイプ（Figma的なモック）を作らせ、その後で実装（[@NwidagKingsley](https://x.com/NwidagKingsley/status/2119353309643378880)）、Figma Makeでモック→Claudeに正確に再現させる（[@ogcodes_](https://x.com/ogcodes_/status/2119325116899234011)）。研修では「元となる資料デザイン」を渡すよう教えている（[@IUTytmr500](https://x.com/IUTytmr500/status/2118861958481064296)）。
- 反対意見：デザインスキルはノイズ、好きなサイトを指して設計システムを作らせ、プロンプトを盛りすぎるな（[@AAjulibe](https://x.com/AAjulibe/status/2119503565039206722)、1件）。
- AIが生成しがちな抽象的なキャッチ（「食卓に、秋のよろこびを。」）が新しい画像モデルでは減った（[@revolvtech](https://x.com/revolvtech/status/2118972818486383052)、ツール開発者）。"Supercharge your workflow with our seamless AI-driven ecosystem" は誰も話さない言葉（[@Jackson__Price](https://x.com/Jackson__Price/status/2119503766026166542)）。
- 定番の型の再確認：紫グラデ・機能カード3枚・「Get Started」・Inter（[@systratools](https://x.com/systratools/status/2118380439173837141)）、どのボタンも光ると重要なものが分からない（[@AnuragKanoria11](https://x.com/AnuragKanoria11/status/2118662460333056302)、宣伝）。紫グラデやキラキラ禁止ルールで作り直した（[@kurabelab](https://x.com/kurabelab/status/2119359198127612164)）。
- AIデザインの問題は品質より「AIだ」が先に伝わり訴求が入らないこと、コテコテの装飾と情報過多（[@PONZ100KG](https://x.com/PONZ100KG/status/2119064325952569602)）。AIっぽさもいずれ一つの様式として扱われる（[@kato_twr](https://x.com/kato_twr/status/2119368546644091348)）。
- Codexでslopを剥がす際、ブランドやデザインシステムを殺さない柔軟な制約にする（[@codex_lab_](https://x.com/codex_lab_/status/2119117120554557668)）。
- 宣伝（教材・ツール・イベント告知）は不採用。

**コントラスト・アクセシビリティ**
- 監査した小規模事業サイトの54%がコントラスト不合格。白地の薄いグレーで電話番号・営業時間・価格が書かれている（[@mkmccarty3](https://x.com/mkmccarty3/status/2118731704969863253)、監査者の自己申告）。料金ページで「free」が読めない（[@Overlap_AI2](https://x.com/Overlap_AI2/status/2118409829832147256)）。購入ボタンと背景の色あてゲーム（[@DuckmarkEC](https://x.com/DuckmarkEC/status/2119005197062320302)）。
- カード番号欄がスクリーンリーダーで「edit, blank」×4、labelがない（[@accessibleso](https://x.com/accessibleso/status/2118373078111846646)、サービス宣伝寄り）。生成UIは初回でスクリーンリーダーに通らないことが多い（[@ferlogs](https://x.com/ferlogs/status/2119204122742358252)）。自動チェックは出発点、キーボードと読み上げで静的ルールが見逃す問題を拾う（[@37off909](https://x.com/37off909/status/2118694838761840901)）。ECの決済が視覚障害者で成功率0%→WCAGに沿った再設計で100%（[@ajsejournal](https://x.com/ajsejournal/status/2118617147933151660)、論文紹介）。

**BtoB・EFO・計測**
- BtoBフォームは、営業に渡した後の使いやすさと離脱の兼ね合いを先に決めてから項目を組む（[@mo_mktg](https://x.com/mo_mktg/status/2118473549904253409)）。「住所、名前、連絡先」をとりあえず必須にするのはやめよう（[@no_fox_here](https://x.com/no_fox_here/status/2118629169131336146)）。
- 資料請求CPAは24%悪化、申込CPAは58%改善。途中の数字だけ見ると失敗に見える（[@Yoggy1123](https://x.com/Yoggy1123/status/2118238449048436950)、代理店の自己申告）。B2Bの成果シグナルはフォーム開始でなく質の高いリード、広告見出しとLP見出しを一語一句合わせる（[@theadgoose](https://x.com/theadgoose/status/2118357523010933162)）。
- 美容医療ではダウンタイムの不安、アフターケア体制をLPで見せる（[@medical_ad_lab](https://x.com/medical_ad_lab/status/2118506058025177353)、既存の「ペルソナ×心理的ハードル」の再確認）。
- 申し込みが少ないとき、見られていないのか・途中離脱か・申込画面か段階を分ける（[@aiteamos_jp](https://x.com/aiteamos_jp/status/2119014499218776248), [@shinya_horoiwa](https://x.com/shinya_horoiwa/status/2118871062729633842)）。
- ABテストで勝ったボタン文言をAI診断が「変えたほうがいい」と言った（[@microcopy_org](https://x.com/microcopy_org/status/2118645063735521544)）→ AIの監査結果より実測を優先。
- X広告のリード獲得広告（フォームがX内で完結）が全広告主に開放（[@webroni_news](https://x.com/webroni_news/status/2118240668502122576)）。デザインのルールではないので記録のみ。

**情報設計・ヒアリング**
- ワイヤーの情報設計の理由を理解せず「私のセンス」で崩すデザイナーへの不満（[@asairo_m](https://x.com/asairo_m/status/2119426975567913047)）。マニュアル理解→ユーザーヒアリング→情報設計→プロトタイプ→ビジュアル→ガイドライン化の流れ（[@seikei_kin](https://x.com/seikei_kin/status/2118502550911770890)、Aitria Designersの記事紹介）。既存のStep順の再確認。


---

## 追記 2026-11-12（X公開検索、2026-11-09以降の投稿 約30件を採用・参照）

**AIっぽさと直し方**
- 「vibe codedのLPは5秒で分かる」系の列挙：紫グラデ、見出しの一語だけ色違い、「✨ New」ピル、Fast/Secure/Simpleのアイコンカード3枚、スクロールで全部フェードアップ（[@reshax0](https://x.com/reshax0/status/2119783865296544068)）。全行中央寄せ、何が始まるか分からない「Get started」（[@nurnabidesigner](https://x.com/nurnabidesigner/status/2119729679968137244)）。光る玉・絵文字つきガラスカード6枚・誰か分からない推薦文（[@devaxsha](https://x.com/devaxsha/status/2120226380378239331)、自作スキルの宣伝）。「Build faster with AI」（[@_vmlops](https://x.com/_vmlops/status/2120453570122371303)）。既存の表でほぼカバー。スクロールのフェードアップは1件のため候補止まり。
- 最近のAIっぽい強調として「筆でざっと塗ったみたいな強調」（[@nagasaki_ponz](https://x.com/nagasaki_ponz/status/2119696002940883428)。同文の投稿 [@UGCoreCcrew](https://x.com/UGCoreCcrew/status/2120622639828046040) があるが同一文面なので1件扱い）。候補止まり。
- Claudeっぽい・Codexっぽいまで分かる、昔の「ホームページビルダーで作ったページ」と同じ感覚（[@takkwebw](https://x.com/takkwebw/status/2120489473360429348)）。曖昧な指示だとDribbble/Awwwards調の「学生の課題」になる（[@PaulyEulerA](https://x.com/PaulyEulerA/status/2120581609007263970)）。研修では元となる資料デザインを渡す（[@TKutschke](https://x.com/TKutschke/status/2120596614809326033)）、デザイン言語を伝え構造化して生成（[@ema_lounge_ai](https://x.com/ema_lounge_ai/status/2120278234587861108)）→既存Step 5の再確認。
- 反対方向の注意：「AIっぽい」という理由で修正指示が入り、AIっぽさは消えたが品質が落ちた（[@FClBrIAt71](https://x.com/FClBrIAt71/status/2120195961909919935)、パワポの例）。囲みをなくせば見やすいわけではない、デザインと視認性を天秤にかけないで（[@WLD_TRUNK](https://x.com/WLD_TRUNK/status/2120604145359241694)）。色とカスタムフォントに凝った案より情報設計を優先した案のほうが売れる（[@kuroruri](https://x.com/kuroruri/status/2120396977129263498)）。→ 直す基準は読みやすさとCV、として採用。
- Anthropicのデザイン指示書が同じ角丸カードの並べすぎや大文字の飾りラベルを定番として挙げている（[@yabi_labs](https://x.com/yabi_labs/status/2119726186771492957)）→既存の表の再確認。
- ルールベースでAIっぽさを検査する無料ツール「impeccable」を試した（[@hayato_ai_help](https://x.com/hayato_ai_help/status/2119993572602855723)）。1件、記録のみ。
- 宣伝（$49リデザイン、教材note等）は不採用。

**BtoBのリード獲得**
- 2027年にはBtoB広告はトップページに送らず、買い手の種類ごとに書かれたページに着地させる（[@maestrotimk](https://x.com/maestrotimk/status/2119882801671500257)、いいね24・ブックマーク26）。$40K/月の検索広告が全部トップページに着地している例で「セグメント別LP」か「商談に最適化する計測の修正」か、の問い（[@RobertJacubs](https://x.com/RobertJacubs/status/2119943143055561147)）。返信の多くは計測が先：フォーム送信に最適化したままだとLPを良くしても間違ったCVが増えるだけ（[@Lmin0711](https://x.com/Lmin0711/status/2119943636356075954)）、良い商談の定義を先に（[@acecreamu](https://x.com/acecreamu/status/2120176335092089024)）、計測を直してから最初のLPのセグメントを選ぶ（[@DmitryBBLV](https://x.com/DmitryBBLV/status/2120235785811038281)）。
- 業種を1つに絞ってLPをその相手だけに語らせる（[@foundrceo](https://x.com/foundrceo/status/2120425856506212488)）。見出しを広告の切り口と一語一句合わせる（[@Hsenju](https://x.com/Hsenju/status/2120502156017225799)、自社ツール宣伝あり）。広告の切り口ごとにサイトの文面を変える（[@brennandunn](https://x.com/i/status/2120155862329147749)、自社ツール宣伝）。
- 高額BtoBは初回訪問で決めない（[@Elsalearns](https://x.com/Elsalearns/status/2119816280765313476)）→既存の「手前の一歩」の再確認。
- 「AI搭載」「オールインワン」「パイプライン10倍」「数千チームが信頼」はどのBtoB SaaSのLPにもある（[@nocode_guy](https://x.com/nocode_guy/status/2120615045423931661)）。AI系はどのLPも同じに聞こえる（[@danifromik](https://x.com/danifromik/status/2119974758972563871)）。→ 常套句の行にBtoBの例を追加。
- 営業の返信が3時間後ならリードは失われる（[@RaphaMassagardi](https://x.com/RaphaMassagardi/status/2119880353410146474)）。デザインのルールではないので記録のみ。

**アクセシビリティ**
- 画像のalt、フォームのlabel、コントラスト、キーボードだけで通れるか、が最初の確認（[@LinnetStudio](https://x.com/LinnetStudio/status/2119890026763067645)、[@weboxcel](https://x.com/weboxcel/status/2120260363534876686)、[@TGG_Plano](https://x.com/TGG_Plano/status/2120086329098690918)）。問い合わせフォームをキーボードだけでTabで通す、写真はaltを付けるか装飾と明示する（[@equalworld_ai](https://x.com/equalworld_ai/status/2120611683328475410)）。375px・44pxタップ・alt・コントラスト・キーボード・フォームエラー（[@mdjunaidap](https://x.com/mdjunaidap/status/2120388552399987138)）。
- AIが書いたaltやメタ情報は見落とされやすく、人の確認が必要（[@AlDev0](https://x.com/AlDev0/status/2119821433580728656)、[@SayyidaSobiyyah](https://x.com/SayyidaSobiyyah/status/2119827352926789971)）。
- 登録フォームで必須項目を空のまま送信し、フォーカスがどこへ行くか確認する。スクリーンリーダー利用者に、ヒントなしでエラーを直して登録を終えられるか試してもらう（[@nirjharhubay](https://x.com/nirjharhubay/status/2120320262289993780)）。

**LP/CVR・計測**
- 「LP改善で5倍」は、何が増えたか・比較期間・元の数字を見る（[@Wassan_Wa3](https://x.com/Wassan_Wa3/status/2119626785621209463)）→既存の「数値は自己申告」の再確認。
- AIで改善案を出すと「もっともらしい」が混ざる、LPレビューでは「どこが迷わせるか」を先に書く（[@L_analysis](https://x.com/L_analysis/status/2120199319202791820)）。前回の @microcopy_org（ABテストの勝ち文言をAI診断が否定）と合わせて、AIの監査結果は仮説として扱うルールに採用。
- 広告→LP到達→フォーム到達→送信のどこで落ちたかを分ける（[@nabenabe8320481](https://x.com/nabenabe8320481/status/2120043351030510043)、[@noujirukun_lab](https://x.com/noujirukun_lab/status/2119622583167717383)）→既存の再確認。最初から個人情報を聞きすぎる（[@beku_AI](https://x.com/beku_AI/status/2119596583062757379)）→既存の再確認。

**ヒアリング・情報設計**
- 最初のヒアリングで7割決まる、残りは媒体そのものの知識（[@MasaDirector](https://x.com/MasaDirector/status/2120085554884645109)）。目立たせたいなら全部を目立たせない（[@discotech_manij](https://x.com/discotech_manij/status/2120146740859056405)、制作実績の紹介）→既存の再確認。

## 追記 2026-11-14（X公開検索、2026-11-12以降の投稿 約25件を採用・参照）

**AIでの作り方・AIっぽさ**
- 「もっと良く」ではなく「セグメントコントロール、下に固定のシート、スケルトンローダー」のように部品名で指示すると製品になる（[@moski____](https://x.com/moski____/status/2121242058027380822)）。AIっぽくしたくないが、参考になる例が少なく、欲しいものを言葉にできるほど知識がない（[@alvi_lai](https://x.com/alvi_lai/status/2120537263587074443)）。vibe codingのデザインではUIと操作の状態が見落とされがちで、エージェントに暗黙・明示の状態を洗い出させると分かりやすくなる（[@maxschen29](https://x.com/maxschen29/status/2121379095737176445)）。→ Step 5の2に追記。
- 8pxの倍数ルールが無視されてAI感が出る（[@VoidLoire](https://x.com/VoidLoire/status/2120441474001301629)）→ 既存の余白スケールの再確認。
- センター配置はAIっぽいと言われるが見やすく、AI感に気づかなかった（[@kenkenpa_3m](https://x.com/kenkenpa_3m/status/2121069649609773566)）。「AIっぽい」で修正指示が入り品質が落ちる（[@Freddywolf68](https://x.com/Freddywolf68/status/2120950211120181614)）→ 前回追加の「直す基準は読みやすさとCV」の再確認。
- 1回の指示で案が5つ出る時代、どこを直すかは人の目、「違和感に気づく力」で差がつく（[@yakumo](https://x.com/yakumo/status/2121088923833364633)）→ 既存のStep 5の5。
- AI製POPを見慣れて安心感を覚え始めている、見慣れで選ばれることもありそう（[@y_hiranai](https://x.com/y_hiranai/status/2121257576977559992)）。1件、記録のみ。
- 紫グラデ、「Revolutionize your workflow ✨」、絵文字つき機能カード3枚、ロゴのない「Trusted by 10,000+ teams」、フッターの© 2023（[@Sambhav06__](https://x.com/Sambhav06__/status/2120889359855690022)）。紫グラデ＋「Build faster with AI」（[@_vmlops](https://x.com/_vmlops/status/2120453570122371303)、前回分と同じ）。
- 宣伝（unslopスキル、Web技法図鑑、25項目監査プロンプト、Kombai等）は不採用。

**LP/CVR・CTA・計測**
- 本物の推薦文・レビューを使う（[@Noah_uiux](https://x.com/Noah_uiux/status/2121151405218046068)、「動画は10倍」は根拠なしのため不採用）。→ 前回の @devaxsha（誰か分からない推薦文）・@nocode_guy（「数千チームが信頼」）と合わせ、社会的証明の行に追記。
- ボタンが明確でも、押した後の約束があいまいなことがある。クリック後に何が起きるかを説明する（[@Mr_Indie_Hacker](https://x.com/Mr_Indie_Hacker/status/2121186051880276441)、記事）。あいまいな「Submit」ボタン、エラー表示が遅い、進捗表示がない（[@OptivSoft](https://x.com/OptivSoft/status/2120886839192031478)、制作会社の宣伝含む）。→ CTAのマイクロコピー行に追記。
- PCとモバイルではCVRが2倍以上違うことも珍しくなく、全体平均では分からない（[@signalz_jp](https://x.com/signalz_jp/status/2120743544692576369)）。BtoBの買い手も立ったままスマホで2分しかないことがある、やりたいことを上に（[@charles_haggas](https://x.com/charles_haggas/status/2120554867726877145)）。→ 計測行に追記。
- フォームの入力項目が増えていてCVRが急に下がった（[@megumiya_ooura](https://x.com/megumiya_ooura/status/2120774070266376585)）。項目7→3で25〜40%増（[@OnePointBusine1](https://x.com/OnePointBusine1/status/2120879335015960752)、数値は自己申告・宣伝）→ 既存の再確認。
- 広告とLPの訴求の一貫性は品質スコアにも関わる（[@minoru_ads](https://x.com/minoru_ads/status/2120538747603386430)）→ 既存のメッセージマッチ。
- 1日単位のCVRはぶれる。施策前後だけでなく変更しなかった群と比べる（[@ad_taiga](https://x.com/ad_taiga/status/2121370020823683247)）。1件、記録のみ。
- 「誰向けか」を先に書くと合わない人は離脱し合う人のCVRが上がる（[@rmrar81383427](https://x.com/rmrar81383427/status/2120818893002534922)）→ 既存のFV 5〜7秒テスト。
- LPは選ばれる瞬間をつくるが、選ばれる理由はLPだけではつくれない（[@YOKKO_fuefuki](https://x.com/YOKKO_fuefuki/status/2121031598753894606)）。記録のみ。

**BtoB**
- 「BtoB SaaSの営業VP向け」と書いたLPは誰向けにも読める。返信する理由を軸にしたLPは自分向けに読める（[@shikalova_cro](https://x.com/shikalova_cro/status/2121234490198786448)）→ 前回追加の買い手別ページの再確認。
- AIエージェントはLPではなくドキュメント・料金・レビューを読む（[@timjcarden](https://x.com/timjcarden/status/2120864464186851706)）→ 既存の料金の目安を出す、の補強。
- 安いリードの数ではなく商談1件あたりの費用を見る（[@radio213](https://x.com/radio213/status/2121228134473474150)）、フォーム送信後の追客が遅いと獲得費が無駄になる（[@FinleySkynner](https://x.com/FinleySkynner/status/2121336799641706565)）→ 既存の計測行の再確認。

**アクセシビリティ**
- 自前の部品を持ち込めると、キーボード操作・フォーカス管理・読み上げラベルを生成のたびに作り直さず、デザインシステム側に保てる（[@AscaiDevLabs](https://x.com/AscaiDevLabs/status/2121283570933301739)）。1件のため候補止まり。
- トップ100万サイトの95.9%にアクセシビリティのエラー（[@yakku_design](https://x.com/yakku_design/status/2120876132430205434)、WebAIM Millionの引用と思われるが投稿内に出典なし）。記録のみ。

## 追記 2026-11-15（X公開検索、2026-11-14以降の投稿 約20件を採用・参照）

**AIっぽさ・新しい定番**
- AIっぽさは「いちばんありがちな見た目」から来る：くすんだベージュや土の色、セリフ体、広い余白。作らせる前に似た分野の実物を集めて数えさせ、その根拠つきで案を出させている（[@y_fujisaki](https://x.com/y_fujisaki/status/2121441741492347130)）。→ SKILL.md冒頭の「新しいAIっぽさ」の例と、実在サイトを根拠に方向を決める一文に採用。
- vibe coderの誰もがブルータリズムUIを使っている（[@Piyush_NextGen](https://x.com/Piyush_NextGen/status/2121635150119555446)）。Claudeのデザイン言語がそのまま署名のように見える（[@cultwrlds](https://x.com/cultwrlds/status/2121744988434522153)）。→ 同上（新しい定番の例）。
- 他のvibe codedアプリと同じに見えた。ムードボード、動く水の背景、フィルムグレイン、読みやすい書体1つ＋個性のある書体1つで直した（[@ceciliakdesign](https://x.com/ceciliakdesign/status/2121748230044323854)）→ 既存の書体1ペア・案件固有のディテールの再確認。
- 客の好きなLP3つから配色と余白だけ抜き出させる（[@kobayashiyuto10](https://x.com/kobayashiyuto10/status/2121746002252267591)）→ 既存の「参考はルールだけ抽出」。
- vibe codedサイトは文字が多く、テキストのカードやチェックリストばかりでビジュアルがほとんどない（[@_Garg_Sarthak](https://x.com/_Garg_Sarthak/status/2121533093081436552)）。1件、既存の「実物のないヒーロー」行の補強候補。
- UIが似るのは既定のプロンプトが同じだから。1人のユーザー・1つの痛み・1つの画面を飛ばしている（[@_pash](https://x.com/_pash/status/2121565662900584496)）→ 背骨の「判断の欠如」の再確認。
- AIデザインが引き算を覚えてきた、ワイヤーが整っていれば一定の成果は出そう（[@maitake_web](https://x.com/maitake_web/status/2121424312968388932)）。AI製同士でもデザイン知識を介入させると情報の優先順位と視線誘導が変わる（[@mabuwo](https://x.com/mabuwo/status/2121481568195907782)）→ 既存の情報設計→ワイヤー優先の再確認。
- 宣伝（Hallmark 65項目のslopチェック、Web制作×ChatGPTキット、LP採点ツール等）は不採用。

**LP/CVR・計測**
- 広告を変えていなくても配信された相手が同じとは限らない。LPだけ直してCVRが上がっても前後比較だけでは理由は決まらない（[@nt773_marketlab](https://x.com/nt773_marketlab/status/2121608628755202517)、記事）。前回記録した @ad_taiga（変えなかった群と比べる）と合わせて2件 → Step 8に採用。
- LP改善には順番がある、全部作り直すと何が効いたか分からない（[@nishimura_meta](https://x.com/nishimura_meta/status/2121709765902377183)）。作り直してもCVRが変わらないときはヒートマップでFV直後の離脱を見る（[@kkrei33](https://x.com/kkrei33/status/2121575372005474323)）→ 既存の「1つずつ改善」「FV 5〜7秒テスト」。
- CTR低→広告、CTR高でCVR低→LP（[@anuenueisland](https://x.com/anuenueisland/status/2121511182037295379)、[@getadplus](https://x.com/getadplus/status/2121731260653453516)）。デバイスで割る（[@LuxWell202601](https://x.com/LuxWell202601/status/2121438283922018569)、宣伝含む）→ 既存の計測行。
- 直すべきは機能ではなく、FVに「誰向けか」の一文がないこと（[@helloshiva0801](https://x.com/helloshiva0801/status/2121579473242063190)）。適合条件をFVに書き、合わない人を予約前にふるい落とす（[@Modulyth](https://x.com/Modulyth/status/2121562206240379219)）→ 既存のFVテスト・「おすすめしない人」。
- ボタン色の0.2%改善より、まずオファー（[@AlwaysPunith_28](https://x.com/AlwaysPunith_28/status/2121453196446978223)）→ 背骨3の再確認。
- 売る側が伝えたい価値と客が払った理由は一致しない、購入者の言葉を見る（[@happyworkmama](https://x.com/happyworkmama/status/2121536364999033326)）→ 既存のヒアリング「お客様がよく使う言葉」。
- 記事LPを手前にはさむ（[@hiroki_muraoka](https://x.com/hiroki_muraoka/status/2121441742939472017)、自社コラムの宣伝）。1件、記録のみ。

**BtoB**
- 「best marketing agency」で1クリック9ドル払っても、LPの見出しが検索語を言っていない（[@ropewrites](https://x.com/ropewrites/status/2121714900238025002)）。広告の着地はLP（1オファー1役割）とサイトを分ける（[@digital_mkt_nj](https://x.com/digital_mkt_nj/status/2121432091065827554)、宣伝含む）→ 既存のメッセージマッチ・買い手別ページ。

**アプリ画面・状態**
- 待ち時間ごとに、何も出さない／スピナー／スケルトン／進捗／楽観的更新／生成中の逐次表示のどれが合うかを判断させるプロンプト（[@Kubai087](https://x.com/Kubai087/status/2121449497171841362)）。1件、記録のみ。

**アクセシビリティ**
- 今回の検索では実務的な新しい投稿は見つからず（日本語の「アクセシビリティ」「資料請求」検索は宣伝・個人の申込報告がほとんど）。

## 追記 2026-11-16（X公開検索、2026-11-15以降の投稿 約20件を採用・参照）

**フォームの到達確認（EFO・BtoB）**
- サイト公開前に問い合わせフォームから実際に1件送る：①送信完了が出る ②自動返信が届く ③担当者の受信箱に届く。テストはスマホから、見当たらなければ迷惑メールも（[@FocusCoreWeb](https://x.com/FocusCoreWeb/status/2121756826626597029)）。
- フォームを置く前に、大量送信対策、自動返信と社内の通知先、入力内容の保存先・期間・閲覧者を確認。通知先が異動・退職者のままになっていないか定期的に見直す（[@youteacherasia](https://x.com/youteacherasia/status/2122110801146527924)）。
- 修正依頼のサイトで、フォームのメールが外部メールサービスに届かずサーバー内で止まっていた（[@Ryo_DS3](https://x.com/Ryo_DS3/status/2121770160075981060)）。
- サイトのフォームがいつから動いていなかったか分からない、というお詫び（[@donantanken](https://x.com/donantanken/status/2121941307291820313)）。→ 4件をまとめてStep 7の確認画面・完了画面の行に採用。
- リードの返信が1日以内でなければフォームは名簿集めで終わる（[@siftydeals](https://x.com/siftydeals/status/2121770202400473237)）→ 既存の「いつ・誰から連絡が来るか」の補強。

**ヒアリング**
- リニューアル後に「前のほうがよかった」と言われる。困りごとだけでなく、残したいもの（ページ・デザイン・機能）を最初に聞く（[@tommyitenginner](https://x.com/tommyitenginner/status/2121800361165951008)）。1件、次回以降に裏付けが出たら検討。
- ヒアリングのメモが、実は自分が作りたいものを後から言語化する材料になっていた（[@sho_kaito_0703](https://x.com/sho_kaito_0703/status/2121811191836115047)）→ 既存の「好みより困りごと」の再確認。
- デザインの目的を「おしゃれに」で終えず、成果を1つの行動（申込・問い合わせ・来店・資料請求）に置き換えてから形にする（[@Tokyo_C_H](https://x.com/Tokyo_C_H/status/2121936250374692916)）→ 既存のCVの定義。

**AIっぽさ**
- vibe codedのLPはどれも3語の断片で話す：「Ship faster. Stay focused. Own it.」（[@Astrodevil_](https://x.com/Astrodevil_/status/2122019302920556985)）。1件、常套句行の補強候補。
- デザインスキルを読ませる以外に良い解決が見つからないが、時間がたてばスキルのガイドライン自体もslopになる（[@PreciousBa82157](https://x.com/PreciousBa82157/status/2121988346411180197)）→ 冒頭の「除去スキルの出力も型になる」の再確認。
- AIっぽいかどうかより、顧客が知りたい情報を明瞭に、不要な情報を最小限に、誤解を招かない日本語で（[@joseph6souza](https://x.com/joseph6souza/status/2121879426464182361)）→ Step 6注意の「直す基準は読みやすさとCV」の再確認。
- AIっぽさはLPの部品ごと（FV・ボタン・料金表・FAQ）に直す（[@yutafuru](https://x.com/yutafuru/status/2121823204956057873)、記事への誘導）→ 既存の「範囲を絞って小さく反復」。
- 「AIのデザインがダサい」の正体は参照の不在（[@freedomofeco](https://x.com/freedomofeco/status/2121933339817119768)）→ 既存の「見本を見せる」。
- 宣伝（Google Stitch・Modulifyの紹介、プロンプト集、デザイン見本サイト）は不採用。

**LP/CVR**
- ABテストでCVRが上がっても、反響後の成約率が落ちていたら意味がない（[@ad_taiga](https://x.com/ad_taiga/status/2121943800545472625)）→ 既存の計測行（商談化・申込まで追う）。
- 動画で魅力を伝え済みの流入では記事LPより商品LPが勝った（[@minoru_ads](https://x.com/minoru_ads/status/2121784103708291539)、数値は自己申告）。1件、記録のみ。
- きれいなLPでも流入チャネルが違えば誰もCVしない、コピーより先にチャネルを直す（[@rcmisk](https://x.com/rcmisk/status/2122088627857473848)）→ 既存のメッセージマッチ・CTR/CVRの切り分け。

**アクセシビリティ**
- vibe codedのUIがほぼ必ず飛ばすのはroving focusとtypeahead（[@__Ashiq__](https://x.com/__Ashiq__/status/2121828021485355118)）。1件、記録のみ。

## 追記 2026-11-17（X公開検索、2026-11-16以降の投稿 約20件を採用・参照。裏付け確認のため一部は2026-11-10以降まで遡った）

**アクセシビリティ：色だけで意味を伝えない**（Step 4の状態色に追記）
- コントラストは機能。本文4.5:1、色だけで意味を示さない、グレーにグレーは読めない、実機を日光の下で確かめる（[@Michael04_06](https://x.com/Michael04_06/status/2122192943800889832)）
- 入力エラーの赤枠は赤が見えない人には意味がない。「メールアドレスに@がありません」と文で添える（[@HRWebKind](https://x.com/HRWebKind/status/2122248639762309176)）
- 問い合わせフォームで未入力の欄は、赤枠だけでなく横に文で「電話番号を入力してください」と書く（[@equalworld_ai](https://x.com/equalworld_ai/status/2120898241818750986)）
- 選択中のタブは色だけでなく下線や太字も付ける（[@yama_plugins](https://x.com/yama_plugins/status/2120679107810001395)）
- 畳んだ後の状態が色だけで運ばれている。小さいと黄とオレンジが見分けにくいので小さな記号を残す（[@phongdesigns](https://x.com/phongdesigns/status/2121147150042374237)）

**アクセシビリティ：ダークモード・テーマ切替のコントラスト**（Step 6のコントラスト行に追記）
- テーマ切替後も、ボタン・入力欄のコントラスト、透過背景のロゴ、暗いまま残りがちなOG画像を確認する（[@MilosNitiva](https://x.com/MilosNitiva/status/2122263637326766415)）
- ダークモードに甘い基準はない。文字4.5:1（大きい文字3:1）、枠・アイコン・フォーカスリング3:1。背景だけでなく一段明るい面の上の文字も測る（[@tiffrentamine](https://x.com/tiffrentamine/status/2122307306805223725)）
- 公開日のダークモードで、黒いPNGロゴが黒に近いヘッダーに載っていた（[@valeharex](https://x.com/valeharex/status/2121028544252031032)）
- 黒に近い背景のグレー文字は、白背景の薄いグレーと同じく不合格になりやすい（[@houssam_atiche](https://x.com/houssam_atiche/status/2120622945135374825)）
- ライト・ダーク共通のブランド色は3:1（ボタン・大きい文字）なら両方で通る範囲があるが、4.5:1（本文）を両方で満たす色はない（[@markRussellDev](https://x.com/markRussellDev/status/2120207360996294717)、計算は投稿者の主張）
- コントラストは前景と背景の組で決まる。ライト・ダークそれぞれで組を全部測る（[@kunalbairwa232](https://x.com/kunalbairwa232/status/2122358032902607341)、自作ツールの紹介を含むため割り引き）
- 小規模事業者サイト12,682件の71.5%で文字コントラストが低い（[@MoonTailStudio_](https://x.com/MoonTailStudio_/status/2122207255693299975)、出典の確認なし）、WebAIM Million 2026で上位100万ページの95.9%が基本チェック不合格（[@plegotech](https://x.com/plegotech/status/2122452787329904657)、孫引き）→ 既存のコントラスト行の再確認。数字は根拠として使わない

**CTA・フォーム（既存ルールの再確認）**
- 「Get Started」は何を始めるのか分からず押されない。得られるもの（「枠を予約する」など）を書く（[@reshax0](https://x.com/reshax0/status/2122322998673969379)）→ 既存のCTA文言・マイクロコピー行
- 「無料相談」を押したら入力15項目。相談するか決める前に会社名・役職・住所まで求めると面倒になる（[@datamkting](https://x.com/datamkting/status/2122125005932921109)）→ 既存のフォーム項目行
- CPA・CVRが改善しても、問い合わせへの返信が何時間後かを見る（[@datamkting](https://x.com/datamkting/status/2122449687752159551)）→ 既存の返信の目安・商談化まで追う計測。運用側の話
- 入力エラーは謝罪より「何が起きたか」「どう直すか」の2つ（[@ykobayashi_work](https://x.com/ykobayashi_work/status/2122295760826048665)）→ 既存の空送信テスト
- フォームの入力項目数で離脱を見る（[@joe_siteaf](https://x.com/joe_siteaf/status/2122178737232117855)）→ 既存。UTAGEの紹介（@yuiro_inc）は宣伝のため不採用

**AIっぽさ・制作の進め方（既存ルールの再確認）**
- 共有された「AI slop」の例のほとんどは、AIは頼まれた通りにしていて、公開前に誰も結果を見ていなかった（[@yyjhao](https://x.com/yyjhao/status/2122405576974176370)）→ 既存のStep 5の4（監査を別工程で）
- vibe codedアプリはスケールより先に状態（空・読込中・エラー・オフライン）で破綻する（[@i1xhi](https://x.com/i1xhi/status/2122382203820605602)）→ 既存の3状態。オフラインは1件、記録のみ
- LP制作はデザインより先に情報設計を固める方が強い（[@brent_orti67997](https://x.com/brent_orti67997/status/2122283850554347781)）→ 既存のStep 3
- 「AIは足し算は得意。きれいなんだけど、なんか違う」（[@KAOTAKEAGARU](https://x.com/KAOTAKEAGARU/status/2122473939826020434)）→ 既存の「足すより引く」
- 「デザイン案をもっと出して」が出たら、原因は技術ではなく意思決定の仕組み（[@Tsukasa13711003](https://x.com/Tsukasa13711003/status/2122261706508484970)、本文は途中まで）→ 既存のStep 8の判断軸。1件、記録のみ
- 初回ヒアリング前に、サイトとパンフレットだけで分かる範囲の事業の俯瞰図を描いておく（[@kajicon8](https://x.com/kajicon8/status/2122181638868070612)）→ 既存のStep 1「手元の資料を先に読む」
- 不採用：DesignBookmark・Canva AI・unslopovich・素材サイトの紹介（宣伝）、Fable 5.2で受注した話（宣伝・自己申告）

## 追記 2026-11-18（X公開検索、2026-11-16 23:00 UTC以降の投稿 約20件を採用・参照）

**情報設計（構成の順番と見た目の強弱）**
- 情報設計で順番を決めても、デザイン上の強弱が逆なら意図は伝わらない。構成の順序と視線の順序の両方が揃って機能する（[@frameby_z](https://x.com/frameby_z/status/2122679669225107614)）→ Step 3の3に追記
- LPのFVでは見た目の綺麗さ以上に視線の流れ（情報が入ってくる順番）を意識する。強みがどこか分からない・どこを読めばいいか迷う状態だと離脱する（[@___eridesign](https://x.com/___eridesign/status/2122645931145519235)、本文は途中まで）→ 同上
- 情報の整理ができていない問題に、配色や装飾の調整だけでは根本的な解決にならない（[@ymnodesignf](https://x.com/ymnodesignf/status/2122735392847962489)）→ 同上
- 自由なイラストと規則的な情報設計（整ったグリッドの文章）の対比（[@keita_webcreate](https://x.com/keita_webcreate/status/2122468955453567257)、参考サイト紹介）→ 記録のみ

**AIっぽさ（既存ルールの再確認）**
- 「AIっぽい画面」を挙げた国内記事12件中10件が、同じデザインのカードを均等に並べる作りを挙げていた。トップのカード6枚を番号つき手順4つと小見出しつき段落に変えた（[@jumon_koubou](https://x.com/jumon_koubou/status/2122661030727995540)、自己申告）→ 既存のStep 6「同形カード3枚」「見出し→アイコン→テキストの繰り返し」
- 参考URLを渡して「いい感じにして」と一言頼んでも、AIっぽい出力は変わらなかった（[@koinu_ai_lab](https://x.com/koinu_ai_lab/status/2122749360727613803)）→ 既存のStep 5の2（形容詞ではなく制約と見本で渡す）
- 無難なAIっぽい画像を、市場で売れている実物を調べ直し、色の世界を1つに絞って作り直した（[@maa_sns_jidoka](https://x.com/maa_sns_jidoka/status/2122520739861631443)）→ 既存の冒頭「同じ業種の実在サイトを集める」
- AIが作った画面をそのまま出すと、のっぺりした安っぽいデザインになる（[@yuu_a_prog](https://x.com/yuu_a_prog/status/2122661277579284620)）→ 既存のStep 5の4
- AIっぽいデザインを見抜く目は磨き続けないと衰える。Tailwindっぽさも過去の話で流行がある（[@yhassy](https://x.com/yhassy/status/2122568487201902884)）→ 既存の冒頭「新しいAIっぽさ」
- AI生成アプリが似るのは、AIが最初に思いついたレイアウトで決めて誰も2案目を見ないから（[@Suryanshti777](https://x.com/Suryanshti777/status/2122738839328567557)、[@heyshrutimishra](https://x.com/heyshrutimishra/status/2122750559602323721)）→ どちらもFloot Designの宣伝のため割り引き、記録のみ（既存のStep 8「複数案と判断軸」）
- AI製に見えるのは毎回ゼロからスタイルを作るから。先にデザインシステムを渡す（[@mokhames1987](https://x.com/mokhames1987/status/2122784327050334281)、リポジトリ紹介）→ 既存のStep 4・Step 5の1
- UIがほとんど文字で表現されるAI感（[@yutoVR](https://x.com/yutoVR/status/2122567926322770157)、講演メモ1行）→ 11-15の「文字ばかり」と合わせて2件目。上のカード→段落の例と方向が逆なので記録のみ
- 「クリーム背景・細いセリフ・ピルボタン」がAI slopの典型（[@JohnxxWang](https://x.com/JohnxxWang/status/2122781599783874882)）→ 既存の冒頭の例。ツール宣伝のため割り引き

**BtoB・リード獲得・計測**
- リード獲得は、フォーム送信あたりの費用ではなく有効リードあたりの費用で見る（[@GoogleAdsGenius](https://x.com/GoogleAdsGenius/status/2122617478136140286)）、「フォーム送信」をCVにすると自動入札がスパム込みでフォームを埋める人を集める。折り返して本物だったリードだけを数える（[@ahmetselimcil](https://x.com/ahmetselimcil/status/2122740886660346137)）、広告はどの送信が顧客になったか知らない（[@zeeshangooglead](https://x.com/zeeshangooglead/status/2122751625609744504)）→ 既存のStep 7計測行「商談化まで追う」
- デモ・トライアルのフォームへのAIエージェントの送信が件数とCVRを水増しし、営業の時間を奪う（[@marko_metrics](https://x.com/marko_metrics/status/2122629328639046069)）→ 1件、記録のみ
- 予算や時期など1〜2問足すとリードは減るが、来た人は電話に出る（[@tryduggie](https://x.com/tryduggie/status/2122739599214796973)）→ 既存のフォーム行「質を絞る質問は1問まで」
- 製造業はRFQフォームで仕様・数量・技術要件を先に集める（[@nkv_dev](https://x.com/nkv_dev/status/2122625793125941572)、宣伝）→ 記録のみ
- LP到達率・スクロール率・フォーム開始率を広告ごとに並べると、広告側とLP側の改善を分けて評価できる（[@nexray_net](https://x.com/nexray_net/status/2122714407331594610)）→ 既存の計測行
- CPA悪化時にクリエイティブ・ターゲティング・予算・LPを一度に変えない（[@ad_cate2016](https://x.com/ad_cate2016/status/2122615739831955900)）→ 既存のStep 8「1つずつ改善」

**アクセシビリティ**
- AIエージェントはボタンの意味を見た目で判断できず、aria-labelなどアクセシビリティ層を読む。a11yがエージェントのUXになった（[@raufsamestone](https://x.com/raufsamestone/status/2122692876337287505)）→ 既存のStep 6「動作が分かるボタン名」。1件、記録のみ
- 全盲のVoiceOver利用者：「ネットで商品を選べること」と「最後まで安心して購入できること」は同じではない（[@oiken0802](https://x.com/oiken0802/status/2122494935974691270)、本文は途中まで）→ 既存の「主要導線をキーボードで通す」
- ツールによる自動診断と障害当事者の操作レビューの組み合わせ（[@UnleashMeet](https://x.com/UnleashMeet/status/2122464742946332846)）→ 既存の「自動スコアだけで合格にしない」

**マイクロコピー**
- 「66%」と「3人中2人」で伝わり方が変わる（[@microcopy_org](https://x.com/microcopy_org/status/2122655237420794206)、106%増は自己申告）→ 1件、記録のみ

- 不採用：アンチグリッドが2026年のトレンド（@kazm_n18、流行の断定）、unslop等のスキル・ツール紹介（@FoundryVibe、@TatsumiSho23、@voidinsteadface、宣伝）、ヒアリング7項目（@tatsu_studio、本文が途中までで内容を確認できず）

## 2026-11-19 追加（定期見直し。2026-11-18 08:00〜11-19 09:00 JSTの投稿）

**AIっぽさ**
- AIっぽくしないための禁止：フチ文字・ドロップシャドウ・光彩、文字の変形・飾りの線、カードの上や左の色帯。「使わない」で終わらせず代わりにどう整えるかまで指示する（[@kawai_design](https://x.com/kawai_design/status/2122985668410331295)、有料プロンプトの宣伝）→ AIっぽさ表の色帯カードを修正
- 同じLPで「AIっぽさ除去」スキル3種と素のプロンプトを比較。4つ中3つが同じ書体と同じ絵文字カードを選んだ（[@TabishHassanDev](https://x.com/TabishHassanDev/status/2123022731746869387)、スコアは本人の基準）→ 既存の「除去スキルの出力も型になる」
- 磨き直しを頼む前に375pxで開き、主ボタンが埋もれていたらスクショを送ってその1点だけ直させ、新しいスクショで確かめる（[@AnriVibeCode](https://x.com/AnriVibeCode/status/2123166274457125134)）→ 既存のStep 5「範囲を絞って小さく反復」と375px確認
- AIに「デザインして」と頼む前に、デザイナーとして自分にヒアリングさせた（[@sumocon](https://x.com/sumocon/status/2122942038442467825)）→ 既存のStep 1・Step 5-1

**ヒアリング**
- ヒアリング7項目：目的・コアメッセージ・ペルソナ・流入経路・ゴール・トンマナ（好きなサイトと苦手なサイト）・USP（[@tatsu_studio](https://x.com/tatsu_studio/status/2122967138743017881)）→ 既存のStep 1でほぼ網羅。「苦手なサイト」は既存の「避けたい印象」

**LP/CVR**
- 申込み直前に読み手は「料金の総額」「申し込んだら何が起きるか」「キャンセル・変更できるか」を確かめる（[@d_r_e_design](https://x.com/d_r_e_design/status/2123205172877054024)）→ 既存のCTA付近マイクロコピー
- 構成案は中身より先にFVを作る。FVで離脱しているなら下を直しても届かない（[@hiroki_muraoka](https://x.com/hiroki_muraoka/status/2123181957807034655)）→ 既存の5〜7秒テスト

**BtoBリード獲得**
- Google広告エディタ2.14は新規検索キャンペーンでAI Max（最終ページURL拡張を含む）を既定でオンにする。選んだLP以外に着地し、固定した見出しも外れる。BtoBではデモ広告のクリックがブログ・採用・ログイン画面に飛びうる。キャンペーンごとに固定か拡張かを決め、リードにならないページを除外する（[@louiejancevski](https://x.com/louiejancevski/status/2123084279420698932)）→ 1件、記録のみ（メッセージマッチに関わる）
- 資料請求は増えたのに商談が増えないなら、ダウンロード後の情報提供（事例・比較資料・セミナー）を見る（[@yoshikazunomori](https://x.com/yoshikazunomori/status/2122933080524505396)）→ 既存の「商談化まで追う」

**アクセシビリティ**
- スライダーには停止ボタンを。読んでいる途中で切り替わると集中しづらい人がいる（[@yama_plugins](https://x.com/yama_plugins/status/2122875462028566791)）→ アクセシビリティ行に追加（WCAG 2.2.2と一致）
- アイコンだけのボタンにラベルがないとスクリーンリーダーが何も読めない（[@qalaburlreview](https://x.com/qalaburlreview/status/2123174188135460963)、[@Vispero_HQ](https://x.com/Vispero_HQ/status/2123129694346256741)）→ 既存の「動作が分かるボタン名」

- 不採用：アンチAIスロップ素材集（@viktoroddy、宣伝）、AIっぽいUIを減らすスキル10選の紹介（@websitebooster_、紹介のみ）、ヒートマップ記事・LP診断・セミナー告知（@Leadplus_jp、@sugu_lp、@IncNadarak42472、@BtoB_hachiware、宣伝）

## 2026-11-20 追加（定期見直し。2026-11-19 09:00〜11-20 09:00 JSTの投稿）

**EFO・フォームの不安**
- 個人情報流出・詐欺報道が増え、クレカ登録や申込時の個人情報入力で大きく離脱する。LPやフォームで事業者の安全性を示すと申込率が上がった（[@D4Csuperdragoon](https://x.com/D4Csuperdragoon/status/2123429288074777005)、数値なし・体感）→ フォーム行に「何に使うかを入力欄の近くに書く」を追加
- 無料査定の段階で個人情報をがっつり取る形式はためらう人が多そう（[@L_FORCE_mtl](https://x.com/L_FORCE_mtl/status/2123001519196848583)、11-18）→ 既存の「今必要な項目だけ」と同趣旨
- 申込みが面倒：フォームが長い、最初から個人情報を聞きすぎる（[@Macho849Joan](https://x.com/Macho849Joan/status/2123032886844530797)、11-18）→ 同上
- 「絶対に漏らさないシステム」より、不要な個人情報をそもそも預からない選択肢がある（[@free_eng_live](https://x.com/free_eng_live/status/2123262538422911222)）→ 同上

**アクセシビリティ・状態**
- グレーアウトの無効ボタンを理由を知らずに出すと、スクリーンリーダー利用者が困る（[@jecture_a11y](https://x.com/jecture_a11y/status/2123446316760019237)、記事への誘導）→ 状態の行に追加
- 生成後に分かりにくい無効ボタンを出していたのを「Generate again」に変えた（[@woshiyanali](https://x.com/woshiyanali/status/2123283603127751034)、自社ツール）→ 同上の2件目
- div にクリック処理をつけてもボタンにならない（Tabで届かない、Enter/Spaceが効かない、読み上げされない）（[@kelvinescka](https://x.com/kelvinescka/status/2121296100590043516)、11-13）→ 既存の「キーボードだけで通す」

**LP/CVR**
- LP改善はボタン色の前に、広告とLPの訴求一致、FVで価値が伝わるか、申込前の不安解消の3点（[@yoshikazunomori](https://x.com/yoshikazunomori/status/2123295540574142755)）→ 既存のメッセージマッチ・5〜7秒テスト・不安への回答
- CTAを強めても判断材料が足りなければ押し切る設計になる。誰向けか、自分の状況として課題を確かめられるか、導入後に何が変わり何が変わらないか（[@Strategia_KH](https://x.com/Strategia_KH/status/2123545728534352157)）→ 既存の不安への回答・ベネフィット。「変わらないこと」も書く視点は1件、記録のみ
- 作り直す前に見直す5か所：最初の画面・ボタン・フォーム・表示速度・広告との言葉のずれ（[@aidac_kondou](https://x.com/aidac_kondou/status/2123234809644532052)、宣伝あり）→ 既存

**BtoBリード獲得**
- トップページは全員向け、LPはその検索に答える。入札をいじる前に、すでにCVしているページへ予算を寄せる（[@GoogleAdsGenius](https://x.com/GoogleAdsGenius/status/2123348756347199970)）→ 既存の「広告の着地をトップページにしない」
- BtoB SaaSのLPを11セクションから6に削り、60日後デモ依頼38%増（[@ignatdesigner](https://x.com/ignatdesigner/status/2123378945168986330)、自己申告）→ 1件、記録のみ

**情報設計**
- 新規ページの要望に、更新頻度と運用負荷を比べて既存ページの情報設計見直しを提案。作らなかった理由を説明できること（[@ren_it_career](https://x.com/ren_it_career/status/2123543092502376609)）→ 既存のStep 8「それ本当に必要ですか？」

- 不採用：AIっぽさを消すキット・スキル紹介（@synapse_vector、@TatsumiSho23、@Ivy_museAI、@iamtanzil_、@Dionisselamii、宣伝）、「Start a Free Trial」と「Request a Demo」が4:1（@bahuvidha、意味が曖昧で根拠なし）、vibe coded UIへの感想のみの投稿多数

## 2026-11-21 追加（定期見直し。2026-11-20 09:00〜11-21 09:00 JSTの投稿）

**メッセージマッチ・広告設定**
- Google Ads Editor 2.14で新規検索キャンペーンのAI Maxが既定オン。自動の検索語マッチ、AI生成の広告文、最終ページURL拡張を含む。公開前に設定を確認（[@OSDDigital](https://x.com/OSDDigital/status/2123703091329475031)）→ 11-19の @louiejancevski に続く2件目。Step 7のメッセージマッチ行に追加

**アクセシビリティ**
- タップ対象はWCAG 2.2で24×24 CSS px以上か十分な周囲の間隔。近接した小アイコンとリンクを確認（[@nickshiftlives](https://x.com/nickshiftlives/status/2123906897216434400)）→ 1件だがWCAG 2.2の達成基準2.5.8と一致。既存の「タップサイズ確保」を具体化

**AIっぽさ**
- プロのデザイナー35人がAIと人のデザインを名前を伏せて見比べた調査で、AI作品に多かったのは濃いグラデーションと光って見えるボタン（[@osarupolice](https://x.com/osarupolice/status/2123776626626277879)、調査の出典は投稿内で未確認）→ 既存のAIっぽさ表1行目と同じ
- 作る前に誰に何を見せるページかをPRODUCT.mdに書かせるのがAIっぽい無難なデザインを避ける近道（[@Claudecodehelp](https://x.com/Claudecodehelp/status/2123719031962103825)）→ 既存のStep 5の1
- 情報ぎっしりのAI製インスタ画像より、必要最低限を画像で伝えて本文へ誘導する方が読みやすい（[@web_maeco](https://x.com/web_maeco/status/2123636343062532373)）→ 既存の「主役を1つ」

**LP/CVR・BtoB**
- B2B広告で問い合わせが減ってもすぐLPを変えず、CTR・直帰など手前の数字から確認する（[@anan_e](https://x.com/anan_e/status/2123885601003028941)）／CPAはCPC÷CVR、まずどちらが動いたか分け、計測タグの欠けも確認（[@nexray_net](https://x.com/nexray_net/status/2123802276678488152)）→ 既存の計測行
- コピーを磨く前に、お客さんが実際に使った言葉（「最初は○○が不安だった」「Aと迷ったけど△△で決めた」）を集める（[@merumeruaffi](https://x.com/merumeruaffi/status/2123702892779692508)）→ 既存のStep 1・2
- AIでLPの案は安く作れても流入は増えない。小さな調整を量産せず、大きく違う案を少数テストし、その選定にレビュー・問い合わせ・アンケートを使う（[@AmitKolton](https://x.com/AmitKolton/status/2123839747445408067)）→ 1件、記録のみ
- ヒーロー下に信頼の証拠と価値の説明を足すABテストでCVR+7.48%（[@jay_neyer](https://x.com/jay_neyer/status/2123876536306774167)、自己申告）→ 既存の社会的証明
- 情報収集や比較がAIの中で済むようになり、サイトは「調べに来る場所」から「確かめに来る場所」へ。事例・サービスページほど情報設計が問われる（[@shin8ka10](https://x.com/shin8ka10/status/2123683706749776291)）→ 1件、記録のみ

- 不採用：AIっぽさを消すスキル・リソース紹介（@Dionisselamii、@FumiShingai、宣伝・まとめ）、AIスロップへの感想のみの投稿多数、ペルソナ（ゲーム）・求人などの無関係な投稿

## 2026-11-22 追加（定期見直し。2026-11-21 09:00〜11-22 09:00 JSTの投稿）

**アクセシビリティ・フォーム**
- デザイナーから、プレースホルダーに入力例やラベルを入れたデザインがいまだに出てくる（[@yshimizu125](https://x.com/yshimizu125/status/2124008041934999944)、#a11yconf_fukuoka）
- 入力欄にはすべてラベルを。入力すると消えるプレースホルダーはラベルではない。読み上げで飛ばされ、途中で何を聞かれていたか忘れる（[@mikwebsolutions](https://x.com/mikwebsolutions/status/2124143348521091339)）
- 予約フォームはプレースホルダーだけでなく欄の上に見えるラベルを（[@equalworld_ai](https://x.com/equalworld_ai/status/2122055837774680556)、11-15）／薄いグレーのプレースホルダー「MM/DD/YYYY」はコントラスト2:1前後になりがちで、日付の形式がそこにしかないと困る（[@equalworld_ai](https://x.com/equalworld_ai/status/2123078164247445761)、11-18）→ 計4件。Step 6のアクセシビリティ行のlabelに追記
- ブラウザの自動入力やパスワード管理ツールが使えるかもアクセシビリティ（[@emim](https://x.com/emim/status/2124007632079855705)）→ 1件、記録のみ
- Tabで移動できないフォームは使いづらい（[@kishimin_test](https://x.com/kishimin_test/status/2124011694599111050)）→ 既存のキーボード操作の行
- 大きな組織でアクセシビリティがばらつく最短の道は、各チームに部品を作らせること。デザインシステムに持たせる（[@desaraev](https://x.com/desaraev/status/2124262840865263753)）→ 11-14の見送り分と同趣旨。11-19の @ux_brad・@jecture_a11y は同文の投稿で独立した根拠とみなしにくく、受託の規模では効きにくいため記録のみ

**AIっぽさ**
- 同じお題でAIにLPを10回作らせると見出しも構成も同じ所に落ちる。デザインはそのままで言葉と順番だけ直した（[@tantakatannoke](https://x.com/tantakatannoke/status/2124110586569011670)）→ 既存の背骨1・Step 3
- AIっぽいデザインを避けるには禁止を挙げるだけでなく、代わりにどう整えるかまで指示する（[@Kanata_Muse](https://x.com/Kanata_Muse/status/2124081842974560283)）→ 既存の冒頭の注意
- LPに🎉が2つと出典のない「5x faster」があってAIスロップと判定された（[@yannessss_h687](https://x.com/yannessss_h687/status/2124271785822790003)）→ 既存の常套句・社会的証明の行
- 「vibe codedに見せるな」とAIに言うだけでは足りず、UI/UXと目的を理解し、AIが作りすぎた分をどこまで削れるか判断する必要がある（[@CarlsonJustin](https://x.com/CarlsonJustin/status/2124264296506868215)）→ 既存の背骨1

**LP/CVR・BtoB**
- 問い合わせが少ない原因はデザインの古さより、比べている人が知りたい情報が足りないことの方が多い（[@sakayu9803](https://x.com/sakayu9803/status/2124065361431826560)）→ 既存のStep 3のBtoB
- CPAが上がったらクリック単価とCVRのどちらが動いたかを先に見る（[@kazuya_addct523](https://x.com/kazuya_addct523/status/2124281718102425632)）→ 既存の計測行
- FVに全部詰め込まず、誰のためのサービスかから考える（[@aiteamos_jp](https://x.com/aiteamos_jp/status/2124087930390237268)）→ 既存の「主役を1つ」

- 不採用：AIっぽさ除去スキル・リソース紹介（@WakeAlen、@Dionisselamii、@Alok619308、宣伝・まとめ）、CRO代理店の営業投稿（@alex_momeni、@saadimarketing など）、ゲーム「ペルソナ」・イベントの入力フォームなど無関係な投稿

## 2026-11-23 追加（定期見直し。2026-11-22 09:00〜11-23 09:00 JSTの投稿）

**AIっぽさ（偽の証拠）**
- AI製LPの緑に点滅する「All Systems Operational」バッジは、何も監視していないただのCSSアニメのことがある。動くシステムより、その見た目の証拠を作る方がずっと簡単（[@srcbuild](https://x.com/srcbuild/status/2124494700237439133)）
- わざとAIが急いで作ったように見せるCSSフレームワーク「Slopstrap」の中身が、光るグラデ、不要なバッジ、動く統計の数字、偽の推薦文、角丸カードの入れ子（[@oldstackjournal](https://x.com/oldstackjournal/status/2124624035510378868)）
- vibe codedの料金ページは一瞬で分かる。偽のステータス行やグラデのスローガンなどのAIの癖に名前をつけて直すスキル（[@fildotai](https://x.com/fildotai/status/2124614396492316944)、自社スキルの宣伝で割り引き）→ 計3件（独立した非宣伝2件）。Step 6の「偽ダッシュボード」行に、つながっていない「稼働中」表示とカウントアップの数字を追加
- 同じグラデ・同じレイアウト・同じ偽の推薦文で、AI製LPは2秒で分かる（[@samongaro_](https://x.com/samongaro_/status/2124552488745345140)）／紫グラデ・全見出しInter・絵文字つき3カード・「unlock the power of」（[@rohanbhanot](https://x.com/rohanbhanot/status/2124513578359140417)、ツール紹介）→ 既存のAIっぽさ表・社会的証明の行

**AIへの指示**
- スライドのAIっぽさの原因は「見ずに・形だけ・1枚ずつ作る」こと。禁止ではなく「やめること→代わりに使うもの」の対で指示するのが効く、と人が作った資料395枚と照らして検証した記事の紹介（[@piske_cc](https://x.com/piske_cc/status/2124473171298685098)、検証は記事側の自己申告）→ 11-22の @Kanata_Muse（禁止だけでなく代わりにどう整えるかまで指示）に続く2件目。Step 5の2に追記
- AI製サイトが悪く見えるのはAIのせいではなく、曖昧な指示、参考なし、書体の軽視、適当な色、最初の出力をそのまま採用するから（[@GondhaleRitesh](https://x.com/GondhaleRitesh/status/2124451253971460225)）→ 既存のStep 5
- 「AIっぽさ」は余白と線の均一さに出る（[@hitoribizdesign](https://x.com/hitoribizdesign/status/2124352026301940116)）／HTMLで組むと余白や文字サイズが均一になりすぎる（[@bigmacfive](https://x.com/bigmacfive/status/2124318233238843769)）→ 既存の「均等すぎる余白」
- 画像生成は文字も中心でバランスを取るが、デザインの文字配置は下のラインで揃えるので、その違いがAIっぽさになる（[@nakanodelicacy](https://x.com/nakanodelicacy/status/2124397326492180765)、返信）→ 1件、記録のみ

**アクセシビリティ**
- AIエージェントのアクセシビリティ対応：画像のaltは全部「image」、ボタン名は全部「button」、コントラストは全部同じグレーにして解決。監査は通るが誰も使えない（[@GenesisProio](https://x.com/GenesisProio/status/2124594970661179757)）→ 既存の「AIが書いたaltは人が読んで直す」「自動スコアだけで合格にしない」
- デザイントークンは片方のテーマでコントラストを満たしても、もう片方で落ちる。同じ部品を両テーマに置き、通常・フォーカス・無効の状態まで確認（[@DominickNoval](https://x.com/DominickNoval/status/2124580600887840962)）→ 既存のダークモードの行。状態ごとの確認は1件、記録のみ
- 施工事例の詳細ページで「施工事例」がh1・個別タイトルがh2だと、見出しで移動する人にはどのページも主役が同じ。テンプレート1つで全ページ直る（[@tedekku0323](https://x.com/tedekku0323/status/2124609684820877581)）→ 1件、記録のみ
- 入力が不正な間に送信ボタンを無効にするのは悪いUX。押しても何も起きず、どの欄が原因か分からない。押せるままにしてエラーを示す（[@Jogoh95](https://x.com/Jogoh95/status/2124492092411896291)）→ 11-20に追加した状態の行と同じ

**LP/CVR・BtoB**
- LPのCVRが落ちたら文章を直す前に分母を見る。クリック基準とLP到達後のCVRを分けると、落ちたのは到達率だけのことがある（[@haku_ad5](https://x.com/haku_ad5/status/2124442797705240821)）／CPAが急に上がった原因はクリックの後にあることがある（[@nishimura_meta](https://x.com/nishimura_meta/status/2124608869297000612)）→ 既存の計測行
- ローン関連なら年収や自己資金の目安をLPに書く。申込は減ってもその後の審査通過率が上がる（[@yutayutayutaro5](https://x.com/yutayutayutaro5/status/2124427745300197727)）→ 既存の「おすすめしない人」・CVの質
- ヒーローの役目は、何をしていて次に何をすればいいかを伝えること。見出し1つ・補足1行・主ボタン1つ。2つ目の行動は目立たない文字リンクに（[@brisapages](https://x.com/brisapages/status/2124538779004195273)）／スマホで開いて見出しとボタンが最初の画面に収まらなければそれが最初の修正（[@710knl](https://x.com/710knl/status/2124518277825335334)）→ 既存の「1画面に主ボタン1つ」・375px確認
- B2B広告は「x alternative」「x vs y」「x pricing」をフレーズ一致で、キーワードごとにLPを1枚、H1と最初の段落にキーワード（[@Graphed](https://x.com/Graphed/status/2124608921184653620)）→ 既存のメッセージマッチ・BtoBの着地ページ
- 納品前に見出しを倍の長さに、写真を縦長に、ボタンを「無料30分相談を予約」にしてレイアウトが崩れないか試す（[@omburo_com](https://x.com/omburo_com/status/2124525847382016023)）→ 1件、記録のみ

**ヒアリング**
- 「どんなサイトに？」→「おしゃれな感じで」→「分かりました」で作り始め、納品後に全やり直し。クライアントの「おしゃれ」と自分の「おしゃれ」は違う（[@kazm_n18](https://x.com/kazm_n18/status/2124634787965255966)）→ 既存のStep 1（参考の「どこが」「なぜ」）

- 不採用：AIっぽさ除去のスキル・道具紹介（@AiAircle34052、@I_am_Aiabir、@zeewasd、@alex_atoms、@aiwaremax、@typedbynikolas、@1DevanshBuilds、宣伝・まとめ）、「フォーム項目1つで約4%減」（@LaurentiuPetran と @sitescore_ai が同文、無料診断の宣伝）、CRO代理店・LP制作の営業投稿（@connectazeem、@alex_momeni、@ecomricsi など）、デザインライブラリMCPの「CVR2倍」（@codex_lab_、宣伝）、ゲーム「ペルソナ」・各種申込フォームの告知など無関係な投稿

## 2026-11-24 追加（定期見直し。2026-11-23 09:00〜11-24 09:00 JSTの投稿）

**リニューアル・既存の成果を守る**
- 毎月30〜50件の質の高いリードが来ていた自社サイトをLovableで丸ごと作り直して公開したら、12月〜3月のリードがゼロに。休みや発信不足のせいにしていたが、旧サイトに戻したらすぐリードが戻った。シンプルなLPと文章のまま、すでに機能していたサイトだった（[@bradsmith](https://x.com/bradsmith/status/2124863251032735918)、本人の自己申告。378項目のチェックリストの配布つき）
- LPの小さな修正（見出しを分かりやすく、CTAを1つ、ボタンの近くに証拠）のほうが、全面リニューアルよりCVを動かすことが多い（[@BusinessInFrame](https://x.com/BusinessInFrame/status/2124970579916984524)、返信での一般論）
→ 11-16に見送った「リニューアルのヒアリングで変えたくない所も聞く」（1件）と合わせて3件。Step 1のリニューアルの行に、成果を生んでいる部分を先に洗い出して残す、一度に切り替えず旧サイトと比べ戻せるようにする、を追記

**AIっぽさ**
- Base44で毎日サイトを作る人のAI臭まとめ：「〜を、もっと〜に。」型の読点で区切った体言止めのコピー、見出し上の英語ラベル（01. – FEATURES）、意味のない絵文字・装飾アイコン、中身の薄い3枚カード、見出しの一部だけ色・グラデ（[@kei_english_ca](https://x.com/kei_english_ca/status/2124694172347285757)）→ すべて既存のAIっぽさ表にある
- Outlookのトップページが通常書体＋イタリックのセリフ体という「Claude既定・vibe coded」の見た目になっている（[@yungrexhar](https://x.com/yungrexhar/status/2124948956027445259)）→ 既存の「流行のイタリックセリフ」
- 緑×ベージュのAI感満載のデザインを直す（[@sytkm](https://x.com/sytkm/status/2124936739789906217)）→ 既存の「くすんだベージュ＋セリフ体」の新しいAIっぽさ
- ゼロから「よさそうな画面」を考えさせず、お手本の既存アプリの画面・動画を読ませ、密度と余白・文字サイズの順番・動きまで1対1で寄せる（[@satomi112504](https://x.com/satomi112504/status/2124790071371108558)、スキルの紹介）→ 既存のStep 5（見本を見せる）
- 「LPのデザイン考えて」と丸投げすると既視感しかないページになり、クライアントに「うーん」と言われる（[@nao23s](https://x.com/nao23s/status/2124820254476194210)）→ 既存のStep 5

**LP/CVR・BtoB**
- 広告用LPの作り方：出稿が伸びている広告とLPのずれを確認し、同種の広告で他社が送っているページの対象・ヒーロー・長さ・構成・画像を分解し、自社の話と証拠で同じ構造を作り、広告の配信先で直接テスト（[@pavcro](https://x.com/pavcro/status/2124665286670397824)、代理店）→ 既存のメッセージマッチ・実在サイトの共通点から方向を決める
- B2Bの料金ページの「Talk to sales」は、買い手には高くて値切れると読まれ、半額から交渉が始まる（[@_Shivam22s](https://x.com/_Shivam22s/status/2124868889695908214)）／「料金はお問い合わせ」は行き止まり（[@thenewpush](https://x.com/thenewpush/status/2124880771366400204)）→ 既存の「料金はお問い合わせくださいで済ませない」
- BtoBの買い手は問い合わせ前にかなり調べ終わっている。サイトに比べるための情報を置く（[@btob_matome](https://x.com/btob_matome/status/2124805908949782557)）→ 既存の「比較検討中の人の質問に答える」

**アクセシビリティ**
- プレースホルダーはHTMLのlabelの代わりにならない（[@bukivalearn](https://x.com/bukivalearn/status/2124837974932365563)）→ 11-22に追加した行と同じ
- 調査でよくある問題は低コントラスト文字（83.9%のページ）、説明のない画像（53.1%）、ラベルのない入力欄（51%）（[@primocollab](https://x.com/primocollab/status/2124827896103477541)、出典の調査名は投稿内で未確認）→ 既存の行
- 改正障害者差別解消法（2024年4月）で民間にも合理的配慮が義務化。ECはスマホ片手でカートまで行けるか（[@kubokeiju](https://x.com/kubokeiju/status/2124833692199928156)）→ 既存のアクセシビリティ行・375px確認

- 不採用：AIスロップ除去スキル・素材のまとめ（@nakalab777、@protoduct_ai、@Dionisselamii、@tetumemo、@uiuxpass など、宣伝・まとめ）、AIデザインセミナーの告知（@amity_sensei）、BtoB診断ツール（@miyawakidai、宣伝）、AI音声ヒアリングで転換率20%改善（@XnwvN、海外事例の紹介・自己申告）、X本体の新UIへの感想、ゲーム「ペルソナ」・各種申込フォームの告知など無関係な投稿
