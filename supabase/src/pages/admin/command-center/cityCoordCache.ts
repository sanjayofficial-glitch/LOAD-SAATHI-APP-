const coordCache: Record<string, [number, number]> = {
  rourkela: [22.2604, 84.8536],
  ranchi: [23.3441, 85.3096],
  bhubaneswar: [20.2961, 85.8245],
  cuttack: [20.4625, 85.883],
  sambalpur: [21.4704, 83.97],
  jamshedpur: [22.8046, 86.2029],
  dhanbad: [23.7957, 86.4304],
  bokaro: [23.6693, 86.1511],
  raipur: [21.2514, 81.6296],
  bilaspur: [22.0797, 82.1409],
  patna: [25.5941, 85.1376],
  varanasi: [25.3176, 82.9739],
  kolkata: [22.5726, 88.3639],
  nagpur: [21.1458, 79.0882],
  delhi: [28.6139, 77.209],
  mumbai: [19.076, 72.8777],
  bangalore: [12.9716, 77.5946],
  chennai: [13.0827, 80.2707],
  pune: [18.5204, 73.8567],
  hyderabad: [17.385, 78.4867],
  ahmedabad: [23.0225, 72.5714],
  jaipur: [26.9124, 75.7873],
  lucknow: [26.8467, 80.9462],
  indore: [22.7196, 75.8577],
  visakhapatnam: [17.6868, 83.2185],
  guwahati: [26.1445, 91.7362],
  gaya: [24.7963, 85.0],
  asansol: [23.6739, 86.9524],
  siliguri: [26.7271, 88.3953],
  jabalpur: [23.1815, 79.9864],
  kanpur: [26.4499, 80.3319],
  vijayawada: [16.5062, 80.648],
  hazaribagh: [23.9925, 85.3633],
  daltonganj: [23.9933, 84.0722],
};

export async function getCityCoords(city: string): Promise<[number, number] | null> {
  const normalized = city.toLowerCase().trim();
  if (coordCache[normalized]) return coordCache[normalized];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', India')}&format=json&limit=1`,
      { headers: { 'User-Agent': 'LoadSaathi-CommandCenter/1.0' } },
    );
    const data = await res.json();
    if (data?.length > 0) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      coordCache[normalized] = coords;
      return coords;
    }
  } catch {
    /* ignore */
  }
  return null;
}
