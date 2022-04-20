export type Address = "tiles" | "arrows";

export type Method = "post" | "delete" | "patch";

export interface Data {
  id: number;
}
export function isData(obj: any): obj is Data {
  return typeof obj.id === "number";
}

//TODO try and create a DataArray type which like Data[] but with no duplicate id
export function isDataArray(obj: any): obj is Data[] {
  if (Array.isArray(obj) && obj.every(isData)) {
    for (let i = 0; i < obj.length; i++) {
      for (let j = 0; j < i; j++) {
        if (obj[i].id === obj[j].id) {
          console.error("Identical id found: " + obj[i].id);
          return false;
        }
      }
    }
    return true;
  }
  console.error("Object is not a DataArray.");
  return false;
}
