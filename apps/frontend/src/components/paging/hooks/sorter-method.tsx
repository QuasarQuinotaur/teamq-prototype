import type {SortMethod} from "@/components/input/constants.tsx";

export default function useSorterMethod() {
    return (sortMethod: SortMethod) => {
        if (sortMethod === "descending") {
            return (a: string, b: string) => -a.localeCompare(b)
        }
        return (a: string, b: string) => a.localeCompare(b)
    }
}