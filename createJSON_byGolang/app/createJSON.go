package main

import (
	"fmt"
	// "os"
	"path/filepath"
	// "encoding/json"
	// "io"
	"io/fs"
	// "log"
)


func main() {
	subDirToSkip := "skip"
	fmt.Println("Start:")
	err := filepath.Walk("./inputs", func(path string, info fs.FileInfo, err error) error {
		if err != nil {
			fmt.Printf("prevent panic by handling failure accessing a path %q: %v\n", path, err)
			return err
		}
		if info.IsDir() && info.Name() == subDirToSkip {
			fmt.Printf("skipping a dir without errors: %+v \n", info.Name())
			return filepath.SkipDir
		}
		
		fmt.Printf("visited file or dir: %q\n", path)
		return nil
	})
	if err != nil {
		fmt.Printf("error walking the path: $v\n", err)
		return
	}
}


// func main() {
// 	getInputsDirTree()

// }