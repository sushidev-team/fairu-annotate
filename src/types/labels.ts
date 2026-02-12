export interface Label {
  id: string
  name: string
  color: string
  classId: number
}

export interface TagSearchParams {
  query: string
  page: number
  limit: number
}

export interface TagSearchResult {
  labels: Label[]
  total: number
  hasMore: boolean
}

export type TagSearchFn = (params: TagSearchParams) => Promise<TagSearchResult>
export type TagCreateFn = (name: string, color?: string) => Promise<Label>
export type TagDeleteFn = (id: string) => Promise<void>
export type TagUpdateFn = (id: string, updates: Partial<Pick<Label, 'name' | 'color'>>) => Promise<Label>
