
// import { useQuery, UseQueryOptions } from "@tanstack/react-query";

// export const CHUNK_KEY_FACTORY = {
//   all: ["speaking"] as const,
//   lists: () => [...CHUNK_KEY_FACTORY.all, "list"] as const,
//   list: (params: ChunkQueryParams) =>
//     [...CHUNK_KEY_FACTORY.lists(), params] as const,
// };

// export const useSpeakingList = (
//   params: ChunkQueryParams,
//   options?: UseQueryOptions<ChunkResponse>,
// ) => {
//   return useQuery({
//     queryKey: CHUNK_KEY_FACTORY.list(params),
//     queryFn: () => chunkApi.getAllChunks(params),
//     staleTime: 1000 * 60 * 5, // 5 minutes
//     enabled: true,
//     ...(typeof options === "object" ? options : {}),
//   });
// };

// export const useSpeakingDetail = (id: string, options?: unknown) => {
//   return useQuery({
//     queryKey: CHUNK_KEY_FACTORY.detail(id),
//     queryFn: () => lessonApi.getSpeakingById(id),
//     staleTime: 1000 * 60 * 5, // 5 minutes
//     ...(typeof options === "object" ? options : {}),
//   });
// };
