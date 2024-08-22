// src/utils/categoryUtils.ts

interface CategoryValue {
    caseID: number;
    topPoint: string;
    [key: string]: any;  // Allow for other properties
  }
  
  interface CategoryTree {
    [key: string]: CategoryValue | CategoryTree;
  }
  
  export interface FlatCategory {
    code: string;
    name: string;
    path: string;
    topPoint: string;
  }
  
  export const flattenCategoryTree = (tree: CategoryTree, parentPath: string[] = []): FlatCategory[] => {
    let result: FlatCategory[] = [];
  
    for (const [key, value] of Object.entries(tree)) {
      if (typeof value === 'object' && value !== null) {
        if ('caseID' in value && 'topPoint' in value && typeof value.topPoint === 'string') {
          result.push({
            code: value.caseID.toString(),
            name: key,
            path: [...parentPath, key].join(' > '),
            topPoint: value.topPoint
          });
        } else {
          result = result.concat(flattenCategoryTree(value as CategoryTree, [...parentPath, key]));
        }
      }
    }
  
    return result;
  };