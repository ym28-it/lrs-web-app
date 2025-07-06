package main

import (
	"encoding/json"
	"fmt"
	"os"
)

type FileDirStruc struct {
	Name string 
	Children []FileDirStruc
}

func main() {
	dirStruc := FileDirStruc{Name: "inputs"}
	subDir1 := FileDirStruc{Name: "ine"}
	subDir2 := FileDirStruc{Name: "ext"}
	dirStruc.Children = append(dirStruc.Children, subDir1)
	dirStruc.Children = append(dirStruc.Children, subDir2)

	jsonData, err := json.Marshal(dirStruc)
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