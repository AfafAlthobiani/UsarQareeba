// AI recommendation engine (rule-based scoring)
import { getDistanceKm } from "../lib/utils.js";

export function scoreBusiness({ biz, preferredCategories, clickedBusinesses, favoriteBusinessIds, userLocation }) {
  const categoryHits = preferredCategories[biz.category] || 0;
  const clicked = clickedBusinesses[biz.id] || 0;
  const favoriteBoost = favoriteBusinessIds.has(biz.id) ? 4 : 0;

  let distanceFactor = 0;
  if (userLocation && typeof biz.lat === "number" && typeof biz.lng === "number") {
    const km = getDistanceKm(userLocation.lat, userLocation.lng, biz.lat, biz.lng);
    distanceFactor = Math.max(0, 5 - km / 2);
  }

  const rating = Number(biz.rating || 0);
  return categoryHits * 3 + clicked * 2 + favoriteBoost + distanceFactor + rating;
}

export function getRecommendations(businesses, interactionState, favorites, userLocation) {
  const preferredCategories = interactionState.categoryViews || {};
  const clickedBusinesses = interactionState.clicks || {};

  const scored = businesses
    .map((biz) => ({
      ...biz,
      aiScore: scoreBusiness({
        biz,
        preferredCategories,
        clickedBusinesses,
        favoriteBusinessIds: favorites,
        userLocation,
      }),
    }))
    .sort((a, b) => b.aiScore - a.aiScore);

  return scored.slice(0, 12);
}
