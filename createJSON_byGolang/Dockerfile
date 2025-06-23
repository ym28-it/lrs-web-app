# Goの公式軽量イメージ
FROM golang:1.23

# 作業ディレクトリを作成
WORKDIR /practice

# ホスト側のファイルをコンテナにコピー
COPY . .

# Goモジュール有効化
ENV GO111MODULE=on

# 初期ビルド（依存があれば取得）
RUN go mod tidy || true

# デフォルト実行
# CMD ["go", "run", "app/main.go"]
