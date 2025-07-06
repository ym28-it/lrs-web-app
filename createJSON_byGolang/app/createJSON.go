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
	IsDir bool
	Path string
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


func getRootIndex(pathList []string, root string) int {
	var rootIndex int
	for i, val := range pathList {
		if val == root {
			rootIndex = i
			break
		}
	}
	return rootIndex
}


func main() {
	fmt.Println("Start:")
	var targetPath string
	fmt.Println("Please enter directory path:")
	fmt.Scan(&targetPath)
	// targetPath = "./inputs/ext"
	// targetPath = "noExist"
	fmt.Printf("targetPath: %v\n", targetPath)

	soursePath := strings.Split(targetPath, "/")
	root := soursePath[len(soursePath)-1]
	 
	// fmt.Printf("root: %v\n", root)
	fmt.Println()
	dirStruc := &FileDirStruc{Name: root, IsDir: true, Path: targetPath}
	err := filepath.WalkDir(targetPath, func (path string, info os.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if info.Name() == root {
			return nil
		}

		// fmt.Printf("nodeName: %v\n", info.Name())
		var nodeList = strings.Split(path, "/")
		rootIndex := getRootIndex(nodeList, root)
		// fmt.Printf("NodeList: %v\n", nodeList)

		newNode := &FileDirStruc{Name: info.Name(), IsDir: true, Path: path}
		fmt.Printf("newNode: %v\n", newNode)
		fmt.Printf("path: %v\n", path)
		SearchDirStruc(dirStruc, nodeList[rootIndex:len(nodeList)-1], newNode)

		return nil
	})


	if err != nil {
		fmt.Println("Error:")
		fmt.Println(err)
	} else {
		createJSONFile(*dirStruc)
	}

}