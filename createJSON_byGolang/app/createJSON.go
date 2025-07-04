package main

import (
	"fmt"
	"os"
	"path/filepath"
	"encoding/json"
	"strings"
)


type FileDirStruc struct {
	Name string
	IsDir string
	Children []*FileDirStruc
}


func SearchDirStruc(sourse *FileDirStruc, path []string, target *FileDirStruc) {
	// fmt.Println(path)
	// fmt.Println(target)
	// fmt.Println()
	for _, node := range path {
		if node == sourse.Name {
			if len(path) == 1 {
				sourse.Children = append(sourse.Children, target)
			}

			for _, child := range sourse.Children {
				SearchDirStruc(child, path[1:], target)
			}
		}
	}
}


func createJSONFile(strc FileDirStruc) {
	jsonData, err := json.MarshalIndent(strc, "", "    ")
	if err != nil {
		fmt.Println("JSONのエンコードに失敗しました:", err)
		return
	}

	fmt.Println(string(jsonData))

	f, err := os.Create("fileList.json")
	if err != nil {
		fmt.Printf("False create json: %e\n", err)
		return
	}

	count, err := f.Write(jsonData)
	if err != nil {
		fmt.Printf("False write jsonData: %e\n", err)
	}

	fmt.Printf("write %d bytes\n", count)

}


func main() {
	fmt.Println("Start:")
	var targetPath string
	fmt.Println("Please enter directory path:")
	fmt.Scan(&targetPath)
	// targetPath = "inputs"

	soursePath := strings.Split(targetPath, "/")
	root := soursePath[len(soursePath)-1]
	 
	fmt.Printf("root: %v\n", root)
	fmt.Println()
	dirStruc := &FileDirStruc{Name: root, IsDir: "true"}
	err := filepath.WalkDir(root, func (path string, info os.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if info.Name() == root {
			return nil
		}

		// fmt.Printf("nodeName: %v\n", info.Name())
		var nodeList = strings.Split(path, "/")
		// fmt.Printf("NodeList: %v\n", nodeList)

		var isDir string
		if info.IsDir() {
			isDir = "true"
		} else {
			isDir = "false"
		}
		newNode := &FileDirStruc{Name: info.Name(), IsDir: isDir}
		fmt.Printf("newNode: %v\n", newNode)
		SearchDirStruc(dirStruc, nodeList[:len(nodeList)-1], newNode)

		return nil
	})

	createJSONFile(*dirStruc)
	if err != nil {
		fmt.Println(err)
	}

}