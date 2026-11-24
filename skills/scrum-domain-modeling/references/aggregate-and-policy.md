# Policies and aggregates

How the big picture names policies and aggregates, and the words used when talking about their rules.

## Policy

A rule or condition that decides what should happen when a domain event occurs.

- Place: `event → policy → command`. Write only the condition on the sticky ("在庫数が0になったら", "購入されたら"); the next command is what is done.
- Ask "does this always hold?" of each policy. The exceptions it surfaces become branches or hotspots.
- `execution`: `sync` (in the same step), `async` (later, eventual consistency), `scheduled` (by the clock, "毎日7時に"; may have no event before it), `external` (another system reacts).
- When a person decides instead of the system, put the actor between: `policy → actor → command`.

## Aggregate

Data that must be updated together to stay consistent.

- Name it with a noun ("在庫", "注文", "購入履歴"), not with its rule.
- Place it in the flow: `command → aggregate → event`. An external system takes the same place when it does the work.
- Put the rules it must always keep in `invariants` ("在庫数は0以上").
- One command updates one aggregate. When a change must reach another aggregate, a policy carries it over and the two agree later (eventual consistency).

## Terms

| Term | Meaning |
| --- | --- |
| 不変条件 | いつでも必ず守られるべきルール。テストでいう「期待結果がずっと成り立つ条件」。集約が守る。 |
| 形式仕様 | 仕様を数式っぽく厳密に書いたもの。曖昧さのない仕様書。 |
| モデル検査 | 起こりうる全部の状態を機械がしらみつぶしに試す。全組み合わせの自動テストのイメージ。 |
| 反例 | ルールが破れる具体的な手順。そのまま再現手順つきのバグ報告。 |
| 集約 | 一緒に更新しないと整合性が崩れるデータのまとまり。 |
| 時相性質 | 「今すぐ」ではなく「いつか必ず」守られればいいルール。非同期のポリシーが集約をまたいで守る。 |
| 結果整合性 | 一時的なズレは許して、後で必ず合わせる考え方。集約どうしはポリシーでこう合わせる。 |
| シフトレフト | 実装前の仕様の段階で問題を見つけること。QAの得意分野。 |
