package main

import (
	"fmt"
	"os"
	"path/filepath"
)


func main() {
	// todo: 
	fileList := []string{}

	err := filepath.WalkDir("../inputs", func (path string, info os.DirEntry, err error) error {
		if err != nil {
			return err
		}


		fmt.Printf("nodeName: %v\n", info.Name())
		fmt.Printf("isDir: %v\n", info.IsDir())
		fileList = append(fileList, path)
		return nil
	})

	fmt.Printf("start print path\n")
	for _, filePath := range fileList {
		fmt.Printf("path: %v\n", filePath)
	}

	if err != nil {
		panic(err)
	}
}