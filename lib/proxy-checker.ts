// Tambahkan file utilitas untuk memeriksa proxy dengan berbagai metode

/**
 * Utilitas untuk memeriksa status proxy dengan berbagai metode
 */

// Fungsi untuk memeriksa proxy dengan API server
export async function checkProxyWithAPI(
  proxyIP: string,
  proxyPort: string,
): Promise<{ isActive: boolean; latency: string }> {
  try {
    const response = await fetch(
      `/api/check-proxy?ip=${encodeURIComponent(proxyIP)}&port=${encodeURIComponent(proxyPort)}`,
    )

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return {
      isActive: data.proxyip === true,
      latency: data.latency || "Unknown",
    }
  } catch (error) {
    console.error("Error checking proxy with API:", error)
    throw error
  }
}

// Fungsi untuk memeriksa proxy dengan metode internal
export async function checkProxyWithInternal(
  proxyIP: string,
  proxyPort: string,
): Promise<{ isActive: boolean; latency: string }> {
  try {
    const response = await fetch(
      `/api/check-proxy-internal?ip=${encodeURIComponent(proxyIP)}&port=${encodeURIComponent(proxyPort)}`,
    )

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return {
      isActive: data.proxyip === true,
      latency: data.latency || "Unknown",
    }
  } catch (error) {
    console.error("Error checking proxy with internal method:", error)
    throw error
  }
}

// Fungsi untuk memeriksa proxy dengan metode hybrid
export async function checkProxyWithHybrid(
  proxyIP: string,
  proxyPort: string,
): Promise<{ isActive: boolean; latency: string }> {
  try {
    const response = await fetch(
      `/api/check-proxy-hybrid?ip=${encodeURIComponent(proxyIP)}&port=${encodeURIComponent(proxyPort)}`,
    )

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return {
      isActive: data.proxyip === true,
      latency: data.latency || "Unknown",
    }
  } catch (error) {
    console.error("Error checking proxy with hybrid method:", error)
    throw error
  }
}

// Fungsi untuk memeriksa proxy dengan semua metode dan mengambil hasil pertama yang berhasil
export async function checkProxyWithAllMethods(
  proxyIP: string,
  proxyPort: string,
): Promise<{ isActive: boolean; latency: string; method: string }> {
  // Coba semua metode secara paralel
  const results = await Promise.allSettled([
    checkProxyWithAPI(proxyIP, proxyPort).then((result) => ({ ...result, method: "api" })),
    checkProxyWithInternal(proxyIP, proxyPort).then((result) => ({ ...result, method: "internal" })),
    checkProxyWithHybrid(proxyIP, proxyPort).then((result) => ({ ...result, method: "hybrid" })),
  ])

  // Filter hasil yang berhasil
  const successfulResults = results
    .filter(
      (result): result is PromiseFulfilledResult<{ isActive: boolean; latency: string; method: string }> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value)

  // Jika ada hasil yang berhasil, ambil yang pertama
  if (successfulResults.length > 0) {
    // Prioritaskan hasil yang menunjukkan proxy aktif
    const activeResults = successfulResults.filter((result) => result.isActive)
    if (activeResults.length > 0) {
      return activeResults[0]
    }

    // Jika tidak ada yang aktif, ambil hasil pertama
    return successfulResults[0]
  }

  // Jika semua metode gagal, kembalikan hasil default
  return {
    isActive: false,
    latency: "Error",
    method: "all-failed",
  }
}

