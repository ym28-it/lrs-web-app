package main

import (
    "encoding/json"
    "fmt"
    "log"
)

type Person struct {
    Name string
    Age  int
}

func main() {
    p := Person{Name: "Alice", Age: 20}
    fmt.Println(p)
    // 出力: {Alice 20}

    bytes, err := json.Marshal(p)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(bytes)
    // 出力: [123 34 78 97 109 101 34 58 34 65 108 105 99 101 34 44 34 65 103 101 34 58 50 48 125]
    // これはJSON形式の文字列をASCIIコードに対応する整数のスライスとして表現したものです。

    fmt.Println(string(bytes))
    // 出力: {"Name":"Alice","Age":20}
}
