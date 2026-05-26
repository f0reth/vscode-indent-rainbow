# Changelog

## [0.0.2]

### Bug Fixes

- **Tabmix highlighting**: Mixed tab+space indentation is now correctly highlighted with the tabmix color instead of the error color.
- **Tabmix decoration range**: The tabmix indicator now covers the entire mixed-indent area as a single continuous highlight instead of being split into separate segments.
- **Indentation width**: When `colorOnWhiteSpaceOnly` is disabled, indentation colors now correctly extend to the full tab stop width.

### Documentation

- **README corrections**: The README now uses the correct extension name "Colorful Indentation" and the correct setting prefix `colorfulIndentation.*` (previously showed incorrect `indentRainbow.*` names). Default values for `errorColor` and `tabmixColor` are also corrected.

## [0.0.1]

Initial release.

---

# 変更履歴

## [0.0.2]

### バグ修正

- **タブミックスのハイライト**: スペースとタブが混在するインデントが、エラー色ではなくタブミックス色で正しくハイライトされるようになりました。
- **タブミックスの装飾範囲**: タブミックスのインジケーターが複数のセグメントに分割されず、混在インデント領域全体を1つの連続したハイライトで表示するようになりました。
- **インデント幅の修正**: `colorOnWhiteSpaceOnly` が無効な場合、インデントの色がタブストップの幅全体に正しく適用されるようになりました。

### ドキュメント

- **READMEの修正**: READMEに記載されている拡張機能名が「Colorful Indentation」に、設定名のプレフィックスが `colorfulIndentation.*` に修正されました（以前は誤って `indentRainbow.*` と記載されていました）。また、`errorColor` および `tabmixColor` のデフォルト値も正しい値に修正されました。

## [0.0.1]

初回リリース。
