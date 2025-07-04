package main

import (
	"encoding/json"
	"fmt"
)

type Book struct {
	Title     string
	Author    string
	Publisher string
}

func main() {
	b := []byte(`{"title": "リーダブルコード", "author": "Trevor Foucher", "Publisher": "OREILLY"}`)
	var book Book
	if err := json.Unmarshal(b, &book); err != nil {
		fmt.Println(err)
	}
	fmt.Println(book.Title, book.Author, book.Publisher)
}