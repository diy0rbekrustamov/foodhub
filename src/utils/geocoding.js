// Geocoding and geographic utility functions for FoodHub Global Branch Management

/**
 * Search places/addresses worldwide using Nominatim OpenStreetMap API
 * Returns array of matches with display_name, lat, lon, address components
 */
export async function searchAddress(query) {
  if (!query || query.trim().length < 2) return [];

  try {
    const encoded = encodeURIComponent(query.trim());
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&addressdetails=1&limit=6`;
    
    const response = await fetch(url, {
      headers: {
        "Accept-Language": "uz,en,ru",
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding HTTP error: ${response.status}`);
    }

    const data = await response.json();
    return data.map((item) => {
      const city =
        item.address?.city ||
        item.address?.town ||
        item.address?.village ||
        item.address?.county ||
        item.address?.state ||
        "";
      const country = item.address?.country || "O'zbekiston";
      const road = item.address?.road || item.address?.pedestrian || "";
      const houseNumber = item.address?.house_number || "";
      const formattedStreet = road ? `${road}${houseNumber ? `, ${houseNumber}` : ""}` : item.name || "";

      return {
        displayName: item.display_name,
        name: item.name || query,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        country,
        city,
        street: formattedStreet,
        rawAddress: item.address,
      };
    });
  } catch (err) {
    console.warn("Geocoding search error, checking fallback:", err);
    return [];
  }
}

/**
 * Reverse geocode latitude/longitude to formatted address and city
 */
export async function reverseGeocode(lat, lng) {
  if (lat == null || lng == null) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        "Accept-Language": "uz,en,ru",
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data || !data.address) return null;

    const city =
      data.address.city ||
      data.address.town ||
      data.address.village ||
      data.address.county ||
      data.address.state ||
      "";
    const country = data.address.country || "O'zbekiston";
    const road = data.address.road || data.address.pedestrian || data.address.neighbourhood || "";
    const houseNumber = data.address.house_number || "";
    const street = road ? `${road}${houseNumber ? `, ${houseNumber}` : ""}` : "";

    return {
      displayName: data.display_name,
      city,
      country,
      street,
      fullAddress: street ? `${street}, ${city}` : data.display_name,
    };
  } catch (err) {
    console.warn("Reverse geocode error:", err);
    return null;
  }
}

/**
 * Calculate distance between two lat/lng points in kilometers (Haversine formula)
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Check if a branch is a potential duplicate of existing branches
 */
export function checkDuplicateBranch(newBranch, existingBranches, currentBranchId = null) {
  const normName = (newBranch.name || "").trim().toLowerCase();
  const normCity = (newBranch.city || "").trim().toLowerCase();
  const lat = parseFloat(newBranch.latitude);
  const lng = parseFloat(newBranch.longitude);

  for (const b of existingBranches) {
    if (currentBranchId && b.id === currentBranchId) continue;

    const bName = (b.name || "").trim().toLowerCase();
    const bCity = (b.city || "").trim().toLowerCase();
    const bLat = parseFloat(b.latitude);
    const bLng = parseFloat(b.longitude);

    // Exact name match in same city
    if (bName === normName && bCity === normCity && normName.length > 0) {
      return {
        isDuplicate: true,
        reason: `Ushbu "${b.name}" nomli filial ${b.city} shahrida allaqachon mavjud.`,
        duplicateBranch: b,
      };
    }

    // Distance under 60 meters (0.06 km)
    if (!isNaN(lat) && !isNaN(lng) && !isNaN(bLat) && !isNaN(bLng)) {
      const dist = calculateDistanceKm(lat, lng, bLat, bLng);
      if (dist < 0.06) {
        return {
          isDuplicate: true,
          reason: `Ko'rsatilgan nuqtaga juda yaqin (${Math.round(dist * 1000)} metr) joylashgan "${b.name}" filiali topildi.`,
          duplicateBranch: b,
        };
      }
    }
  }

  return { isDuplicate: false };
}
