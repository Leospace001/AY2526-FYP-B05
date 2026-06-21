export interface PlantDetails {
    medicine_properties: string;
    feng_shui_layout: string;
    festive_meaning: string;
}

export interface PlantIdentifierCache {
    previewDataUrl: string | null;
    plantName: string | null;
    plantDetails: PlantDetails | null;
}

const emptyCache: PlantIdentifierCache = {
    previewDataUrl: null,
    plantName: null,
    plantDetails: null,
};

let cache: PlantIdentifierCache = { ...emptyCache };

export function getPlantIdentifierCache(): PlantIdentifierCache {
    return cache;
}

export function updatePlantIdentifierCache(partial: Partial<PlantIdentifierCache>): void {
    cache = { ...cache, ...partial };
}
