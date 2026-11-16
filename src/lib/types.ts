export type ItemType = "link" | "image" | "text";

export type Item = {
  id: string;
  type: ItemType;
  title: string;
  url: string | null;
  content: string | null;
  note: string | null;
  image_path: string | null;
  image_url?: string | null;
  folder_id: string | null;
  is_favorite: boolean;
  is_private: boolean;
  is_effectively_private?: boolean;
  tags?: Tag[];
  created_at: string;
};

export type HomeFilter =
  | "all"
  | "link"
  | "image"
  | "text"
  | "favorite"
  | "private";

export type Tag = {
  id: string;
  name: string;
};

export type PopularTag = Tag & {
  itemCount: number;
};

export type Folder = {
  id: string;
  name: string;
  is_private: boolean;
  created_at: string;
};

export type FolderSummary = Folder & {
  itemCount: number;
  counts: Record<ItemType, number>;
  previewItems: Item[];
};

export type SearchHistoryEntry = {
  id: string;
  query: string;
  searched_at: string;
};
