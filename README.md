# Indent Rainbow

A VS Code extension that colorizes indentation levels with alternating rainbow colors, making code structure easier to read at a glance.

## Features

- **Rainbow indentation**: Each indentation level is highlighted with a distinct color
- **Error detection**: Highlights incorrect indentation (e.g., 3-space indent when tab size is 2)
- **Tab/space mix detection**: Detects and highlights lines that mix tabs and spaces
- **Two indicator styles**: Classic (full background) or Light (colored left border)
- **Per-language control**: Include or exclude specific languages
- **Fully customizable**: Colors, error colors, update delay, and more

## Extension Settings

| Setting                                      | Default               | Description                                                          |
| -------------------------------------------- | --------------------- | -------------------------------------------------------------------- |
| `indentRainbow.colors`                       | 4 RGBA colors         | Array of colors used for indentation levels (cycles through)         |
| `indentRainbow.errorColor`                   | `rgba(128,32,32,0.6)` | Color for incorrect indentation                                      |
| `indentRainbow.tabmixColor`                  | `rgba(128,32,96,0.6)` | Color for lines that mix tabs and spaces (empty string to disable)   |
| `indentRainbow.indicatorStyle`               | `"classic"`           | `"classic"` (full background) or `"light"` (left border only)        |
| `indentRainbow.lightIndicatorStyleLineWidth` | `1`                   | Border width in pixels when using `light` style                      |
| `indentRainbow.colorOnWhiteSpaceOnly`        | `false`               | When `true`, only colorize whitespace characters                     |
| `indentRainbow.includedLanguages`            | `[]`                  | Languages to activate for (empty = all languages)                    |
| `indentRainbow.excludedLanguages`            | `["plaintext"]`       | Languages to deactivate for                                          |
| `indentRainbow.ignoreErrorLanguages`         | `["markdown"]`        | Languages to skip error highlighting for (`"*"` to disable globally) |
| `indentRainbow.ignoreLinePatterns`           | See below             | RegEx patterns to skip error highlighting on matching lines          |
| `indentRainbow.updateDelay`                  | `100`                 | Delay in milliseconds before updating decorations                    |

Default `ignoreLinePatterns`:

```json
["/[ \t]* [*]/g", "/[ \t]+[/]{2}/g"]
```

These skip block comment lines (`* ...`) and full-line comments (`// ...`).

### Example configuration

```json
{
  "indentRainbow.colors": [
    "rgba(255,255,64,0.07)",
    "rgba(127,255,127,0.07)",
    "rgba(255,127,255,0.07)",
    "rgba(79,236,236,0.07)"
  ],
  "indentRainbow.indicatorStyle": "light",
  "indentRainbow.excludedLanguages": ["plaintext"],
  "indentRainbow.ignoreErrorLanguages": ["markdown"]
}
```

> **Tip**: When using `light` style, consider disabling VS Code's built-in indent guides with `"editor.guides.indentation": false` to avoid visual overlap.

## Requirements

- VS Code `^1.120.0`

## Known Issues

- Configuration changes require a window reload to take effect. A prompt is shown automatically when settings are modified.

## Release Notes

### 0.0.1

Initial release.

---

# Indent Rainbow（日本語）

インデントレベルを虹色で色分けするVS Code拡張機能です。コードの構造を一目で把握しやすくなります。

## 機能

- **虹色インデント**: 各インデントレベルを異なる色でハイライト表示
- **エラー検出**: 不正なインデントをハイライト（例：タブサイズが2なのに3スペースでインデントされている場合）
- **タブ/スペース混在検出**: タブとスペースが混在している行を検出してハイライト
- **2種類のインジケータースタイル**: クラシック（背景全体を着色）またはライト（左ボーダーのみ着色）
- **言語別制御**: 特定の言語を対象に含めたり除外したりできる
- **完全カスタマイズ可能**: 色、エラー色、更新遅延などを設定可能

## 設定項目

| 設定                                         | デフォルト値          | 説明                                                          |
| -------------------------------------------- | --------------------- | ------------------------------------------------------------- |
| `indentRainbow.colors`                       | 4種類のRGBA色         | インデントレベルに使用する色の配列（ループして使用）          |
| `indentRainbow.errorColor`                   | `rgba(128,32,32,0.6)` | 不正なインデントの色                                          |
| `indentRainbow.tabmixColor`                  | `rgba(128,32,96,0.6)` | タブとスペースが混在している行の色（無効にするには空文字列）  |
| `indentRainbow.indicatorStyle`               | `"classic"`           | `"classic"`（背景全体）または `"light"`（左ボーダーのみ）     |
| `indentRainbow.lightIndicatorStyleLineWidth` | `1`                   | `light`スタイル使用時のボーダー幅（ピクセル）                 |
| `indentRainbow.colorOnWhiteSpaceOnly`        | `false`               | `true`にすると空白文字のみを着色                              |
| `indentRainbow.includedLanguages`            | `[]`                  | 有効にする言語（空の場合はすべての言語）                      |
| `indentRainbow.excludedLanguages`            | `["plaintext"]`       | 無効にする言語                                                |
| `indentRainbow.ignoreErrorLanguages`         | `["markdown"]`        | エラーハイライトをスキップする言語（`"*"`でグローバルに無効） |
| `indentRainbow.ignoreLinePatterns`           | 下記参照              | エラーハイライトをスキップする行のRegExパターン               |
| `indentRainbow.updateDelay`                  | `100`                 | デコレーションを更新するまでの遅延時間（ミリ秒）              |

デフォルトの `ignoreLinePatterns`:

```json
["/[ \t]* [*]/g", "/[ \t]+[/]{2}/g"]
```

ブロックコメント行（`* ...`）と行コメント（`// ...`）をスキップします。

### 設定例

```json
{
  "indentRainbow.colors": [
    "rgba(255,255,64,0.07)",
    "rgba(127,255,127,0.07)",
    "rgba(255,127,255,0.07)",
    "rgba(79,236,236,0.07)"
  ],
  "indentRainbow.indicatorStyle": "light",
  "indentRainbow.excludedLanguages": ["plaintext"],
  "indentRainbow.ignoreErrorLanguages": ["markdown"]
}
```

> **ヒント**: `light`スタイルを使用する場合、VS Codeの標準インデントガイドと重なるため、`"editor.guides.indentation": false`で標準ガイドを無効にすることをお勧めします。

## 動作要件

- VS Code `^1.120.0`

## 既知の問題

- 設定変更を反映するにはウィンドウのリロードが必要です。設定変更時には自動的にリロードを促すプロンプトが表示されます。

## リリースノート

### 0.0.1

初回リリース。
