package main

import (
	"encoding/json"
	"fmt"
	"os"
)

type User struct {
	Name string `json:"name"`
	Age  int    `json:"age"`
}

func main() {
	user := User{Name: "Hanako", Age: 25}
	jsonData, err := json.Marshal(user)
	if err != nil {
		fmt.Println("JSONのエンコードに失敗しました:", err)
		return
	}

	fmt.Println(string(jsonData))

	f, err := os.Create("./inputs/fileList.json")
	count, err := f.Write(jsonData)
	if err != nil {
		fmt.Println(err)
		fmt.Println("err")
	}

	fmt.Printf("write %d bytes\n", count)
}